import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import {
  BloodType,
  RequestStatus,
  Urgency,
  MatchStatus,
  NotificationType,
  Role,
  UserStatus,
} from "../../../generated/prisma/enums";
import type { DonationRequest, Prisma } from "../../../generated/prisma/client";
import { BloodLabel } from "../../types/constant/bloodLabel";

import { eligibilityCutoff, getEligibility } from "../../utils/eligiblity";
import { COMPATIBLE_Donors } from "../../types/constant/compatibleDonors";
import { parsePagination } from "../../utils/parsePagination";
import { validateCoordinates } from "../../utils/validateCordinates";

type CreateDonationRequestInput = {
  patientName?: string | null;
  hospitalName?: string | null;
  contactPhone?: string | null;
  note?: string | null;
  bloodType: BloodType;
  unitsNeeded: number;
  urgency?: Urgency;
  upazilaId: string;
  unionId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type UpdateDonationRequestInput = {
  patientName?: string | null;
  hospitalName?: string | null;
  contactPhone?: string | null;
  note?: string | null;
  bloodType?: BloodType;
  unitsNeeded?: number;
  urgency?: Urgency;
  upazilaId?: string;
  unionId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

// page/limit can arrive as strings from the query string
type GetDonationRequestsFilters = {
  page?: number | string;
  limit?: number | string;
  status?: RequestStatus; // only used by "my requests"
  bloodType?: string | string[]; // "A_POSITIVE,O_POSITIVE" or repeated
  urgency?: string | string[];
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  unionId?: string;
};

type Viewer = { id: string; role: Role | null };

type ViewerState = {
  isOwner: boolean;
  matchStatus: MatchStatus | null;
  canRespond: boolean;
  blockedReason: string | null;
};

type Scope = "UNION" | "UPAZILA";
type Tx = Prisma.TransactionClient;
type MatchableRequest = Pick<
  DonationRequest,
  | "id"
  | "requesterId"
  | "bloodType"
  | "unitsNeeded"
  | "urgency"
  | "hospitalName"
  | "upazilaId"
  | "unionId"
>;

export const MAX_UNITS_PER_REQUEST = 15;
export const MAX_OPEN_REQUESTS_PER_USER = 3;

// An open request with no accepted donor expires after this many hours
export const REQUEST_EXPIRY_HOURS: Record<Urgency, number> = {
  CRITICAL: 36,
  URGENT: 72,
  NORMAL: 168,
};

// const PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

const areaSelect = { select: { id: true, name: true, bn_name: true } } as const;

// What anyone browsing requests may see. No patient phone, coordinates or requester.
const publicRequestSelect = {
  id: true,
  patientName: true,
  bloodType: true,
  unitsNeeded: true,
  unitsAccepted: true,
  urgency: true,
  status: true,
  hospitalName: true,
  createdAt: true,
  upazila: areaSelect,
  union: areaSelect,
  note: true,
} as const;

// ---------- validation helpers ----------

const assertEnum = (
  enumObject: Record<string, string>,
  value: unknown,
  label: string,
) => {
  if (!Object.values(enumObject).includes(value as string)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
};

const validateUnits = (units: unknown) => {
  if (
    typeof units !== "number" ||
    !Number.isInteger(units) ||
    units < 1 ||
    units > MAX_UNITS_PER_REQUEST
  ) {
    throw new ApiError(
      400,
      `Units needed must be a whole number between 1 and ${MAX_UNITS_PER_REQUEST}`,
    );
  }
};

const validateLocation = async (upazilaId: string, unionId?: string | null) => {
  const upazila = await prisma.upazila.findUnique({
    where: { id: upazilaId },
    select: { id: true },
  });

  if (!upazila) {
    throw new ApiError(400, "Selected upazila does not exist");
  }

  if (unionId !== undefined && unionId !== null) {
    const union = await prisma.union.findUnique({
      where: { id: unionId },
      select: { id: true, upazilaId: true },
    });

    if (!union) {
      throw new ApiError(400, "Selected union does not exist");
    }

    if (union.upazilaId !== upazilaId) {
      throw new ApiError(
        400,
        "The selected union does not belong to the selected upazila",
      );
    }
  }
};

const toList = (value: unknown): string[] => {
  const raw = Array.isArray(value) ? value : value === undefined ? [] : [value];

  return [
    ...new Set(
      raw
        .flatMap((item) => String(item).split(","))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
};

const firstString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

// Shared by the public feed and "my requests"
const buildWhere = (
  filters: GetDonationRequestsFilters,
): Prisma.DonationRequestWhereInput => {
  const bloodTypes = toList(filters.bloodType);
  const urgencies = toList(filters.urgency);

  bloodTypes.forEach((value) => assertEnum(BloodType, value, "blood type"));
  urgencies.forEach((value) => assertEnum(Urgency, value, "urgency"));

  const unionId = firstString(filters.unionId);
  const upazilaId = firstString(filters.upazilaId);
  const districtId = firstString(filters.districtId);
  const divisionId = firstString(filters.divisionId);

  return {
    ...(bloodTypes.length > 0 && { bloodType: { in: bloodTypes as BloodType[] } }),
    ...(urgencies.length > 0 && { urgency: { in: urgencies as Urgency[] } }),
    // Only the most specific location filter applies
    ...(unionId
      ? { unionId }
      : upazilaId
        ? { upazilaId }
        : districtId
          ? { upazila: { districtId } }
          : divisionId
            ? { upazila: { district: { divisionId } } }
            : {}),
  };
};


const feedSelect = { ...publicRequestSelect, requesterId: true } as const;

type FeedRow = {
  id: string;
  requesterId: string;
  bloodType: BloodType;
  unitsNeeded: number;
  unitsAccepted: number;
};

// What the logged-in donor can do with each request on the page
const getViewerStates = async (userId: string, rows: FeedRow[]) => {
  const [me, matches] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { bloodType: true, lastDonationDate: true },
    }),
    prisma.donationMatch.findMany({
      where: { donorId: userId, requestId: { in: rows.map((row) => row.id) } },
      select: { requestId: true, status: true },
    }),
  ]);

  const statusByRequest = new Map(matches.map((m) => [m.requestId, m.status]));
  const eligibility = getEligibility(me?.lastDonationDate ?? null);
  const states = new Map<string, ViewerState>();

  for (const row of rows) {
    const isOwner = row.requesterId === userId;
    const matchStatus = statusByRequest.get(row.id) ?? null;
    const alreadyAccepted =
      matchStatus === MatchStatus.ACCEPTED ||
      matchStatus === MatchStatus.COMPLETED;

    let blockedReason: string | null = null;

    if (!isOwner && !alreadyAccepted) {
      if (matchStatus === MatchStatus.CANCELLED) {
        blockedReason = "You can no longer respond to this request";
      } else if (row.unitsAccepted >= row.unitsNeeded) {
        blockedReason = "All bags have been claimed";
      } else if (!me?.bloodType) {
        blockedReason = "Add your blood type to your profile to donate";
      } else if (!COMPATIBLE_Donors[row.bloodType].includes(me.bloodType)) {
        blockedReason = "Your blood type can't donate to this patient";
      } else if (!eligibility.eligible) {
        blockedReason = `You can donate again on ${eligibility.nextEligibleDate
          ?.toISOString()
          .slice(0, 10)}`;
      }
    }

    states.set(row.id, {
      isOwner,
      matchStatus,
      canRespond: !isOwner && !alreadyAccepted && blockedReason === null,
      blockedReason,
    });
  }

  return states;
};

// ---------- matching helpers ----------

const findDonorIds = async (
  tx: Tx,
  request: MatchableRequest,
  scope: Scope,
) => {
  // UNION scope also covers donors who picked the whole upazila (unionId = null)
  const areaFilter =
    scope === "UNION" && request.unionId
      ? {
          OR: [
            { unionId: request.unionId },
            { upazilaId: request.upazilaId, unionId: null },
          ],
        }
      : { upazilaId: request.upazilaId };

  const donors = await tx.user.findMany({
    where: {
      role: Role.USER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      id: { not: request.requesterId },
      bloodType: { in: COMPATIBLE_Donors[request.bloodType] },
      OR: [
        { lastDonationDate: null },
        { lastDonationDate: { lte: eligibilityCutoff() } },
      ],
      donorServiceAreas: { some: areaFilter },
    },
    select: { id: true },
  });

  return donors.map((donor) => donor.id);
};

const notifyDonors = async (
  tx: Tx,
  request: MatchableRequest,
  scope: Scope,
) => {
  const donorIds = await findDonorIds(tx, request, scope);

  if (donorIds.length === 0) return 0;

  await tx.donationMatch.createMany({
    data: donorIds.map((donorId) => ({ requestId: request.id, donorId })),
    skipDuplicates: true,
  });

  const label = BloodLabel[request.bloodType];
  const prefix =
    request.urgency === Urgency.CRITICAL
      ? "Critical: "
      : request.urgency === Urgency.URGENT
        ? "Urgent: "
        : "";

  await tx.notification.createMany({
    data: donorIds.map((userId) => ({
      userId,
      type: NotificationType.NEW_REQUEST,
      title: `${prefix}${label} blood needed`,
      message: `${request.unitsNeeded} bag${
        request.unitsNeeded > 1 ? "s" : ""
      } of ${label} needed${
        request.hospitalName ? ` at ${request.hospitalName}` : ""
      }. Open the request to respond.`,
      link: `/requests/${request.id}`,
    })),
  });

  return donorIds.length;
};

// ---------- services ----------

const createDonationRequest = async (
  requesterId: string,
  payload: CreateDonationRequestInput,
) => {
  assertEnum(BloodType, payload.bloodType, "blood type");
  if (payload.urgency !== undefined)
    assertEnum(Urgency, payload.urgency, "urgency");
  
  validateUnits(payload.unitsNeeded);
  validateCoordinates(payload.latitude, payload.longitude);
  
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { phone: true },
  });
  
  if (!requester) {
    throw new ApiError(404, "User not found");
  }
  
  const openCount = await prisma.donationRequest.count({
    where: { requesterId, status: RequestStatus.OPEN },
  });
  
  if (openCount >= MAX_OPEN_REQUESTS_PER_USER) {
    throw new ApiError(
      409,
      `You can have at most ${MAX_OPEN_REQUESTS_PER_USER} open requests. Cancel or complete one first.`,
    );
  }

  await validateLocation(payload.upazilaId, payload.unionId);

  return prisma.$transaction(async (tx) => {
    const request = await tx.donationRequest.create({
      data: {
        requester: {
          connect: { id: requesterId },
        },
        patientName: payload.patientName ?? null,
        hospitalName: payload.hospitalName ?? null,
        contactPhone: payload.contactPhone?.trim() || requester.phone,
        note: payload.note ?? null,
        bloodType: payload.bloodType,
        unitsNeeded: payload.unitsNeeded,
        ...(payload.urgency !== undefined && { urgency: payload.urgency }),
        upazila: {
          connect: { id: payload.upazilaId },
        },
        ...(payload.unionId != null && {
          union: {
            connect: { id: payload.unionId },
          },
        }),
        ...(payload.latitude != null && { latitude: payload.latitude }),
        ...(payload.longitude != null && { longitude: payload.longitude }),
      },
      include: {
        upazila: areaSelect,
        union: areaSelect,
      },
    });
    
    // Try the union first. If nobody is eligible there, widen to the whole upazila straight away.
    let searchScope: Scope = request.unionId ? "UNION" : "UPAZILA";
    let notifiedDonors = await notifyDonors(tx, request, searchScope);
    
    if (notifiedDonors === 0 && searchScope === "UNION") {
      searchScope = "UPAZILA";
      notifiedDonors = await notifyDonors(tx, request, searchScope);
    }

    return { request, notifiedDonors, searchScope };
  }, {timeout: 20000});
};

