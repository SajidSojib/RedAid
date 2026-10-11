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

// ---------- Types ----------

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


const acceptOffer = async (donorId: string, matchId: string) => {
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

    // Re-check donor status and eligibility at acceptance time.
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

    const request = match.request;

    if (request.unitsAccepted >= request.unitsNeeded) {
      throw new ApiError(409, "All available donor slots have been filled");
    }

    /*
     * Guarded compare-and-swap:
     * only increment if unitsAccepted still has the value we just read.
     * If another transaction claims a slot first, this update affects 0 rows.
     */
    const claimed = await tx.donationRequest.updateMany({
      where: {
        id: request.id,
        status: RequestStatus.OPEN,
        unitsAccepted: request.unitsAccepted,
      },
      data: {
        unitsAccepted: { increment: 1 },
      },
    });

    if (claimed.count === 0) {
      throw new ApiError(
        409,
        "This request changed while you were accepting it. Please try again.",
      );
    }

    // Change only this donor's still-pending offer.
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
      // Throwing rolls back the slot increment too.
      throw new ApiError(409, "This offer has already been answered");
    }

    const newAcceptedCount = request.unitsAccepted + 1;
    const isFull = newAcceptedCount >= request.unitsNeeded;

    if (isFull) {
      // Close the request only if it is still open at the expected count.
      const fulfilled = await tx.donationRequest.updateMany({
        where: {
          id: request.id,
          status: RequestStatus.OPEN,
          unitsAccepted: newAcceptedCount,
        },
        data: { status: RequestStatus.FULFILLED },
      });

      if (fulfilled.count === 0) {
        throw new ApiError(
          409,
          "The request changed while the final slot was being claimed",
        );
      }

      // No need to leave offers available once all slots are taken.
      await tx.donationMatch.updateMany({
        where: {
          requestId: request.id,
          status: MatchStatus.NOTIFIED,
        },
        data: { status: MatchStatus.CANCELLED },
      });
    }

    // Tell the requester that a donor has accepted.
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

    const request = match.request;

    if (
      request.status !== RequestStatus.OPEN &&
      request.status !== RequestStatus.FULFILLED
    ) {
      throw new ApiError(
        409,
        "The request is no longer available for another donor",
      );
    }

    if (request.unitsAccepted < 1) {
      throw new ApiError(
        409,
        "There are no accepted donor slots available to release",
      );
    }

    // Release exactly one slot with a guarded update.
    const released = await tx.donationRequest.updateMany({
      where: {
        id: request.id,
        status: request.status,
        unitsAccepted: request.unitsAccepted,
      },
      data: {
        unitsAccepted: { decrement: 1 },
        // Reopen a fulfilled request so another donor can accept.
        ...(request.status === RequestStatus.FULFILLED && {
          status: RequestStatus.OPEN,
        }),
      },
    });

    if (released.count === 0) {
      throw new ApiError(
        409,
        "The request changed while releasing this donor slot. Please try again.",
      );
    }

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

export const matchesServices = {
  getMyOffers,
  acceptOffer,
  declineOffer,
  cancelNoShow,
};
