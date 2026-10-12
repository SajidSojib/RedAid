import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import {
  MatchStatus,
  NotificationType,
  RequestStatus,
} from "../../../generated/prisma/enums";
import { parsePagination } from "../../utils/parsePagination";
import { getEligibility } from "../../utils/eligiblity";
import { achievementServices } from "../achievement/achievement.service";

type GetMyDonationsFilters = {
  page?: number | string;
  limit?: number | string;
};

const donationRequestSelect = {
  id: true,
  bloodType: true,
  hospitalName: true,
  upazila: { select: { id: true, name: true, bn_name: true } },
  union: { select: { id: true, name: true, bn_name: true } },
} as const;

// ---------- 1. Requester confirms a donation ----------

const confirmDonation = async (requesterId: string, matchId: string) => {
  return prisma.$transaction(
    async (tx) => {
      // Only the requester who owns the request can confirm
      const match = await tx.donationMatch.findFirst({
        where: { id: matchId, request: { requesterId } },
        include: {
          request: { select: { id: true, status: true, hospitalName: true } },
          donation: { select: { id: true } },
        },
      });

      if (!match) {
        throw new ApiError(404, "Donation match not found");
      }

      if (match.donation) {
        throw new ApiError(409, "This donation has already been confirmed");
      }

      if (match.status !== MatchStatus.ACCEPTED) {
        throw new ApiError(
          409,
          "Only a donor who accepted the request can be confirmed as having donated",
        );
      }

      if (
        match.request.status !== RequestStatus.OPEN &&
        match.request.status !== RequestStatus.FULFILLED
      ) {
        throw new ApiError(409, "This request is no longer active");
      }

      // Guarded write: a double click or a second request can't confirm the same donation twice
      const completed = await tx.donationMatch.updateMany({
        where: { id: match.id, status: MatchStatus.ACCEPTED },
        data: { status: MatchStatus.COMPLETED, respondedAt: new Date() },
      });

      if (completed.count === 0) {
        throw new ApiError(409, "This donation has already been confirmed");
      }

      const donation = await tx.donationHistory.create({
        data: {
          donorId: match.donorId,
          requestId: match.requestId,
          matchId: match.id,
          units: 1, // one bag per donor per visit
        },
      });

      // 1 confirmed donation = 1 point. The increment is atomic, so the count we get back is real.
      const donor = await tx.user.update({
        where: { id: match.donorId },
        data: {
          donationCount: { increment: 1 },
          lastDonationDate: donation.donatedAt,
        },
        select: { donationCount: true },
      });

      const earned = await achievementServices.awardMilestones(
        tx,
        match.donorId,
        donor.donationCount,
      );

      const nextDate = getEligibility(donation.donatedAt)
        .nextEligibleDate?.toISOString()
        .slice(0, 10);

      await tx.notification.create({
        data: {
          userId: match.donorId,
          type: NotificationType.DONATION_CONFIRMED,
          title: "Donation confirmed",
          message: `Your donation${
            match.request.hospitalName
              ? ` at ${match.request.hospitalName}`
              : ""
          } was confirmed. Thank you for saving a life! You can donate again on ${nextDate}.`,
          link: "/dashboard/my-donations",
        },
      });

      return {
        donation,
        donationCount: donor.donationCount,
        earned, // badges and certificates unlocked by this donation (empty if none)
      };
    },
    { timeout: 20000 },
  );
};

// ---------- 2. Donor's donation history ----------

const getMyDonations = async (
  donorId: string,
  filters: GetMyDonationsFilters = {},
) => {
  const { page, limit } = parsePagination(filters.page, filters.limit);

  const [donations, total, user] = await prisma.$transaction([
    prisma.donationHistory.findMany({
      where: { donorId },
      select: {
        id: true,
        units: true,
        donatedAt: true,
        request: { select: donationRequestSelect },
      },
      orderBy: { donatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.donationHistory.count({ where: { donorId } }),
    prisma.user.findUnique({
      where: { id: donorId },
      select: { donationCount: true, lastDonationDate: true },
    }),
  ]);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return {
    donations,
    summary: {
      donationCount: user.donationCount,
      lastDonationDate: user.lastDonationDate,
      eligibility: getEligibility(user.lastDonationDate),
    },
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const donationServices = {
  confirmDonation,
  getMyDonations,
};
