import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import type { Prisma } from "../../../generated/prisma/client";
import {
  BankRequestStatus,
  MatchStatus,
  NotificationType,
  ReportStatus,
  RequestStatus,
  Role,
  UserStatus,
} from "../../../generated/prisma/enums";
import { parsePagination } from "../../utils/parsePagination";
import { donorRequestLink, requesterRequestLink } from "../../utils/links";
import { closeRequestAsCompleted } from "../request/request.service";

type Tx = Prisma.TransactionClient;

export type GetUsersFilters = {
  status?: string; // ACTIVE | SUSPENDED
  reported?: string; // "true": only users with pending reports
  q?: string; // name or email
  page?: number | string;
  limit?: number | string;
};

const OPEN: RequestStatus[] = [RequestStatus.OPEN, RequestStatus.FULFILLED];

// ---------- 1. Users list (admin) ----------

const getUsers = async (filters: GetUsersFilters = {}) => {
  const { page, limit } = parsePagination(filters.page, filters.limit);
  const q = filters.q?.trim();

  if (
    filters.status !== undefined &&
    filters.status !== UserStatus.ACTIVE &&
    filters.status !== UserStatus.SUSPENDED
  ) {
    throw new ApiError(400, "Status must be ACTIVE or SUSPENDED");
  }

  const where: Prisma.UserWhereInput = {
    role: Role.USER,
    ...(filters.status && { status: filters.status as UserStatus }),
    ...(filters.reported === "true" && {
      reportsReceived: { some: { status: ReportStatus.PENDING } },
    }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const [rows, total, active, suspended, reported] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        bloodType: true,
        status: true,
        suspensionReason: true,
        suspendedAt: true,
        donationCount: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
    prisma.user.count({
      where: { role: Role.USER, status: UserStatus.ACTIVE },
    }),
    prisma.user.count({
      where: { role: Role.USER, status: UserStatus.SUSPENDED },
    }),
    prisma.user.count({
      where: {
        role: Role.USER,
        reportsReceived: { some: { status: ReportStatus.PENDING } },
      },
    }),
  ]);

  // Report totals for the users on this page only
  const stats = await prisma.report.groupBy({
    by: ["reportedUserId", "status"],
    where: { reportedUserId: { in: rows.map((u) => u.id) } },
    _count: { _all: true },
  });

  const users = rows.map((user) => {
    const mine = stats.filter((s) => s.reportedUserId === user.id);
    return {
      ...user,
      reports: {
        total: mine.reduce((sum, s) => sum + s._count._all, 0),
        pending:
          mine.find((s) => s.status === ReportStatus.PENDING)?._count._all ?? 0,
      },
    };
  });

  return {
    users,
    counts: { active, suspended, reported },
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ---------- Cleanup: nothing may keep waiting on a suspended user ----------

const releaseUser = async (tx: Tx, userId: string, reason: string) => {
  // 1. Their own open donor requests
  const requests = await tx.donationRequest.findMany({
    where: { requesterId: userId, status: { in: OPEN } },
    select: {
      id: true,
      bloodType: true,
      matches: {
        where: {
          status: { in: [MatchStatus.ACCEPTED, MatchStatus.COMPLETED] },
        },
        select: { donorId: true, status: true },
      },
    },
  });

  for (const request of requests) {
    // someone already donated, so it ends as completed, not cancelled
    if (request.matches.some((m) => m.status === MatchStatus.COMPLETED)) {
      await closeRequestAsCompleted(tx, request);
      continue;
    }

    const closed = await tx.donationRequest.updateMany({
      where: { id: request.id, status: { in: OPEN } },
      data: { status: RequestStatus.CANCELLED },
    });
    if (closed.count === 0) continue;

    await tx.donationMatch.updateMany({
      where: {
        requestId: request.id,
        status: { in: [MatchStatus.NOTIFIED, MatchStatus.ACCEPTED] },
      },
      data: { status: MatchStatus.CANCELLED },
    });

    if (request.matches.length > 0) {
      await tx.notification.createMany({
        data: request.matches.map((m) => ({
          userId: m.donorId,
          type: NotificationType.REQUEST_CANCELLED,
          title: "Request cancelled",
          message:
            "A request you accepted was cancelled because the requester's account was suspended.",
          link: donorRequestLink(request.id),
        })),
      });
    }
  }

  // 2. Offers they accepted as a donor: free the slot
  const offers = await tx.donationMatch.findMany({
    where: {
      donorId: userId,
      status: MatchStatus.ACCEPTED,
      request: { status: { in: OPEN } },
    },
    select: { id: true, request: { select: { id: true, requesterId: true } } },
  });

  for (const offer of offers) {
    await tx.donationRequest.updateMany({
      where: {
        id: offer.request.id,
        status: { in: OPEN },
        unitsAccepted: { gt: 0 },
      },
      data: { unitsAccepted: { decrement: 1 } },
    });
    await tx.donationRequest.updateMany({
      where: { id: offer.request.id, status: RequestStatus.FULFILLED },
      data: { status: RequestStatus.OPEN },
    });
    await tx.donationMatch.update({
      where: { id: offer.id },
      data: { status: MatchStatus.WITHDRAWN, respondedAt: new Date() },
    });
    await tx.notification.create({
      data: {
        userId: offer.request.requesterId,
        type: NotificationType.REQUEST_UPDATED,
        title: "A donor is no longer available",
        message:
          "A donor who accepted your request can no longer donate. The slot is open again.",
        link: requesterRequestLink(offer.request.id),
      },
    });
  }

  // 3. Their active bank requests
  const bankRequests = await tx.bankRequest.findMany({
    where: {
      requesterId: userId,
      status: { in: [BankRequestStatus.PENDING, BankRequestStatus.APPROVED] },
    },
    select: { id: true, bank: { select: { ownerId: true } } },
  });

  if (bankRequests.length > 0) {
    await tx.bankRequest.updateMany({
      where: { id: { in: bankRequests.map((r) => r.id) } },
      data: { status: BankRequestStatus.CANCELLED },
    });
    await tx.notification.createMany({
      data: bankRequests.map((r) => ({
        userId: r.bank.ownerId,
        type: NotificationType.BANK_REQUEST_UPDATE,
        title: "Request closed",
        message:
          "A request was closed because the requester's account was suspended.",
        link: "/dashboard/bank-requests",
      })),
    });
  }

  // 4. Pending reports on this user are now handled
  await tx.report.updateMany({
    where: { reportedUserId: userId, status: ReportStatus.PENDING },
    data: {
      status: ReportStatus.ACTION_TAKEN,
      adminNote: reason,
      resolvedAt: new Date(),
    },
  });
};

// ---------- 2. Suspend ----------

const suspendUser = async (adminId: string, userId: string, note?: string) => {
  const reason = note?.trim();

  if (!reason || reason.length < 5) {
    throw new ApiError(400, "Give the user a reason (at least 5 characters)");
  }
  if (reason.length > 300) {
    throw new ApiError(400, "The reason can be at most 300 characters");
  }
  if (userId === adminId) {
    throw new ApiError(400, "You can't suspend yourself");
  }

  return prisma.$transaction(
    async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, status: true },
      });

      if (!user) throw new ApiError(404, "User not found");
      if (user.role !== Role.USER) {
        throw new ApiError(
          403,
          "Only donor and requester accounts can be suspended here",
        );
      }
      if (user.status !== UserStatus.ACTIVE) {
        throw new ApiError(409, "This account is already suspended");
      }

      const updated = await tx.user.updateMany({
        where: { id: userId, status: UserStatus.ACTIVE },
        data: {
          status: UserStatus.SUSPENDED,
          suspensionReason: reason,
          suspendedAt: new Date(),
        },
      });
      if (updated.count === 0) {
        throw new ApiError(
          409,
          "This account was just updated. Reload and try again.",
        );
      }

      await releaseUser(tx, userId, reason);

      await tx.notification.create({
        data: {
          userId,
          type: NotificationType.ACCOUNT,
          title: "Your account was suspended",
          message: `Reason: ${reason}. You can still log in and view your data, but you can't request or donate blood.`,
        },
      });

      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          status: true,
          suspensionReason: true,
          suspendedAt: true,
        },
      });
    },
    { timeout: 20000 },
  );
};

// ---------- 3. Reactivate (restores access only) ----------

const reactivateUser = async (userId: string) => {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: { id: userId, role: Role.USER, status: UserStatus.SUSPENDED },
      data: {
        status: UserStatus.ACTIVE,
        suspensionReason: null,
        suspendedAt: null,
      },
    });

    if (updated.count === 0) {
      throw new ApiError(409, "This account is not suspended");
    }

    await tx.notification.create({
      data: {
        userId,
        type: NotificationType.ACCOUNT,
        title: "Your account is active again",
        message:
          "Your suspension was lifted. You can request and donate blood again.",
      },
    });

    return tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, status: true },
    });
  });
};

export const usersServices = { getUsers, suspendUser, reactivateUser };
