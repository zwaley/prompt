/**
 * 统计控制器
 * 处理统计相关的业务逻辑
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class StatsController {
  /**
   * 获取总体统计信息
   */
  async getOverviewStats(req: Request, res: Response): Promise<void> {
    try {
      const [promptCount, categoryCount, tagCount, totalUsage] = await Promise.all([
        prisma.prompt.count(),
        prisma.category.count(),
        prisma.tag.count(),
        prisma.prompt.aggregate({
          _sum: {
            useCount: true
          }
        })
      ]);

      // 获取最受欢迎的prompt
      const popularPrompt = await prisma.prompt.findFirst({
        orderBy: {
          useCount: 'desc'
        },
        select: {
          id: true,
          title: true,
          useCount: true
        }
      });

      // 获取最新的prompt
      const latestPrompt = await prisma.prompt.findFirst({
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          createdAt: true
        }
      });

      // 获取平均评分
      const avgRating = await prisma.prompt.aggregate({
        _avg: {
          rating: true
        }
      });

      res.json({
        overview: {
          totalPrompts: promptCount,
          totalCategories: categoryCount,
          totalTags: tagCount,
          totalUsage: totalUsage._sum.useCount || 0,
          averageRating: Number((avgRating._avg.rating || 0).toFixed(2))
        },
        highlights: {
          popularPrompt,
          latestPrompt
        }
      });
    } catch (error) {
      console.error('获取总体统计失败:', error);
      res.status(500).json({ error: '获取统计信息失败' });
    }
  }

  /**
   * 获取使用统计
   */
  async getUsageStats(req: Request, res: Response): Promise<void> {
    try {
      const { period = '7d' } = req.query;
      
      // 计算时间范围
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '1d':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // 获取使用历史统计
      const usageHistory = await prisma.usageHistory.findMany({
        where: {
          usedAt: {
            gte: startDate
          }
        },
        include: {
          prompt: {
            select: {
              title: true,
              category: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          usedAt: 'desc'
        }
      });

      // 获取最常用的prompts
      const topPrompts = await prisma.prompt.findMany({
        orderBy: {
          useCount: 'desc'
        },
        take: 10,
        select: {
          id: true,
          title: true,
          useCount: true,
          category: {
            select: {
              name: true
            }
          }
        }
      });

      res.json({
        period,
        usageHistory: usageHistory.slice(0, 50), // 限制返回数量
        topPrompts,
        totalUsageInPeriod: usageHistory.length
      });
    } catch (error) {
      console.error('获取使用统计失败:', error);
      res.status(500).json({ error: '获取使用统计失败' });
    }
  }

  /**
   * 获取趋势分析
   */
  async getTrendStats(req: Request, res: Response): Promise<void> {
    try {
      const { days = 30 } = req.query;
      const daysCount = Number(days);
      
      // 计算时间范围
      const now = new Date();
      const startDate = new Date(now.getTime() - daysCount * 24 * 60 * 60 * 1000);

      // 获取每日创建的prompt数量
      const dailyCreations = await prisma.prompt.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate
          }
        },
        _count: {
          id: true
        }
      });

      // 获取每日使用量
      const dailyUsage = await prisma.usageHistory.groupBy({
        by: ['usedAt'],
        where: {
          usedAt: {
            gte: startDate
          }
        },
        _count: {
          id: true
        }
      });

      // 处理数据，按日期聚合
      const trendData = [];
      for (let i = 0; i < daysCount; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        const creations = dailyCreations.filter(item => 
          item.createdAt.toISOString().split('T')[0] === dateStr
        ).reduce((sum, item) => sum + item._count.id, 0);
        
        const usage = dailyUsage.filter(item => 
          item.usedAt.toISOString().split('T')[0] === dateStr
        ).reduce((sum, item) => sum + item._count.id, 0);
        
        trendData.push({
          date: dateStr,
          creations,
          usage
        });
      }

      res.json({
        period: `${daysCount}d`,
        trends: trendData
      });
    } catch (error) {
      console.error('获取趋势分析失败:', error);
      res.status(500).json({ error: '获取趋势分析失败' });
    }
  }

  /**
   * 获取分类统计
   */
  async getCategoryStats(req: Request, res: Response): Promise<void> {
    try {
      const categoryStats = await prisma.category.findMany({
        include: {
          _count: {
            select: {
              prompts: true
            }
          },
          prompts: {
            select: {
              useCount: true,
              rating: true
            }
          }
        },
        orderBy: {
          prompts: {
            _count: 'desc'
          }
        }
      });

      const formattedStats = categoryStats.map(category => {
        const totalUsage = category.prompts.reduce((sum, prompt) => sum + prompt.useCount, 0);
        const avgRating = category.prompts.length > 0 
          ? category.prompts.reduce((sum, prompt) => sum + prompt.rating, 0) / category.prompts.length
          : 0;

        return {
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          promptCount: category._count.prompts,
          totalUsage,
          averageRating: Number(avgRating.toFixed(2))
        };
      });

      res.json({
        categories: formattedStats
      });
    } catch (error) {
      console.error('获取分类统计失败:', error);
      res.status(500).json({ error: '获取分类统计失败' });
    }
  }

  /**
   * 获取标签统计
   */
  async getTagStats(req: Request, res: Response): Promise<void> {
    try {
      const tagStats = await prisma.tag.findMany({
        include: {
          _count: {
            select: {
              prompts: true
            }
          },
          prompts: {
            include: {
              prompt: {
                select: {
                  useCount: true,
                  rating: true
                }
              }
            }
          }
        },
        orderBy: {
          prompts: {
            _count: 'desc'
          }
        }
      });

      const formattedStats = tagStats.map(tag => {
        const totalUsage = tag.prompts.reduce((sum, pt) => sum + pt.prompt.useCount, 0);
        const avgRating = tag.prompts.length > 0 
          ? tag.prompts.reduce((sum, pt) => sum + pt.prompt.rating, 0) / tag.prompts.length
          : 0;

        return {
          id: tag.id,
          name: tag.name,
          color: tag.color,
          promptCount: tag._count.prompts,
          totalUsage,
          averageRating: Number(avgRating.toFixed(2))
        };
      });

      res.json({
        tags: formattedStats
      });
    } catch (error) {
      console.error('获取标签统计失败:', error);
      res.status(500).json({ error: '获取标签统计失败' });
    }
  }
}