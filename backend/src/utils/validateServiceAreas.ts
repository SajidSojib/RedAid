import { prisma } from "../lib/prisma";
import { ApiError } from "./apiError";

export const MAX_SERVICE_AREAS = 5;

export type ServiceAreaInput = {
  upazilaId: string;
  unionId?: string | null;
};

// Returns the cleaned list: unionId is always a string or null, never "" or undefined
export const validateServiceAreas = async (input: ServiceAreaInput[]) => {
  if (!Array.isArray(input) || input.length === 0) {
    throw new ApiError(400, "You must select at least one service area");
  }

  const areas = input.map((area) => ({
    upazilaId: area?.upazilaId,
    unionId: area?.unionId || null,
  }));

  if (
    areas.some((area) => typeof area.upazilaId !== "string" || !area.upazilaId)
  ) {
    throw new ApiError(400, "Each service area needs an upazila");
  }

  if (areas.length > MAX_SERVICE_AREAS) {
    throw new ApiError(
      400,
      `You can select at most ${MAX_SERVICE_AREAS} service areas`,
    );
  }

  const keys = areas.map(
    (area) => `${area.upazilaId}:${area.unionId ?? "ALL"}`,
  );
  if (new Set(keys).size !== keys.length) {
    throw new ApiError(400, "Duplicate service areas are not allowed");
  }

  // A whole upazila already covers every union in it, so a union inside it is redundant
  const wholeUpazilas = new Set(
    areas.filter((area) => area.unionId === null).map((area) => area.upazilaId),
  );
  if (
    areas.some(
      (area) => area.unionId !== null && wholeUpazilas.has(area.upazilaId),
    )
  ) {
    throw new ApiError(
      400,
      "You selected a whole upazila, so you can't also select a specific union inside it",
    );
  }

  const upazilaIds = [...new Set(areas.map((area) => area.upazilaId))];
  const unionIds = [
    ...new Set(areas.flatMap((area) => (area.unionId ? [area.unionId] : []))),
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

  const parentOf = new Map(unions.map((union) => [union.id, union.upazilaId]));
  for (const area of areas) {
    if (area.unionId && parentOf.get(area.unionId) !== area.upazilaId) {
      throw new ApiError(
        400,
        "A selected union does not belong to its upazila",
      );
    }
  }

  return areas as { upazilaId: string; unionId: string | null }[];
};