// Requester sees everything. A matched donor sees a trimmed view that unlocks after they accept.
const getDonationRequestById = async (requestId: string, userId: string) => {
  const request = await prisma.donationRequest.findUnique({
    where: { id: requestId },
    include: {
      upazila: areaSelect,
      union: areaSelect,
    },
  });

  if (!request) {
    throw new ApiError(404, "Donation request not found");
  }

  if (request.requesterId === userId) {
    const [donors, counts] = await Promise.all([
      prisma.donationMatch.findMany({
        where: {
          requestId,
          status: { in: [MatchStatus.ACCEPTED, MatchStatus.COMPLETED] },
        },
        select: {
          id: true,
          status: true,
          respondedAt: true,
          donor: {
            select: {
              id: true,
              name: true,
              phone: true,
              bloodType: true,
              image: true,
            },
          },
        },
        orderBy: { respondedAt: "asc" },
      }),
      prisma.donationMatch.groupBy({
        by: ["status"],
        where: { requestId },
        _count: { _all: true },
      }),
    ]);

    return {
      viewer: "REQUESTER" as const,
      ...request,
      donors, // only donors who accepted or completed; notified donors stay anonymous
      matchCounts: Object.fromEntries(
        counts.map((c) => [c.status, c._count._all]),
      ),
    };
  }

  const myMatch = await prisma.donationMatch.findUnique({
    where: { requestId_donorId: { requestId, donorId: userId } },
    select: { id: true, status: true, notifiedAt: true, respondedAt: true },
  });

  if (!myMatch) {
    throw new ApiError(404, "Donation request not found"); // don't reveal that it exists
  }

  const unlocked =
    myMatch.status === MatchStatus.ACCEPTED ||
    myMatch.status === MatchStatus.COMPLETED;

  return {
    viewer: "DONOR" as const,
    id: request.id,
    bloodType: request.bloodType,
    unitsNeeded: request.unitsNeeded,
    unitsAccepted: request.unitsAccepted,
    urgency: request.urgency,
    status: request.status,
    hospitalName: request.hospitalName,
    note: request.note,
    upazila: request.upazila,
    union: request.union,
    createdAt: request.createdAt,
    ...(unlocked && {
      patientName: request.patientName,
      contactPhone: request.contactPhone,
    }),
    myMatch,
  };
};

