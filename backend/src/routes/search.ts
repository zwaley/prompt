/**
 * 搜索相关的API路由
 * 处理prompt搜索功能
 */

import express from 'express';
import { SearchController } from '../controllers/searchController';

const router = express.Router();
const searchController = new SearchController();

// GET /api/search - 搜索prompts
router.get('/', searchController.searchPrompts.bind(searchController));

// GET /api/search/suggestions - 获取搜索建议
router.get('/suggestions', searchController.getSearchSuggestions.bind(searchController));

// GET /api/search/history - 获取搜索历史
router.get('/history', searchController.getSearchHistory.bind(searchController));

// POST /api/search/history - 记录搜索历史
router.post('/history', searchController.recordSearch.bind(searchController));

// DELETE /api/search/history - 清空搜索历史
router.delete('/history', searchController.clearSearchHistory.bind(searchController));

export default router;