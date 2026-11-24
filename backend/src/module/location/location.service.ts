import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { randomUUID } from "node:crypto";
import { parsePagination } from "../../utils/parsePagination";
import { validateCoordinates } from "../../utils/validateCordinates";

export const LEVELS = ["division", "district", "upazila", "union"] as const;
export type Level = (typeof LEVELS)[number];

type CreateDivisionInput = {
  id: string
  name: string;
  bn_name: string;
  url: string;
};
type CreateDistrictInput = {
  id: string;
  name: string;
  bn_name: string;
  url: string;
  latitude: number;
  longitude: number;
  divisionId: string;
};
type CreateUpazilaInput = {
  id: string;
  name: string;
  bn_name: string;
  url: string;
  districtId: string;
};
type CreateUnionInput = {
  id: string;
  name: string;
  bn_name: string;
  url: string;
  upazilaId: string;
};

export type ListLocationsFilters = {
  level?: string;
  q?: string;
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  page?: number | string;
  limit?: number | string;
};

export type LocationInput = {
  id?: string;
  name?: string;
  bn_name?: string;
  url?: string;
  latitude?: number;
  longitude?: number;
  parentId?: string; // divisionId, districtId or upazilaId, depending on the level
};



const createDivision = async (payload: CreateDivisionInput) => {
  const existing = await prisma.division.findUnique({
    where: { id: payload.id },
    select: { id: true },
  });
  if (existing) {
    throw new ApiError(409, "Division ID already exists");
  }
  return prisma.division.create({ data: payload });
};

const createDistrict = async (payload: CreateDistrictInput) => {
  const division = await prisma.division.findUnique({
    where: { id: payload.divisionId },
    select: { id: true },
  });
  if (!division) {
    throw new ApiError(404, "Division not found");
  }

  const existing = await prisma.district.findUnique({
    where: { id: payload.id },
    select: { id: true },
  });
  if (existing) {
    throw new ApiError(409, "District ID already exists");
  }

  if (
    !Number.isFinite(payload.latitude) ||
    !Number.isFinite(payload.longitude) ||
    payload.latitude < -90 ||
    payload.latitude > 90 ||
    payload.longitude < -180 ||
    payload.longitude > 180
  ) {
    throw new ApiError(400, "Invalid latitude or longitude");
  }
  return prisma.district.create({ data: payload });
};

const createUpazila = async (payload: CreateUpazilaInput) => {
  const district = await prisma.district.findUnique({
    where: { id: payload.districtId },
    select: { id: true },
  });
  if (!district) {
    throw new ApiError(404, "District not found");
  }

  const existing = await prisma.upazila.findUnique({
    where: { id: payload.id },
    select: { id: true },
  });
  if (existing) {
    throw new ApiError(409, "Upazila ID already exists");
  }

  return prisma.upazila.create({ data: payload });
};

const createUnion = async (payload: CreateUnionInput) => {
  const upazila = await prisma.upazila.findUnique({
    where: { id: payload.upazilaId },
    select: { id: true },
  });
  if (!upazila) {
    throw new ApiError(404, "Upazila not found");
  }

  const existing = await prisma.union.findUnique({
    where: { id: payload.id },
    select: { id: true },
  });
  if (existing) {
    throw new ApiError(409, "Union ID already exists");
  }

  return prisma.union.create({ data: payload });
};


