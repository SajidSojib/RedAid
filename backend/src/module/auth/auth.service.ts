import { BloodType, Role } from "../../../generated/prisma/enums";
import { auth as betterAuth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { validateServiceAreas } from "../../utils/validateServiceAreas";

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
  lastDonationDate?: string | null;
  serviceAreas: ServiceAreaInput[];
};

type RegisterBankOwnerInput = {
  name: string;
  email: string;
  password: string;
  image?: string | null;
  bloodType: BloodType
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

const assertEmailAvailable = async (email: string) => {
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });

  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }
};

const loginUser = async (payload: LoginUserInput) => {
  const { headers, response } = await betterAuth.api.signInEmail({
    body: { email: payload.email, password: payload.password },
    returnHeaders: true,
  });

  if (!response.user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!response.user.emailVerified) {
    throw new ApiError(403, "Please verify your email address");
  }
  return { result: response, cookies: headers.getSetCookie() };
};


const registerUser = async (payload: RegisterUserInput) => {
  const serviceAreas = await validateServiceAreas(payload.serviceAreas);

  // null / "" / missing means the donor has never donated
  const lastDonationDate = payload.lastDonationDate
    ? new Date(payload.lastDonationDate)
    : undefined;

  if (
    lastDonationDate &&
    (Number.isNaN(lastDonationDate.getTime()) || lastDonationDate > new Date())
  ) {
    throw new ApiError(400, "Invalid last donation date");
  }

  await assertEmailAvailable(payload.email);

  const result = await betterAuth.api.signUpEmail({
    body: {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      bloodType: payload.bloodType,
      image: payload.image || undefined,
      phone: payload.phone,
      lastDonationDate,
    },
  });

  // Save the selected service areas
  try {
    await prisma.donorServiceArea.createMany({
      data: serviceAreas.map((area) => ({
        donorId: result.user.id,
        upazilaId: area.upazilaId,
        unionId: area.unionId,
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
    serviceAreas,
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
    },
  });

  try {
    // bank and inventory
    const bloodBank = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: result.user.id },
        data: { role: Role.BANK },
      });
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