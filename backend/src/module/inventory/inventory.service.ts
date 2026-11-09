import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { BloodType } from "../../../generated/prisma/enums";

export const MAX_UNITS = 1000;

export type InventoryUpdateItem = {
  bloodType: BloodType;
  unitsAvailable: number;
};

const BLOOD_TYPES = Object.values(BloodType);

// ---------- 1. My inventory ----------

const getMyInventory = async (ownerId: string) => {
  const bank = await prisma.bloodBank.findUnique({
    where: { ownerId },
    select: {
      id: true,
      name: true,
      verificationStatus: true,
      inventory: {
        select: { bloodType: true, unitsAvailable: true, updatedAt: true },
      },
    },
  });

  if (!bank) {
    throw new ApiError(404, "Blood bank not found for this account");
  }

  // Always return all 8 types in a fixed order, even if a row is missing
  const byType = new Map(bank.inventory.map((row) => [row.bloodType, row]));
  const inventory = BLOOD_TYPES.map(
    (bloodType) =>
      byType.get(bloodType) ?? {
        bloodType,
        unitsAvailable: 0,
        updatedAt: null,
      },
  );

  return {
    bank: {
      id: bank.id,
      name: bank.name,
      verificationStatus: bank.verificationStatus,
    },
    inventory,
  };
};

// ---------- 2. Update several blood types at once ----------

const updateMyInventory = async (ownerId: string, items: unknown) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Provide at least one blood type to update");
  }

  const seen = new Set<string>();

  for (const item of items as InventoryUpdateItem[]) {
    if (!BLOOD_TYPES.includes(item?.bloodType)) {
      throw new ApiError(400, "Invalid blood type");
    }
    if (seen.has(item.bloodType)) {
      throw new ApiError(400, "Each blood type can only appear once");
    }
    seen.add(item.bloodType);

    if (
      typeof item.unitsAvailable !== "number" ||
      !Number.isInteger(item.unitsAvailable) ||
      item.unitsAvailable < 0 ||
      item.unitsAvailable > MAX_UNITS
    ) {
      throw new ApiError(
        400,
        `Units must be a whole number between 0 and ${MAX_UNITS}`,
      );
    }
  }

  const bank = await prisma.bloodBank.findUnique({
    where: { ownerId },
    select: { id: true },
  });

  if (!bank) {
    throw new ApiError(404, "Blood bank not found for this account");
  }

  // upsert, so a missing row is created instead of failing
  await prisma.$transaction(
    (items as InventoryUpdateItem[]).map((item) =>
      prisma.bloodInventory.upsert({
        where: {
          bankId_bloodType: { bankId: bank.id, bloodType: item.bloodType },
        },
        update: { unitsAvailable: item.unitsAvailable },
        create: {
          bankId: bank.id,
          bloodType: item.bloodType,
          unitsAvailable: item.unitsAvailable,
        },
      }),
    ),
  );

  return getMyInventory(ownerId);
};

export const inventoryServices = { getMyInventory, updateMyInventory };
