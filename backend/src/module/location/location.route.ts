import { Router } from "express";
import { locationControllers } from "./location.controller";
import { Role } from "../../../generated/prisma/enums";
import auth from "../../middlewares/auth";



const router = Router();

router.get("/divisions", locationControllers.getAllDivisions);

router.get(
  "/divisions/:divisionId/districts",
  locationControllers.getDistrictsByDivisionId,
);

router.get(
  "/districts/:districtId/upazilas",
  locationControllers.getUpazilasByDistrictId,
);

router.get(
  "/upazilas/:upazilaId/unions",
  locationControllers.getUnionsByUpazilaId,
);

router.post(
  "/divisions",
  auth(Role.ADMIN),
  locationControllers.createDivision,
);

router.post(
  "/districts",
  auth(Role.ADMIN),
  locationControllers.createDistrict,
);

router.post(
  "/upazilas",
  auth(Role.ADMIN),
  locationControllers.createUpazila,
);

router.post(
  "/unions",
  auth(Role.ADMIN),
  locationControllers.createUnion,
);

export const locationRouter: Router = router;