// Public feed. Patient name and note are only included for logged-in users.
const getAllDonationRequests = async (
  filters: GetDonationRequestsFilters,
  viewer?: Viewer,
) => {
  const { page, limit } = parsePagination(filters.page, filters.limit);

  const where: Prisma.DonationRequestWhereInput = {
    status: RequestStatus.OPEN,
    ...buildWhere(filters),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.donationRequest.findMany({
      where,
      select: feedSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.donationRequest.count({ where }),
  ]);

  // Only donor/requester accounts get a "can I respond?" state
  const states =
    viewer?.role === Role.USER
      ? await getViewerStates(viewer.id, rows)
      : new Map<string, ViewerState>();

  const requests = rows.map(({ requesterId, patientName, note, ...rest }) => ({
    ...rest,
    ...(viewer && { patientName, note }),
    viewer: states.get(rest.id) ?? null,
  }));

  return {
    requests,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// The requester's own requests, with full details. requesterId always comes from the logged-in user.
const getMyDonationRequests = async (
  requesterId: string,
  filters: GetDonationRequestsFilters,
) => {
  const { page, limit } = parsePagination(filters.page, filters.limit);
  if (filters.status !== undefined)
    assertEnum(RequestStatus, filters.status, "status");

  const where = {
    requesterId,
    ...(filters.status !== undefined && { status: filters.status }),
    ...buildWhere(filters),
  };

  const [requests, total] = await prisma.$transaction([
    prisma.donationRequest.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        upazila: areaSelect,
        union: areaSelect,
        _count: {
          select: {
            matches: true,
            donations: true,
          },
        },
      },
    }),
    prisma.donationRequest.count({ where }),
  ]);

  return {
    requests,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateMyDonationRequest = async (
  requesterId: string,
  requestId: string,
  payload: UpdateDonationRequestInput,
) => {
  const existingRequest = await prisma.donationRequest.findFirst({
    where: { id: requestId, requesterId },
  });

  if (!existingRequest) {
    throw new ApiError(404, "Donation request not found");
  }

  if (existingRequest.status !== RequestStatus.OPEN) {
    throw new ApiError(400, "Only open donation requests can be updated");
  }

  if (payload.bloodType !== undefined)
    assertEnum(BloodType, payload.bloodType, "blood type");
  if (payload.urgency !== undefined)
    assertEnum(Urgency, payload.urgency, "urgency");

  if (payload.unitsNeeded !== undefined) {
    validateUnits(payload.unitsNeeded);

    if (payload.unitsNeeded < existingRequest.unitsAccepted) {
      throw new ApiError(
        400,
        "Units needed cannot be less than the units already accepted",
      );
    }
  }

  // The coordinates must still be a valid pair after merging with what is stored
  const nextLatitude =
    payload.latitude !== undefined
      ? payload.latitude
      : existingRequest.latitude;
  const nextLongitude =
    payload.longitude !== undefined
      ? payload.longitude
      : existingRequest.longitude;
  validateCoordinates(nextLatitude, nextLongitude);

  const nextUpazilaId = payload.upazilaId ?? existingRequest.upazilaId;
  const nextUnionId =
    payload.unionId !== undefined ? payload.unionId : existingRequest.unionId;

  if (payload.upazilaId !== undefined || payload.unionId !== undefined) {
    await validateLocation(nextUpazilaId, nextUnionId);
  }

  // Once donors have been contacted, changing who is needed or where would make that wrong.
  const bloodTypeChanged =
    payload.bloodType !== undefined &&
    payload.bloodType !== existingRequest.bloodType;
  const areaChanged =
    nextUpazilaId !== existingRequest.upazilaId ||
    (nextUnionId ?? null) !== (existingRequest.unionId ?? null);

  if (bloodTypeChanged || areaChanged) {
    const notified = await prisma.donationMatch.count({ where: { requestId } });

    if (notified > 0) {
      throw new ApiError(
        409,
        "Donors have already been notified. To change the blood type or location, cancel this request and create a new one.",
      );
    }
  }

  const updateData = {
    ...(payload.patientName !== undefined && {
      patientName: payload.patientName,
    }),
    ...(payload.hospitalName !== undefined && {
      hospitalName: payload.hospitalName,
    }),
    ...(Boolean(payload.contactPhone?.trim()) && {
      contactPhone: payload.contactPhone!.trim(),
    }),
    ...(payload.note !== undefined && { note: payload.note }),
    ...(payload.bloodType !== undefined && { bloodType: payload.bloodType }),
    ...(payload.unitsNeeded !== undefined && {
      unitsNeeded: payload.unitsNeeded,
    }),
    ...(payload.urgency !== undefined && { urgency: payload.urgency }),
    ...(payload.upazilaId !== undefined && { upazilaId: payload.upazilaId }),
    ...(payload.unionId !== undefined && { unionId: payload.unionId }),
    ...(payload.latitude !== undefined && { latitude: payload.latitude }),
    ...(payload.longitude !== undefined && { longitude: payload.longitude }),
  };

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "Provide at least one field to update");
  }

  const updated = await prisma.donationRequest.updateMany({
    where: {
      id: requestId,
      requesterId,
      status: RequestStatus.OPEN,
      ...(payload.unitsNeeded !== undefined && {
        unitsAccepted: { lte: payload.unitsNeeded },
      }),
    },
    data: updateData,
  });

  if (updated.count === 0) {
    throw new ApiError(
      409,
      "This request changed while you were editing it. Reload and try again.",
    );
  }

  return prisma.donationRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: {
      upazila: areaSelect,
      union: areaSelect,
    },
  });
};

