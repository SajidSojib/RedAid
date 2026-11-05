import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { Prisma } from "../../../generated/prisma/client";
import {
  BloodType,
  NotificationType,
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
      district: { select: { id: true, name: true, bn_name: true } },
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

    return {
      banks,
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

export const bankServices = { getBanks };
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

export const adminServices = { getBanks, verifyBank, rejectBank };
