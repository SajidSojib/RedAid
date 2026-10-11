import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { BloodType, VerificationStatus } from "../../../generated/prisma/enums";

type ServiceAreaInput = {
  upazilaId: string;
  unionId?: string | null;
};

type UpdateMyProfileInput = {
  name?: string;
  phone?: string;
  image?: string;
  bloodType?: BloodType;
  lastDonationDate?: Date | string | null;
  serviceAreas?: ServiceAreaInput[];
};

type UpdateMyBankInput = {
  name?: string;
  address?: string;
  phone?: string;
  licenseNumber?: string;
  upazilaId?: string;
  latitude?: number | null;
  longitude?: number | null;
};

const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      donorServiceAreas: {
        include: {
          upazila: true,
          union: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};


const validateServiceAreas = async (serviceAreas: ServiceAreaInput[]) => {
  if (serviceAreas.length === 0) {
    throw new ApiError(400, "You must select at least one service area");
  }

  // Duplicate = same upazila AND same union (two unions in one upazila is fine)
  const keys = serviceAreas.map((a) => `${a.upazilaId}:${a.unionId ?? "ALL"}`);
  if (new Set(keys).size !== keys.length) {
    throw new ApiError(400, "Duplicate service areas are not allowed");
  }

  const upazilaIds = [...new Set(serviceAreas.map((a) => a.upazilaId))];
  const unionIds = [
    ...new Set(serviceAreas.flatMap((a) => (a.unionId ? [a.unionId] : []))),
  ];

  const [upazilas, unions] = await Promise.all([
    prisma.upazila.findMany({
      where: { id: { in: upazilaIds } },
      select: { id: true },
    }),
    unionIds.length > 0
      ? prisma.union.findMany({
          where: { id: { in: unionIds } },
          select: { id: true, upazilaId: true },
        })
      : Promise.resolve([] as { id: string; upazilaId: string }[]),
  ]);

  if (upazilas.length !== upazilaIds.length) {
    throw new ApiError(400, "One or more selected upazilas do not exist");
  }
  if (unions.length !== unionIds.length) {
    throw new ApiError(400, "One or more selected unions do not exist");
  }

  const parentOf = new Map(unions.map((u) => [u.id, u.upazilaId]));
  for (const area of serviceAreas) {
    if (area.unionId && parentOf.get(area.unionId) !== area.upazilaId) {
      throw new ApiError(
        400,
        "A selected union does not belong to its upazila",
      );
    }
  }
};

const updateMyProfile = async (
  userId: string,
  payload: UpdateMyProfileInput,
) => {
  const lastDonationDate =
    payload.lastDonationDate === undefined
      ? undefined
      : payload.lastDonationDate === null || payload.lastDonationDate === ""
        ? null
        : payload.lastDonationDate instanceof Date
          ? payload.lastDonationDate
          : new Date(payload.lastDonationDate);

  if (lastDonationDate instanceof Date) {
    if (Number.isNaN(lastDonationDate.getTime())) {
      throw new ApiError(400, "Invalid last donation date");
    }
    if (lastDonationDate > new Date()) {
      throw new ApiError(400, "Last donation date cannot be in the future");
    }
  }

  const updateData = {
    ...(payload.name !== undefined && { name: payload.name }),
    ...(payload.phone !== undefined && { phone: payload.phone }),
    ...(payload.image !== undefined && { image: payload.image }),
    ...(payload.bloodType !== undefined && { bloodType: payload.bloodType }),
    ...(lastDonationDate !== undefined && { lastDonationDate }),
  };

  const serviceAreas = payload.serviceAreas;

  if (Object.keys(updateData).length === 0 && serviceAreas === undefined) {
    throw new ApiError(400, "Provide at least one field to update");
  }

  if (serviceAreas !== undefined) {
    await validateServiceAreas(serviceAreas);
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({
      where: { id: userId },
      select: { donationCount: true, bloodType: true, lastDonationDate: true },
    });

    if (!current) {
      throw new ApiError(404, "User not found");
    }

    // Once a donation is confirmed, the system owns these two fields.
    if (current.donationCount > 0) {
      const bloodTypeChanged =
        payload.bloodType !== undefined &&
        payload.bloodType !== current.bloodType;

      const dateChanged =
        lastDonationDate !== undefined &&
        (lastDonationDate?.getTime() ?? null) !==
          (current.lastDonationDate?.getTime() ?? null);

      if (bloodTypeChanged || dateChanged) {
        throw new ApiError(
          403,
          "Blood type and last donation date can't be changed after a confirmed donation. Please contact an admin.",
        );
      }
    }

    if (Object.keys(updateData).length > 0) {
      await tx.user.update({ where: { id: userId }, data: updateData });
    }

    if (serviceAreas !== undefined) {
      await tx.donorServiceArea.deleteMany({ where: { donorId: userId } });
      await tx.donorServiceArea.createMany({
        data: serviceAreas.map((a) => ({
          donorId: userId,
          upazilaId: a.upazilaId,
          unionId: a.unionId ?? null,
        })),
      });
    }

    return tx.user.findUniqueOrThrow({
      where: { id: userId },
      include: {donorServiceAreas : true},
    });
  });
};

