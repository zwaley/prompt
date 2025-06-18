/**
 * 语言状态管理
 * 使用 Zustand 管理应用的语言设置
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 支持的语言类型
export type Language = 'zh' | 'en';

// 语言状态接口
interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

// 创建语言状态管理器
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      // 默认语言为中文
      language: 'zh',
      
      // 设置语言
      setLanguage: (language: Language) => {
        set({ language });
      },
      
      // 切换语言
      toggleLanguage: () => {
        const currentLanguage = get().language;
        const newLanguage = currentLanguage === 'zh' ? 'en' : 'zh';
        set({ language: newLanguage });
      }
    }),
    {
      name: 'language-storage', // 本地存储的键名
      version: 1
    }
  )
);