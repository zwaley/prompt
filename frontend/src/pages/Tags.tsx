/**
 * 标签管理页面
 * 显示所有标签，支持创建、编辑、删除标签
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
  Statistic,
  Empty,
  Tooltip,
  Select,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TagOutlined,
  FileTextOutlined,
  SearchOutlined,
  EyeOutlined,
  FireOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePromptStore } from '../store/promptStore';
import type { Tag as TagType } from '../store/promptStore';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface TagWithStats extends TagType {
  promptCount?: number;
  isPopular?: boolean;
}

const Tags: React.FC = () => {
  const navigate = useNavigate();
  const {
    tags,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    isLoading,
  } = usePromptStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [tagsWithStats, setTagsWithStats] = useState<TagWithStats[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cloud'>('table');
  const [sortBy, setSortBy] = useState<'name' | 'count' | 'created'>('name');

  // 预定义的标签颜色
  const tagColors = [
    'magenta', 'red', 'volcano', 'orange', 'gold',
    'lime', 'green', 'cyan', 'blue', 'geekblue',
    'purple', 'pink', 'default'
  ];

  // 颜色名称到十六进制代码的映射
  const colorNameToHex: { [key: string]: string } = {
    magenta: '#eb2f96',
    red: '#f5222d',
    volcano: '#fa541c',
    orange: '#fa8c16',
    gold: '#faad14',
    lime: '#a0d911',
    green: '#52c41a',
    cyan: '#13c2c2',
    blue: '#1890ff',
    geekblue: '#2f54eb',
    purple: '#722ed1',
    pink: '#eb2f96', // Ant Design 的 pink 和 magenta 颜色相同
    default: '#87d068', // 后端默认颜色
  };

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    // 模拟添加统计数据
    const statsData = tags.map(tag => {
      const promptCount = Math.floor(Math.random() * 30);
      return {
        ...tag,
        promptCount,
        isPopular: promptCount > 15,
      };
    });
    setTagsWithStats(statsData);
  }, [tags]);

  const loadTags = async () => {
    try {
      await fetchTags();
    } catch (error) {
      message.error('加载标签失败');
    }
  };

  const handleCreate = () => {
    setEditingTag(null);
    form.resetFields();
    // 设置默认颜色
    form.setFieldsValue({
      color: tagColors[Math.floor(Math.random() * tagColors.length)]
    });
    setModalVisible(true);
  };

  const handleEdit = (tag: TagType) => {
    setEditingTag(tag);
    form.setFieldsValue({
      name: tag.name,
      description: tag.description,
      color: tag.color || 'default',
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: { name: string; description?: string; color?: string }) => {
    try {
      // 打印提交的数据，便于调试
      console.log('原始提交的标签数据:', JSON.stringify(values));

      const submissionData = {
        ...values,
        color: values.color && values.color !== 'default' ? colorNameToHex[values.color] : undefined,
      };
      // 如果颜色是 default，则不传递 color 字段，让后端使用其默认值
      if (values.color === 'default') {
        delete submissionData.color;
      }

      console.log('处理后的标签数据:', JSON.stringify(submissionData));
      
      if (editingTag) {
        await updateTag(editingTag.id, submissionData);
        message.success('标签更新成功');
      } else {
        await createTag(submissionData);
        message.success('标签创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      loadTags();
    } catch (error: any) {
      // 详细记录错误信息
      console.error('标签操作失败:', error);
      console.error('错误详情:', error.response?.data);
      
      // 显示更具体的错误信息
      const errorMsg = error.response?.data?.error || error.response?.data?.message || (editingTag ? '更新失败' : '创建失败');
      message.error(errorMsg);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTag(id);
      message.success('标签删除成功');
      loadTags();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleViewPrompts = (tagId: number, tagName: string) => {
    navigate(`/prompts?tag=${tagId}`);
  };

  const filteredTags = tagsWithStats.filter(tag =>
    tag.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (tag.description && tag.description.toLowerCase().includes(searchText.toLowerCase()))
  );

  const sortedTags = [...filteredTags].sort((a, b) => {
    switch (sortBy) {
      case 'count':
        return (b.promptCount || 0) - (a.promptCount || 0);
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const columns: ColumnsType<TagWithStats> = [
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TagWithStats) => (
        <div className="flex items-center">
          <Tag color={record.color || 'default'} className="mr-2">
            {text}
          </Tag>
          {record.isPopular && (
            <Badge
              count={<FireOutlined className="text-red-500" />}
              title="热门标签"
            />
          )}
          {record.description && (
            <div className="ml-2 text-gray-500 text-sm">
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Prompt 数量',
      dataIndex: 'promptCount',
      key: 'promptCount',
      width: 120,
      render: (count: number) => (
        <Tag color={count > 0 ? 'blue' : 'default'}>
          {count || 0} 个
        </Tag>
      ),
      sorter: (a, b) => (a.promptCount || 0) - (b.promptCount || 0),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: TagWithStats) => (
        <Space>
          <Tooltip title="查看Prompts">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewPrompts(record.id, record.name)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除"
            description={`确定要删除标签 "${record.name}" 吗？${record.promptCount ? `该标签被 ${record.promptCount} 个 Prompt 使用。` : ''}`}
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okType="danger"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalPrompts = tagsWithStats.reduce((sum, tag) => sum + (tag.promptCount || 0), 0);
  const popularTags = tagsWithStats.filter(tag => tag.isPopular);
  const unusedTags = tagsWithStats.filter(tag => (tag.promptCount || 0) === 0);

  const renderTagCloud = () => (
    <div className="tag-cloud p-6">
      {sortedTags.map((tag) => {
        const size = Math.max(12, Math.min(24, 12 + (tag.promptCount || 0) / 2));
        return (
          <Tag
            key={tag.id}
            color={tag.color || 'default'}
            className="tag-item cursor-pointer m-1"
            style={{ fontSize: `${size}px`, padding: '4px 8px' }}
            onClick={() => handleViewPrompts(tag.id, tag.name)}
          >
            {tag.name}
            {tag.promptCount && tag.promptCount > 0 && (
              <span className="ml-1 text-xs opacity-75">
                ({tag.promptCount})
              </span>
            )}
            {tag.isPopular && (
              <FireOutlined className="ml-1 text-red-500" />
            )}
          </Tag>
        );
      })}
    </div>
  );

  return (
    <div className="p-6">
      {/* 页面标题和统计 */}
      <div className="mb-6">
        <Title level={2} className="mb-4">
          标签管理
        </Title>
        
        <Row gutter={16} className="mb-4">
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总标签数"
                value={tags.length}
                prefix={<TagOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="热门标签"
                value={popularTags.length}
                prefix={<FireOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总使用次数"
                value={totalPrompts}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="未使用标签"
                value={unusedTags.length}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* 操作栏 */}
      <Card className="mb-4">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input
              placeholder="搜索标签名称或描述..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 120 }}
            >
              <Option value="name">按名称</Option>
              <Option value="count">按使用量</Option>
              <Option value="created">按创建时间</Option>
            </Select>
          </Col>
          <Col>
            <Button.Group>
              <Button
                type={viewMode === 'table' ? 'primary' : 'default'}
                onClick={() => setViewMode('table')}
              >
                表格
              </Button>
              <Button
                type={viewMode === 'cloud' ? 'primary' : 'default'}
                onClick={() => setViewMode('cloud')}
              >
                标签云
              </Button>
            </Button.Group>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              创建标签
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 标签展示 */}
      <Card>
        {filteredTags.length > 0 ? (
          viewMode === 'table' ? (
            <Table
              columns={columns}
              dataSource={sortedTags}
              rowKey="id"
              loading={isLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              }}
              scroll={{ x: 800 }}
            />
          ) : (
            renderTagCloud()
          )
        ) : (
          <Empty
            description={searchText ? '没有找到匹配的标签' : '暂无标签'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {!searchText && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                创建第一个标签
              </Button>
            )}
          </Empty>
        )}
      </Card>

      {/* 热门标签快速预览 */}
      {popularTags.length > 0 && (
        <Card title="🔥 热门标签" className="mt-4">
          <div className="flex flex-wrap gap-2">
            {popularTags.slice(0, 10).map((tag) => (
              <Tag
                key={tag.id}
                color={tag.color || 'default'}
                className="cursor-pointer"
                onClick={() => handleViewPrompts(tag.id, tag.name)}
              >
                {tag.name} ({tag.promptCount})
              </Tag>
            ))}
          </div>
        </Card>
      )}

      {/* 创建/编辑标签模态框 */}
      <Modal
        title={editingTag ? '编辑标签' : '创建标签'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="标签名称"
            rules={[
              { required: true, message: '请输入标签名称' },
              { max: 30, message: '标签名称不能超过30个字符' },
              {
                validator: async (_, value) => {
                  if (value && value.trim()) {
                    // 检查名称是否重复（排除当前编辑的标签）
                    const exists = tags.some(
                      tag => tag.name.toLowerCase() === value.toLowerCase() && 
                      (!editingTag || tag.id !== editingTag.id)
                    );
                    if (exists) {
                      throw new Error('标签名称已存在');
                    }
                  }
                },
              },
            ]}
          >
            <Input
              placeholder="输入标签名称"
              showCount
              maxLength={30}
            />
          </Form.Item>

          <Form.Item
            name="color"
            label="标签颜色"
            rules={[
              { required: true, message: '请选择标签颜色' },
            ]}
          >
            <Select placeholder="选择标签颜色">
              {tagColors.map((color) => (
                <Option key={color} value={color}>
                  <Tag color={color}>{color}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="标签描述"
            rules={[
              { max: 100, message: '描述不能超过100个字符' },
            ]}
          >
            <TextArea
              placeholder="输入标签描述（可选）"
              rows={3}
              showCount
              maxLength={100}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
              >
                {editingTag ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 使用提示 */}
      <Card className="mt-4" bodyStyle={{ padding: '16px' }}>
        <div className="text-center">
          <Text type="secondary">
            💡 提示：标签用于为 Prompt 添加关键词标记，便于分类和搜索。标签云视图中，标签大小反映使用频率
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Tags;