/**
 * 标签控制器
 * 处理标签相关的业务逻辑
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TagController {
  /**
   * 获取所有标签
   */
  async getTags(req: Request, res: Response): Promise<void> {
    try {
      const tags = await prisma.tag.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              prompts: true
            }
          }
        }
      });

      const formattedTags = tags.map(tag => ({
        ...tag,
        promptCount: tag._count.prompts
      }));

      res.json(formattedTags);
    } catch (error) {
      console.error('获取标签失败:', error);
      res.status(500).json({ error: '获取标签失败' });
    }
  }

  /**
   * 根据ID获取单个标签
   */
  async getTagById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const tag = await prisma.tag.findUnique({
        where: { id: Number(id) },
        include: {
          _count: {
            select: {
              prompts: true
            }
          }
        }
      });

      if (!tag) {
        res.status(404).json({ error: '标签不存在' });
        return;
      }

      const formattedTag = {
        ...tag,
        promptCount: tag._count.prompts
      };

      res.json(formattedTag);
    } catch (error) {
      console.error('获取标签失败:', error);
      res.status(500).json({ error: '获取标签失败' });
    }
  }

  /**
   * 创建新标签
   */
  async createTag(req: Request, res: Response): Promise<void> {
    try {
      const { name, color } = req.body;

      // 检查标签名是否已存在
      const existingTag = await prisma.tag.findUnique({
        where: { name }
      });

      if (existingTag) {
        res.status(400).json({ error: '标签名已存在' });
        return;
      }

      const tag = await prisma.tag.create({
        data: {
          name,
          color: color || '#87d068'
        }
      });

      res.status(201).json(tag);
    } catch (error) {
      console.error('创建标签失败:', error);
      res.status(500).json({ error: '创建标签失败' });
    }
  }

  /**
   * 更新标签
   */
  async updateTag(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, color } = req.body;

      const existingTag = await prisma.tag.findUnique({
        where: { id: Number(id) }
      });

      if (!existingTag) {
        res.status(404).json({ error: '标签不存在' });
        return;
      }

      // 如果要更新名称，检查新名称是否已存在
      if (name && name !== existingTag.name) {
        const nameExists = await prisma.tag.findUnique({
          where: { name }
        });

        if (nameExists) {
          res.status(400).json({ error: '标签名已存在' });
          return;
        }
      }

      // 构建更新数据对象，只包含提供的字段
      const updateData: { name?: string; color?: string } = {};
      if (name !== undefined) updateData.name = name;
      if (color !== undefined) updateData.color = color;

      const updatedTag = await prisma.tag.update({
        where: { id: Number(id) },
        data: updateData
      });

      res.json(updatedTag);
    } catch (error) {
      console.error('更新标签失败:', error);
      res.status(500).json({ error: '更新标签失败' });
    }
  }

  /**
   * 删除标签
   */
  async deleteTag(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const tag = await prisma.tag.findUnique({
        where: { id: Number(id) },
        include: {
          _count: {
            select: {
              prompts: true
            }
          }
        }
      });

      if (!tag) {
        res.status(404).json({ error: '标签不存在' });
        return;
      }

      // 检查是否有关联的prompts
      if (tag._count.prompts > 0) {
        res.status(400).json({ 
          error: `无法删除标签，还有${tag._count.prompts}个prompts使用此标签` 
        });
        return;
      }

      await prisma.tag.delete({
        where: { id: Number(id) }
      });

      res.json({ message: '标签删除成功' });
    } catch (error) {
      console.error('删除标签失败:', error);
      res.status(500).json({ error: '删除标签失败' });
    }
  }

  /**
   * 获取热门标签
   */
  async getPopularTags(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;

      const tags = await prisma.tag.findMany({
        include: {
          _count: {
            select: {
              prompts: true
            }
          }
        },
        orderBy: {
          prompts: {
            _count: 'desc'
          }
        },
        take: Number(limit)
      });

      const formattedTags = tags.map(tag => ({
        ...tag,
        promptCount: tag._count.prompts
      }));

      res.json(formattedTags);
    } catch (error) {
      console.error('获取热门标签失败:', error);
      res.status(500).json({ error: '获取热门标签失败' });
    }
  }

  /**
   * 获取标签下的所有prompts
   */
  async getTagPrompts(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const tag = await prisma.tag.findUnique({
        where: { id: Number(id) }
      });

      if (!tag) {
        res.status(404).json({ error: '标签不存在' });
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const [prompts, total] = await Promise.all([
        prisma.prompt.findMany({
          where: {
            tags: {
              some: {
                tagId: Number(id)
              }
            }
          },
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
          orderBy: { createdAt: 'desc' }
        }),
        prisma.prompt.count({
          where: {
            tags: {
              some: {
                tagId: Number(id)
              }
            }
          }
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
        }
      });
    } catch (error) {
      console.error('获取标签prompts失败:', error);
      res.status(500).json({ error: '获取标签prompts失败' });
    }
  }
}