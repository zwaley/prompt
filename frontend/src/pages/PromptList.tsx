/**
 * Prompt列表页面
 * 显示所有Prompt，支持搜索、筛选、排序等功能
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Tag,
  Pagination,
  Space,
  Typography,
  Empty,
  Spin,
  message,
  Modal,
  Tooltip,
  Rate,
  Dropdown,
  Menu,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  HeartOutlined,
  HeartFilled,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  MoreOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePromptStore } from '../store/promptStore';
import type { Prompt } from '../store/promptStore';

const { Search } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

const PromptList: React.FC = () => {
  const navigate = useNavigate();
  const {
    prompts,
    categories,
    tags,
    pagination,
    filters,
    isLoading,
    error,
    fetchPrompts,
    fetchCategories,
    fetchTags,
    deletePrompt,
    toggleFavorite,
    ratePrompt,
    recordUsage,
    setFilters,
    clearError,
  } = usePromptStore();

  const [selectedPrompts, setSelectedPrompts] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadData();
  }, [filters, pagination.current, sortBy, sortOrder]);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchPrompts({
          ...filters,
          page: pagination.current,
          limit: pagination.pageSize,
          sortBy,
          sortOrder,
        }),
        fetchCategories(),
        fetchTags(),
      ]);
    } catch (error) {
      message.error('加载数据失败');
    }
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
  };

  const handleCategoryChange = (categoryId: number | undefined) => {
    setFilters({ ...filters, categoryId });
  };

  const handleTagsChange = (tagIds: number[]) => {
    setFilters({ ...filters, tagIds });
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    setFilters({ ...filters, page, limit: pageSize });
  };

  const handleDelete = (id: number) => {
    confirm({
      title: '确认删除',
      content: '确定要删除这个 Prompt 吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deletePrompt(id);
          message.success('删除成功');
          loadData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleToggleFavorite = async (id: number) => {
    try {
      await toggleFavorite(id);
      message.success('操作成功');
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleRate = async (id: number, rating: number) => {
    try {
      await ratePrompt(id, rating);
      message.success('评分成功');
      loadData();
    } catch (error) {
      message.error('评分失败');
    }
  };

  const handleUse = async (prompt: Prompt) => {
    try {
      await recordUsage(prompt.id);
      // 复制到剪贴板
      await navigator.clipboard.writeText(prompt.content);
      message.success('Prompt 已复制到剪贴板');
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      message.success('已复制到剪贴板');
    } catch (error) {
      message.error('复制失败');
    }
  };

  const getActionMenu = (prompt: Prompt) => (
    <Menu>
      <Menu.Item
        key="edit"
        icon={<EditOutlined />}
        onClick={() => navigate(`/prompts/${prompt.id}/edit`)}
      >
        编辑
      </Menu.Item>
      <Menu.Item
        key="copy"
        icon={<CopyOutlined />}
        onClick={() => handleCopy(prompt.content)}
      >
        复制内容
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        danger
        onClick={() => handleDelete(prompt.id)}
      >
        删除
      </Menu.Item>
    </Menu>
  );

  const renderPromptCard = (prompt: Prompt) => (
    <Card
      key={prompt.id}
      className="prompt-card h-full"
      hoverable
      actions={[
        <Tooltip title={prompt.isFavorite ? '取消收藏' : '添加收藏'}>
          <Button
            type="text"
            icon={
              prompt.isFavorite ? (
                <HeartFilled className="text-red-500" />
              ) : (
                <HeartOutlined />
              )
            }
            onClick={() => handleToggleFavorite(prompt.id)}
          />
        </Tooltip>,
        <Tooltip title="使用并复制">
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => handleUse(prompt)}
          />
        </Tooltip>,
        <Tooltip title="查看详情">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/prompts/${prompt.id}`)}
          />
        </Tooltip>,
        <Dropdown overlay={getActionMenu(prompt)} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>,
      ]}
    >
      <div className="h-full flex flex-col">
        <div className="flex-1">
          <Title level={5} className="prompt-title">
            {prompt.title}
          </Title>
          <Paragraph className="prompt-content text-gray-600">
            {prompt.content}
          </Paragraph>
        </div>
        
        <div className="mt-4">
          {/* 分类和标签 */}
          <div className="mb-3">
            {prompt.category && (
              <Tag color="blue" className="mb-1">
                {prompt.category.name}
              </Tag>
            )}
            {prompt.tags?.map((tag) => (
              <Tag key={tag.id} className="mb-1">
                {tag.name}
              </Tag>
            ))}
          </div>
          
          {/* 评分和统计 */}
          <div className="flex justify-between items-center">
            <div>
              <Rate
                size="small"
                value={prompt.rating || 0}
                onChange={(value) => handleRate(prompt.id, value)}
              />
              <Text type="secondary" className="ml-2 text-xs">
                ({prompt.rating?.toFixed(1) || '0.0'})
              </Text>
            </div>
            <Space size="small">
              <Text type="secondary" className="text-xs">
                <EyeOutlined /> {prompt.usageCount || 0}
              </Text>
            </Space>
          </div>
        </div>
      </div>
    </Card>
  );

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <Empty
            description="加载失败"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => { clearError(); loadData(); }}>
              重新加载
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} className="mb-0">
            Prompt 管理
          </Title>
          <Text type="secondary">
            共 {pagination.total} 个 Prompt
          </Text>
        </div>
        <Space>
          <Button icon={<ImportOutlined />}>导入</Button>
          <Button icon={<ExportOutlined />}>导出</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/prompts/create')}
          >
            创建 Prompt
          </Button>
        </Space>
      </div>

      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索 Prompt..."
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="选择分类"
              allowClear
              style={{ width: '100%' }}
              onChange={handleCategoryChange}
              value={filters.categoryId}
            >
              {categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              mode="multiple"
              placeholder="选择标签"
              allowClear
              style={{ width: '100%' }}
              onChange={handleTagsChange}
              value={filters.tagIds}
            >
              {tags.map((tag) => (
                <Option key={tag.id} value={tag.id}>
                  {tag.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="排序方式"
              style={{ width: '100%' }}
              value={`${sortBy}-${sortOrder}`}
              onChange={(value) => {
                const [field, order] = value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
            >
              <Option value="createdAt-desc">创建时间（新到旧）</Option>
              <Option value="createdAt-asc">创建时间（旧到新）</Option>
              <Option value="usageCount-desc">使用次数（高到低）</Option>
              <Option value="rating-desc">评分（高到低）</Option>
              <Option value="title-asc">标题（A-Z）</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Button.Group>
              <Button
                type={viewMode === 'grid' ? 'primary' : 'default'}
                onClick={() => setViewMode('grid')}
              >
                网格
              </Button>
              <Button
                type={viewMode === 'list' ? 'primary' : 'default'}
                onClick={() => setViewMode('list')}
              >
                列表
              </Button>
            </Button.Group>
          </Col>
        </Row>
      </Card>

      {/* Prompt 列表 */}
      <Spin spinning={isLoading}>
        {prompts.length > 0 ? (
          <>
            <Row gutter={[16, 16]}>
              {prompts.map((prompt) => (
                <Col
                  key={prompt.id}
                  xs={24}
                  sm={viewMode === 'grid' ? 12 : 24}
                  md={viewMode === 'grid' ? 8 : 24}
                  lg={viewMode === 'grid' ? 6 : 24}
                >
                  {renderPromptCard(prompt)}
                </Col>
              ))}
            </Row>
            
            {/* 分页 */}
            <div className="flex justify-center mt-6">
              <Pagination
                current={pagination.current}
                total={pagination.total}
                pageSize={pagination.pageSize}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) =>
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                }
                onChange={handlePageChange}
              />
            </div>
          </>
        ) : (
          <Card>
            <Empty
              description="暂无 Prompt"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/prompts/create')}
              >
                创建第一个 Prompt
              </Button>
            </Empty>
          </Card>
        )}
      </Spin>
    </div>
  );
};

export default PromptList;