/**
 * 搜索控制器
 * 处理搜索相关的业务逻辑
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SearchController {
  /**
   * 搜索prompts
   */
  async searchPrompts(req: Request, res: Response): Promise<void> {
    try {
      const { 
        q: query = '', 
        category, 
        tags, 
        page = 1, 
        limit = 20,
        sortBy = 'relevance',
        sortOrder = 'desc'
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      // 构建搜索条件
      const searchConditions: any = {
        OR: [
          {
            title: {
              contains: String(query)
            }
          },
          {
            content: {
              contains: String(query)
            }
          },
          {
            description: {
              contains: String(query)
            }
          }
        ]
      };

      // 添加分类过滤
      if (category) {
        searchConditions.categoryId = Number(category);
      }

      // 添加标签过滤
      if (tags) {
        const tagIds = String(tags).split(',').map(id => Number(id));
        searchConditions.tags = {
          some: {
            tagId: {
              in: tagIds
            }
          }
        };
      }

      // 构建排序条件
      let orderBy: any = { createdAt: 'desc' };
      if (sortBy === 'rating') {
        orderBy = { rating: sortOrder };
      } else if (sortBy === 'useCount') {
        orderBy = { useCount: sortOrder };
      } else if (sortBy === 'createdAt') {
        orderBy = { createdAt: sortOrder };
      }

      const [prompts, total] = await Promise.all([
        prisma.prompt.findMany({
          where: searchConditions,
          include: {
            category: true,
            tags: {
              include: {
                tag: true
              }
            }
          },
          skip,
          take,
          orderBy
        }),
        prisma.prompt.count({
          where: searchConditions
        })
      ]);

      const formattedPrompts = prompts.map(prompt => ({
        ...prompt,
        tags: prompt.tags.map(pt => pt.tag)
      }));

      res.json({
        prompts: formattedPrompts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        },
        query: String(query)
      });
    } catch (error) {
      console.error('搜索prompts失败:', error);
      res.status(500).json({ error: '搜索失败' });
    }
  }

  /**
   * 获取搜索建议
   */
  async getSearchSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { q: query = '' } = req.query;
      const searchQuery = String(query);

      if (!searchQuery || searchQuery.length < 2) {
        res.json({ suggestions: [] });
        return;
      }

      // 获取标题匹配的prompts
      const titleSuggestions = await prisma.prompt.findMany({
        where: {
          title: {
            contains: searchQuery
          }
        },
        select: {
          title: true
        },
        take: 5,
        orderBy: {
          useCount: 'desc'
        }
      });

      // 获取分类建议
      const categorySuggestions = await prisma.category.findMany({
        where: {
          name: {
            contains: searchQuery
          }
        },
        select: {
          name: true
        },
        take: 3
      });

      // 获取标签建议
      const tagSuggestions = await prisma.tag.findMany({
        where: {
          name: {
            contains: searchQuery
          }
        },
        select: {
          name: true
        },
        take: 3
      });

      const suggestions = [
        ...titleSuggestions.map(p => ({ type: 'prompt', text: p.title })),
        ...categorySuggestions.map(c => ({ type: 'category', text: c.name })),
        ...tagSuggestions.map(t => ({ type: 'tag', text: t.name }))
      ];

      res.json({ suggestions });
    } catch (error) {
      console.error('获取搜索建议失败:', error);
      res.status(500).json({ error: '获取搜索建议失败' });
    }
  }

  /**
   * 获取搜索历史
   */
  async getSearchHistory(req: Request, res: Response): Promise<void> {
    try {
      // 这里简化实现，实际项目中可能需要用户认证
      // 暂时返回空数组，后续可以扩展为基于用户的搜索历史
      res.json({ history: [] });
    } catch (error) {
      console.error('获取搜索历史失败:', error);
      res.status(500).json({ error: '获取搜索历史失败' });
    }
  }

  /**
   * 记录搜索历史
   */
  async recordSearch(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.body;

      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: '搜索查询不能为空' });
        return;
      }

      // 这里简化实现，实际项目中可能需要用户认证和数据库存储
      // 暂时只返回成功响应
      res.json({ message: '搜索历史记录成功' });
    } catch (error) {
      console.error('记录搜索历史失败:', error);
      res.status(500).json({ error: '记录搜索历史失败' });
    }
  }

  /**
   * 清空搜索历史
   */
  async clearSearchHistory(req: Request, res: Response): Promise<void> {
    try {
      // 这里简化实现，实际项目中可能需要用户认证
      // 暂时只返回成功响应
      res.json({ message: '搜索历史清空成功' });
    } catch (error) {
      console.error('清空搜索历史失败:', error);
      res.status(500).json({ error: '清空搜索历史失败' });
    }
  }
}