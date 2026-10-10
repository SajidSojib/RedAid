import { BloodType, Role } from "../../../generated/prisma/enums";
import { auth as betterAuth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";

type ServiceAreaInput = {
  upazilaId: string;
  unionId?: string | null;
};

type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
  image?: string | null;
  bloodType: BloodType
  phone: string;
  lastDonationDate: string;
  serviceAreas: ServiceAreaInput[];
};

type RegisterBankOwnerInput = {
  name: string;
  email: string;
  password: string;
  image?: string | null;
  bloodType: BloodType;
  phone: string;
  bank: {
    name: string;
    address: string;
    phone: string;
    licenseNumber: string;
    upazilaId: string;
    latitude?: number;
    longitude?: number;
  };
};

type LoginUserInput = {
  email: string;
  password: string;
};

const loginUser = async (payload: LoginUserInput) => {
  const result = await betterAuth.api.signInEmail({
    body: {
      email: payload.email,
      password: payload.password,
    },
  });

  if (!result.user) {
    throw new ApiError(401, "Invalid email or password");
  }

  return result;
};


const registerUser = async (payload: RegisterUserInput) => {
  const { serviceAreas } = payload;

  if (serviceAreas.length < 1) {
    throw new ApiError(
      400,
      "You must select at least 1 service area",
    );
  }

  const uniqueAreas = new Set(
    serviceAreas.map(
      (area) => `${area.upazilaId}:${area.unionId ?? "ALL"}`,
    ),
  );

  if (uniqueAreas.size !== serviceAreas.length) {
    throw new ApiError(400, "Duplicate service areas are not allowed");
  }

  const upazilaIds = [
    ...new Set(serviceAreas.map((area) => area.upazilaId)),
  ];

  const upazilas = await prisma.upazila.findMany({
    where: {
      id: { in: upazilaIds },
    },
    select: { id: true },
  });

  if (upazilas.length !== upazilaIds.length) {
    throw new ApiError(400, "One or more selected upazilas do not exist");
  }

  // Verify that each selected union belongs to its selected upazila
  const unionAreas = serviceAreas.filter(
    (area): area is ServiceAreaInput & { unionId: string } =>
      Boolean(area.unionId),
  );

  if (unionAreas.length > 0) {
    const unions = await prisma.union.findMany({
      where: {
        OR: unionAreas.map((area) => ({
          id: area.unionId,
          upazilaId: area.upazilaId,
        })),
      },
      select: {
        id: true,
        upazilaId: true,
      },
    });

    if (unions.length !== unionAreas.length) {
      throw new ApiError(
        400,
        "One or more selected unions do not belong to their upazilas",
      );
    }
  }

  const result = await betterAuth.api.signUpEmail({
    body: {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      bloodType: payload.bloodType,
      image: payload.image || undefined,
      phone: payload.phone,
      lastDonationDate: new Date(payload.lastDonationDate),
    },
  });

  // Save the selected service areas
  try {
    await prisma.donorServiceArea.createMany({
      data: serviceAreas.map((area) => ({
        donorId: result.user.id,
        upazilaId: area.upazilaId,
        unionId: area.unionId || null,
      })),
    });
  } catch (error) {
    try {
      await prisma.user.delete({
        where: { id: result.user.id },
      });
    } catch (cleanupError) {
      console.error(
        "Failed to clean up user after registration failure:",
        cleanupError,
      );
    }

    throw error;
  }

  return {
    user: result.user,
    serviceAreas
  };
};



const registerBankOwner = async (
  payload: RegisterBankOwnerInput,
) => {
  const { bank } = payload;

  const upazila = await prisma.upazila.findUnique({
    where: { id: bank.upazilaId },
    select: { id: true },
  });

  if (!upazila) {
    throw new ApiError(400, "Selected upazila does not exist");
  }

  if (
    (bank.latitude !== undefined &&
      (!Number.isFinite(bank.latitude) ||
        bank.latitude < -90 ||
        bank.latitude > 90)) ||
    (bank.longitude !== undefined &&
      (!Number.isFinite(bank.longitude) ||
        bank.longitude < -180 ||
        bank.longitude > 180))
  ) {
    throw new ApiError(400, "Invalid bank coordinates");
  }

  // Create the bank owner's account through Better Auth
  const result = await betterAuth.api.signUpEmail({
    body: {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      bloodType: payload.bloodType,
      image: payload.image || undefined,
      phone: payload.phone,
      role: Role.BANK,
    },
  });

  try {
    // bank and inventory
    const bloodBank = await prisma.$transaction(async (tx) => {
      const createdBank = await tx.bloodBank.create({
        data: {
          ownerId: result.user.id,
          name: bank.name,
          address: bank.address,
          phone: bank.phone,
          licenseNumber: bank.licenseNumber,
          upazilaId: bank.upazilaId,
          ...(bank.latitude !== undefined && {
            latitude: bank.latitude,
          }),
          ...(bank.longitude !== undefined && {
            longitude: bank.longitude,
          }),
        },
      });

      await tx.bloodInventory.createMany({
        data: Object.values(BloodType).map((bloodType) => ({
          bankId: createdBank.id,
          bloodType,
          unitsAvailable: 0,
        })),
      });

      return createdBank;
    });

    return {
      user: result.user,
      bank: bloodBank
    };
  } catch (error) {
    try {
      await prisma.user.delete({
        where: { id: result.user.id },
      });
    } catch (cleanupError) {
      console.error(
        "Failed to clean up bank owner after registration failure:",
        cleanupError,
      );
    }

    throw error;
  }
};

export const authServices = {
  registerUser,
  registerBankOwner,
  loginUser,
};