/**
 * Prompt相关的API路由
 * 处理prompt的CRUD操作、批量导入导出等功能
 */

import express from 'express';
import { PromptController } from '../controllers/promptController';
import { validatePrompt, validatePromptUpdate } from '../middleware/validation';
import multer from 'multer';
import path from 'path';

const router = express.Router();
const promptController = new PromptController();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.json', '.csv', '.md', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// GET /api/prompts - 获取所有prompts（支持分页和筛选）
router.get('/', promptController.getPrompts.bind(promptController));

// GET /api/prompts/:id - 获取单个prompt详情
router.get('/:id', promptController.getPromptById.bind(promptController));

// POST /api/prompts - 创建新prompt
router.post('/', validatePrompt, promptController.createPrompt.bind(promptController));

// PUT /api/prompts/:id - 更新prompt
router.put('/:id', validatePromptUpdate, promptController.updatePrompt.bind(promptController));

// DELETE /api/prompts/:id - 删除prompt
router.delete('/:id', promptController.deletePrompt.bind(promptController));

// POST /api/prompts/batch - 批量创建prompts
router.post('/batch', promptController.batchCreatePrompts.bind(promptController));

// DELETE /api/prompts/batch - 批量删除prompts
router.delete('/batch', promptController.batchDeletePrompts.bind(promptController));

// POST /api/prompts/:id/use - 记录prompt使用
router.post('/:id/use', promptController.recordUsage.bind(promptController));

// POST /api/prompts/:id/favorite - 切换收藏状态
router.post('/:id/favorite', promptController.toggleFavorite.bind(promptController));

// POST /api/prompts/:id/rate - 评分prompt
router.post('/:id/rate', promptController.ratePrompt.bind(promptController));

// GET /api/prompts/:id/versions - 获取prompt版本历史
router.get('/:id/versions', promptController.getPromptVersions.bind(promptController));

// POST /api/prompts/:id/versions - 创建新版本
router.post('/:id/versions', promptController.createPromptVersion.bind(promptController));

// POST /api/prompts/import - 导入prompts
router.post('/import', upload.single('file'), promptController.importPrompts.bind(promptController));

// GET /api/prompts/export - 导出prompts
router.get('/export', promptController.exportPrompts.bind(promptController));

// GET /api/prompts/popular - 获取热门prompts
router.get('/popular', promptController.getPopularPrompts.bind(promptController));

// GET /api/prompts/recent - 获取最近使用的prompts
router.get('/recent', promptController.getRecentPrompts.bind(promptController));

// GET /api/prompts/favorites - 获取收藏的prompts
router.get('/favorites', promptController.getFavoritePrompts.bind(promptController));

export default router;