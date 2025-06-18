/**
 * 统计相关的API路由
 * 处理使用统计和分析功能
 */

import express from 'express';
import { StatsController } from '../controllers/statsController';

const router = express.Router();
const statsController = new StatsController();

// GET /api/stats/overview - 获取总体统计信息
router.get('/overview', statsController.getOverviewStats.bind(statsController));

// GET /api/stats/usage - 获取使用统计
router.get('/usage', statsController.getUsageStats.bind(statsController));

// GET /api/stats/trends - 获取趋势分析
router.get('/trends', statsController.getTrendStats.bind(statsController));

// GET /api/stats/categories - 获取分类统计
router.get('/categories', statsController.getCategoryStats.bind(statsController));

// GET /api/stats/tags - 获取标签统计
router.get('/tags', statsController.getTagStats.bind(statsController));

export default router;