/**
 * 侧边栏组件
 * 提供应用的主要导航菜单，支持中英双语切换
 */

import React from 'react';
import { Layout, Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  FileTextOutlined,
  FolderOutlined,
  TagsOutlined,
  SearchOutlined,
  BarChartOutlined,
  SettingOutlined,
  PlusOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useLanguageStore } from '../../store/languageStore';

const { Sider } = Layout;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: {
    zh: string;
    en: string;
  };
  path: string;
}

// 菜单项配置
const menuItems: MenuItem[] = [
  {
    key: 'home',
    icon: <HomeOutlined />,
    label: { zh: '首页', en: 'Home' },
    path: '/'
  },
  {
    key: 'prompts',
    icon: <FileTextOutlined />,
    label: { zh: 'Prompt管理', en: 'Prompts' },
    path: '/prompts'
  },
  {
    key: 'create',
    icon: <PlusOutlined />,
    label: { zh: '创建Prompt', en: 'Create Prompt' },
    path: '/prompts/create'
  },
  {
    key: 'categories',
    icon: <FolderOutlined />,
    label: { zh: '分类管理', en: 'Categories' },
    path: '/categories'
  },
  {
    key: 'tags',
    icon: <TagsOutlined />,
    label: { zh: '标签管理', en: 'Tags' },
    path: '/tags'
  },
  {
    key: 'favorites',
    icon: <SearchOutlined />,
    label: { zh: '收藏夹', en: 'Favorites' },
    path: '/favorites'
  },
  {
    key: 'stats',
    icon: <BarChartOutlined />,
    label: { zh: '统计分析', en: 'Statistics' },
    path: '/stats'
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: { zh: '设置', en: 'Settings' },
    path: '/settings'
  }
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, toggleLanguage } = useLanguageStore();

  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    const currentPath = location.pathname;
    
    // 特殊处理创建页面
    if (currentPath === '/prompts/create') {
      return 'create';
    }
    
    // 查找匹配的菜单项
    const matchedItem = menuItems.find(item => {
      if (item.path === '/') {
        return currentPath === '/';
      }
      return currentPath.startsWith(item.path);
    });
    
    return matchedItem?.key || 'home';
  };

  // 处理菜单点击
  const handleMenuClick = ({ key }: { key: string }) => {
    const menuItem = menuItems.find(item => item.key === key);
    if (menuItem) {
      navigate(menuItem.path);
    }
  };

  // 转换菜单项为Ant Design Menu所需格式
  const antdMenuItems = menuItems.map(item => ({
    key: item.key,
    icon: item.icon,
    label: item.label[language]
  }));

  return (
    <Sider
      width={250}
      style={{
        background: '#001529',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        zIndex: 100
      }}
    >
      {/* Logo区域 */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #303030',
          color: '#fff',
          fontSize: '18px',
          fontWeight: 'bold'
        }}
      >
        {language === 'zh' ? 'Prompt管理器' : 'Prompt Manager'}
      </div>

      {/* 语言切换按钮 */}
      <div style={{ padding: '16px', borderBottom: '1px solid #303030' }}>
        <Button
          type="ghost"
          icon={<GlobalOutlined />}
          onClick={toggleLanguage}
          style={{
            width: '100%',
            color: '#fff',
            borderColor: '#40a9ff'
          }}
        >
          {language === 'zh' ? 'English' : '中文'}
        </Button>
      </div>

      {/* 导航菜单 */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={antdMenuItems}
        onClick={handleMenuClick}
        style={{
          borderRight: 0,
          height: 'calc(100vh - 145px)',
          overflowY: 'auto'
        }}
      />
    </Sider>
  );
};

export default Sidebar;