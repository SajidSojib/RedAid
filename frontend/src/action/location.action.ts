"use server";

import { Level, LocationInput, locationServices } from "@/service/location.service";
import { revalidatePath, updateTag } from "next/cache";

const expire = () => {
  updateTag("locations"); // the selects on signup, filters and profile
  revalidatePath("/dashboard/locations");
};

export const getAllDivisions = async () => {
  const res = await locationServices.getAllDivisions();
  return res;
};

export const getDistrictsByDivisionId = async (divisionId: string) => {
  const res = await locationServices.getDistrictsByDivisionId(divisionId);
  return res;
};

export const getUpazilasByDistrictId = async (districtId: string) => {
  const res = await locationServices.getUpazilasByDistrictId(districtId);
  return res;
};

export const getUnionsByUpazilaId = async (upazilaId: string) => {
  const res = await locationServices.getUnionsByUpazilaId(upazilaId);
  return res;
};
export const createLocation = async (level: Level, input: LocationInput) => {
  const res = await locationServices.createLocation(level, input);
  if (!res.error) expire();
  return res;
};

export const updateLocation = async (
  level: Level,
  id: string,
  input: LocationInput,
) => {
  const res = await locationServices.updateLocation(level, id, input);
  if (!res.error) expire();
  return res;
};