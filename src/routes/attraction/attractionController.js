import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

// 创建景点及其每日门票记录
const createAttractionWithTickets = async (data) => {
  const { name, imageUrl, description, category, tags, totalTickets } = data;

  const today = new Date();
  const ticketDays = [];

  // 生成下7天的日期
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);  // 增加天数

    ticketDays.push({
      date: nextDate,
      totalTickets: totalTickets,
      remainingTickets: totalTickets,  // 初始剩余票数与总票数相同
      currentFlow: 0,  // 初始游客流量为 0
    });
  }

  try {
    // 使用事务创建景点和7天的门票记录
    const createdAttraction = await prisma.$transaction(async (prisma) => {
      // 创建景点
      const attraction = await prisma.attraction.create({
        data: {
          name,
          imageUrl,
          description,
          category,
          tags,
        },
      });

      // 为景点创建每日门票记录
      const ticketDaysData = ticketDays.map((ticket) => ({
        attractionId: attraction.id,
        date: ticket.date,
        totalTickets: ticket.totalTickets,
        remainingTickets: ticket.remainingTickets,
        currentFlow: ticket.currentFlow,
      }));

      // 批量创建门票记录
      await prisma.ticketDay.createMany({
        data: ticketDaysData,
      });

      // 创建景点互动数据
      const engagement = await prisma.attractionEngagement.create({
        data: {
          attractionId: attraction.id,
          likes: 0,       // 初始点赞数
          shares: 0,      // 初始转发数
          favorites: 0,   // 初始收藏数
        },
      });

      return { attraction, engagement };
    });

    console.log('景点、每日门票和互动数据已成功创建:', createdAttraction);
  } catch (error) {
    console.error('创建景点、每日门票和互动数据时出错:', error);
  }
};

// 修改景点信息和门票记录
const updateAttractionWithTickets = async (data) => {
  const { attractionId, name, imageUrl, description, category, tags, totalTickets } = data;

  const today = new Date();
  const ticketDays = [];

  // 生成下7天的日期
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);  // 增加天数

    ticketDays.push({
      date: nextDate,
      totalTickets: totalTickets,
      remainingTickets: totalTickets,  // 初始剩余票数与总票数相同
      currentFlow: 0,  // 初始游客流量为 0
    });
  }

  try {
    // 使用事务来更新景点、门票记录
    const updatedAttraction = await prisma.$transaction(async (prisma) => {
      // 更新景点信息
      const attraction = await prisma.attraction.update({
        where: { id: attractionId },
        data: {
          name,
          imageUrl,
          description,
          category,
          tags,
        },
      });

      // 更新或创建门票记录
      const ticketDaysData = ticketDays.map((ticket) => ({
        attractionId: attraction.id,
        date: ticket.date,
        totalTickets: ticket.totalTickets,
        remainingTickets: ticket.remainingTickets,
        currentFlow: ticket.currentFlow,
      }));

      // 删除旧的门票记录并批量创建新的记录
      await prisma.ticketDay.deleteMany({
        where: { attractionId: attraction.id },
      });

      await prisma.ticketDay.createMany({
        data: ticketDaysData,
      });

      return attraction;
    });

    console.log('景点和门票记录已成功更新:', updatedAttraction);
  } catch (error) {
    console.error('更新景点和门票记录时出错:', error);
  }
};

// 删除景点、门票记录和互动数据
const deleteAttractionWithTicketsAndEngagement = async (attractionId) => {
  try {
    // 使用事务来删除景点及其关联的数据
    const deletedAttraction = await prisma.$transaction(async (prisma) => {
      // 删除景点的互动数据
      await prisma.attractionEngagement.delete({
        where: { attractionId },
      });

      // 删除景点的所有门票记录
      await prisma.ticketDay.deleteMany({
        where: { attractionId },
      });

      // 删除景点本身
      const attraction = await prisma.attraction.delete({
        where: { id: attractionId },
      });

      return attraction;
    });

    console.log('景点及相关数据已成功删除:', deletedAttraction);
  } catch (error) {
    console.error('删除景点及相关数据时出错:', error);
  }
};

// 获取景点数据
const getAttractionsList = async (req, res) => {
  try {
    const attractions = await prisma.attraction.findMany({
      include: {
        tickets: { // 包括每个景点的门票记录
          select: {
            date: true,  // 显示日期
            totalTickets: true,  // 总票数
            remainingTickets: true,  // 剩余票数
            currentFlow: true  // 当前游客流量
          }
        },
        engagements: { // 包括每个景点的互动数据
          select: {
            likes: true,  // 点赞数
            shares: true,  // 转发数
            favorites: true  // 收藏数
          }
        },
      },
    });

    // 如果没有数据，返回一个空数组
    if (!attractions) {
      return res.status(404).json({ message: '没有找到任何景点数据' });
    }

    // 返回景点数据给前端
    res.json(attractions);
  } catch (error) {
    console.error('获取景点列表失败:', error);
    res.status(500).send('服务器错误');
  }
};