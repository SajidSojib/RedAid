import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import {
  BloodType,
  BankRequestStatus,
  NotificationType,
  VerificationStatus,
  RequestStatus,
} from "../../../generated/prisma/enums";
import { BloodLabel } from "../../types/constant/bloodLabel";
import { parsePagination } from "../../utils/parsePagination";
import { Prisma } from "../../../generated/prisma/client";
import { closeRequestAsCompleted } from "../request/request.service";

export const MAX_UNITS_PER_BANK_REQUEST = 15;
export const MAX_ACTIVE_BANK_REQUESTS = 3;

// A request is active while the bank is still deciding or the requester has yet to collect
export const ACTIVE_BANK_STATUSES: BankRequestStatus[] = [
  BankRequestStatus.PENDING,
  BankRequestStatus.APPROVED,
];

export type CreateBankRequestInput = {
  bankId?: string;
  bloodType?: BloodType;
  unitsRequested?: number;
  note?: string | null;
  donationRequestId?: string | null; // optional link to the user's own donor request
};

const ACTIVE: BankRequestStatus[] = [
  BankRequestStatus.PENDING,
  BankRequestStatus.APPROVED,
];

const OPEN_DONOR_STATUSES: RequestStatus[] = [
  RequestStatus.OPEN,
  RequestStatus.FULFILLED,
];

type LinkedState = {
  status: RequestStatus;
  unitsNeeded: number;
  unitsAccepted: number;
} | null;

// Bags the bank must really give. A linked request only needs what donors haven't covered.
const unitsFor = (r: {
  status: BankRequestStatus;
  unitsRequested: number;
  donationRequest: LinkedState;
}) => {
  if (!r.donationRequest || !ACTIVE_BANK_STATUSES.includes(r.status)) {
    return r.unitsRequested; // no link, or finished: the stored number
  }
  const d = r.donationRequest;
  return OPEN_DONOR_STATUSES.includes(d.status)
    ? Math.max(0, d.unitsNeeded - d.unitsAccepted)
    : 0; // the donor request is already closed, so nothing more is needed
};

type Tx = Prisma.TransactionClient;

const createBankRequest = async (
  requesterId: string,
  payload: CreateBankRequestInput,
) => {
  const { bankId, bloodType, unitsRequested } = payload;
  const note = payload.note?.trim() || null;

  if (!bankId) {
    throw new ApiError(400, "Choose a blood bank");
  }
  if (!Object.values(BloodType).includes(bloodType as BloodType)) {
    throw new ApiError(400, "Invalid blood type");
  }
  if (
    typeof unitsRequested !== "number" ||
    !Number.isInteger(unitsRequested) ||
    unitsRequested < 1 ||
    unitsRequested > MAX_UNITS_PER_BANK_REQUEST
  ) {
    throw new ApiError(
      400,
      `Bags must be a whole number between 1 and ${MAX_UNITS_PER_BANK_REQUEST}`,
    );
  }
  if (note && note.length > 300) {
    throw new ApiError(400, "The note can be at most 300 characters");
  }

  return prisma.$transaction(async (tx) => {
    // Only verified banks can receive requests
    const bank = await tx.bloodBank.findFirst({
      where: { id: bankId, verificationStatus: VerificationStatus.VERIFIED },
      select: {
        id: true,
        name: true,
        ownerId: true,
        inventory: {
          where: { bloodType: bloodType as BloodType },
          select: { unitsAvailable: true },
        },
      },
    });

    if (!bank) {
      throw new ApiError(404, "Blood bank not found");
    }

    if (bank.ownerId === requesterId) {
      throw new ApiError(400, "You can't request blood from your own bank");
    }

    const stock = bank.inventory[0]?.unitsAvailable ?? 0;
    if (stock < unitsRequested) {
      throw new ApiError(
        409,
        stock === 0
          ? "This bank has no stock of that blood type right now"
          : `This bank only has ${stock} bag${stock === 1 ? "" : "s"} of that type`,
      );
    }

    // At most 3 active requests in total, and one per bank
    const active = await tx.bankRequest.findMany({
      where: { requesterId, status: { in: ACTIVE_BANK_STATUSES } },
      select: { bankId: true, status: true },
    });

    if (active.some((r) => r.status === BankRequestStatus.APPROVED)) {
      throw new ApiError(
        409,
        "A bank already approved one of your requests. Collect it or withdraw it before asking again.",
      );
    }
    if (active.some((r) => r.bankId === bankId)) {
      throw new ApiError(
        409,
        "You already have an active request at this bank. Withdraw it first.",
      );
    }
    if (active.length >= MAX_ACTIVE_BANK_REQUESTS) {
      throw new ApiError(
        409,
        `You can have at most ${MAX_ACTIVE_BANK_REQUESTS} active bank requests. Withdraw one first.`,
      );
    }

    // The link is optional, but it must be the requester's own open request
    if (payload.donationRequestId) {
      const linked = await tx.donationRequest.findFirst({
        where: {
          id: payload.donationRequestId,
          requesterId,
          status: { in: OPEN_DONOR_STATUSES },
        },
        select: { bloodType: true, unitsNeeded: true, unitsAccepted: true },
      });

      if (!linked) {
        throw new ApiError(400, "That request can't be linked");
      }

      const remaining = linked.unitsNeeded - linked.unitsAccepted;
      if (remaining < 1) {
        throw new ApiError(
          409,
          "Donors already cover every bag of that request",
        );
      }
      if (linked.bloodType !== bloodType || unitsRequested !== remaining) {
        throw new ApiError(
          400,
          "A linked request must use the same blood type and the bags still needed",
        );
      }
    }

    const request = await tx.bankRequest.create({
      data: {
        requesterId,
        bankId,
        bloodType: bloodType as BloodType,
        unitsRequested,
        note,
        donationRequestId: payload.donationRequestId ?? null,
      },
    });

    await tx.notification.create({
      data: {
        userId: bank.ownerId,
        type: NotificationType.BANK_REQUEST_UPDATE,
        title: "New blood request",
        message: `${unitsRequested} bag${unitsRequested === 1 ? "" : "s"} of ${BloodLabel[bloodType as BloodType]} requested from ${bank.name}.`,
        link: "/dashboard/bank-requests",
      },
    });

    return request;
  });
};

