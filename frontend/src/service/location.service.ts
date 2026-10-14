import { env } from "@/env";
import { cookies } from "next/headers";

const API_URL = env.API_URL

interface CreateDivisionInput {
  name: string
  bn_name: string
  url: string
};
interface CreateDistrictInput {
  name: string
  bn_name: string
  url: string
  latitude: number
  longitude: number
  divisionId: string
};
interface CreateUpazilaInput {
  name: string;
  bn_name: string;
  url: string;
  districtId: string;
};
interface CreateUnionInput {
  name: string;
  bn_name: string;
  url: string;
  upazilaId: string;
};
export type LocationOption = { id: string; name: string; bn_name: string };

const getList = async (path: string) => {
  try {
    const res = await fetch(`${env.API_URL}${path}`, {
      next: { revalidate: 86400 },
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      return {
        data: null,
        error: { message: result.message ?? "Failed to load locations" },
      };
    }

    return { data: result.data as LocationOption[], error: null };
  } catch {
    return { data: null, error: { message: "Failed to load locations" } };
  }
};

export const locationServices = {
  getAllDivisions: () => getList("/location/divisions"),
  getDistrictsByDivisionId: (divisionId: string) =>
    getList(`/location/divisions/${divisionId}/districts`),
  getUpazilasByDistrictId: (districtId: string) =>
    getList(`/location/districts/${districtId}/upazilas`),
  getUnionsByUpazilaId: (upazilaId: string) =>
    getList(`/location/upazilas/${upazilaId}/unions`),
};
