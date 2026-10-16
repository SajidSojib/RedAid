import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import {
  MatchStatus,
  NotificationType,
  RequestStatus,
  UserStatus,
} from "../../../generated/prisma/enums";
import { getEligibility } from "../../utils/eligiblity";
import { BloodLabel } from "../../types/constant/bloodLabel";
import { Prisma } from "../../../generated/prisma/client";
import { COMPATIBLE_Donors } from "../../types/constant/compatibleDonors";

// ---------- Types ----------
type Tx = Prisma.TransactionClient;
type GetMyOffersFilters = {
  status?: MatchStatus;
};

const requestSummarySelect = {
  id: true,
  patientName: true,
  bloodType: true,
  unitsNeeded: true,
  unitsAccepted: true,
  urgency: true,
  status: true,
  hospitalName: true,
  createdAt: true,
  upazila: {
    select: { id: true, name: true, bn_name: true },
  },
  union: {
    select: { id: true, name: true, bn_name: true },
  },
} as const;

// ---------- Helpers ----------

const assertMatchStatus = (status: unknown): void => {
  if (!Object.values(MatchStatus).includes(status as MatchStatus)) {
    throw new ApiError(400, "Invalid match status");
  }
};

// ---------- 1. List my offers ----------

const getMyOffers = async (
  donorId: string,
  filters: GetMyOffersFilters = {},
) => {
  if (filters.status !== undefined) {
    assertMatchStatus(filters.status);
  }

  return prisma.donationMatch.findMany({
    where: {
      donorId,
      ...(filters.status !== undefined && { status: filters.status }),
    },
    include: {
      request: {
        select: requestSummarySelect,
      },
    },
    orderBy: { notifiedAt: "desc" },
  });
};

// ---------- 2. Accept an offer ----------

