import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

// 返回用户的收藏景点
export const getUserFavorites = async (req, res) => {
  const userId = req.user.userId;

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
      return res.status(404).json({ message: '这个用户目前没有收藏景点~' });
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

    res.status(201).json(favoriteAttractions);
  } catch (error) {
    res.status(500).json({
      message: '查询收藏景点错误',
      details: error.message,
    });
  }
}

// 返回用户是否收藏该景点
export const getUserFavoriteById = async (req, res) => {
  const userId = req.user.userId;
  const attractionId = parseInt(req.params.id, 10);

  try {
    const favorite = await prisma.userFavorite.findUnique({
      where: {
        userId_attractionId: {
          userId: parseInt(userId),
          attractionId: parseInt(attractionId),
        },
      },
    });
    res.status(201).json({ isFavorited: !!favorite }); // 返回是否已收藏
  } catch (error) {
    console.error(error);
    res.status(500).send('服务器错误');
  }
}

// 增加点赞数
export const incrementLike = async (req, res) => {
  const attractionId = parseInt(req.params.id, 10);

  try {
    const engagement = await prisma.attractionEngagement.findFirstOrThrow({
      where: { attractionId }
    });

    if (!engagement) {
      return res.status(404).json({ message: '未找到该景点的互动数据' });
    }

    const updatedEngagement = await prisma.attractionEngagement.update({
      where: { id: engagement.id },
      data: { likes: engagement.likes + 1 }
    });

    res.status(201).json({
      message: '点赞数已增加',
      updatedEngagement,
    });
  } catch (error) {
    res.status(500).json({
      message: '点赞异常出现错误!',
      details: error.message,
    });
  }
};

// 取消点赞
export const decrementLike = async (req, res) => {
  const attractionId = parseInt(req.params.id, 10);

  try {
    const engagement = await prisma.attractionEngagement.findFirstOrThrow({
      where: { attractionId }
    });

    if (!engagement) {
      return res.status(404).json({ message: '未找到该景点的互动数据' });
    }

    if (engagement.likes <= 0) {
      return res.status(400).json({ message: '点赞数已经为0, 无法减少' });
    }

    const updatedEngagement = await prisma.attractionEngagement.update({
      where: { id: engagement.id },
      data: { likes: engagement.likes - 1 }
    });

    res.status(200).json({
      message: '点赞数已减少',
      updatedEngagement,
    });
  } catch (error) {
    res.status(500).json({
      message: '取消点赞异常出现错误!',
      details: error.message,
    });
  }
};