const getMyBank = async (userId: string) => {
  const bank = await prisma.bloodBank.findUnique({
    where: { ownerId: userId },
    include: {
      inventory: true,
    },
  });

  if (!bank) {
    throw new ApiError(404, "Blood bank not found for this account");
  }

  return bank;
};

const updateMyBank = async (userId: string, payload: UpdateMyBankInput) => {
  const bank = await prisma.bloodBank.findUnique({
    where: { ownerId: userId },
    select: {
      id: true,
      name: true,
      address: true,
      licenseNumber: true,
      upazilaId: true,
      verificationStatus: true,
    },
  });

  if (!bank) {
    throw new ApiError(404, "Blood bank not found for this account");
  }

  // Required text fields: if sent, they must be non-empty (null is not allowed)
  const name = payload.name?.trim();
  const address = payload.address?.trim();
  const phone = payload.phone?.trim();
  const licenseNumber = payload.licenseNumber?.trim();

  if (payload.name !== undefined && !name) {
    throw new ApiError(400, "Bank name cannot be empty");
  }
  if (payload.address !== undefined && !address) {
    throw new ApiError(400, "Address cannot be empty");
  }
  if (payload.phone !== undefined && !phone) {
    throw new ApiError(400, "Phone cannot be empty");
  }
  if (payload.licenseNumber !== undefined && !licenseNumber) {
    throw new ApiError(400, "License number cannot be empty");
  }

  if (payload.upazilaId !== undefined && payload.upazilaId !== bank.upazilaId) {
    const upazila = await prisma.upazila.findUnique({
      where: { id: payload.upazilaId },
      select: { id: true },
    });
    if (!upazila) {
      throw new ApiError(400, "Selected upazila does not exist");
    }
  }

  // Coordinates are optional: a number sets them, null clears them
  const validCoord = (v: number, limit: number) =>
    Number.isFinite(v) && v >= -limit && v <= limit;

  if (
    payload.latitude !== undefined &&
    payload.latitude !== null &&
    !validCoord(payload.latitude, 90)
  ) {
    throw new ApiError(400, "Latitude must be between -90 and 90");
  }
  if (
    payload.longitude !== undefined &&
    payload.longitude !== null &&
    !validCoord(payload.longitude, 180)
  ) {
    throw new ApiError(400, "Longitude must be between -180 and 180");
  }

  // Identity fields are what the admin verified. Changing them invalidates that approval.
  const identityChanged =
    (name !== undefined && name !== bank.name) ||
    (address !== undefined && address !== bank.address) ||
    (licenseNumber !== undefined && licenseNumber !== bank.licenseNumber) ||
    (payload.upazilaId !== undefined && payload.upazilaId !== bank.upazilaId);

  const reverificationRequired =
    bank.verificationStatus === VerificationStatus.REJECTED ||
    (bank.verificationStatus === VerificationStatus.VERIFIED &&
      identityChanged);

  const updateData = {
    ...(name !== undefined && { name }),
    ...(address !== undefined && { address }),
    ...(phone !== undefined && { phone }),
    ...(licenseNumber !== undefined && { licenseNumber }),
    ...(payload.upazilaId !== undefined && { upazilaId: payload.upazilaId }),
    ...(payload.latitude !== undefined && { latitude: payload.latitude }),
    ...(payload.longitude !== undefined && { longitude: payload.longitude }),
    ...(reverificationRequired && {
      verificationStatus: VerificationStatus.PENDING,
      verifiedAt: null,
      verificationNote: null,
    }),
  };

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "Provide at least one field to update");
  }

  const updatedBank = await prisma.bloodBank.update({
    where: { id: bank.id },
    data: updateData,
    include: { inventory: true },
  });

  return { ...updatedBank, reverificationRequired };
};


export const profileServices = {
  getMyProfile,
  updateMyProfile,
  getMyBank,
  updateMyBank,
};