const cancelMyDonationRequest = async (
  requesterId: string,
  requestId: string,
) => {
  return prisma.$transaction(async (tx) => {
    const existingRequest = await tx.donationRequest.findFirst({
      where: { id: requestId, requesterId },
    });

    if (!existingRequest) {
      throw new ApiError(404, "Donation request not found");
    }

    // A request whose slots are all taken is FULFILLED, but it can still be cancelled
    if (
      existingRequest.status !== RequestStatus.OPEN &&
      existingRequest.status !== RequestStatus.FULFILLED
    ) {
      throw new ApiError(
        400,
        "Only open or fulfilled donation requests can be cancelled",
      );
    }

    // Once a donor has actually donated, the request is part of the history
    const completed = await tx.donationMatch.count({
      where: { requestId, status: MatchStatus.COMPLETED },
    });

    if (completed > 0) {
      throw new ApiError(
        409,
        "A donation for this request is already completed, so it can't be cancelled",
      );
    }

    const accepted = await tx.donationMatch.findMany({
      where: { requestId, status: MatchStatus.ACCEPTED },
      select: { donorId: true },
    });

    // Guarded write: matches 0 rows if the request was closed by someone else in the meantime
    const updated = await tx.donationRequest.updateMany({
      where: {
        id: requestId,
        requesterId,
        status: { in: [RequestStatus.OPEN, RequestStatus.FULFILLED] },
      },
      data: { status: RequestStatus.CANCELLED },
    });

    if (updated.count === 0) {
      throw new ApiError(409, "This request can no longer be cancelled");
    }

    await tx.donationMatch.updateMany({
      where: {
        requestId,
        status: { in: [MatchStatus.NOTIFIED, MatchStatus.ACCEPTED] },
      },
      data: { status: MatchStatus.CANCELLED },
    });

    // Only donors who had already said yes need to hear about it
    if (accepted.length > 0) {
      await tx.notification.createMany({
        data: accepted.map((m) => ({
          userId: m.donorId,
          type: NotificationType.REQUEST_CANCELLED,
          title: "Request cancelled",
          message: `The ${BloodLabel[existingRequest.bloodType]} request you accepted was cancelled by the requester. Thank you for being ready to help.`,
          link: `/requests/${requestId}`,
        })),
      });
    }

    return tx.donationRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: {
        upazila: areaSelect,
        union: areaSelect,
      },
    });
  });
};

