import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { Prisma } from "../../../generated/prisma/client";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import { MILESTONES } from "../../types/constant/milestones";
import { parsePagination } from "../../utils/parsePagination";

export type GetTopDonorsFilters = {
  page?: number | string;
  limit?: number | string;
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  unionId?: string;
};

// ---------- Helpers ----------

// Turns the most specific area filter into a service-area condition.
// Returns null when no area filter was sent.
const buildAreaWhere = async (
  filters: GetTopDonorsFilters,
): Promise<Prisma.DonorServiceAreaWhereInput | null> => {
  const { divisionId, districtId, upazilaId, unionId } = filters;

  if (unionId) {
    const union = await prisma.union.findUnique({
      where: { id: unionId },
      select: { upazilaId: true },
    });

    if (!union) {
      throw new ApiError(400, "Selected union does not exist");
    }

    return {
      OR: [
        { unionId },
        // donors who picked the whole upazila also serve this union
        { upazilaId: union.upazilaId, unionId: null },
      ],
    };
  }

  if (upazilaId) {
    const upazila = await prisma.upazila.findUnique({
      where: { id: upazilaId },
      select: { id: true },
    });

    if (!upazila) {
      throw new ApiError(400, "Selected upazila does not exist");
    }

    return { upazilaId };
  }

  if (districtId) {
    const district = await prisma.district.findUnique({
      where: { id: districtId },
      select: { id: true },
    });

    if (!district) {
      throw new ApiError(400, "Selected district does not exist");
    }

    return { upazila: { districtId } };
  }

  if (divisionId) {
    const division = await prisma.division.findUnique({
      where: { id: divisionId },
      select: { id: true },
    });

    if (!division) {
      throw new ApiError(400, "Selected division does not exist");
    }

    return { upazila: { district: { divisionId } } };
  }

  return null;
};

// ---------- 1. Top donors (optionally for one area) ----------

const getTopDonors = async (filters: GetTopDonorsFilters = {}) => {
  const { page, limit } = parsePagination(filters.page, filters.limit);
  const area = await buildAreaWhere(filters);

  const where: Prisma.UserWhereInput = {
    role: Role.USER,
    status: UserStatus.ACTIVE,
    donationCount: { gt: 0 },
    // "some" counts a donor once, even if several of their areas match
    ...(area && { donorServiceAreas: { some: area } }),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: { name: true, image: true, donationCount: true },
      orderBy: [
        { donationCount: "desc" },
        { lastDonationDate: "asc" }, // tie: whoever reached the number first
        { id: "asc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const donors = rows.map((user, index) => ({
    rank: (page - 1) * limit + index + 1, // rank inside the filtered list
    name: user.name,
    image: user.image,
    donations: user.donationCount, // 1 donation = 1 point
    badge:
      [...MILESTONES].reverse().find((m) => m.count <= user.donationCount)
        ?.badge ?? null,
  }));

  return {
    donors,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const leaderboardServices = { getTopDonors };