const getAllDivisions = async () => {
  return prisma.division.findMany({
    select: {
      id: true,
      name: true,
      bn_name: true,
      url: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

const getDistrictsByDivisionId = async (divisionId: string) => {
  const division = await prisma.division.findUnique({
    where: { id: divisionId },
    select: { id: true },
  });

  if (!division) {
    throw new ApiError(404, "Division not found");
  }

  return prisma.district.findMany({
    where: { divisionId },
    select: {
      id: true,
      name: true,
      bn_name: true,
      url: true,
      latitude: true,
      longitude: true,
      divisionId: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

const getUpazilasByDistrictId = async (districtId: string) => {
  const district = await prisma.district.findUnique({
    where: { id: districtId },
    select: { id: true },
  });

  if (!district) {
    throw new ApiError(404, "District not found");
  }

  return prisma.upazila.findMany({
    where: { districtId },
    select: {
      id: true,
      name: true,
      bn_name: true,
      url: true,
      districtId: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

const getUnionsByUpazilaId = async (upazilaId: string) => {
  const upazila = await prisma.upazila.findUnique({
    where: { id: upazilaId },
    select: { id: true },
  });

  if (!upazila) {
    throw new ApiError(404, "Upazila not found");
  }

  return prisma.union.findMany({
    where: { upazilaId },
    select: {
      id: true,
      name: true,
      bn_name: true,
      url: true,
      upazilaId: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};


const assertLevel = (level: unknown): Level => {
  if (!LEVELS.includes(level as Level)) {
    throw new ApiError(
      400,
      "Level must be division, district, upazila or union",
    );
  }
  return level as Level;
};

// Validates the fields shared by create and update
const cleanFields = (payload: LocationInput, level: Level) => {
  const name = payload.name?.trim();
  const bn_name = payload.bn_name?.trim();
  const url = payload.url?.trim() ?? "";

  if (!name || name.length > 30)
    throw new ApiError(400, "Name is required (up to 30 characters)");
  if (!bn_name || bn_name.length > 30)
    throw new ApiError(400, "Bengali name is required (up to 30 characters)");
  if (url.length > 150)
    throw new ApiError(400, "URL can be at most 150 characters");

  if (level !== "district") return { name, bn_name, url };

  if (payload.latitude === undefined || payload.longitude === undefined) {
    throw new ApiError(400, "A district needs both latitude and longitude");
  }
  validateCoordinates(payload.latitude, payload.longitude);
  return {
    name,
    bn_name,
    url,
    latitude: payload.latitude,
    longitude: payload.longitude,
  };
};

// ---------- Admin: list with search and parent filters ----------

const listLocations = async (filters: ListLocationsFilters = {}) => {
  const level = assertLevel(filters.level ?? "division");
  const { page, limit } = parsePagination(filters.page, filters.limit);
  const q = filters.q?.trim();
  const { divisionId, districtId, upazilaId } = filters;

  const text = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { bn_name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};
  const paging = {
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { name: "asc" as const },
  };

  let rows: {
    id: string;
    name: string;
    bn_name: string;
    url: string;
    latitude: number | null;
    longitude: number | null;
    parent: string | null;
    children: number | null;
  }[] = [];
  let total = 0;

  if (level === "division") {
    const where = text;
    const [data, count] = await prisma.$transaction([
      prisma.division.findMany({
        where,
        ...paging,
        include: { _count: { select: { districts: true } } },
      }),
      prisma.division.count({ where }),
    ]);
    total = count;
    rows = data.map((d) => ({
      ...d,
      latitude: null,
      longitude: null,
      parent: null,
      children: d._count.districts,
    }));
  }

  if (level === "district") {
    const where = { ...text, ...(divisionId && { divisionId }) };
    const [data, count] = await prisma.$transaction([
      prisma.district.findMany({
        where,
        ...paging,
        include: {
          division: { select: { name: true } },
          _count: { select: { upazilas: true } },
        },
      }),
      prisma.district.count({ where }),
    ]);
    total = count;
    rows = data.map((d) => ({
      ...d,
      parent: d.division.name,
      children: d._count.upazilas,
    }));
  }

  if (level === "upazila") {
    const where = {
      ...text,
      ...(districtId
        ? { districtId }
        : divisionId
          ? { district: { divisionId } }
          : {}),
    };
    const [data, count] = await prisma.$transaction([
      prisma.upazila.findMany({
        where,
        ...paging,
        include: {
          district: {
            select: { name: true, division: { select: { name: true } } },
          },
          _count: { select: { unions: true } },
        },
      }),
      prisma.upazila.count({ where }),
    ]);
    total = count;
    rows = data.map((u) => ({
      ...u,
      latitude: null,
      longitude: null,
      parent: `${u.district.name}, ${u.district.division.name}`,
      children: u._count.unions,
    }));
  }

  if (level === "union") {
    const where = {
      ...text,
      ...(upazilaId
        ? { upazilaId }
        : districtId
          ? { upazila: { districtId } }
          : divisionId
            ? { upazila: { district: { divisionId } } }
            : {}),
    };
    const [data, count] = await prisma.$transaction([
      prisma.union.findMany({
        where,
        ...paging,
        include: {
          upazila: {
            select: { name: true, district: { select: { name: true } } },
          },
        },
      }),
      prisma.union.count({ where }),
    ]);
    total = count;
    rows = data.map((u) => ({
      ...u,
      latitude: null,
      longitude: null,
      parent: `${u.upazila.name}, ${u.upazila.district.name}`,
      children: null,
    }));
  }

  const [divisions, districts, upazilas, unions] = await Promise.all([
    prisma.division.count(),
    prisma.district.count(),
    prisma.upazila.count(),
    prisma.union.count(),
  ]);

  return {
    rows: rows.map(
      ({ id, name, bn_name, url, latitude, longitude, parent, children }) => ({
        id,
        name,
        bn_name,
        url,
        latitude,
        longitude,
        parent,
        children,
      }),
    ),
    counts: {
      division: divisions,
      district: districts,
      upazila: upazilas,
      union: unions,
    },
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ---------- Admin: create (reuses the existing create functions) ----------

const createLocation = async (levelInput: unknown, payload: LocationInput) => {
  const level = assertLevel(levelInput);
  const fields = cleanFields(payload, level);
  const id = payload.id?.trim() || randomUUID();

  if (level === "division")
    return createDivision({ id, ...fields } as CreateDivisionInput);

  if (!payload.parentId) throw new ApiError(400, "Choose the parent area");

  if (level === "district") {
    return createDistrict({
      id,
      ...fields,
      divisionId: payload.parentId,
    } as CreateDistrictInput);
  }
  if (level === "upazila") {
    return createUpazila({
      id,
      ...fields,
      districtId: payload.parentId,
    } as CreateUpazilaInput);
  }
  return createUnion({
    id,
    ...fields,
    upazilaId: payload.parentId,
  } as CreateUnionInput);
};

// ---------- Admin: update (the parent never changes) ----------

const updateLocation = async (
  levelInput: unknown,
  id: string,
  payload: LocationInput,
) => {
  const level = assertLevel(levelInput);
  const data = cleanFields(payload, level);

  try {
    if (level === "division")
      return await prisma.division.update({ where: { id }, data });
    if (level === "district")
      return await prisma.district.update({ where: { id }, data });
    if (level === "upazila")
      return await prisma.upazila.update({ where: { id }, data });
    return await prisma.union.update({ where: { id }, data });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      throw new ApiError(404, "Location not found");
    }
    throw error;
  }
};

export const locationServices = {
  getAllDivisions,
  getDistrictsByDivisionId,
  getUpazilasByDistrictId,
  getUnionsByUpazilaId,
  createDivision,
  createDistrict,
  createUpazila,
  createUnion,
  listLocations,
  createLocation,
  updateLocation,
};
