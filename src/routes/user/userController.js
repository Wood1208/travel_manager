import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

// 返回用户的收藏景点
const getUserFavorites = async ( userId ) => {
  const { userId } = req.params;

  try {
    const favorites = await prisma.userFavorite.findMany({
      where: {
        userId: parseInt(userId),
      },
      include: {
        attraction: true, // 关联景点数据
      },
    });

    if(!favorites.length) {
      return res.status(404).json({ message: 'No favorites found for this user' });
    }

    // 返回景点的详细信息
    const favoriteAttractions = favorites.map(favorite => ({
      id: favorite.attraction.id,
      name: favorite.attraction.name,
      imageUrl: favorite.attraction.imageUrl,
      description: favorite.attraction.description,
      category: favorite.attraction.category,
      tags: favorite.attraction.tags,
    }));

    res.json(favoriteAttractions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// 增加点赞数
const incrementLike = async (attractionId) => {
  try {
    const updatedEngagement = await prisma.attractionEngagement.update({
      where: { attractionId },
      data: {
        likes: { increment: 1 },  // 点赞数 +1
      },
    });
    console.log('点赞数已增加:', updatedEngagement);
  } catch (error) {
    console.error('增加点赞数时出错:', error);
  }
};

// 增加转发数
const incrementShare = async (attractionId) => {
  try {
    const updatedEngagement = await prisma.attractionEngagement.update({
      where: { attractionId },
      data: {
        shares: { increment: 1 },  // 转发数 +1
      },
    });
    console.log('转发数已增加:', updatedEngagement);
  } catch (error) {
    console.error('增加转发数时出错:', error);
  }
};

// 用户收藏景点的函数
const addFavorite = async (userId, attractionId) => {
  try {
    // 开始一个事务，确保数据一致性
    const result = await prisma.$transaction(async (prisma) => {
      // 1. 增加景点的收藏数（AttractionEngagement）
      const engagement = await prisma.attractionEngagement.update({
        where: { attractionId },
        data: {
          favorites: { increment: 1 },  // 收藏数 +1
        },
      });

      // 2. 检查用户是否已经收藏过该景点
      const existingFavorite = await prisma.userFavorite.findUnique({
        where: { userId_attractionId: { userId, attractionId } },
      });

      if (existingFavorite) {
        throw new Error('用户已经收藏过该景点');
      }

      // 3. 如果用户没有收藏过，插入收藏记录（UserFavorite）
      const newFavorite = await prisma.userFavorite.create({
        data: {
          userId,
          attractionId,
        },
      });

      return { engagement, newFavorite };
    });

    console.log('收藏成功:', result);
  } catch (error) {
    console.error('收藏操作失败:', error);
  }
};

// 记录用户预约景点
const addReservation = async (req, res) => {
  const { userId } = req.params;
  const { attractionId, date } = req.body;

  try {
    // 检查景点是否存在
    const attraction = await prisma.attraction.findUnique({
      where: { id: attractionId },
    });

    if (!attraction) {
      return res.status(404).json({ message: 'Attraction not found' });
    }

    // 检查景点当天的门票情况（其实感觉这里我可以在前端禁止）
    const ticket = await prisma.ticketDay.findUnique({
      where: {
        attractionId_date: {
          attractionId: attractionId,
          date: new Date(date),
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: 'No ticket record found for this date' });
    }

    if (ticket.remainingTickets <= 0) {
      return res.status(400).json({ message: 'No tickets available for this date' });
    }

    // 创建预约记录
    const reservation = await prisma.reservation.create({
      data: {
        userId: parseInt(userId),
        attractionId: attractionId,
        date: new Date(date),
      },
    });

    // 更新门票的剩余数量
    await prisma.ticketDay.update({
      where: { id: ticket.id },
      data: {
        remainingTickets: ticket.remainingTickets - 1,
        currentFlow: ticket.currentFlow + 1, // 游客流量增加
      },
    });

    res.status(201).json({ message: 'Reservation created successfully', reservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// 返回用户的预约记录
const getUserReservations = async (userId) => {
  const { userId } = req.params;

  try {
    const reservations = await prisma.reservation.findMany({
      where: {
        userId: parseInt(userId),
      },
      include: {
        attraction: true,  // 关联景点数据
      },
    });

    if (!reservations.length) {
      return res.status(404).json({ message: 'No reservations found for this user' });
    }

    // 返回预约记录的详细信息
    const reservationDetails = reservations.map(reservation => ({
      id: reservation.id,
      attractionName: reservation.attraction.name,
      attractionImageUrl: reservation.attraction.imageUrl,
      reservationDate: reservation.date,
      status: reservation.status,
    }));

    res.json(reservationDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }

}