const withdrawBankRequest = async (requesterId: string, id: string) => {
  return prisma.$transaction(async (tx) => {
    const request = await tx.bankRequest.findFirst({
      where: { id, requesterId },
      select: {
        id: true,
        status: true,
        bloodType: true,
        bank: { select: { name: true, ownerId: true } },
      },
    });

    if (!request) throw new ApiError(404, "Bank request not found");
    if (!ACTIVE.includes(request.status)) {
      throw new ApiError(
        409,
        "Only a pending or approved request can be withdrawn",
      );
    }

    // Guarded write: fails if the bank changed it in the meantime
    const updated = await tx.bankRequest.updateMany({
      where: { id, status: request.status },
      data: { status: BankRequestStatus.WITHDRAWN },
    });
    if (updated.count === 0) {
      throw new ApiError(
        409,
        "This request just changed. Reload and try again.",
      );
    }

    await tx.notification.create({
      data: {
        userId: request.bank.ownerId,
        type: NotificationType.BANK_REQUEST_UPDATE,
        title: "Request withdrawn",
        message: `A requester withdrew their ${BloodLabel[request.bloodType]} request.`,
        link: "/dashboard/bank-requests",
      },
    });

    return tx.bankRequest.findUniqueOrThrow({ where: { id } });
  });
};

