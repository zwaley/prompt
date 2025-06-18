/**
 * 首页组件
 * 显示应用概览、快速操作和最近活动
 */

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Button, List, Tag, Typography, Space, Empty } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  HeartOutlined,
  FireOutlined,
  ClockCircleOutlined,
  FolderOutlined,
  TagOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePromptStore } from '../store/promptStore';
import { promptApi } from '../api/promptApi';
import { useLanguageStore } from '../store/languageStore';

const { Title, Paragraph, Text } = Typography;

// 国际化文本配置
const i18nTexts = {
  zh: {
    welcome: '欢迎使用 Prompt 管理器',
    subtitle: '高效管理您的 AI Prompt，让创意触手可及',
    totalPrompts: '总 Prompt 数',
    totalCategories: '分类数量',
    totalTags: '标签数量',
    totalFavorites: '收藏数量',
    quickActions: '快速操作',
    createPrompt: '创建 Prompt',
    createPromptDesc: '添加新的 Prompt 到您的收藏',
    searchPrompt: '搜索 Prompt',
    searchPromptDesc: '快速找到您需要的 Prompt',
    manageCategories: '管理分类',
    manageCategoriesDesc: '组织您的 Prompt 分类',
    manageTags: '管理标签',
    manageTagsDesc: '为 Prompt 添加标签',
    popularPrompts: '🔥 热门 Prompt',
    recentPrompts: '🕒 最近使用',
    favoritePrompts: '❤️ 我的收藏',
    noPopularPrompts: '暂无热门 Prompt',
    noRecentPrompts: '暂无最近使用的 Prompt',
    noFavoritePrompts: '暂无收藏的 Prompt',
    tip: '💡 提示：您可以通过关键词搜索、分类筛选或标签过滤来快速找到需要的 Prompt'
  },
  en: {
    welcome: 'Welcome to Prompt Manager',
    subtitle: 'Efficiently manage your AI Prompts, making creativity within reach',
    totalPrompts: 'Total Prompts',
    totalCategories: 'Categories',
    totalTags: 'Tags',
    totalFavorites: 'Favorites',
    quickActions: 'Quick Actions',
    createPrompt: 'Create Prompt',
    createPromptDesc: 'Add new prompts to your collection',
    searchPrompt: 'Search Prompts',
    searchPromptDesc: 'Quickly find the prompts you need',
    manageCategories: 'Manage Categories',
    manageCategoriesDesc: 'Organize your prompt categories',
    manageTags: 'Manage Tags',
    manageTagsDesc: 'Add tags to your prompts',
    popularPrompts: '🔥 Popular Prompts',
    recentPrompts: '🕒 Recently Used',
    favoritePrompts: '❤️ My Favorites',
    noPopularPrompts: 'No popular prompts yet',
    noRecentPrompts: 'No recently used prompts',
    noFavoritePrompts: 'No favorite prompts yet',
    tip: '💡 Tip: You can quickly find prompts through keyword search, category filtering, or tag filtering'
  }
};

