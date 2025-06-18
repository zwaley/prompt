/**
 * Prompt控制器
 * 处理prompt相关的业务逻辑
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Fuse from 'fuse.js';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import csvParser from 'csv-parser';
import { marked } from 'marked';

const prisma = new PrismaClient();

export class PromptController {
  /**
   * 获取所有prompts（支持分页、筛选、排序）
   */
  async getPrompts(req: Request, res: Response): Promise<void> {
    try {
      const {
        page: pageQuery = '1', // 默认值为字符串 '1'
        limit: limitQuery = '20', // 默认值为字符串 '20'
        category,
        tags,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        favorite
      } = req.query;

      // 将查询参数转换为数字，并提供默认值以防转换失败
      const page = Number(pageQuery) || 1;
      const limit = Number(limitQuery) || 20;

      const skip = (page - 1) * limit;
      const take = limit;

      // 构建查询条件
      const where: any = {};

      if (category) {
        where.categoryId = Number(category);
      }

      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        where.tags = {
          some: {
            tag: {
              name: {
                in: tagArray
              }
            }
          }
        };
      }

      if (search) {
        where.OR = [
          { title: { contains: search as string } },
          { content: { contains: search as string } },
          { description: { contains: search as string } }
        ];
      }

      if (favorite !== undefined) {
        where.isFavorite = favorite === 'true';
      }

      // 构建排序条件
      const orderBy: any = {};
      orderBy[sortBy as string] = sortOrder;

      const [prompts, total] = await Promise.all([
        prisma.prompt.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            category: true,
            tags: {
              include: {
                tag: true
              }
            },
            _count: {
              select: {
                usageHistory: true,
                versions: true
              }
            }
          }
        }),
        prisma.prompt.count({ where })
      ]);

      // 格式化返回数据
      const formattedPrompts = prompts.map(prompt => ({
        ...prompt,
        tags: prompt.tags.map(pt => pt.tag),
        usageCount: prompt._count.usageHistory,
        versionCount: prompt._count.versions
      }));

      res.json({
        data: formattedPrompts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('获取prompts失败:', error);
      res.status(500).json({ error: '获取prompts失败' });
    }
  }

  /**
   * 根据ID获取单个prompt
   */
  async getPromptById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const prompt = await prisma.prompt.findUnique({
        where: { id: Number(id) },
        include: {
          category: true,
          tags: {
            include: {
              tag: true
            }
          },
          usageHistory: {
            orderBy: { usedAt: 'desc' },
            take: 10
          },
          versions: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!prompt) {
        res.status(404).json({ error: 'Prompt不存在' });
        return;
      }

      // 格式化返回数据
      const formattedPrompt = {
        ...prompt,
        tags: prompt.tags.map(pt => pt.tag)
      };

      res.json(formattedPrompt);
    } catch (error) {
      console.error('获取prompt失败:', error);
      res.status(500).json({ error: '获取prompt失败' });
    }
  }

  /**
   * 创建新prompt
   */
  async createPrompt(req: Request, res: Response): Promise<void> {
    console.log('Received request to create prompt. Body:', JSON.stringify(req.body, null, 2)); // 添加日志记录
    try {
      const { title, content, description, categoryId, tags, priority } = req.body;

      // 创建prompt
      const prompt = await prisma.prompt.create({
        data: {
          title,
          content,
          description,
          categoryId: categoryId ? Number(categoryId) : null,
          priority: priority || 0
        },
        include: {
          category: true
        }
      });

      // 处理标签关联
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          // 查找或创建标签
          let tag = await prisma.tag.findUnique({
            where: { name: tagName }
          });

          if (!tag) {
            tag = await prisma.tag.create({
              data: { name: tagName }
            });
          }

          // 创建关联
          await prisma.promptTag.create({
            data: {
              promptId: prompt.id,
              tagId: tag.id
            }
          });
        }
      }

      // 创建初始版本
      await prisma.promptVersion.create({
        data: {
          promptId: prompt.id,
          version: '1.0.0',
          title,
          content,
          description,
          changeLog: '初始版本'
        }
      });

      // 重新获取完整数据
      const fullPrompt = await prisma.prompt.findUnique({
        where: { id: prompt.id },
        include: {
          category: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      res.status(201).json({
        ...fullPrompt,
        tags: fullPrompt?.tags.map(pt => pt.tag) || []
      });
    } catch (error) {
      console.error('创建prompt失败:', error);
      res.status(500).json({ error: '创建prompt失败' });
    }
  }

  /**
   * 更新prompt
   */
  async updatePrompt(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, content, description, categoryId, tags, priority } = req.body;

      // 检查prompt是否存在
      const existingPrompt = await prisma.prompt.findUnique({
        where: { id: Number(id) }
      });

      if (!existingPrompt) {
        res.status(404).json({ error: 'Prompt不存在' });
        return;
      }

      // 更新prompt
      const prompt = await prisma.prompt.update({
        where: { id: Number(id) },
        data: {
          title,
          content,
          description,
          categoryId: categoryId ? Number(categoryId) : null,
          priority: priority || 0
        }
      });

      // 更新标签关联
      if (tags !== undefined) {
        // 删除现有关联
        await prisma.promptTag.deleteMany({
          where: { promptId: Number(id) }
        });

        // 创建新关联
        if (tags.length > 0) {
          for (const tagName of tags) {
            let tag = await prisma.tag.findUnique({
              where: { name: tagName }
            });

            if (!tag) {
              tag = await prisma.tag.create({
                data: { name: tagName }
              });
            }

            await prisma.promptTag.create({
              data: {
                promptId: Number(id),
                tagId: tag.id
              }
            });
          }
        }
      }

      // 重新获取完整数据
      const fullPrompt = await prisma.prompt.findUnique({
        where: { id: Number(id) },
        include: {
          category: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      res.json({
        ...fullPrompt,
        tags: fullPrompt?.tags.map(pt => pt.tag) || []
      });
    } catch (error) {
      console.error('更新prompt失败:', error);
      res.status(500).json({ error: '更新prompt失败' });
    }
  }

  /**
   * 删除prompt
   */
  async deletePrompt(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const prompt = await prisma.prompt.findUnique({
        where: { id: Number(id) }
      });

      if (!prompt) {
        res.status(404).json({ error: 'Prompt不存在' });
        return;
      }

      await prisma.prompt.delete({
        where: { id: Number(id) }
      });

      res.json({ message: 'Prompt删除成功' });
    } catch (error) {
      console.error('删除prompt失败:', error);
      res.status(500).json({ error: '删除prompt失败' });
    }
  }

  /**
   * 记录prompt使用
   */
  async recordUsage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { context } = req.body;

      // 记录使用历史
      await prisma.usageHistory.create({
        data: {
          promptId: Number(id),
          context
        }
      });

      // 更新使用次数
      await prisma.prompt.update({
        where: { id: Number(id) },
        data: {
          useCount: {
            increment: 1
          }
        }
      });

      res.json({ message: '使用记录已保存' });
    } catch (error) {
      console.error('记录使用失败:', error);
      res.status(500).json({ error: '记录使用失败' });
    }
  }

  /**
   * 切换收藏状态
   */
  async toggleFavorite(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const prompt = await prisma.prompt.findUnique({
        where: { id: Number(id) }
      });

      if (!prompt) {
        res.status(404).json({ error: 'Prompt不存在' });
        return;
      }

      const updatedPrompt = await prisma.prompt.update({
        where: { id: Number(id) },
        data: {
          isFavorite: !prompt.isFavorite
        }
      });

      res.json({ isFavorite: updatedPrompt.isFavorite });
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      res.status(500).json({ error: '切换收藏状态失败' });
    }
  }

  /**
   * 评分prompt
   */
  async ratePrompt(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rating } = req.body;

      if (rating < 0 || rating > 5) {
        res.status(400).json({ error: '评分必须在0-5之间' });
        return;
      }

      const updatedPrompt = await prisma.prompt.update({
        where: { id: Number(id) },
        data: { rating }
      });

      res.json({ rating: updatedPrompt.rating });
    } catch (error) {
      console.error('评分失败:', error);
      res.status(500).json({ error: '评分失败' });
    }
  }

  /**
   * 获取热门prompts
   */
  async getPopularPrompts(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;

      const prompts = await prisma.prompt.findMany({
        orderBy: [
          { useCount: 'desc' },
          { rating: 'desc' }
        ],
        take: Number(limit),
        include: {
          category: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      const formattedPrompts = prompts.map(prompt => ({
        ...prompt,
        tags: prompt.tags.map(pt => pt.tag)
      }));

      res.json(formattedPrompts);
    } catch (error) {
      console.error('获取热门prompts失败:', error);
      res.status(500).json({ error: '获取热门prompts失败' });
    }
  }

  /**
   * 获取最近使用的prompts
   */
  async getRecentPrompts(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;

      const recentUsage = await prisma.usageHistory.findMany({
        orderBy: { usedAt: 'desc' },
        take: Number(limit),
        include: {
          prompt: {
            include: {
              category: true,
              tags: {
                include: {
                  tag: true
                }
              }
            }
          }
        }
      });

      const prompts = recentUsage.map(usage => ({
        ...usage.prompt,
        tags: usage.prompt.tags.map(pt => pt.tag),
        lastUsedAt: usage.usedAt
      }));

      res.json(prompts);
    } catch (error) {
      console.error('获取最近使用prompts失败:', error);
      res.status(500).json({ error: '获取最近使用prompts失败' });
    }
  }

  /**
   * 获取收藏的prompts
   */
  async getFavoritePrompts(req: Request, res: Response): Promise<void> {
    try {
      const prompts = await prisma.prompt.findMany({
        where: { isFavorite: true },
        orderBy: { updatedAt: 'desc' },
        include: {
          category: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      const formattedPrompts = prompts.map(prompt => ({
        ...prompt,
        tags: prompt.tags.map(pt => pt.tag)
      }));

      res.json(formattedPrompts);
    } catch (error) {
      console.error('获取收藏prompts失败:', error);
      res.status(500).json({ error: '获取收藏prompts失败' });
    }
  }

  /**
   * 批量创建prompts
   */
  async batchCreatePrompts(req: Request, res: Response): Promise<void> {
    try {
      const { prompts } = req.body;

      if (!Array.isArray(prompts) || prompts.length === 0) {
        res.status(400).json({ error: '请提供有效的prompts数组' });
        return;
      }

      const createdPrompts = [];

      for (const promptData of prompts) {
        const { title, content, description, categoryId, tags, priority } = promptData;

        const prompt = await prisma.prompt.create({
          data: {
            title,
            content,
            description,
            categoryId: categoryId ? Number(categoryId) : null,
            priority: priority || 0
          }
        });

        // 处理标签
        if (tags && tags.length > 0) {
          for (const tagName of tags) {
            let tag = await prisma.tag.findUnique({
              where: { name: tagName }
            });

            if (!tag) {
              tag = await prisma.tag.create({
                data: { name: tagName }
              });
            }

            await prisma.promptTag.create({
              data: {
                promptId: prompt.id,
                tagId: tag.id
              }
            });
          }
        }

        createdPrompts.push(prompt);
      }

      res.status(201).json({
        message: `成功创建${createdPrompts.length}个prompts`,
        data: createdPrompts
      });
    } catch (error) {
      console.error('批量创建prompts失败:', error);
      res.status(500).json({ error: '批量创建prompts失败' });
    }
  }

  /**
   * 批量删除prompts
   */
  async batchDeletePrompts(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: '请提供有效的ID数组' });
        return;
      }

      const result = await prisma.prompt.deleteMany({
        where: {
          id: {
            in: ids.map(id => Number(id))
          }
        }
      });

      res.json({
        message: `成功删除${result.count}个prompts`
      });
    } catch (error) {
      console.error('批量删除prompts失败:', error);
      res.status(500).json({ error: '批量删除prompts失败' });
    }
  }

  /**
   * 获取prompt版本历史
   */
  async getPromptVersions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const versions = await prisma.promptVersion.findMany({
        where: { promptId: Number(id) },
        orderBy: { createdAt: 'desc' }
      });

      res.json(versions);
    } catch (error) {
      console.error('获取版本历史失败:', error);
      res.status(500).json({ error: '获取版本历史失败' });
    }
  }

  /**
   * 创建新版本
   */
  async createPromptVersion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { version, changeLog } = req.body;

      const prompt = await prisma.prompt.findUnique({
        where: { id: Number(id) }
      });

      if (!prompt) {
        res.status(404).json({ error: 'Prompt不存在' });
        return;
      }

      const newVersion = await prisma.promptVersion.create({
        data: {
          promptId: Number(id),
          version,
          title: prompt.title,
          content: prompt.content,
          description: prompt.description,
          changeLog
        }
      });

      res.status(201).json(newVersion);
    } catch (error) {
      console.error('创建版本失败:', error);
      res.status(500).json({ error: '创建版本失败' });
    }
  }

  /**
   * 导入prompts
   */
  async importPrompts(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: '请上传文件' });
        return;
      }

      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();

      let prompts: any[] = [];

      try {
        if (fileExt === '.json') {
          const fileContent = await fsPromises.readFile(filePath, 'utf-8');
          const data = JSON.parse(fileContent);
          prompts = Array.isArray(data) ? data : [data];
        } else if (fileExt === '.csv') {
          // CSV导入逻辑
          prompts = await this.parseCsvFile(filePath);
        } else if (fileExt === '.md' || fileExt === '.txt') {
          // Markdown/文本导入逻辑
          const fileContent = await fsPromises.readFile(filePath, 'utf-8');
          prompts = this.parseMarkdownFile(fileContent);
        }

        // 批量创建prompts
        const createdPrompts = [];
        for (const promptData of prompts) {
          if (promptData.title && promptData.content) {
            const prompt = await prisma.prompt.create({
              data: {
                title: promptData.title,
                content: promptData.content,
                description: promptData.description || '',
                priority: promptData.priority || 0
              }
            });
            createdPrompts.push(prompt);
          }
        }

        // 清理临时文件
        await fsPromises.unlink(filePath);

        res.json({
          message: `成功导入${createdPrompts.length}个prompts`,
          data: createdPrompts
        });
      } catch (parseError) {
        // 清理临时文件
        await fsPromises.unlink(filePath);
        throw parseError;
      }
    } catch (error) {
      console.error('导入prompts失败:', error);
      res.status(500).json({ error: '导入prompts失败' });
    }
  }

  /**
   * 导出prompts
   */
  async exportPrompts(req: Request, res: Response): Promise<void> {
    try {
      const { format = 'json', category, tags } = req.query;

      // 构建查询条件
      const where: any = {};
      if (category) where.categoryId = Number(category);
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        where.tags = {
          some: {
            tag: {
              name: { in: tagArray }
            }
          }
        };
      }

      const prompts = await prisma.prompt.findMany({
        where,
        include: {
          category: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      const exportData = prompts.map(prompt => ({
        id: prompt.id,
        title: prompt.title,
        content: prompt.content,
        description: prompt.description,
        category: prompt.category?.name,
        tags: prompt.tags.map(pt => pt.tag.name),
        priority: prompt.priority,
        useCount: prompt.useCount,
        rating: prompt.rating,
        isFavorite: prompt.isFavorite,
        createdAt: prompt.createdAt,
        updatedAt: prompt.updatedAt
      }));

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=prompts.json');
        res.json(exportData);
      } else if (format === 'csv') {
        const csv = this.convertToCSV(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=prompts.csv');
        res.send(csv);
      } else {
        res.status(400).json({ error: '不支持的导出格式' });
      }
    } catch (error) {
      console.error('导出prompts失败:', error);
      res.status(500).json({ error: '导出prompts失败' });
    }
  }

  /**
   * 解析CSV文件
   */
  private async parseCsvFile(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  /**
   * 解析Markdown文件
   */
  private parseMarkdownFile(content: string): any[] {
    const prompts: any[] = [];
    const sections = content.split(/^#{1,2}\s+/m).filter(section => section.trim());

    sections.forEach(section => {
      const lines = section.split('\n');
      const title = lines[0]?.trim();
      const content = lines.slice(1).join('\n').trim();

      if (title && content) {
        prompts.push({
          title,
          content,
          description: '从Markdown文件导入'
        });
      }
    });

    return prompts;
  }

  /**
   * 转换为CSV格式
   */
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (Array.isArray(value)) {
            return `"${value.join(';')}"`;
          }
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }
}