// For a scheduled job (e.g. hourly). Requests that already have an accepted donor are left alone.
const expireOverdueRequests = async () => {
  const now = Date.now();

  const overdue = await prisma.donationRequest.findMany({
    where: {
      status: RequestStatus.OPEN,
      matches: { none: { status: MatchStatus.ACCEPTED } },
      OR: Object.entries(REQUEST_EXPIRY_HOURS).map(([urgency, hours]) => ({
        urgency: urgency as Urgency,
        createdAt: { lt: new Date(now - hours * 3_600_000) },
      })),
    },
    select: { id: true, requesterId: true, bloodType: true },
  });

  if (overdue.length === 0) return 0;

  const ids = overdue.map((request) => request.id);

  await prisma.$transaction([
    prisma.donationRequest.updateMany({
      where: { id: { in: ids }, status: RequestStatus.OPEN },
      data: { status: RequestStatus.EXPIRED },
    }),
    prisma.donationMatch.updateMany({
      where: { requestId: { in: ids }, status: MatchStatus.NOTIFIED },
      data: { status: MatchStatus.CANCELLED },
    }),
    prisma.notification.createMany({
      data: overdue.map((request) => ({
        userId: request.requesterId,
        type: NotificationType.REQUEST_EXPIRED,
        title: "Your request expired",
        message: `Your ${BloodLabel[request.bloodType]} request received no response in time. You can create a new request or contact a blood bank.`,
        link: "/blood-banks",
      })),
    }),
  ]);

  return ids.length;
};

export const requestServices = {
  createDonationRequest,
  getDonationRequestById,
  getAllDonationRequests,
  getMyDonationRequests,
  updateMyDonationRequest,
  cancelMyDonationRequest,
  expireOverdueRequests,
};
