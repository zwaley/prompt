/**
 * 分类相关的API路由
 * 处理prompt分类的CRUD操作
 */

import express from 'express';
import { CategoryController } from '../controllers/categoryController';
import { validateCategory } from '../middleware/validation';

const router = express.Router();
const categoryController = new CategoryController();

// GET /api/categories - 获取所有分类
router.get('/', categoryController.getCategories.bind(categoryController));

// GET /api/categories/:id - 获取单个分类详情
router.get('/:id', categoryController.getCategoryById.bind(categoryController));

// POST /api/categories - 创建新分类
router.post('/', validateCategory, categoryController.createCategory.bind(categoryController));

// PUT /api/categories/:id - 更新分类
router.put('/:id', validateCategory, categoryController.updateCategory.bind(categoryController));

// DELETE /api/categories/:id - 删除分类
router.delete('/:id', categoryController.deleteCategory.bind(categoryController));

// GET /api/categories/:id/prompts - 获取分类下的所有prompts
router.get('/:id/prompts', categoryController.getCategoryPrompts.bind(categoryController));

export default router;