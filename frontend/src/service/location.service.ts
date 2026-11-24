import { env } from "@/env";
import { authedRequest } from "@/lib/server-api";

export type LocationOption = { id: string; name: string; bn_name: string };

export type Level = "division" | "district" | "upazila" | "union";

export type LocationRow = {
  id: string;
  name: string;
  bn_name: string;
  url: string;
  latitude: number | null;
  longitude: number | null;
  parent: string | null;
  children: number | null;
};

export type LocationsPayload = {
  rows: LocationRow[];
  counts: Record<Level, number>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type LocationInput = {
  name: string;
  bn_name: string;
  url: string;
  latitude?: number;
  longitude?: number;
  parentId?: string;
};

const enc = encodeURIComponent;

const getList = async (path: string) => {
  try {
    const res = await fetch(`${env.API_URL}${path}`, {
      next: { revalidate: 86400 },
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      return {
        data: null,
        error: { message: result.message ?? "Failed to load "+path.split("/").pop()?.toLowerCase() },
      };
    }

    return { data: result.data as LocationOption[], error: null };
  } catch {
    return { data: null, error: { message: "Failed to load locations" } };
  }
};

const listLocations = (query: string) =>
  authedRequest<LocationsPayload>(`/location/admin${query ? `?${query}` : ""}`);

const createLocation = (level: Level, input: LocationInput) =>
  authedRequest<unknown>(`/location/admin/${level}`, {
    method: "POST",
    body: input,
  });

const updateLocation = (level: Level, id: string, input: LocationInput) =>
  authedRequest<unknown>(`/location/admin/${level}/${enc(id)}`, {
    method: "PATCH",
    body: input,
  });


export const locationServices = {
  getAllDivisions: () => getList("/location/divisions"),
  getDistrictsByDivisionId: (divisionId: string) =>
    getList(`/location/divisions/${divisionId}/districts`),
  getUpazilasByDistrictId: (districtId: string) =>
    getList(`/location/districts/${districtId}/upazilas`),
  getUnionsByUpazilaId: (upazilaId: string) =>
    getList(`/location/upazilas/${upazilaId}/unions`),
  listLocations,
  createLocation,
  updateLocation,
};
