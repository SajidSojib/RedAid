import { Router } from "express";
import auth from "../../middlewares/auth";
import { bankRequestControllers } from "./bank-request.controller";
import { Role } from "../../../generated/prisma/enums";
import requireActiveUser from "../../middlewares/requireActiveUser";
import requireActiveBank from "../../middlewares/requireActiveBank";

const router = Router();

// Requester routes
router.post("/", auth(Role.USER), requireActiveUser(), bankRequestControllers.createBankRequest);

// "/my" must stay above any "/:id" route
router.get("/my", auth(Role.USER), bankRequestControllers.getMyBankRequests);

// Bank owner: the incoming list
router.get(
  "/incoming",
  auth(Role.BANK),
  bankRequestControllers.getIncomingBankRequests,
);

router.patch(
  "/:id/withdraw",
  auth(Role.USER),
  requireActiveUser(),
  bankRequestControllers.withdrawBankRequest,
);

// Bank owner routes
router.patch(
  "/:id/approve",
  auth(Role.BANK),
  requireActiveBank(),
  bankRequestControllers.approveBankRequest,
);

router.patch(
  "/:id/reject",
  auth(Role.BANK),
  requireActiveBank(),
  bankRequestControllers.rejectBankRequest,
);

router.patch(
  "/:id/complete",
  auth(Role.BANK),
  requireActiveBank(),
  bankRequestControllers.completeBankRequest,
);

router.patch(
  "/:id/no-show",
  auth(Role.BANK),
  requireActiveBank(),
  bankRequestControllers.markBankRequestNoShow,
);


export const bankRequestRouter: Router = router;