const getMyBankRequests = async (
  requesterId: string,
  filters: { scope?: string; page?: number | string; limit?: number | string },
) => {
  const { page, limit } = parsePagination(filters.page, filters.limit);
  if (
    filters.scope !== undefined &&
    filters.scope !== "active" &&
    filters.scope !== "history"
  ) {
    throw new ApiError(400, "Scope must be active or history");
  }

  const where = {
    requesterId,
    ...(filters.scope === "active" && { status: { in: ACTIVE_BANK_STATUSES } }),
    ...(filters.scope === "history" && {
      status: { notIn: ACTIVE_BANK_STATUSES },
    }),
  };

  const [requests, total, activeCount] = await prisma.$transaction([
    prisma.bankRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        bank: { select: { id: true, name: true, phone: true, address: true } },
        donationRequest: {
          select: {
            id: true,
            hospitalName: true,
            status: true,
            unitsNeeded: true,
            unitsAccepted: true,
          },
        },
      },
    }),
    prisma.bankRequest.count({ where }),
    prisma.bankRequest.count({
      where: { requesterId, status: { in: ACTIVE_BANK_STATUSES } },
    }),
  ]);

  return {
    requests: requests.map((r) => ({ ...r, unitsRemaining: unitsFor(r) })),
    activeRequests: { used: activeCount, limit: MAX_ACTIVE_BANK_REQUESTS },
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// The bank owner's own request, or 404
const findOwned = async (tx: Tx, ownerId: string, id: string) => {
  const request = await tx.bankRequest.findFirst({
    where: { id, bank: { ownerId } },
    select: {
      id: true,
      status: true,
      bankId: true,
      requesterId: true,
      bloodType: true,
      unitsRequested: true,
      bank: { select: { name: true } },
      donationRequest: {
        select: {
          id: true,
          bloodType: true,
          status: true,
          unitsNeeded: true,
          unitsAccepted: true,
        },
      },
    },
  });
  if (!request) throw new ApiError(404, "Bank request not found");
  return request;
};

// Guarded write: fails if the status changed in the meantime
const move = async (
  tx: Tx,
  id: string,
  from: BankRequestStatus,
  to: BankRequestStatus,
) => {
  const updated = await tx.bankRequest.updateMany({
    where: { id, status: from },
    data: { status: to },
  });
  if (updated.count === 0) {
    throw new ApiError(409, "This request just changed. Reload and try again.");
  }
};

const notifyRequester = (
  tx: Tx,
  userId: string,
  title: string,
  message: string,
) =>
  tx.notification.create({
    data: {
      userId,
      type: NotificationType.BANK_REQUEST_UPDATE,
      title,
      message,
      link: "/dashboard/my-requests?type=bank",
    },
  });

const stockOf = async (tx: Tx, bankId: string, bloodType: BloodType) =>
  (
    await tx.bloodInventory.findUnique({
      where: { bankId_bloodType: { bankId, bloodType } },
      select: { unitsAvailable: true },
    })
  )?.unitsAvailable ?? 0;

// ---------- Bank: approve (closes the requester's other pending requests) ----------

const approveBankRequest = (ownerId: string, id: string) =>
  prisma.$transaction(async (tx) => {
    const request = await findOwned(tx, ownerId, id);

    if (request.status !== BankRequestStatus.PENDING) {
      throw new ApiError(409, "Only a pending request can be approved");
    }

    const units = unitsFor(request);
    const stock = await stockOf(tx, request.bankId, request.bloodType);
    if (stock < units) {
      throw new ApiError(
        409,
        `You only have ${stock} bag${stock === 1 ? "" : "s"} of that type. Update your inventory first.`,
      );
    }

    await move(tx, id, BankRequestStatus.PENDING, BankRequestStatus.APPROVED);

    // The requester got blood from this bank, so their other pending requests are closed
    const others = await tx.bankRequest.findMany({
      where: {
        requesterId: request.requesterId,
        id: { not: id },
        status: BankRequestStatus.PENDING,
      },
      select: { id: true, bloodType: true, bank: { select: { ownerId: true } } },
    });

    if (others.length > 0) {
      await tx.bankRequest.updateMany({
        where: { id: { in: others.map((o) => o.id) }, status: BankRequestStatus.PENDING },
        data: { status: BankRequestStatus.CANCELLED },
      });

      await tx.notification.createMany({
        data: others.map((o) => ({
          userId: o.bank.ownerId,
          type: NotificationType.BANK_REQUEST_UPDATE,
          title: "Request closed",
          message: `A ${BloodLabel[o.bloodType]} request was closed because the requester was approved by another bank.`,
          link: "/dashboard/bank-requests",
        })),
      });
    }

    // Two banks approving at the same moment: the second one rolls back
    const approved = await tx.bankRequest.count({
      where: { requesterId: request.requesterId, status: BankRequestStatus.APPROVED },
    });
    if (approved > 1) {
      throw new ApiError(409, "The requester was just approved by another bank");
    }

    await notifyRequester(
      tx,
      request.requesterId,
      "Your request was approved",
      `${request.bank.name} approved your ${BloodLabel[request.bloodType]} request. Contact the bank to collect it.`,
    );

    return tx.bankRequest.findUniqueOrThrow({ where: { id } });
  });

// ---------- Bank: reject ----------

const rejectBankRequest = (ownerId: string, id: string) =>
  prisma.$transaction(async (tx) => {
    const request = await findOwned(tx, ownerId, id);

    if (request.status !== BankRequestStatus.PENDING) {
      throw new ApiError(409, "Only a pending request can be rejected");
    }

    await move(tx, id, BankRequestStatus.PENDING, BankRequestStatus.REJECTED);
    await notifyRequester(
      tx,
      request.requesterId,
      "Your request was declined",
      `${request.bank.name} could not fulfil your ${BloodLabel[request.bloodType]} request.`,
    );

    return tx.bankRequest.findUniqueOrThrow({ where: { id } });
  });

// ---------- Bank: complete (the requester collected the blood) ----------

const completeBankRequest = (ownerId: string, id: string) =>
  prisma.$transaction(async (tx) => {
    const request = await findOwned(tx, ownerId, id);

    if (request.status !== BankRequestStatus.APPROVED) {
      throw new ApiError(409, "Only an approved request can be completed");
    }

    await move(tx, id, BankRequestStatus.APPROVED, BankRequestStatus.FULFILLED);

    // Only what donors haven't covered is given and deducted
    const units = unitsFor(request);

    if (units > 0) {
      const deducted = await tx.bloodInventory.updateMany({
        where: {
          bankId: request.bankId,
          bloodType: request.bloodType,
          unitsAvailable: { gte: units },
        },
        data: { unitsAvailable: { decrement: units } },
      });
      if (deducted.count === 0) {
        throw new ApiError(
          409,
          "Your stock is lower than the bags needed. Update your inventory first.",
        );
      }
    }

    // Keep a record of what was really given
    await tx.bankRequest.update({
      where: { id },
      data: { unitsRequested: units },
    });

    // The bank covered the rest, so the donor request is done
    if (
      request.donationRequest &&
      OPEN_DONOR_STATUSES.includes(request.donationRequest.status)
    ) {
      await closeRequestAsCompleted(tx, {
        id: request.donationRequest.id,
        bloodType: request.donationRequest.bloodType,
      });
    }

    await notifyRequester(
      tx,
      request.requesterId,
      "Request completed",
      `Your ${BloodLabel[request.bloodType]} request at ${request.bank.name} is complete.`,
    );

    return tx.bankRequest.findUniqueOrThrow({ where: { id } });
  });

// ---------- Bank: no-show ----------

const markBankRequestNoShow = (ownerId: string, id: string) =>
  prisma.$transaction(async (tx) => {
    const request = await findOwned(tx, ownerId, id);

    if (request.status !== BankRequestStatus.APPROVED) {
      throw new ApiError(409, "Only an approved request can be marked as a no-show");
    }

    await move(tx, id, BankRequestStatus.APPROVED, BankRequestStatus.NO_SHOW);
    await notifyRequester(
      tx,
      request.requesterId,
      "Marked as not collected",
      `${request.bank.name} marked your ${BloodLabel[request.bloodType]} request as not collected.`,
    );

    return tx.bankRequest.findUniqueOrThrow({ where: { id } });
  });


const INCOMING_SCOPES = {
  pending: [BankRequestStatus.PENDING],
  approved: [BankRequestStatus.APPROVED],
  history: [
    BankRequestStatus.FULFILLED,
    BankRequestStatus.REJECTED,
    BankRequestStatus.CANCELLED,
    BankRequestStatus.WITHDRAWN,
    BankRequestStatus.NO_SHOW,
  ],
} as const;

type IncomingScope = keyof typeof INCOMING_SCOPES;

const getIncomingBankRequests = async (
  ownerId: string,
  filters: {
    scope?: string;
    page?: number | string;
    limit?: number | string;
  },
) => {
  const { page, limit } = parsePagination(filters.page, filters.limit);
  const scope = (filters.scope ?? "pending") as IncomingScope;

  if (!Object.hasOwn(INCOMING_SCOPES, scope)) {
    throw new ApiError(400, "Scope must be pending, approved or history");
  }

  const bank = await prisma.bloodBank.findUnique({
    where: { ownerId },
    select: {
      id: true,
      inventory: { select: { bloodType: true, unitsAvailable: true } },
    },
  });

  if (!bank) {
    throw new ApiError(404, "Blood bank not found for this account");
  }

  const where = {
    bankId: bank.id,
    status: { in: [...INCOMING_SCOPES[scope]] },
  };

  const [rows, total, pending, approved] = await prisma.$transaction([
    prisma.bankRequest.findMany({
      where,
      // the queue is oldest first, so nobody waits forever
      orderBy: { createdAt: scope === "history" ? "desc" : "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        bloodType: true,
        unitsRequested: true,
        status: true,
        note: true,
        createdAt: true,
        updatedAt: true,
        requester: {
          select: { id: true, name: true, phone: true, image: true },
        },
        donationRequest: {
          select: {
            id: true,
            bloodType: true,
            unitsNeeded: true,
            unitsAccepted: true,
            urgency: true,
            status: true,
            hospitalName: true,
            patientName: true,
            contactPhone: true,
            note: true,
            createdAt: true,
            upazila: {
              select: {
                name: true,
                district: { select: { name: true } },
              },
            },
            union: { select: { name: true } },
          },
        },
      },
    }),
    prisma.bankRequest.count({ where }),
    prisma.bankRequest.count({
      where: { bankId: bank.id, status: BankRequestStatus.PENDING },
    }),
    prisma.bankRequest.count({
      where: { bankId: bank.id, status: BankRequestStatus.APPROVED },
    }),
  ]);

  // Current stock next to each request, so the owner sees if they can fulfil it
  const stockByType = new Map(
    bank.inventory.map((i) => [i.bloodType, i.unitsAvailable]),
  );

  return {
    requests: rows.map((r) => ({
      ...r,
      unitsRemaining: unitsFor(r),
      stock: stockByType.get(r.bloodType) ?? 0,
    })),
    counts: { pending, approved },
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const bankRequestServices = { createBankRequest, getIncomingBankRequests, withdrawBankRequest, getMyBankRequests, rejectBankRequest, completeBankRequest, markBankRequestNoShow, approveBankRequest };
