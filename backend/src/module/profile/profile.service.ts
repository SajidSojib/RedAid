import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { BloodType } from "../../../generated/prisma/enums";


type UpdateMyProfileInput = {
  name?: string;
  phone?: string;
  image?: string;
  bloodType?: BloodType;
  lastDonationDate?: Date | string | null;
  serviceAreas?: {
    upazilaId: string;
    unionId?: string | null;
  }[];
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

  if (
    lastDonationDate instanceof Date &&
    Number.isNaN(lastDonationDate.getTime())
  ) {
    throw new ApiError(400, "Invalid last donation date");
  }

  const updateData = {
    ...(payload.name !== undefined && { name: payload.name }),
    ...(payload.phone !== undefined && { phone: payload.phone }),
    ...(payload.image !== undefined && { image: payload.image }),
    ...(payload.bloodType !== undefined && {
      bloodType: payload.bloodType,
    }),
    ...(lastDonationDate !== undefined && {
      lastDonationDate,
    }),
  };

  const shouldUpdateServiceAreas = payload.serviceAreas !== undefined;

  if (Object.keys(updateData).length === 0 && !shouldUpdateServiceAreas) {
    throw new ApiError(400, "Provide at least one field to update");
  }

  if (shouldUpdateServiceAreas) {
    const { serviceAreas } = payload;

    if (!serviceAreas || serviceAreas.length === 0) {
      throw new ApiError(400, "You must select at least one service area");
    }

    const upazilaIds = serviceAreas.map((area) => area.upazilaId);

    if (new Set(upazilaIds).size !== upazilaIds.length) {
      throw new ApiError(
        400,
        "Each service area must have a different upazila",
      );
    }

    const existingUpazilas = await prisma.upazila.findMany({
      where: {
        id: { in: upazilaIds },
      },
      select: { id: true },
    });

    if (existingUpazilas.length !== upazilaIds.length) {
      throw new ApiError(400, "One or more selected upazilas do not exist");
    }

    const unionIds = serviceAreas
      .map((area) => area.unionId)
      .filter((id): id is string => Boolean(id));

    if (new Set(unionIds).size !== unionIds.length) {
      throw new ApiError(400, "A union cannot be selected more than once");
    }

    if (unionIds.length > 0) {
      const existingUnions = await prisma.union.findMany({
        where: {
          id: { in: unionIds },
        },
        select: {
          id: true,
          upazilaId: true,
        },
      });

      if (existingUnions.length !== unionIds.length) {
        throw new ApiError(400, "One or more selected unions do not exist");
      }

      const unionUpazilaMap = new Map(
        existingUnions.map((union) => [union.id, union.upazilaId]),
      );

      for (const area of serviceAreas) {
        if (
          area.unionId &&
          unionUpazilaMap.get(area.unionId) !== area.upazilaId
        ) {
          throw new ApiError(
            400,
            "The selected union does not belong to its upazila",
          );
        }
      }
    }
  }

  const user = await prisma.$transaction(async (tx) => {
    if (Object.keys(updateData).length > 0) {
      await tx.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    if (shouldUpdateServiceAreas) {
      await tx.donorServiceArea.deleteMany({
        where: { donorId: userId },
      });

      await tx.donorServiceArea.createMany({
        data: payload.serviceAreas!.map((area) => ({
          donorId: userId,
          upazilaId: area.upazilaId,
          unionId: area.unionId || null,
        })),
      });
    }

    const updatedUser = await tx.user.findUnique({
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

    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }

    return updatedUser;
  });

  return user;
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
    select: { id: true },
  });

  if (!bank) {
    throw new ApiError(404, "Blood bank not found for this account");
  }

  if (payload.upazilaId !== undefined) {
    const upazila = await prisma.upazila.findUnique({
      where: { id: payload.upazilaId },
      select: { id: true },
    });

    if (!upazila) {
      throw new ApiError(400, "Selected upazila does not exist");
    }
  }

  if (
    payload.latitude !== undefined &&
    payload.latitude !== null &&
    (payload.latitude < -90 || payload.latitude > 90)
  ) {
    throw new ApiError(400, "Latitude must be between -90 and 90");
  }

  if (
    payload.longitude !== undefined &&
    payload.longitude !== null &&
    (payload.longitude < -180 || payload.longitude > 180)
  ) {
    throw new ApiError(400, "Longitude must be between -180 and 180");
  }

  const updateData = {
    ...(payload.name !== undefined && { name: payload.name }),
    ...(payload.address !== undefined && { address: payload.address }),
    ...(payload.phone !== undefined && { phone: payload.phone }),
    ...(payload.licenseNumber !== undefined && {
      licenseNumber: payload.licenseNumber,
    }),
    ...(payload.upazilaId !== undefined && {
      upazila: {
        connect: { id: payload.upazilaId },
      },
    }),
    ...(payload.latitude !== undefined && {
      latitude: payload.latitude,
    }),
    ...(payload.longitude !== undefined && {
      longitude: payload.longitude,
    }),
  };

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "Provide at least one field to update");
  }

  const updatedBank = await prisma.bloodBank.update({
    where: { id: bank.id },
    data: updateData,
    include: {
      inventory: true,
    },
  });

  return updatedBank;
};

export const profileServices = {
  getMyProfile,
  updateMyProfile,
  getMyBank,
  updateMyBank,
};
