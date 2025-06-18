/**
 * Prompt相关的API调用
 */

import apiClient from './client';
import { Prompt, PaginationInfo, SearchFilters } from '../store/promptStore';

export interface PromptsResponse {
  data: Prompt[];
  pagination: PaginationInfo;
}

export interface PromptParams extends SearchFilters {
  page?: number;
  limit?: number;
}

export const promptApi = {
  // 获取prompts列表
  getPrompts: async (params: PromptParams = {}): Promise<PromptsResponse> => {
    const response = await apiClient.get('/prompts', { params });
    return response.data;
  },

  // 获取单个prompt详情
  getPromptById: async (id: number): Promise<Prompt> => {
    const response = await apiClient.get(`/prompts/${id}`);
    return response.data;
  },

  // 创建新prompt
  createPrompt: async (data: Partial<Prompt>): Promise<Prompt> => {
    const response = await apiClient.post('/prompts', data);
    return response.data;
  },

  // 更新prompt
  updatePrompt: async (id: number, data: any): Promise<Prompt> => {
    console.log('发送更新请求:', { id, data }); // 添加调试日志
    const response = await apiClient.put(`/prompts/${id}`, data);
    return response.data;
  },

  // 删除prompt
  deletePrompt: async (id: number): Promise<void> => {
    await apiClient.delete(`/prompts/${id}`);
  },

  // 批量创建prompts
  batchCreatePrompts: async (prompts: Partial<Prompt>[]): Promise<{ message: string; data: Prompt[] }> => {
    const response = await apiClient.post('/prompts/batch', { prompts });
    return response.data;
  },

  // 批量删除prompts
  batchDeletePrompts: async (ids: number[]): Promise<{ message: string }> => {
    const response = await apiClient.delete('/prompts/batch', { data: { ids } });
    return response.data;
  },

  // 记录prompt使用
  recordUsage: async (id: number, context?: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/prompts/${id}/use`, { context });
    return response.data;
  },

  // 切换收藏状态
  toggleFavorite: async (id: number): Promise<{ isFavorite: boolean }> => {
    const response = await apiClient.post(`/prompts/${id}/favorite`);
    return response.data;
  },

  // 评分prompt
  ratePrompt: async (id: number, rating: number): Promise<{ rating: number }> => {
    const response = await apiClient.post(`/prompts/${id}/rate`, { rating });
    return response.data;
  },

  // 获取prompt版本历史
  getPromptVersions: async (id: number): Promise<any[]> => {
    const response = await apiClient.get(`/prompts/${id}/versions`);
    return response.data;
  },

  // 创建新版本
  createPromptVersion: async (id: number, data: { version: string; changeLog: string }): Promise<any> => {
    const response = await apiClient.post(`/prompts/${id}/versions`, data);
    return response.data;
  },

  // 获取热门prompts
  getPopularPrompts: async (limit: number = 10): Promise<Prompt[]> => {
    const response = await apiClient.get('/prompts/popular', { params: { limit } });
    return response.data;
  },

  // 获取最近使用的prompts
  getRecentPrompts: async (limit: number = 10): Promise<Prompt[]> => {
    const response = await apiClient.get('/prompts/recent', { params: { limit } });
    return response.data;
  },

  // 获取收藏的prompts
  getFavoritePrompts: async (): Promise<Prompt[]> => {
    const response = await apiClient.get('/prompts/favorites');
    return response.data;
  },

  // 导入prompts
  importPrompts: async (file: File): Promise<{ message: string; data: Prompt[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/prompts/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 导出prompts
  exportPrompts: async (params: { format?: 'json' | 'csv'; category?: number; tags?: string[] } = {}): Promise<Blob> => {
    const response = await apiClient.get('/prompts/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};