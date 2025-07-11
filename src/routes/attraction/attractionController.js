import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

// 创建景点
export const createAttraction = async (req, res) => {
  const { name, imageUrl, description, category, tags } = req.body;

  // 如果tags是字符串，将其转为数组
  const tagsArray = typeof tags === 'string' ? tags.split('，') : tags; // 按中文逗号分割

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
          tags: tagsArray,
        },
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
    // 发送成功的响应
    res.status(201).json({
      message: '景点和互动数据已成功创建',
      attraction: createdAttraction.attraction,
      engagement: createdAttraction.engagement,
    });
  } catch (error) {
    // 发送错误响应
    res.status(500).json({
      error: '创建景点和互动数据时出错',
      details: error.message,
    });
  }
};

// 创建景点对应日期门票
export const createTicketForDay = async (req, res) => {
  const attractionId = parseInt(req.params.id, 10);
  let { date, totalTickets } = req.body;

  // 将 totalTickets 转换为整数类型
  totalTickets = parseInt(totalTickets, 10);

  try {
    // 确保景点存在
    const attraction = await prisma.attraction.findUnique({
      where: { id: attractionId },
    });

    if (!attraction) {
      return res.status(404).json({ message: '没有找到该景点!' });
    }

    // 创建门票记录
    const ticket = await prisma.ticketDay.create({
      data: {
        attractionId,
        date: new Date(date),
        totalTickets: totalTickets,
        remainingTickets: totalTickets, // 初始剩余票数为总票数
        currentFlow: 0,  // 初始游客流量为 0
      },
    });

    res.status(201).json({
      message: '门票记录已成功创建',
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      message: '创建门票记录失败',
      details: error.message,
    });
  }
}

// 修改景点对应日期门票
export const updateTicketForDay = async (req, res) => {
  const { date, newTickets } = req.body;
  const attractionId = parseInt(req.params.id, 10);

  try {
    // 确保景点存在
    const attraction = await prisma.attraction.findUnique({
      where: { id: attractionId },
    });

    if (!attraction) {
      return res.status(404).json({ message: '没有找到该景点!' });
    }

    // 转换日期为标准格式
    const ticketDate = new Date(date);
    console.log(ticketDate);

    const updatedTicket = await prisma.ticketDay.update({
      where: { attractionId_date: { attractionId, date: ticketDate } },
      data: {
        remainingTickets: newTickets, // 只增加剩余票数
      },
    });

    res.status(200).json({
      message: '门票记录已成功更新',
      ticket: updatedTicket,
    });
  } catch (error) {
    res.status(500).json({
      message: '更新门票记录失败',
      details: error.message,
    });
  }
};

// 删除景点对应日期门票记录
export const deleteTicketForDay = async (req, res) => {
  const { date } = req.body;
  const attractionId = parseInt(req.params.id, 10);

   try {
    // 更新所有相关预约的状态为已取消
    await prisma.reservation.updateMany({
      where: {
        attractionId: attractionId,
        date: new Date(date),
      },
      data: {
        status: 'CANCELLED',
      },
    });

    // 删除门票记录
    await prisma.ticketDay.delete({
      where: {
        attractionId_date: {
          attractionId: attractionId,
          date: new Date(date),
        },
      },
    });

    res.status(200).json({
      message: '景点对应日期的门票记录已成功删除，相关预约状态已更新为已取消',
    });

  } catch (error) {
    res.status(500).json({
      message: '删除门票记录失败',
      details: error.message,
    });
  }
}

// 更新景点信息
export const updateAttraction = async (req, res) => {
  const { name, imageUrl, description, category, tags } = req.body;
  const attractionId = parseInt(req.params.id, 10);

  // 如果tags是字符串，将其转为数组
  const tagsArray = typeof tags === 'string' ? tags.split('，') : tags; // 按中文逗号分割

  try {
    // 更新景点信息
    const attraction = await prisma.attraction.update({
      where: { id: attractionId },
      data: {
        name,
        imageUrl,
        description,
        category,
        tags : tagsArray,
      },
    });

    res.status(200).json({
      message: '景点信息已成功修改',
      attraction,
    });
  } catch (error) {
    res.status(500).json({
      error: '更新景点信息时出错',
      details: error.message,
    });
  }
};

// 删除景点、门票记录、互动数据和预约记录
export const deleteAttractionWithTicketsAndEngagement = async (req, res) => {
  const attractionId = parseInt(req.params.id, 10);

  // 如果转换失败，返回错误
  if (isNaN(attractionId)) {
    console.log('无效的景点 ID:', req.params.id);  // 打印无效ID
    return res.status(400).json({
      message: '无效的景点 ID',
    });
  }

  try {
    // 使用事务来删除景点及其关联的数据
    const deletedAttraction = await prisma.$transaction(async (prisma) => {
      // 删除景点的互动数据
      await prisma.attractionEngagement.deleteMany({
        where: { attractionId },
      });

      // 删除景点的所有门票记录
      await prisma.ticketDay.deleteMany({
        where: { attractionId },
      });

      // 删除景点的所有预约记录
      await prisma.reservation.deleteMany({
        where: { attractionId },
      });


      // 删除景点的所有收藏记录
      await prisma.userFavorite.deleteMany({
        where: { attractionId },
      });

      // 删除景点本身
      const attraction = await prisma.attraction.delete({
        where: { id: attractionId },
      });

      return attraction;
    });

    res.status(201).json({
      message: '景点已经被正常删除',
      deletedAttraction
    });
  } catch (error) {
    console.error('删除景点时出现错误:', error);  // 打印错误详细信息
    res.status(500).json({
      message: '删除景点时出现错误',
      details: error.message,
    });
  }
};

// 获取全部景点数据
export const getAttractionsList = async (req, res) => {
  try {
    const attractions = await prisma.attraction.findMany({
      include: {
        tickets: { // 包括每个景点的门票记录
          select: {
            date: true,  // 显示日期
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
    res.status(201).json(attractions);
  } catch (error) {
    console.error('获取景点列表失败:', error);
    res.status(500).json({
      message: '获取景点列表失败!',
      details: error.message,
    });
  }
};

// 根据ID获取景点数据
export const getAttractionById = async (req, res) => {
  const attractionId = parseInt(req.params.id, 10);

  // 校验 ID 是否有效
  if (isNaN(attractionId)) {
    return res.status(400).json({ error: 'Invalid attraction ID' });
  }

  try {
    const attraction = await prisma.attraction.findUnique({
      where: {
        id: attractionId,
      },
      include: {
        tickets: true,  // 可选：根据需求，你可以获取关联的预约记录
        engagements: true,  // 可选：根据需求，获取关联的景点互动记录
      },
    });

    if (!attraction) {
      return res.status(404).json({ error: 'Attraction not found' });
    }


    return res.status(200).json(attraction);
  } catch (error) {
    return res.status(500).json({ error: '返回单个景点数据错误', details: error.message });
  }
};