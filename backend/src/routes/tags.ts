/**
 * 标签相关的API路由
 * 处理prompt标签的CRUD操作
 */

import express from 'express';
import { TagController } from '../controllers/tagController';
import { validateTag } from '../middleware/validation';

const router = express.Router();
const tagController = new TagController();

// GET /api/tags - 获取所有标签
router.get('/', tagController.getTags.bind(tagController));

// GET /api/tags/:id - 获取单个标签详情
router.get('/:id', tagController.getTagById.bind(tagController));

// POST /api/tags - 创建新标签
router.post('/', validateTag, tagController.createTag.bind(tagController));

// PUT /api/tags/:id - 更新标签
router.put('/:id', validateTag, tagController.updateTag.bind(tagController));

// DELETE /api/tags/:id - 删除标签
router.delete('/:id', tagController.deleteTag.bind(tagController));

// GET /api/tags/:id/prompts - 获取标签下的所有prompts
router.get('/:id/prompts', tagController.getTagPrompts.bind(tagController));

// GET /api/tags/popular - 获取热门标签
router.get('/popular', tagController.getPopularTags.bind(tagController));

export default router;