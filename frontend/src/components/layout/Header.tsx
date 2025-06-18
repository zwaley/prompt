/**
 * 顶部导航栏组件
 * 提供面包屑导航、用户信息等功能
 */

import React from 'react';
import { Layout, Breadcrumb, Space, Avatar, Dropdown } from 'antd';
import { useLocation } from 'react-router-dom';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useLanguageStore } from '../../store/languageStore';

const { Header: AntHeader } = Layout;

// 路径映射配置
interface PathConfig {
  [key: string]: {
    zh: string;
    en: string;
  };
}

const pathConfig: PathConfig = {
  '/': { zh: '首页', en: 'Home' },
  '/prompts': { zh: 'Prompt管理', en: 'Prompts' },
  '/prompts/create': { zh: '创建Prompt', en: 'Create Prompt' },
  '/categories': { zh: '分类管理', en: 'Categories' },
  '/tags': { zh: '标签管理', en: 'Tags' },
  '/favorites': { zh: '收藏夹', en: 'Favorites' },
  '/stats': { zh: '统计分析', en: 'Statistics' },
  '/settings': { zh: '设置', en: 'Settings' }
};

const Header: React.FC = () => {
  const location = useLocation();
  const { language } = useLanguageStore();

  // 生成面包屑导航
  const generateBreadcrumb = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbItems = [{
      title: pathConfig['/'][language]
    }];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // 处理动态路由参数
      if (segment.match(/^[0-9a-f-]+$/)) {
        // 如果是ID，显示为详情页
        breadcrumbItems.push({
          title: language === 'zh' ? '详情' : 'Detail'
        });
      } else {
        const config = pathConfig[currentPath];
        if (config) {
          breadcrumbItems.push({
            title: config[language]
          });
        }
      }
    });

    return breadcrumbItems;
  };

  // 用户菜单项
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: language === 'zh' ? '个人资料' : 'Profile'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: language === 'zh' ? '设置' : 'Settings'
    },
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: language === 'zh' ? '退出登录' : 'Logout'
    }
  ];

  // 处理用户菜单点击
  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        // 跳转到个人资料页面
        console.log('跳转到个人资料');
        break;
      case 'settings':
        // 跳转到设置页面
        window.location.href = '/settings';
        break;
      case 'logout':
        // 处理退出登录
        console.log('退出登录');
        break;
      default:
        break;
    }
  };

  return (
    <AntHeader
      style={{
        background: '#fff',
        padding: '0 24px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginLeft: '250px', // 为侧边栏留出空间
        position: 'fixed',
        top: 0,
        right: 0,
        left: '250px',
        zIndex: 99,
        height: '64px'
      }}
    >
      {/* 面包屑导航 */}
      <Breadcrumb
        items={generateBreadcrumb()}
        style={{ fontSize: '14px' }}
      />

      {/* 右侧用户信息 */}
      <Space size="middle">
        {/* 用户头像和菜单 */}
        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: handleUserMenuClick
          }}
          placement="bottomRight"
          arrow
        >
          <Space style={{ cursor: 'pointer' }}>
            <Avatar
              size="small"
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1890ff' }}
            />
            <span style={{ color: '#666' }}>
              {language === 'zh' ? '用户' : 'User'}
            </span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;