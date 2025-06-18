/**
 * 统计页面
 * 显示各种数据统计和分析图表
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  Select,
  DatePicker,
  Space,
  Table,
  Tag,
  Progress,
  List,
  Avatar,
  Tooltip,
  Empty,
  Button,
  Divider,
} from 'antd';
import {
  FileTextOutlined,
  HeartOutlined,
  EyeOutlined,
  StarOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  TagOutlined,
  FolderOutlined,
  CalendarOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  UserOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { usePromptStore } from '../store/promptStore';
import type { Prompt, Category, Tag as TagType } from '../store/promptStore';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface StatisticsData {
  totalPrompts: number;
  totalFavorites: number;
  totalViews: number;
  avgRating: number;
  publicPrompts: number;
  privatePrompts: number;
  categoriesCount: number;
  tagsCount: number;
  
  // 趋势数据
  promptsGrowth: number;
  favoritesGrowth: number;
  viewsGrowth: number;
  
  // 分类统计
  categoryStats: Array<{
    category: Category;
    count: number;
    percentage: number;
  }>;
  
  // 标签统计
  tagStats: Array<{
    tag: TagType;
    count: number;
    percentage: number;
  }>;
  
  // 热门 Prompt
  popularPrompts: Array<{
    prompt: Prompt;
    views: number;
    favorites: number;
    rating: number;
  }>;
  
  // 最近活动
  recentActivity: Array<{
    id: string;
    type: 'create' | 'update' | 'favorite' | 'view';
    prompt: Prompt;
    date: string;
  }>;
  
  // 时间分布
  timeDistribution: Array<{
    date: string;
    prompts: number;
    views: number;
    favorites: number;
  }>;
  
  // 难度分布
  difficultyStats: Array<{
    difficulty: string;
    count: number;
    percentage: number;
  }>;
  
  // 语言分布
  languageStats: Array<{
    language: string;
    count: number;
    percentage: number;
  }>;
}

const Statistics: React.FC = () => {
  const {
    prompts,
    categories,
    tags,
    fetchPrompts,
    fetchCategories,
    fetchTags,
    isLoading,
  } = usePromptStore();

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (prompts.length > 0 && categories.length > 0 && tags.length > 0) {
      generateStatistics();
    }
  }, [prompts, categories, tags, timeRange]);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchPrompts(),
        fetchCategories(),
        fetchTags(),
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const generateStatistics = () => {
    // 模拟生成统计数据
    const totalPrompts = prompts.length;
    const totalFavorites = prompts.filter(p => p.isFavorite).length;
    const totalViews = prompts.reduce((sum, p) => sum + (p.usageCount || 0), 0);
    const avgRating = prompts.length > 0 
      ? prompts.reduce((sum, p) => sum + (p.rating || 0), 0) / prompts.length 
      : 0;
    const publicPrompts = prompts.filter(p => p.isPublic).length;
    const privatePrompts = totalPrompts - publicPrompts;

    // 分类统计
    const categoryStats = categories.map(category => {
      const count = prompts.filter(p => p.categoryId === category.id).length;
      return {
        category,
        count,
        percentage: totalPrompts > 0 ? (count / totalPrompts) * 100 : 0,
      };
    }).sort((a, b) => b.count - a.count);

    // 标签统计
    const tagCounts = new Map<number, number>();
    prompts.forEach(prompt => {
      prompt.tags.forEach(tag => {
        tagCounts.set(tag.id, (tagCounts.get(tag.id) || 0) + 1);
      });
    });
    
    const tagStats = tags.map(tag => {
      const count = tagCounts.get(tag.id) || 0;
      return {
        tag,
        count,
        percentage: totalPrompts > 0 ? (count / totalPrompts) * 100 : 0,
      };
    }).sort((a, b) => b.count - a.count).slice(0, 10);

    // 热门 Prompt
    const popularPrompts = prompts
      .map(prompt => ({
        prompt,
        views: prompt.usageCount || 0,
        favorites: Math.floor(Math.random() * 50),
        rating: prompt.rating || 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // 最近活动（模拟）
    const recentActivity = prompts
      .slice(0, 10)
      .map((prompt, index) => ({
        id: `activity-${index}`,
        type: ['create', 'update', 'favorite', 'view'][Math.floor(Math.random() * 4)] as any,
        prompt,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 时间分布（模拟）
    const timeDistribution = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        prompts: Math.floor(Math.random() * 10),
        views: Math.floor(Math.random() * 100),
        favorites: Math.floor(Math.random() * 20),
      };
    }).reverse();

    // 难度分布
    const difficultyMap = new Map<string, number>();
    prompts.forEach(prompt => {
      difficultyMap.set(prompt.difficulty, (difficultyMap.get(prompt.difficulty) || 0) + 1);
    });
    
    const difficultyStats = Array.from(difficultyMap.entries()).map(([difficulty, count]) => ({
      difficulty,
      count,
      percentage: totalPrompts > 0 ? (count / totalPrompts) * 100 : 0,
    }));

    // 语言分布
    const languageMap = new Map<string, number>();
    prompts.forEach(prompt => {
      languageMap.set(prompt.language, (languageMap.get(prompt.language) || 0) + 1);
    });
    
    const languageStats = Array.from(languageMap.entries()).map(([language, count]) => ({
      language,
      count,
      percentage: totalPrompts > 0 ? (count / totalPrompts) * 100 : 0,
    }));

    setStatisticsData({
      totalPrompts,
      totalFavorites,
      totalViews,
      avgRating,
      publicPrompts,
      privatePrompts,
      categoriesCount: categories.length,
      tagsCount: tags.length,
      promptsGrowth: Math.floor(Math.random() * 20) - 10,
      favoritesGrowth: Math.floor(Math.random() * 30) - 15,
      viewsGrowth: Math.floor(Math.random() * 50) - 25,
      categoryStats,
      tagStats,
      popularPrompts,
      recentActivity,
      timeDistribution,
      difficultyStats,
      languageStats,
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'create': return <FileTextOutlined className="text-green-500" />;
      case 'update': return <EditOutlined className="text-blue-500" />;
      case 'favorite': return <HeartOutlined className="text-red-500" />;
      case 'view': return <EyeOutlined className="text-gray-500" />;
      default: return <FileTextOutlined />;
    }
  };

  const getActivityText = (type: string) => {
    switch (type) {
      case 'create': return '创建了';
      case 'update': return '更新了';
      case 'favorite': return '收藏了';
      case 'view': return '查看了';
      default: return '操作了';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'green';
      case 'intermediate': return 'orange';
      case 'advanced': return 'red';
      default: return 'default';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '初级';
      case 'intermediate': return '中级';
      case 'advanced': return '高级';
      default: return difficulty;
    }
  };

  const getLanguageText = (language: string) => {
    switch (language) {
      case 'zh': return '中文';
      case 'en': return 'English';
      case 'ja': return '日本語';
      case 'ko': return '한국어';
      default: return language;
    }
  };

  const popularPromptsColumns: ColumnsType<any> = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_, __, index) => {
        const rank = index + 1;
        let icon = <span className="text-gray-500">{rank}</span>;
        if (rank === 1) icon = <TrophyOutlined className="text-yellow-500" />;
        else if (rank === 2) icon = <TrophyOutlined className="text-gray-400" />;
        else if (rank === 3) icon = <TrophyOutlined className="text-orange-400" />;
        return <div className="text-center">{icon}</div>;
      },
    },
    {
      title: 'Prompt',
      dataIndex: 'prompt',
      key: 'prompt',
      render: (prompt: Prompt) => (
        <div>
          <div className="font-medium">{prompt.title}</div>
          <div className="text-sm text-gray-500 truncate">{prompt.description}</div>
        </div>
      ),
    },
    {
      title: '查看次数',
      dataIndex: 'views',
      key: 'views',
      width: 100,
      render: (views: number) => (
        <div className="text-center">
          <div className="font-medium">{views}</div>
          <EyeOutlined className="text-gray-400" />
        </div>
      ),
    },
    {
      title: '收藏数',
      dataIndex: 'favorites',
      key: 'favorites',
      width: 100,
      render: (favorites: number) => (
        <div className="text-center">
          <div className="font-medium">{favorites}</div>
          <HeartOutlined className="text-red-400" />
        </div>
      ),
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 100,
      render: (rating: number) => (
        <div className="text-center">
          <div className="font-medium">{rating.toFixed(1)}</div>
          <StarOutlined className="text-yellow-400" />
        </div>
      ),
    },
  ];

  if (!statisticsData) {
    return (
      <div className="p-6">
        <Title level={2} className="mb-6">
          统计分析
        </Title>
        <Card loading={isLoading}>
          <Empty description="正在加载统计数据..." />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 页面标题和时间选择 */}
      <div className="flex items-center justify-between mb-6">
        <Title level={2} className="mb-0">
          统计分析
        </Title>
        <Space>
          <Select value={timeRange} onChange={setTimeRange} style={{ width: 120 }}>
            <Option value="7d">最近7天</Option>
            <Option value="30d">最近30天</Option>
            <Option value="90d">最近90天</Option>
            <Option value="all">全部时间</Option>
          </Select>
        </Space>
      </div>

      {/* 核心指标 */}
      <Row gutter={16} className="mb-6">
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总 Prompt 数"
              value={statisticsData.totalPrompts}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                statisticsData.promptsGrowth !== 0 && (
                  <span className={`text-sm ml-2 ${statisticsData.promptsGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {statisticsData.promptsGrowth > 0 ? <RiseOutlined /> : <FallOutlined />}
                    {Math.abs(statisticsData.promptsGrowth)}%
                  </span>
                )
              }
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总收藏数"
              value={statisticsData.totalFavorites}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#f5222d' }}
              suffix={
                statisticsData.favoritesGrowth !== 0 && (
                  <span className={`text-sm ml-2 ${statisticsData.favoritesGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {statisticsData.favoritesGrowth > 0 ? <RiseOutlined /> : <FallOutlined />}
                    {Math.abs(statisticsData.favoritesGrowth)}%
                  </span>
                )
              }
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总查看次数"
              value={statisticsData.totalViews}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={
                statisticsData.viewsGrowth !== 0 && (
                  <span className={`text-sm ml-2 ${statisticsData.viewsGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {statisticsData.viewsGrowth > 0 ? <RiseOutlined /> : <FallOutlined />}
                    {Math.abs(statisticsData.viewsGrowth)}%
                  </span>
                )
              }
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="平均评分"
              value={statisticsData.avgRating.toFixed(1)}
              prefix={<StarOutlined />}
              suffix="/ 5.0"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 次要指标 */}
      <Row gutter={16} className="mb-6">
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="公开 Prompt"
              value={statisticsData.publicPrompts}
              prefix={<GlobalOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="私有 Prompt"
              value={statisticsData.privatePrompts}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="分类数量"
              value={statisticsData.categoriesCount}
              prefix={<FolderOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="标签数量"
              value={statisticsData.tagsCount}
              prefix={<TagOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        {/* 分类分布 */}
        <Col xs={24} lg={12}>
          <Card title={<span><PieChartOutlined /> 分类分布</span>}>
            {statisticsData.categoryStats.length > 0 ? (
              <div className="space-y-3">
                {statisticsData.categoryStats.slice(0, 8).map((item, index) => (
                  <div key={item.category.id} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className={`w-3 h-3 rounded mr-2`} style={{ backgroundColor: `hsl(${index * 45}, 70%, 60%)` }} />
                      <span className="truncate">{item.category.name}</span>
                    </div>
                    <div className="flex items-center ml-4">
                      <span className="text-sm text-gray-500 mr-2">{item.count}</span>
                      <Progress
                        percent={item.percentage}
                        size="small"
                        showInfo={false}
                        strokeColor={`hsl(${index * 45}, 70%, 60%)`}
                        className="w-20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="暂无分类数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        {/* 热门标签 */}
        <Col xs={24} lg={12}>
          <Card title={<span><TagOutlined /> 热门标签</span>}>
            {statisticsData.tagStats.length > 0 ? (
              <div className="space-y-3">
                {statisticsData.tagStats.slice(0, 8).map((item, index) => (
                  <div key={item.tag.id} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <Tag color={item.tag.color} className="mr-2">
                        {item.tag.name}
                      </Tag>
                    </div>
                    <div className="flex items-center ml-4">
                      <span className="text-sm text-gray-500 mr-2">{item.count}</span>
                      <Progress
                        percent={item.percentage}
                        size="small"
                        showInfo={false}
                        className="w-20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="暂无标签数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        {/* 难度分布 */}
        <Col xs={24} lg={12}>
          <Card title={<span><BarChartOutlined /> 难度分布</span>}>
            {statisticsData.difficultyStats.length > 0 ? (
              <div className="space-y-3">
                {statisticsData.difficultyStats.map((item) => (
                  <div key={item.difficulty} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <Tag color={getDifficultyColor(item.difficulty)} className="mr-2">
                        {getDifficultyText(item.difficulty)}
                      </Tag>
                    </div>
                    <div className="flex items-center ml-4">
                      <span className="text-sm text-gray-500 mr-2">{item.count}</span>
                      <Progress
                        percent={item.percentage}
                        size="small"
                        showInfo={false}
                        strokeColor={getDifficultyColor(item.difficulty) === 'green' ? '#52c41a' : 
                                   getDifficultyColor(item.difficulty) === 'orange' ? '#fa8c16' : '#f5222d'}
                        className="w-20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="暂无难度数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        {/* 语言分布 */}
        <Col xs={24} lg={12}>
          <Card title={<span><GlobalOutlined /> 语言分布</span>}>
            {statisticsData.languageStats.length > 0 ? (
              <div className="space-y-3">
                {statisticsData.languageStats.map((item, index) => (
                  <div key={item.language} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <span className="mr-2">{getLanguageText(item.language)}</span>
                    </div>
                    <div className="flex items-center ml-4">
                      <span className="text-sm text-gray-500 mr-2">{item.count}</span>
                      <Progress
                        percent={item.percentage}
                        size="small"
                        showInfo={false}
                        strokeColor={`hsl(${index * 60}, 70%, 60%)`}
                        className="w-20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="暂无语言数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      {/* 热门 Prompt */}
      <Row gutter={16} className="mb-6">
        <Col xs={24}>
          <Card title={<span><FireOutlined /> 热门 Prompt</span>}>
            {statisticsData.popularPrompts.length > 0 ? (
              <Table
                columns={popularPromptsColumns}
                dataSource={statisticsData.popularPrompts}
                rowKey={(record) => record.prompt.id}
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="暂无热门 Prompt" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      {/* 最近活动 */}
      <Row gutter={16}>
        <Col xs={24}>
          <Card title={<span><ClockCircleOutlined /> 最近活动</span>}>
            {statisticsData.recentActivity.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={statisticsData.recentActivity}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={getActivityIcon(item.type)} />}
                      title={
                        <span>
                          {getActivityText(item.type)}
                          <span className="font-medium ml-1">{item.prompt.title}</span>
                        </span>
                      }
                      description={
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 truncate">{item.prompt.description}</span>
                          <span className="text-sm text-gray-400 ml-4">
                            {new Date(item.date).toLocaleString()}
                          </span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无活动记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;