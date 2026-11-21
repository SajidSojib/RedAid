import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { Prisma } from "../../../generated/prisma/client";
import {
  BankRequestStatus,
  BloodType,
  NotificationType,
  ReportStatus,
  Role,
  VerificationStatus,
} from "../../../generated/prisma/enums";
import { parsePagination } from "../../utils/parsePagination";

export type GetBanksFilters = {
  page?: number | string;
  limit?: number | string;
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  bloodType?: string; // only banks with stock of this type
  status?: string; // admin only
};

type Viewer = { role: Role | null } | undefined;

const STATUSES = Object.values(VerificationStatus);

// What anyone may see
const publicBankSelect = {
  id: true,
  name: true,
  address: true,
  phone: true,
  latitude: true,
  longitude: true,
  verifiedAt: true,
  upazila: {
    select: {
      id: true,
      name: true,
      bn_name: true,
      district: {
        select: {
          id: true,
          name: true,
          bn_name: true,
          division: { select: { id: true, name: true, bn_name: true } },
        },
      },
    },
  },
  inventory: {
    select: { bloodType: true, unitsAvailable: true, updatedAt: true },
    orderBy: { bloodType: "asc" },
  },
} as const;

// ADMIN ONLY: everything public, plus the private review data.
// Never reuse this select for a public endpoint.
export const adminBankSelect = {
  ...publicBankSelect,
  licenseNumber: true,
  verificationStatus: true,
  verificationNote: true,
  suspensionReason: true,
  suspendedAt: true,
  createdAt: true,
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      phone: true,
      image: true,
      status: true,
      createdAt: true,
    },
  },
} as const;

