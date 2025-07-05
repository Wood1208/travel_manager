import { Router } from "express";
import { 
  createAttraction, 
  updateAttraction, 
  deleteAttractionWithTicketsAndEngagement,
  getAttractionsList,
  createTicketForDay,
  updateTicketForDay
} 
from "./attractionController.js";

const router = Router();

router.put("/update-TicketForDay/:id", updateTicketForDay); // 修改景点对应日期的门票
router.post("/create-attractionWithTicket/:id", createTicketForDay); // 创建景点对应日期的门票
router.post("/create-attraction", createAttraction); // 创建景点
router.put("/update-attraction/:id", updateAttraction); // 修改景点信息和门票记录
router.delete("/delete-attraction/:id", deleteAttractionWithTicketsAndEngagement); // 删除景点及相关数据
router.get("/getAttractionList", getAttractionsList); // 获取景点数据

export default router;