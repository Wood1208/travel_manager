import { Router } from "express";
import { createUser, loginUser } from "./authController.js";

const router = Router();

router.post('/sign-up', createUser);
router.post('/login', loginUser);

export default router;