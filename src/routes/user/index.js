import { Router } from "express";
import {
  getUserFavorites,
  incrementLike,
  incrementShare,
  addFavorite,
  getUserReservations,
  addReservation,
  decrementLike,
  removeFavorite,
  getUserFavoriteById,
  removeReservation
} from "./userController.js";
import { authenticate } from "../../middlewares/authMiddleware.js";

const router = Router();

router.post("/addReservation/:id", authenticate, addReservation); // 用户预约
router.put("/incrementLike/:id", authenticate, incrementLike); // 点赞
router.put("/decrementLike/:id", authenticate, decrementLike); // 取消点赞
router.put("/incrementShare/:id", authenticate, incrementShare); // 转发
router.put("/addFavorite/:id", authenticate, addFavorite); // 收藏
router.put("/removeFavorite/:id", authenticate, removeFavorite); // 取消收藏
router.get("/getUserFavorites", authenticate, getUserFavorites); // 获取用户收藏
router.get('/getUserFavoriteById/:id', authenticate, getUserFavoriteById); // 获取用户是否收藏该景点
router.get("/getUserReservations", authenticate, getUserReservations); // 获取用户预约
router.put("/removeReservation/:id", authenticate, removeReservation); // 移除用户预约记录


export default router;