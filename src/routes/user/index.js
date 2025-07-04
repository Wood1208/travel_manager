import { Router } from "express";
import {
  getUserFavorites,
  incrementLike,
  incrementShare,
  addFavorite,
  getUserReservations,
  addReservation
} from "./userController.js";

const router = Router();

router.post("/addReservation/:id", addReservation); // 用户预约
router.put("/incrementLike/:id", incrementLike); // 点赞
router.put("/incrementShare/:id", incrementShare); // 转发
router.put("/addFavorite/:id", addFavorite); // 收藏
router.get("/getUserFavorites/:id", getUserFavorites); // 获取用户收藏
router.get("/getUserReservations/:id", getUserReservations); // 获取用户预约

export default router;