interface DashboardStats {
  totalPrompts: number;
  totalCategories: number;
  totalTags: number;
  recentUsage: number;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const { prompts, categories, tags, fetchPrompts, fetchCategories, fetchTags } = usePromptStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalPrompts: 0,
    totalCategories: 0,
    totalTags: 0,
    recentUsage: 0,
  });
  const [popularPrompts, setPopularPrompts] = useState([]);
  const [recentPrompts, setRecentPrompts] = useState([]);
  const [favoritePrompts, setFavoritePrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 并行加载数据
      const [promptsData, categoriesData, tagsData, popularData, recentData, favoriteData] = await Promise.all([
        fetchPrompts(),
        fetchCategories(),
        fetchTags(),
        promptApi.getPopularPrompts(5),
        promptApi.getRecentPrompts(5),
        promptApi.getFavoritePrompts(),
      ]);

      // 更新统计数据
      setStats({
        totalPrompts: prompts.length,
        totalCategories: categories.length,
        totalTags: tags.length,
        recentUsage: recentData.length,
      });

      setPopularPrompts(popularData);
      setRecentPrompts(recentData);
      setFavoritePrompts(favoriteData.slice(0, 5));
    } catch (error) {
      console.error('加载仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const t = i18nTexts[language];

  const quickActions = [
    {
      title: t.createPrompt,
      description: t.createPromptDesc,
      icon: <PlusOutlined />,
      color: '#1890ff',
      action: () => navigate('/prompts/create'),
    },
    {
      title: t.searchPrompt,
      description: t.searchPromptDesc,
      icon: <SearchOutlined />,
      color: '#52c41a',
      action: () => navigate('/favorites'),
    },
    {
      title: t.manageCategories,
      description: t.manageCategoriesDesc,
      icon: <FolderOutlined />,
      color: '#fa8c16',
      action: () => navigate('/categories'),
    },
    {
      title: t.manageTags,
      description: t.manageTagsDesc,
      icon: <TagOutlined />,
      color: '#eb2f96',
      action: () => navigate('/tags'),
    },
  ];

  const renderPromptList = (prompts: any[], titleKey: keyof typeof i18nTexts.zh, emptyTextKey: keyof typeof i18nTexts.zh) => (
    <Card title={t[titleKey]} size="small" className="h-full">
      {prompts.length > 0 ? (
        <List
          size="small"
          dataSource={prompts}
          renderItem={(item: any) => (
            <List.Item
              className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
              onClick={() => navigate(`/prompts/${item.id}`)}
            >
              <div className="w-full">
                <div className="flex justify-between items-start mb-1">
                  <Text strong className="text-sm">
                    {item.title}
                  </Text>
                  <Space size="small">
                    {item.isFavorite && <HeartOutlined className="text-red-500" />}
                    <Text type="secondary" className="text-xs">
                      <EyeOutlined /> {item.usageCount || 0}
                    </Text>
                  </Space>
                </div>
                <Paragraph
                  className="text-xs text-gray-600 mb-1"
                  ellipsis={{ rows: 1 }}
                >
                  {item.content}
                </Paragraph>
                {item.category && (
                  <Tag size="small" color="blue">
                    {item.category.name}
                  </Tag>
                )}
              </div>
            </List.Item>
          )}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t[emptyTextKey]}
          className="py-8"
        />
      )}
    </Card>
  );

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <Title level={2} className="mb-2">
          {t.welcome}
        </Title>
        <Paragraph className="text-gray-600">
          {t.subtitle}
        </Paragraph>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t.totalPrompts}
              value={stats.totalPrompts}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t.totalCategories}
              value={stats.totalCategories}
              prefix={<FolderOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t.totalTags}
              value={stats.totalTags}
              prefix={<TagOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t.totalFavorites}
              value={favoritePrompts.length}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Card title={t.quickActions} className="mb-6">
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col xs={12} sm={6} key={index}>
              <Card
                hoverable
                className="text-center cursor-pointer"
                onClick={action.action}
                bodyStyle={{ padding: '20px 16px' }}
              >
                <div
                  className="text-3xl mb-3"
                  style={{ color: action.color }}
                >
                  {action.icon}
                </div>
                <Title level={5} className="mb-1">
                  {action.title}
                </Title>
                <Text type="secondary" className="text-xs">
                  {action.description}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 内容区域 */}
      <Row gutter={[16, 16]}>
        {/* 热门 Prompt */}
        <Col xs={24} lg={8}>
          {renderPromptList(popularPrompts, 'popularPrompts', 'noPopularPrompts')}
        </Col>

        {/* 最近使用 */}
        <Col xs={24} lg={8}>
          {renderPromptList(recentPrompts, 'recentPrompts', 'noRecentPrompts')}
        </Col>

        {/* 我的收藏 */}
        <Col xs={24} lg={8}>
          {renderPromptList(favoritePrompts, 'favoritePrompts', 'noFavoritePrompts')}
        </Col>
      </Row>

      {/* 底部提示 */}
      <Card className="mt-6" bodyStyle={{ padding: '16px' }}>
        <div className="text-center">
          <Text type="secondary">
            {t.tip}
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Home;