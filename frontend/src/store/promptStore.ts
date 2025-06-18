/**
 * Prompt状态管理
 * 使用Zustand管理应用的全局状态
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { promptApi } from '../api/promptApi';
import { categoryApi } from '../api/categoryApi';
import { tagApi } from '../api/tagApi';

// 类型定义
export interface Prompt {
  id: number;
  title: string;
  content: string;
  description?: string;
  category?: Category;
  tags: Tag[];
  priority: number;
  useCount: number;
  rating: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  promptCount?: number;
  createdAt: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface SearchFilters {
  search?: string;
  category?: number;
  tags?: string[];
  favorite?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PromptStore {
  // 状态
  prompts: Prompt[];
  categories: Category[];
  tags: Tag[];
  currentPrompt: Prompt | null;
  pagination: PaginationInfo;
  filters: SearchFilters;
  isLoading: boolean;
  error: string | null;

  // Actions
  // Prompt相关
  fetchPrompts: (page?: number, filters?: SearchFilters) => Promise<void>;
  fetchPromptById: (id: number) => Promise<void>;
  createPrompt: (data: Partial<Prompt>) => Promise<void>;
  updatePrompt: (id: number, data: Partial<Prompt>) => Promise<void>;
  deletePrompt: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
  ratePrompt: (id: number, rating: number) => Promise<void>;
  recordUsage: (id: number, context?: string) => Promise<void>;

  // 分类相关
  fetchCategories: () => Promise<void>;
  createCategory: (data: Partial<Category>) => Promise<void>;
  updateCategory: (id: number, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;

  // 标签相关
  fetchTags: () => Promise<void>;
  createTag: (data: Partial<Tag>) => Promise<void>;
  updateTag: (id: number, data: Partial<Tag>) => Promise<void>;
  deleteTag: (id: number) => Promise<void>;

  // 工具方法
  setFilters: (filters: SearchFilters) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const usePromptStore = create<PromptStore>()(devtools(
  (set, get) => ({
    // 初始状态
    prompts: [],
    categories: [],
    tags: [],
    currentPrompt: null,
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    },
    filters: {},
    isLoading: false,
    error: null,

    // Prompt相关Actions
    fetchPrompts: async (page = 1, filters: SearchFilters = {}) => {
      set({ isLoading: true, error: null });
      try {
        // 从 filters 中提取 sortBy 和 sortOrder，如果它们存在于 page 对象下
        const { sortBy, sortOrder, ...restFilters } = filters;
        let actualSortBy = sortBy;
        let actualSortOrder = sortOrder;

        // 兼容旧的嵌套方式，如果 sortBy/sortOrder 在 filters.page 下
        if (filters.page && typeof filters.page === 'object') {
          actualSortBy = (filters.page as any).sortBy || sortBy;
          actualSortOrder = (filters.page as any).sortOrder || sortOrder;
        }

        const params: PromptParams = {
          page,
          limit: get().pagination.limit,
          ...restFilters, // 其他筛选条件
        };

        if (actualSortBy) {
          params.sortBy = actualSortBy;
        }
        if (actualSortOrder) {
          params.sortOrder = actualSortOrder;
        }

        const response = await promptApi.getPrompts(params);
        set({
          prompts: response.data,
          pagination: response.pagination,
          filters: { ...get().filters, ...filters },
          isLoading: false
        });
      } catch (error: any) {
        set({ 
          error: error.response?.data?.message || '获取prompts失败',
          isLoading: false 
        });
      }
    },

    fetchPromptById: async (id: number) => {
      set({ isLoading: true, error: null });
      try {
        const prompt = await promptApi.getPromptById(id);
        set({ currentPrompt: prompt, isLoading: false });
      } catch (error: any) {
        set({ 
          error: error.response?.data?.message || '获取prompt详情失败',
          isLoading: false 
        });
      }
    },

    createPrompt: async (data: Partial<Prompt>) => {
      set({ isLoading: true, error: null });
      try {
        const newPrompt = await promptApi.createPrompt(data);
        set(state => ({
          prompts: [newPrompt, ...state.prompts],
          isLoading: false
        }));
      } catch (error: any) {
        set({ 
          error: error.response?.data?.message || '创建prompt失败',
          isLoading: false 
        });
        throw error;
      }
    },

    updatePrompt: async (id: number, data: Partial<Prompt>) => {
      set({ isLoading: true, error: null });
      try {
        const updatedPrompt = await promptApi.updatePrompt(id, data);
        set(state => ({
          prompts: state.prompts.map(p => p.id === id ? updatedPrompt : p),
          currentPrompt: state.currentPrompt?.id === id ? updatedPrompt : state.currentPrompt,
          isLoading: false
        }));
      } catch (error: any) {
        set({ 
          error: error.response?.data?.message || '更新prompt失败',
          isLoading: false 
        });
        throw error;
      }
    },

    deletePrompt: async (id: number) => {
      set({ isLoading: true, error: null });
      try {
        await promptApi.deletePrompt(id);
        set(state => ({
          prompts: state.prompts.filter(p => p.id !== id),
          currentPrompt: state.currentPrompt?.id === id ? null : state.currentPrompt,
          isLoading: false
        }));
      } catch (error: any) {
        set({ 
          error: error.response?.data?.message || '删除prompt失败',
          isLoading: false 
        });
        throw error;
      }
    },

    toggleFavorite: async (id: number) => {
      try {
        const result = await promptApi.toggleFavorite(id);
        set(state => ({
          prompts: state.prompts.map(p => 
            p.id === id ? { ...p, isFavorite: result.isFavorite } : p
          ),
          currentPrompt: state.currentPrompt?.id === id 
            ? { ...state.currentPrompt, isFavorite: result.isFavorite }
            : state.currentPrompt
        }));
      } catch (error: any) {
        set({ error: error.response?.data?.message || '切换收藏状态失败' });
      }
    },

    ratePrompt: async (id: number, rating: number) => {
      try {
        const result = await promptApi.ratePrompt(id, rating);
        set(state => ({
          prompts: state.prompts.map(p => 
            p.id === id ? { ...p, rating: result.rating } : p
          ),
          currentPrompt: state.currentPrompt?.id === id 
            ? { ...state.currentPrompt, rating: result.rating }
            : state.currentPrompt
        }));
      } catch (error: any) {
        set({ error: error.response?.data?.message || '评分失败' });
      }
    },

    recordUsage: async (id: number, context?: string) => {
      try {
        await promptApi.recordUsage(id, context);
        set(state => ({
          prompts: state.prompts.map(p => 
            p.id === id ? { ...p, useCount: p.useCount + 1 } : p
          ),
          currentPrompt: state.currentPrompt?.id === id 
            ? { ...state.currentPrompt, useCount: state.currentPrompt.useCount + 1 }
            : state.currentPrompt
        }));
      } catch (error: any) {
        console.error('记录使用失败:', error);
      }
    },

    // 分类相关Actions
    fetchCategories: async () => {
      try {
        const categories = await categoryApi.getCategories();
        set({ categories });
      } catch (error: any) {
        set({ error: error.response?.data?.message || '获取分类失败' });
      }
    },

    createCategory: async (data: Partial<Category>) => {
      set({ isLoading: true, error: null });
      try {
        const newCategory = await categoryApi.createCategory(data);
        set(state => ({
          categories: [...state.categories, newCategory],
          isLoading: false
        }));
      } catch (error: any) {
        set({ 
          error: error.response?.data?.message || '创建分类失败',
          isLoading: false 
        });
        throw error;
      }
    },

    updateCategory: async (id: number, data: Partial<Category>) => {
      set({ isLoading: true, error: null });
      try {
        const updatedCategory = await categoryApi.updateCategory(id, data);
        set(state => ({
          categories: state.categories.map(c => c.id === id ? updatedCategory : c),
          isLoading: false
        }));
      } catch (error: any) {
        set({ 
          error: error.response?.data?.message || '更新分类失败',
          isLoading: false 
        });
        throw error;
      }
    },

    deleteCategory: async (id: number) => {
      set({ isLoading: true, error: null });
      try {
        await categoryApi.deleteCategory(id);
        set(state => ({
          categories: state.categories.filter(c => c.id !== id),
          isLoading: false
        }));
      } catch (error: any) {
        set({ 
          error: error.response?.data?.message || '删除分类失败',
          isLoading: false 
        });
        throw error;
      }
    },

    // 标签相关Actions
    fetchTags: async () => {
      try {
        const tags = await tagApi.getTags();
        set({ tags });
      } catch (error: any) {
        set({ error: error.response?.data?.message || '获取标签失败' });
      }
    },

    createTag: async (data: Partial<Tag>) => {
      set({ isLoading: true, error: null });
      try {
        const newTag = await tagApi.createTag(data);
        set(state => ({
          tags: [...state.tags, newTag],
          isLoading: false
        }));
      } catch (error: any) {
        set({ 
          error: error.response?.data?.message || '创建标签失败',
          isLoading: false 
        });
        throw error;
      }
    },

    updateTag: async (id: number, data: Partial<Tag>) => {
      set({ isLoading: true, error: null });
      try {
        const updatedTag = await tagApi.updateTag(id, data);
        set(state => ({
          tags: state.tags.map(t => t.id === id ? updatedTag : t),
          isLoading: false
        }));
      } catch (error: any) {
        set({ 
          error: error.response?.data?.message || '更新标签失败',
          isLoading: false 
        });
        throw error;
      }
    },

    deleteTag: async (id: number) => {
      set({ isLoading: true, error: null });
      try {
        await tagApi.deleteTag(id);
        set(state => ({
          tags: state.tags.filter(t => t.id !== id),
          isLoading: false
        }));
      } catch (error: any) {
        set({ 
          error: error.response?.data?.message || '删除标签失败',
          isLoading: false 
        });
        throw error;
      }
    },

    // 工具方法
    setFilters: (filters: SearchFilters) => {
      set(state => ({ filters: { ...state.filters, ...filters } }));
    },

    clearError: () => {
      set({ error: null });
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    }
  }),
  {
    name: 'prompt-store'
  }
));