import { Router } from "express";
import { chechAuth, createUser, loginUser } from "./authController.js";
import { authenticate } from "../../middlewares/authMiddleware.js";

const router = Router();

router.post('/sign-up', createUser);
router.post('/login', loginUser);
router.get('/check-auth', authenticate, chechAuth);

export default router;