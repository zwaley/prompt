/**
 * 主应用组件
 * 定义应用的整体布局和路由结构
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import { usePromptStore } from './store/promptStore';

// 导入页面组件
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import HomePage from './pages/Home';
import PromptsPage from './pages/PromptList';
import CategoriesPage from './pages/Categories';
import TagsPage from './pages/Tags';
import StatsPage from './pages/Statistics';
import SettingsPage from './pages/Settings';
import PromptDetailPage from './pages/PromptDetail';
import CreatePromptPage from './pages/CreatePrompt';
import EditPromptPage from './pages/EditPrompt';
import FavoritesPage from './pages/Favorites';

const { Content } = Layout;

function App() {
  const { isLoading } = usePromptStore();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sidebar />
      
      <Layout style={{ marginLeft: '250px' }}>
        {/* 顶部导航 */}
        <Header />
        
        {/* 主内容区域 */}
        <Content 
          style={{ 
            margin: '80px 16px 16px 16px', // 为固定头部留出空间
            padding: '24px',
            background: '#fff',
            borderRadius: '8px',
            minHeight: 'calc(100vh - 112px)'
          }}
        >
          <Routes>
            {/* 首页 */}
            <Route path="/" element={<HomePage />} />
            
            {/* Prompt管理 */}
            <Route path="/prompts" element={<PromptsPage />} />
            <Route path="/prompts/create" element={<CreatePromptPage />} />
            <Route path="/prompts/:id" element={<PromptDetailPage />} />
            <Route path="/prompts/:id/edit" element={<EditPromptPage />} />
            
            {/* 分类管理 */}
            <Route path="/categories" element={<CategoriesPage />} />
            
            {/* 标签管理 */}
            <Route path="/tags" element={<TagsPage />} />
            
            {/* 收藏夹 */}
            <Route path="/favorites" element={<FavoritesPage />} />
            
            {/* 统计分析 */}
            <Route path="/stats" element={<StatsPage />} />
            
            {/* 设置 */}
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* 404页面 */}
            <Route path="*" element={
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <h2>页面不存在</h2>
                <p>您访问的页面不存在，请检查URL是否正确。</p>
              </div>
            } />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;