const acceptMatch = async (tx: Tx, donorId: string, matchId: string) => {
  return prisma.$transaction(async (tx) => {
    const match = await tx.donationMatch.findFirst({
      where: { id: matchId, donorId },
      include: {
        request: true,
        donor: {
          select: {
            id: true,
            name: true,
            status: true,
            emailVerified: true,
            lastDonationDate: true,
          },
        },
      },
    });

    if (!match) {
      throw new ApiError(404, "Donation offer not found");
    }

    if (match.status !== MatchStatus.NOTIFIED) {
      throw new ApiError(409, "This offer has already been answered");
    }

    if (match.request.status !== RequestStatus.OPEN) {
      throw new ApiError(409, "This donation request is no longer open");
    }

    // Re-check donor status and eligibility at acceptance time
    if (
      match.donor.status !== UserStatus.ACTIVE ||
      !match.donor.emailVerified
    ) {
      throw new ApiError(
        403,
        "Your account must be active and your email verified to accept an offer",
      );
    }

    const eligibility = getEligibility(match.donor.lastDonationDate);

    if (!eligibility.eligible) {
      throw new ApiError(
        403,
        `You are not eligible to donate yet. You can donate again on ${eligibility.nextEligibleDate?.toISOString().slice(0, 10)}.`,
      );
    }

    // A donor can only donate once every 90 days, so only one accepted donation at a time
    const activeCommitment = await tx.donationMatch.count({
      where: { donorId, status: MatchStatus.ACCEPTED },
    });

    if (activeCommitment > 0) {
      throw new ApiError(
        409,
        "You already have an accepted donation in progress. Complete or cancel it before accepting another.",
      );
    }

    const request = match.request;

    // Claim a slot. The "slot is free" check and the increment happen in one statement,
    // so concurrent donors queue up and each free slot is taken exactly once.
    const claimed = await tx.donationRequest.updateMany({
      where: {
        id: request.id,
        status: RequestStatus.OPEN,
        unitsAccepted: { lt: request.unitsNeeded },
      },
      data: { unitsAccepted: { increment: 1 } },
    });

    if (claimed.count === 0) {
      throw new ApiError(409, "All available donor slots have been filled");
    }

    // Mark this donor's still-pending offer as accepted
    const accepted = await tx.donationMatch.updateMany({
      where: {
        id: match.id,
        donorId,
        status: MatchStatus.NOTIFIED,
      },
      data: {
        status: MatchStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });

    if (accepted.count === 0) {
      // Throwing rolls back the slot increment too
      throw new ApiError(409, "This offer has already been answered");
    }

    // Re-read the real count after our own increment
    const fresh = await tx.donationRequest.findUniqueOrThrow({
      where: { id: request.id },
      select: { unitsAccepted: true, unitsNeeded: true },
    });

    const isFull = fresh.unitsAccepted >= fresh.unitsNeeded;

    if (isFull) {
      // Other donors' offers stay NOTIFIED: if a no-show frees a slot, they can still accept
      await tx.donationRequest.updateMany({
        where: { id: request.id, status: RequestStatus.OPEN },
        data: { status: RequestStatus.FULFILLED },
      });
    }

    // Tell the requester
    await tx.notification.create({
      data: {
        userId: request.requesterId,
        type: NotificationType.DONOR_ACCEPTED,
        title: "A donor accepted your request",
        message: `${match.donor.name} accepted your ${BloodLabel[request.bloodType]} blood request.`,
        link: `/requests/${request.id}`,
      },
    });

    if (isFull) {
      await tx.notification.create({
        data: {
          userId: request.requesterId,
          type: NotificationType.REQUEST_FILLED,
          title: "All donor slots filled",
          message: `Your ${BloodLabel[request.bloodType]} blood request has received enough donor commitments.`,
          link: `/requests/${request.id}`,
        },
      });
    }

    return tx.donationMatch.findUniqueOrThrow({
      where: { id: match.id },
      include: {
        request: {
          select: requestSummarySelect,
        },
      },
    });
  });
};

const acceptOffer = (donorId: string, matchId: string) =>
  prisma.$transaction((tx) => acceptMatch(tx, donorId, matchId));

// ---------- 3. Decline an offer ----------

const declineOffer = async (donorId: string, matchId: string) => {
  const result = await prisma.donationMatch.updateMany({
    where: {
      id: matchId,
      donorId,
      status: MatchStatus.NOTIFIED,
    },
    data: {
      status: MatchStatus.CANCELLED,
      respondedAt: new Date(),
    },
  });

  if (result.count === 0) {
    const existing = await prisma.donationMatch.findFirst({
      where: { id: matchId, donorId },
      select: { id: true },
    });

    if (!existing) {
      throw new ApiError(404, "Donation offer not found");
    }

    throw new ApiError(409, "This offer has already been answered");
  }

  return prisma.donationMatch.findUniqueOrThrow({
    where: { id: matchId },
    include: {
      request: {
        select: requestSummarySelect,
      },
    },
  });
};

// ---------- 4. Requester cancels an accepted no-show ----------

const cancelNoShow = async (requesterId: string, matchId: string) => {
  return prisma.$transaction(async (tx) => {
    const match = await tx.donationMatch.findFirst({
      where: {
        id: matchId,
        request: { requesterId },
      },
      include: {
        request: true,
        donation: { select: { id: true } },
      },
    });

    if (!match) {
      throw new ApiError(404, "Donation match not found");
    }

    if (match.status !== MatchStatus.ACCEPTED) {
      throw new ApiError(
        409,
        "Only an accepted match can be cancelled as a no-show",
      );
    }

    if (match.donation) {
      throw new ApiError(
        409,
        "This match already has a donation record and cannot be cancelled as a no-show",
      );
    }

    // Release one slot. Works for OPEN and FULFILLED (all slots taken) requests.
    const released = await tx.donationRequest.updateMany({
      where: {
        id: match.request.id,
        status: { in: [RequestStatus.OPEN, RequestStatus.FULFILLED] },
        unitsAccepted: { gt: 0 },
      },
      data: { unitsAccepted: { decrement: 1 } },
    });

    if (released.count === 0) {
      throw new ApiError(
        409,
        "The request is no longer available for another donor",
      );
    }

    // A slot is free again, so a fulfilled request goes back to open
    await tx.donationRequest.updateMany({
      where: { id: match.request.id, status: RequestStatus.FULFILLED },
      data: { status: RequestStatus.OPEN },
    });

    const cancelled = await tx.donationMatch.updateMany({
      where: {
        id: match.id,
        status: MatchStatus.ACCEPTED,
      },
      data: {
        status: MatchStatus.CANCELLED,
        respondedAt: new Date(),
      },
    });

    if (cancelled.count === 0) {
      throw new ApiError(
        409,
        "This match has already changed. Please reload and try again.",
      );
    }

    return tx.donationMatch.findUniqueOrThrow({
      where: { id: match.id },
      include: {
        request: {
          select: requestSummarySelect,
        },
      },
    });
  });
};

// "I can donate" from the public requests page. Works for donors who were notified
// and for donors who weren't. Either way it ends in the normal accept logic.
const volunteerForRequest = async (donorId: string, requestId: string) => {
  return prisma.$transaction(async (tx) => {
    const request = await tx.donationRequest.findUnique({
      where: { id: requestId },
      select: { id: true, requesterId: true, status: true, bloodType: true },
    });

    if (!request) {
      throw new ApiError(404, "Donation request not found");
    }

    if (request.requesterId === donorId) {
      throw new ApiError(400, "You can't donate to your own request");
    }

    if (request.status !== RequestStatus.OPEN) {
      throw new ApiError(409, "This donation request is no longer open");
    }

    const existing = await tx.donationMatch.findUnique({
      where: { requestId_donorId: { requestId, donorId } },
      select: { id: true, status: true },
    });

    if (existing) {
      // Notified earlier: this is just the normal accept
      if (existing.status === MatchStatus.NOTIFIED) {
        return acceptMatch(tx, donorId, existing.id);
      }
      if (
        existing.status === MatchStatus.ACCEPTED ||
        existing.status === MatchStatus.COMPLETED
      ) {
        throw new ApiError(409, "You have already accepted this request");
      }
      throw new ApiError(409, "You can no longer respond to this request");
    }

    const donor = await tx.user.findUnique({
      where: { id: donorId },
      select: { bloodType: true },
    });

    if (!donor?.bloodType) {
      throw new ApiError(400, "Add your blood type to your profile before donating");
    }

    if (!COMPATIBLE_Donors[request.bloodType].includes(donor.bloodType)) {
      throw new ApiError(403, "Your blood type can't donate to this patient");
    }

    // Account status, email, 90-day eligibility, one-at-a-time and the slot claim
    // are all checked by acceptMatch. If it throws, this new match is rolled back too.
    const match = await tx.donationMatch.create({
      data: { requestId, donorId },
    });

    return acceptMatch(tx, donorId, match.id);
  });
};

export const matchesServices = {
  getMyOffers,
  acceptOffer,
  declineOffer,
  cancelNoShow,
  volunteerForRequest,
};