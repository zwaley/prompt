/**
 * 分类控制器
 * 处理分类相关的业务逻辑
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CategoryController {
  /**
   * 获取所有分类
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              prompts: true
            }
          }
        }
      });

      const formattedCategories = categories.map(category => ({
        ...category,
        promptCount: category._count.prompts
      }));

      res.json(formattedCategories);
    } catch (error) {
      console.error('获取分类失败:', error);
      res.status(500).json({ error: '获取分类失败' });
    }
  }

  /**
   * 根据ID获取单个分类
   */
  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const category = await prisma.category.findUnique({
        where: { id: Number(id) },
        include: {
          _count: {
            select: {
              prompts: true
            }
          }
        }
      });

      if (!category) {
        res.status(404).json({ error: '分类不存在' });
        return;
      }

      res.json({
        ...category,
        promptCount: category._count.prompts
      });
    } catch (error) {
      console.error('获取分类失败:', error);
      res.status(500).json({ error: '获取分类失败' });
    }
  }

  /**
   * 创建新分类
   */
  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, color } = req.body;

      // 检查分类名是否已存在
      const existingCategory = await prisma.category.findUnique({
        where: { name }
      });

      if (existingCategory) {
        res.status(400).json({ error: '分类名已存在' });
        return;
      }

      const category = await prisma.category.create({
        data: {
          name,
          description,
          color: color || '#1890ff'
        }
      });

      res.status(201).json(category);
    } catch (error) {
      console.error('创建分类失败:', error);
      res.status(500).json({ error: '创建分类失败' });
    }
  }

  /**
   * 更新分类
   */
  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, color } = req.body;

      // 检查分类是否存在
      const existingCategory = await prisma.category.findUnique({
        where: { id: Number(id) }
      });

      if (!existingCategory) {
        res.status(404).json({ error: '分类不存在' });
        return;
      }

      // 如果更新名称，检查新名称是否已存在
      if (name && name !== existingCategory.name) {
        const nameExists = await prisma.category.findUnique({
          where: { name }
        });

        if (nameExists) {
          res.status(400).json({ error: '分类名已存在' });
        return;
        }
      }

      const category = await prisma.category.update({
        where: { id: Number(id) },
        data: {
          name,
          description,
          color
        }
      });

      res.json(category);
    } catch (error) {
      console.error('更新分类失败:', error);
      res.status(500).json({ error: '更新分类失败' });
    }
  }

  /**
   * 删除分类
   */
  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // 检查分类是否存在
      const category = await prisma.category.findUnique({
        where: { id: Number(id) },
        include: {
          _count: {
            select: {
              prompts: true
            }
          }
        }
      });

      if (!category) {
        res.status(404).json({ error: '分类不存在' });
        return;
      }

      // 检查是否有关联的prompts
      if (category._count.prompts > 0) {
        res.status(400).json({ 
          error: `无法删除分类，还有${category._count.prompts}个prompts使用此分类` 
        });
        return;
      }

      await prisma.category.delete({
        where: { id: Number(id) }
      });

      res.json({ message: '分类删除成功' });
    } catch (error) {
      console.error('删除分类失败:', error);
      res.status(500).json({ error: '删除分类失败' });
    }
  }

  /**
   * 获取分类下的所有prompts
   */
  async getCategoryPrompts(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      // 检查分类是否存在
      const category = await prisma.category.findUnique({
        where: { id: Number(id) }
      });

      if (!category) {
        res.status(404).json({ error: '分类不存在' });
        return;
      }

      const [prompts, total] = await Promise.all([
        prisma.prompt.findMany({
          where: { categoryId: Number(id) },
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            category: true,
            tags: {
              include: {
                tag: true
              }
            }
          }
        }),
        prisma.prompt.count({
          where: { categoryId: Number(id) }
        })
      ]);

      const formattedPrompts = prompts.map(prompt => ({
        ...prompt,
        tags: prompt.tags.map(pt => pt.tag)
      }));

      res.json({
        category,
        data: formattedPrompts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('获取分类prompts失败:', error);
      res.status(500).json({ error: '获取分类prompts失败' });
    }
  }
}