/**
 * 收藏夹页面
 * 显示用户收藏的所有 Prompt
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Empty,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Rate,
  Tooltip,
  message,
  Popconfirm,
  Badge,
  Divider,
  Statistic,
} from 'antd';
import {
  HeartOutlined,
  HeartFilled,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  CopyOutlined,
  ShareAltOutlined,
  DeleteOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  CalendarOutlined,
  TagOutlined,
  FolderOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePromptStore } from '../store/promptStore';
import type { Prompt } from '../store/promptStore';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

interface FavoritePrompt extends Prompt {
  favoriteDate?: string;
  lastUsed?: string;
  useCount?: number;
}

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const {
    prompts,
    categories,
    tags,
    fetchPrompts,
    fetchCategories,
    fetchTags,
    toggleFavorite,
    isLoading,
  } = usePromptStore();

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [selectedTag, setSelectedTag] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<'favoriteDate' | 'lastUsed' | 'rating' | 'title'>('favoriteDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [favoritePrompts, setFavoritePrompts] = useState<FavoritePrompt[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // 模拟收藏的 Prompt 数据
    const favorites = prompts
      .filter(prompt => prompt.isFavorite)
      .map(prompt => ({
        ...prompt,
        favoriteDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        useCount: Math.floor(Math.random() * 50),
      }));
    setFavoritePrompts(favorites);
  }, [prompts]);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchPrompts(),
        fetchCategories(),
        fetchTags(),
      ]);
    } catch (error) {
      message.error('加载数据失败');
    }
  };

  const handleUnfavorite = async (promptId: number) => {
    try {
      await toggleFavorite(promptId);
      message.success('已取消收藏');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleView = (promptId: number) => {
    navigate(`/prompts/${promptId}`);
  };

  const handleEdit = (promptId: number) => {
    navigate(`/prompts/${promptId}/edit`);
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      message.success('内容已复制到剪贴板');
    } catch (error) {
      message.error('复制失败');
    }
  };

  const handleShare = (prompt: Prompt) => {
    // 模拟分享功能
    const shareUrl = `${window.location.origin}/prompts/${prompt.id}`;
    navigator.clipboard.writeText(shareUrl);
    message.success('分享链接已复制到剪贴板');
  };

  // 过滤和排序
  const filteredPrompts = favoritePrompts.filter(prompt => {
    const matchesSearch = !searchText || 
      prompt.title.toLowerCase().includes(searchText.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchText.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesCategory = !selectedCategory || prompt.categoryId === selectedCategory;
    
    const matchesTag = !selectedTag || prompt.tags.some(tag => tag.id === selectedTag);
    
    return matchesSearch && matchesCategory && matchesTag;
  });

  const sortedPrompts = [...filteredPrompts].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'favoriteDate':
        comparison = new Date(a.favoriteDate || 0).getTime() - new Date(b.favoriteDate || 0).getTime();
        break;
      case 'lastUsed':
        const aLastUsed = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
        const bLastUsed = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
        comparison = aLastUsed - bLastUsed;
        break;
      case 'rating':
        comparison = (a.rating || 0) - (b.rating || 0);
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });

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

  const totalUseCount = favoritePrompts.reduce((sum, prompt) => sum + (prompt.useCount || 0), 0);
  const avgRating = favoritePrompts.length > 0 
    ? favoritePrompts.reduce((sum, prompt) => sum + (prompt.rating || 0), 0) / favoritePrompts.length 
    : 0;
  const recentlyUsed = favoritePrompts.filter(prompt => 
    prompt.lastUsed && new Date(prompt.lastUsed).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;

  return (
    <div className="p-6">
      {/* 页面标题和统计 */}
      <div className="mb-6">
        <Title level={2} className="mb-4">
          我的收藏
        </Title>
        
        <Row gutter={16} className="mb-4">
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="收藏总数"
                value={favoritePrompts.length}
                prefix={<HeartFilled className="text-red-500" />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总使用次数"
                value={totalUseCount}
                prefix={<EyeOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="平均评分"
                value={avgRating.toFixed(1)}
                prefix={<StarOutlined />}
                suffix="/ 5"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="近期使用"
                value={recentlyUsed}
                prefix={<CalendarOutlined />}
                suffix="个"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* 搜索和过滤 */}
      <Card className="mb-4">
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8}>
            <Search
              placeholder="搜索收藏的 Prompt..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={4}>
            <Select
              placeholder="选择分类"
              value={selectedCategory}
              onChange={setSelectedCategory}
              allowClear
              style={{ width: '100%' }}
            >
              {categories.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={4}>
            <Select
              placeholder="选择标签"
              value={selectedTag}
              onChange={setSelectedTag}
              allowClear
              style={{ width: '100%' }}
            >
              {tags.map(tag => (
                <Option key={tag.id} value={tag.id}>
                  <Tag color={tag.color}>{tag.name}</Tag>
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={4}>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: '100%' }}
            >
              <Option value="favoriteDate">收藏时间</Option>
              <Option value="lastUsed">最近使用</Option>
              <Option value="rating">评分</Option>
              <Option value="title">标题</Option>
            </Select>
          </Col>
          <Col xs={12} sm={4}>
            <Button
              icon={<SortAscendingOutlined />}
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={{ width: '100%' }}
            >
              {sortOrder === 'asc' ? '升序' : '降序'}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Prompt 列表 */}
      {sortedPrompts.length > 0 ? (
        <Row gutter={[16, 16]}>
          {sortedPrompts.map((prompt) => {
            const category = categories.find(c => c.id === prompt.categoryId);
            
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={prompt.id}>
                <Card
                  className="h-full hover:shadow-lg transition-shadow cursor-pointer"
                  actions={[
                    <Tooltip title="查看详情">
                      <EyeOutlined onClick={() => handleView(prompt.id)} />
                    </Tooltip>,
                    <Tooltip title="编辑">
                      <EditOutlined onClick={() => handleEdit(prompt.id)} />
                    </Tooltip>,
                    <Tooltip title="复制内容">
                      <CopyOutlined onClick={() => handleCopy(prompt.content)} />
                    </Tooltip>,
                    <Tooltip title="分享">
                      <ShareAltOutlined onClick={() => handleShare(prompt)} />
                    </Tooltip>,
                    <Popconfirm
                      title="取消收藏"
                      description="确定要取消收藏这个 Prompt 吗？"
                      onConfirm={() => handleUnfavorite(prompt.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Tooltip title="取消收藏">
                        <HeartFilled className="text-red-500" />
                      </Tooltip>
                    </Popconfirm>,
                  ]}
                >
                  <div className="h-full flex flex-col">
                    {/* 标题和状态 */}
                    <div className="flex items-start justify-between mb-2">
                      <Title level={5} className="mb-0 flex-1 mr-2" ellipsis={{ rows: 2 }}>
                        {prompt.title}
                      </Title>
                      <div className="flex flex-col items-end">
                        {prompt.isPublic ? (
                          <Badge status="success" text="公开" />
                        ) : (
                          <Badge status="default" text="私有" />
                        )}
                        {prompt.useCount && prompt.useCount > 10 && (
                          <Badge count="热门" style={{ backgroundColor: '#f50' }} />
                        )}
                      </div>
                    </div>

                    {/* 描述 */}
                    <Paragraph
                      className="text-gray-600 flex-1 mb-3"
                      ellipsis={{ rows: 2 }}
                    >
                      {prompt.description}
                    </Paragraph>

                    {/* 分类和标签 */}
                    <div className="mb-3">
                      {category && (
                        <Tag icon={<FolderOutlined />} color="blue" className="mb-1">
                          {category.name}
                        </Tag>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {prompt.tags.slice(0, 3).map(tag => (
                          <Tag key={tag.id} color={tag.color} size="small">
                            {tag.name}
                          </Tag>
                        ))}
                        {prompt.tags.length > 3 && (
                          <Tag size="small">+{prompt.tags.length - 3}</Tag>
                        )}
                      </div>
                    </div>

                    {/* 元信息 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>难度:</span>
                        <Tag color={getDifficultyColor(prompt.difficulty)} size="small">
                          {getDifficultyText(prompt.difficulty)}
                        </Tag>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>语言:</span>
                        <Tag size="small">{getLanguageText(prompt.language)}</Tag>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>评分:</span>
                        <Rate disabled value={prompt.rating} size="small" />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>使用:</span>
                        <span>{prompt.useCount || 0} 次</span>
                      </div>
                    </div>

                    <Divider className="my-3" />

                    {/* 收藏信息 */}
                    <div className="text-xs text-gray-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>收藏时间:</span>
                        <span>{new Date(prompt.favoriteDate || '').toLocaleDateString()}</span>
                      </div>
                      {prompt.lastUsed && (
                        <div className="flex items-center justify-between">
                          <span>最近使用:</span>
                          <span>{new Date(prompt.lastUsed).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Card>
          <Empty
            description={
              searchText || selectedCategory || selectedTag
                ? '没有找到匹配的收藏 Prompt'
                : '您还没有收藏任何 Prompt'
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {!searchText && !selectedCategory && !selectedTag && (
              <Button
                type="primary"
                onClick={() => navigate('/prompts')}
              >
                去发现 Prompt
              </Button>
            )}
          </Empty>
        </Card>
      )}

      {/* 快速操作提示 */}
      <Card className="mt-4" bodyStyle={{ padding: '16px' }}>
        <div className="text-center">
          <Text type="secondary">
            💡 提示：点击卡片可查看详情，使用右上角的操作按钮进行编辑、复制、分享等操作
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Favorites;