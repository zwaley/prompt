/**
 * 标签相关的API调用
 */

import apiClient from './client';
import { Tag } from '../store/promptStore';

export const tagApi = {
  // 获取所有标签
  getTags: async (): Promise<Tag[]> => {
    const response = await apiClient.get('/tags');
    return response.data;
  },

  // 获取单个标签详情
  getTagById: async (id: number): Promise<Tag> => {
    const response = await apiClient.get(`/tags/${id}`);
    return response.data;
  },

  // 创建新标签
  createTag: async (data: Partial<Tag>): Promise<Tag> => {
    const response = await apiClient.post('/tags', data);
    return response.data;
  },

  // 更新标签
  updateTag: async (id: number, data: Partial<Tag>): Promise<Tag> => {
    const response = await apiClient.put(`/tags/${id}`, data);
    return response.data;
  },

  // 删除标签
  deleteTag: async (id: number): Promise<void> => {
    await apiClient.delete(`/tags/${id}`);
  },

  // 获取标签下的prompts
  getTagPrompts: async (id: number, params: { page?: number; limit?: number } = {}): Promise<any> => {
    const response = await apiClient.get(`/tags/${id}/prompts`, { params });
    return response.data;
  },

  // 获取热门标签
  getPopularTags: async (limit: number = 20): Promise<Tag[]> => {
    const response = await apiClient.get('/tags/popular', { params: { limit } });
    return response.data;
  },
};