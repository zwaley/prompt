/**
 * 分类相关的API调用
 */

import apiClient from './client';
import { Category } from '../store/promptStore';

export const categoryApi = {
  // 获取所有分类
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  // 获取单个分类详情
  getCategoryById: async (id: number): Promise<Category> => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },

  // 创建新分类
  createCategory: async (data: Partial<Category>): Promise<Category> => {
    const response = await apiClient.post('/categories', data);
    return response.data;
  },

  // 更新分类
  updateCategory: async (id: number, data: Partial<Category>): Promise<Category> => {
    const response = await apiClient.put(`/categories/${id}`, data);
    return response.data;
  },

  // 删除分类
  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },

  // 获取分类下的prompts
  getCategoryPrompts: async (id: number, params: { page?: number; limit?: number } = {}): Promise<any> => {
    const response = await apiClient.get(`/categories/${id}/prompts`, { params });
    return response.data;
  },
};