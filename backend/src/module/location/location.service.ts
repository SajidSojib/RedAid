import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";


type CreateDivisionInput = {
  id: string;
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

export const locationServices = {
  getAllDivisions,
  getDistrictsByDivisionId,
  getUpazilasByDistrictId,
  getUnionsByUpazilaId,
  createDivision,
  createDistrict,
  createUpazila,
  createUnion,
};