const getBanks = async (filters: GetBanksFilters = {}, viewer?: Viewer) => {
  const { page, limit } = parsePagination(filters.page, filters.limit);
  const isAdmin = viewer?.role === Role.ADMIN;

  if (
    filters.bloodType !== undefined &&
    !Object.values(BloodType).includes(filters.bloodType as BloodType)
  ) {
    throw new ApiError(400, "Invalid blood type");
  }

  let status: VerificationStatus = VerificationStatus.VERIFIED; // visitors only ever get verified banks
  if (isAdmin) {
    status = (filters.status ??
      VerificationStatus.PENDING) as VerificationStatus;
    if (!STATUSES.includes(status)) {
      throw new ApiError(400, "Status must be PENDING, VERIFIED or REJECTED");
    }
  }

  const where: Prisma.BloodBankWhereInput = {
    verificationStatus: status,
    // Only the most specific location filter applies
    ...(filters.upazilaId
      ? { upazilaId: filters.upazilaId }
      : filters.districtId
        ? { upazila: { districtId: filters.districtId } }
        : filters.divisionId
          ? { upazila: { district: { divisionId: filters.divisionId } } }
          : {}),
    ...(filters.bloodType && {
      inventory: {
        some: {
          bloodType: filters.bloodType as BloodType,
          unitsAvailable: { gt: 0 },
        },
      },
    }),
  };

  const paging = { skip: (page - 1) * limit, take: limit };
  // the admin queue is oldest first, the public list is newest first
  const orderBy: Prisma.BloodBankOrderByWithRelationInput = {
    createdAt:
      isAdmin && status === VerificationStatus.PENDING ? "asc" : "desc",
  };

  if (isAdmin) {
    const [banks, total, ...counts] = await prisma.$transaction([
      prisma.bloodBank.findMany({
        where,
        select: adminBankSelect,
        orderBy,
        ...paging,
      }),
      prisma.bloodBank.count({ where }),
      ...STATUSES.map((s) =>
        prisma.bloodBank.count({ where: { verificationStatus: s } }),
      ),
    ]);

    const stats = await prisma.report.groupBy({
      by: ["reportedBankId", "status"],
      where: { reportedBankId: { in: banks.map((b) => b.id) } },
      _count: { _all: true },
    });

    return {
      banks: banks.map((bank) => {
        const mine = stats.filter((s) => s.reportedBankId === bank.id);
        return {
          ...bank,
          reports: {
            total: mine.reduce((sum, s) => sum + s._count._all, 0),
            pending:
              mine.find((s) => s.status === ReportStatus.PENDING)?._count
                ._all ?? 0,
          },
        };
      }),
      counts: Object.fromEntries(STATUSES.map((s, i) => [s, counts[i]])),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  const [banks, total] = await prisma.$transaction([
    prisma.bloodBank.findMany({
      where,
      select: publicBankSelect,
      orderBy,
      ...paging,
    }),
    prisma.bloodBank.count({ where }),
  ]);

  return {
    banks,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ---------- 2. Verify or reject (one place for both) ----------

const review = async (
  bankId: string,
  status: "VERIFIED" | "REJECTED",
  note: string | null,
) => {
  return prisma.$transaction(async (tx) => {
    const bank = await tx.bloodBank.findUnique({
      where: { id: bankId },
      select: { id: true, name: true, ownerId: true, verificationStatus: true },
    });

    if (!bank) {
      throw new ApiError(404, "Blood bank not found");
    }

    if (bank.verificationStatus === VerificationStatus.SUSPENDED) {
      throw new ApiError(409, "This bank is suspended. Reinstate it first.");
    }

    if (bank.verificationStatus === status) {
      throw new ApiError(409, `This bank is already ${status.toLowerCase()}`);
    }

    // Guarded write: fails if another admin changed it in the meantime
    const updated = await tx.bloodBank.updateMany({
      where: { id: bankId, verificationStatus: bank.verificationStatus },
      data: {
        verificationStatus: status,
        verificationNote: note,
        verifiedAt: status === VerificationStatus.VERIFIED ? new Date() : null,
      },
    });

    if (updated.count === 0) {
      throw new ApiError(
        409,
        "This bank was just updated. Reload and try again.",
      );
    }

    await tx.notification.create({
      data: {
        userId: bank.ownerId,
        type: NotificationType.BANK_VERIFICATION,
        title:
          status === VerificationStatus.VERIFIED
            ? "Your blood bank is verified"
            : "Your blood bank was not approved",
        message:
          status === VerificationStatus.VERIFIED
            ? `${bank.name} is now visible to requesters.`
            : `${bank.name} was rejected: ${note}. Update your details to submit it again.`,
        link: "/dashboard/bank-profile",
      },
    });

    return tx.bloodBank.findUniqueOrThrow({
      where: { id: bankId },
      select: adminBankSelect,
    });
  });
};

const verifyBank = (bankId: string) =>
  review(bankId, VerificationStatus.VERIFIED, null);

const rejectBank = (bankId: string, note?: string) => {
  const reason = note?.trim();

  if (!reason || reason.length < 5) {
    throw new ApiError(400, "Give the owner a reason (at least 5 characters)");
  }
  if (reason.length > 300) {
    throw new ApiError(400, "The reason can be at most 300 characters");
  }

  return review(bankId, VerificationStatus.REJECTED, reason);
};

// ---------- Suspend: hidden from the public, owner keeps read-only access ----------

const suspendBank = async (bankId: string, note?: string) => {
  const reason = note?.trim();

  if (!reason || reason.length < 5) {
    throw new ApiError(400, "Give the owner a reason (at least 5 characters)");
  }
  if (reason.length > 300) {
    throw new ApiError(400, "The reason can be at most 300 characters");
  }

  return prisma.$transaction(
    async (tx) => {
      const bank = await tx.bloodBank.findUnique({
        where: { id: bankId },
        select: { id: true, name: true, ownerId: true, verificationStatus: true },
      });

      if (!bank) throw new ApiError(404, "Blood bank not found");
      if (bank.verificationStatus !== VerificationStatus.VERIFIED) {
        throw new ApiError(409, "Only a verified bank can be suspended");
      }

      const updated = await tx.bloodBank.updateMany({
        where: { id: bankId, verificationStatus: VerificationStatus.VERIFIED },
        data: {
          verificationStatus: VerificationStatus.SUSPENDED,
          suspensionReason: reason,
          suspendedAt: new Date(),
        },
      });
      if (updated.count === 0) {
        throw new ApiError(409, "This bank was just updated. Reload and try again.");
      }

      // Nobody should keep waiting on a suspended bank
      const open = await tx.bankRequest.findMany({
        where: {
          bankId,
          status: { in: [BankRequestStatus.PENDING, BankRequestStatus.APPROVED] },
        },
        select: { id: true, requesterId: true },
      });

      if (open.length > 0) {
        await tx.bankRequest.updateMany({
          where: { id: { in: open.map((r) => r.id) } },
          data: { status: BankRequestStatus.CANCELLED },
        });
        await tx.notification.createMany({
          data: open.map((r) => ({
            userId: r.requesterId,
            type: NotificationType.BANK_REQUEST_UPDATE,
            title: "Request closed",
            message: `${bank.name} is no longer available, so your request was closed. You can ask another bank.`,
            link: "/dashboard/my-requests?type=bank",
          })),
        });
      }

      await tx.report.updateMany({
        where: { reportedBankId: bankId, status: ReportStatus.PENDING },
        data: { status: ReportStatus.ACTION_TAKEN, adminNote: reason, resolvedAt: new Date() },
      });

      await tx.notification.create({
        data: {
          userId: bank.ownerId,
          type: NotificationType.BANK_VERIFICATION,
          title: "Your blood bank was suspended",
          message: `Reason: ${reason}. You can still view your data, but you can't make changes.`,
          link: "/dashboard/bank-profile",
        },
      });

      return tx.bloodBank.findUniqueOrThrow({ where: { id: bankId }, select: adminBankSelect });
    },
    { timeout: 20000 },
  );
};

// ---------- Reinstate: back to verified and public ----------

const reinstateBank = async (bankId: string) => {
  return prisma.$transaction(async (tx) => {
    const bank = await tx.bloodBank.findUnique({
      where: { id: bankId },
      select: { name: true, ownerId: true },
    });
    if (!bank) throw new ApiError(404, "Blood bank not found");

    const updated = await tx.bloodBank.updateMany({
      where: { id: bankId, verificationStatus: VerificationStatus.SUSPENDED },
      data: {
        verificationStatus: VerificationStatus.VERIFIED,
        suspensionReason: null,
        suspendedAt: null,
      },
    });
    if (updated.count === 0) {
      throw new ApiError(409, "This bank is not suspended");
    }

    await tx.notification.create({
      data: {
        userId: bank.ownerId,
        type: NotificationType.BANK_VERIFICATION,
        title: "Your blood bank is active again",
        message: `${bank.name} is visible to requesters again.`,
        link: "/dashboard/bank-profile",
      },
    });

    return tx.bloodBank.findUniqueOrThrow({ where: { id: bankId }, select: adminBankSelect });
  });
};
export const bankServices = { getBanks, verifyBank, rejectBank, suspendBank, reinstateBank };
