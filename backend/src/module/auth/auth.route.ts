import { Router } from "express";

import { authControllers } from "./auth.controller";

const router = Router();

router.post("/login", authControllers.loginUser);
router.post("/register/user", authControllers.registerUser);
router.post("/register/bank", authControllers.registerBankOwner);

export const authRouter: Router = router;