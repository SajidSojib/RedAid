import type { Request, Response } from "express";

import { ListLocationsFilters, locationServices } from "./location.service";
import { ApiResponse } from "../../utils/apiResponse";
import asyncHandler from "../../utils/asyncHandler";

const getAllDivisions = asyncHandler(async (req: Request, res: Response) => {
    const divisions = await locationServices.getAllDivisions();

    const response = new ApiResponse(200, divisions, "Divisions retrieved successfully");
    return response.send(res);
  });

const getDistrictsByDivisionId = asyncHandler(async (req: Request, res: Response) => {
    const { divisionId } = req.params;

    const districts = await locationServices.getDistrictsByDivisionId(divisionId as string);

    const response = new ApiResponse(200, districts, "Districts retrieved successfully");
    return response.send(res);
  });

const getUpazilasByDistrictId = asyncHandler(async (req: Request, res: Response) => {
    const { districtId } = req.params;

    const upazilas = await locationServices.getUpazilasByDistrictId(districtId as string);

    const response = new ApiResponse(200, upazilas, "Upazilas retrieved successfully");
    return response.send(res);
  });

const getUnionsByUpazilaId = asyncHandler(async (req: Request, res: Response) => {
    const { upazilaId } = req.params;

    const unions = await locationServices.getUnionsByUpazilaId(upazilaId as string);

    const response = new ApiResponse(200, unions, "Unions retrieved successfully");
    return response.send(res);
  });

const createDivision = asyncHandler(async (req: Request, res: Response) => {
    const division = await locationServices.createDivision(req.body);

    const response = new ApiResponse(201, division, "Division created successfully");
    return response.send(res);
  });

const createDistrict = asyncHandler(async (req: Request, res: Response) => {
    const district = await locationServices.createDistrict(req.body);

    const response = new ApiResponse(201, district, "District created successfully");
    return response.send(res);
  },
);

const createUpazila = asyncHandler(async (req: Request, res: Response) => {
    const upazila = await locationServices.createUpazila(req.body);

    const response = new ApiResponse(201, upazila, "Upazila created successfully");
    return response.send(res);
  },
);

const createUnion = asyncHandler(async (req: Request, res: Response) => {
    const union = await locationServices.createUnion(req.body);

    const response = new ApiResponse(201, union, "Union created successfully");
    return response.send(res);
  },
);

const listLocations = asyncHandler(async (req: Request, res: Response) => {
  const result = await locationServices.listLocations(
    req.query as unknown as ListLocationsFilters,
  );
  return new ApiResponse(200, result, "Locations retrieved successfully").send(
    res,
  );
});

const createLocation = asyncHandler(async (req: Request, res: Response) => {
  const location = await locationServices.createLocation(
    req.params.level,
    req.body,
  );
  return new ApiResponse(201, location, "Location created successfully").send(
    res,
  );
});

const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  const location = await locationServices.updateLocation(
    req.params.level,
    req.params.id as string,
    req.body,
  );
  return new ApiResponse(200, location, "Location updated successfully").send(
    res,
  );
});

export const locationControllers = {
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