// 用户收藏景点
export const addFavorite = async (req, res) => {
  const attractionId = parseInt(req.params.id, 10);
  const userId = req.user.userId;

  try {
    // 开始一个事务，确保数据一致性
    const result = await prisma.$transaction(async (prisma) => {
      // 1. 增加景点的收藏数（AttractionEngagement
      const engagement = await prisma.attractionEngagement.findFirstOrThrow({
        where: { attractionId }
      });

      if (!engagement) {
        return res.status(404).json({ message: '未找到该景点的互动数据' });
      }

      const updatedEngagement = await prisma.attractionEngagement.update({
        where: { id: engagement.id },
        data: {
          favorites: engagement.favorites + 1,  // 收藏数 +1
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

      return { updatedEngagement, newFavorite };
    });

    console.log('收藏成功:', result);
    res.status(201).json({
      message: '成功收藏该景点~',
      result,
    })
  } catch (error) {
    console.error('收藏操作失败:', error);
    res.status(500).json({
      message: '收藏景点操作失败',
      details: error.message,
    })
  }
};

// 用户取消收藏
export const removeFavorite = async (req, res) => {
  const attractionId = parseInt(req.params.id, 10);
  const userId = req.user.userId;

  try {
    // 开始一个事务，确保数据一致性
    const result = await prisma.$transaction(async (prisma) => {
      // 1. 查找景点的互动数据
      const engagement = await prisma.attractionEngagement.findFirstOrThrow({
        where: { attractionId }
      });

      if (!engagement) {
        return res.status(404).json({ message: '未找到该景点的互动数据' });
      }

      // 2. 检查用户是否收藏过该景点
      const existingFavorite = await prisma.userFavorite.findUnique({
        where: { userId_attractionId: { userId, attractionId } },
      });

      if (!existingFavorite) {
        throw new Error('用户没有收藏该景点');
      }

      // 3. 删除收藏记录（UserFavorite）
      const deletedFavorite = await prisma.userFavorite.delete({
        where: { userId_attractionId: { userId, attractionId } },
      });

      // 4. 更新景点的收藏数（减少收藏数）
      const updatedEngagement = await prisma.attractionEngagement.update({
        where: { id: engagement.id },
        data: {
          favorites: engagement.favorites - 1,  // 收藏数 -1
        },
      });

      return { updatedEngagement, deletedFavorite };
    });

    console.log('取消收藏成功:', result);
    res.status(200).json({
      message: '成功取消收藏该景点~',
      result,
    });
  } catch (error) {
    console.error('取消收藏操作失败:', error);
    res.status(500).json({
      message: '取消收藏景点操作失败',
      details: error.message,
    });
  }
};

// 记录用户预约景点
export const addReservation = async (req, res) => {
  const userId = req.user.userId;
  const attractionId = parseInt(req.params.id, 10);
  const { date } = req.body;

  try {
    // 检查景点是否存在
    const attraction = await prisma.attraction.findUnique({
      where: { id: attractionId },
    });

    if (!attraction) {
      return res.status(404).json({ message: '没有找到该景点!' });
    }

    const ticket = await prisma.ticketDay.findUnique({
      where: {
        attractionId_date: {
          attractionId: attractionId,
          date: new Date(date),
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: '这个日期景点没有可售卖门票!' });
    }

    if (ticket.remainingTickets <= 0) {
      return res.status(400).json({ message: '这个日期的景点门票已经售空!' });
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

    res.status(201).json({ message: '预约记录已经成功创建', reservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: '预约景点失败!',
      details: error.message, 
    });
  }
}

// 增加转发数
export const incrementShare = async (req, res) => {
  const attractionId = parseInt(req.params.id, 10);

  try {
    const engagement = await prisma.attractionEngagement.findFirstOrThrow({
      where: { attractionId }
    });

    if (!engagement) {
      return res.status(404).json({ message: '未找到该景点的互动数据' });
    }

    const updatedEngagement = await prisma.attractionEngagement.update({
      where: { id: engagement.id },
      data: {
        shares: engagement.shares + 1,  // 转发数 +1
      },
    });

    res.status(201).json({
      message: '转发数已增加',
      updatedEngagement,
    });
  } catch (error) {
    res.status(500).json({
      message: '转发异常出现错误!',
      details: error.message,
    });
  }
};

// 返回用户的预约记录
export const getUserReservations = async (req, res) => {
  const userId = req.user.userId;

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
      attractionId: reservation.attractionId,
      attractionName: reservation.attraction.name,
      attractionImageUrl: reservation.attraction.imageUrl,
      reservationDate: reservation.date,
      status: reservation.status,
    }));

    res.status(200).json(reservationDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }

}

// 用户取消预约
export const removeReservation = async (req, res) => {
  const attractionId = parseInt(req.params.id, 10);
  const userId = req.user.userId;
  const { date } = req.body;
  console.log(attractionId, userId, date);
  try {
    // 查找是否存在对应的预约记录
    const reservation = await prisma.reservation.findUnique({
      where: {
        userId_attractionId_date: {
          userId: userId,
          attractionId: attractionId,
          date: new Date(date), 
        },
      },
    });
    console.log(reservation);
    if (!reservation) {
      return res.status(404).json({
        message: 'Reservation not found',
      });
    }

    // 删除预约记录
    const result = await prisma.reservation.delete({
      where: {
        id: reservation.id,
      },
    });

    return res.status(200).json({
      message: 'Reservation removed successfully',
      result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Failed to remove reservation',
      error: error.message,
    });
  }
}

