"use server";

import { locationServices } from "@/service/location.service";

export const getAllDivisions = async () => {
    const res = await locationServices.getAllDivisions();
    return res;
}

export const getDistrictsByDivisionId = async (divisionId: string) => {
    const res = await locationServices.getDistrictsByDivisionId(divisionId);
    return res;
}

export const getUpazilasByDistrictId = async (districtId: string) => {
    const res = await locationServices.getUpazilasByDistrictId(districtId);
    return res;
}

export const getUnionsByUpazilaId = async (upazilaId: string) => {
    const res = await locationServices.getUnionsByUpazilaId(upazilaId);
    return res;
}