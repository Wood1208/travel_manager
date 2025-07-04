import { Router } from "express";
import { 
  createAttraction, 
  updateAttractionWithTickets, 
  deleteAttractionWithTicketsAndEngagement,
  getAttractionsList
} 
from "./attractionController.js";

const router = Router();

router.post("/create-attraction", createAttraction); // 创建景点
router.put("/update-attraction/:id", updateAttractionWithTickets); // 修改景点信息和门票记录
router.delete("/delete-attraction/:id", deleteAttractionWithTicketsAndEngagement); // 删除景点及相关数据
router.get("/getAttractionList", getAttractionsList); // 获取景点数据

export default router;