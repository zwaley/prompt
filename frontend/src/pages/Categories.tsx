/**
 * 分类管理页面
 * 显示所有分类，支持创建、编辑、删除分类
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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  FileTextOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePromptStore } from '../store/promptStore';
import type { Category } from '../store/promptStore';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface CategoryWithStats extends Category {
  promptCount?: number;
}

const Categories: React.FC = () => {
  const navigate = useNavigate();
  const {
    categories,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    isLoading,
  } = usePromptStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [categoriesWithStats, setCategoriesWithStats] = useState<CategoryWithStats[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    // 模拟添加统计数据
    const statsData = categories.map(category => ({
      ...category,
      promptCount: Math.floor(Math.random() * 50), // 模拟数据
    }));
    setCategoriesWithStats(statsData);
  }, [categories]);

  const loadCategories = async () => {
    try {
      await fetchCategories();
    } catch (error) {
      message.error('加载分类失败');
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: { name: string; description?: string }) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, values);
        message.success('分类更新成功');
      } else {
        await createCategory(values);
        message.success('分类创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      loadCategories();
    } catch (error) {
      message.error(editingCategory ? '更新失败' : '创建失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCategory(id);
      message.success('分类删除成功');
      loadCategories();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleViewPrompts = (categoryId: number, categoryName: string) => {
    navigate(`/prompts?category=${categoryId}`);
  };

  const filteredCategories = categoriesWithStats.filter(category =>
    category.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns: ColumnsType<CategoryWithStats> = [
    {
      title: '分类名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: CategoryWithStats) => (
        <div className="flex items-center">
          <FolderOutlined className="text-blue-500 mr-2" />
          <div>
            <div className="font-medium">{text}</div>
            {record.description && (
              <div className="text-gray-500 text-sm mt-1">
                {record.description}
              </div>
            )}
          </div>
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
      render: (_, record: CategoryWithStats) => (
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
            description={`确定要删除分类 "${record.name}" 吗？${record.promptCount ? `该分类下有 ${record.promptCount} 个 Prompt。` : ''}`}
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

  const totalPrompts = categoriesWithStats.reduce((sum, cat) => sum + (cat.promptCount || 0), 0);
  const avgPromptsPerCategory = categoriesWithStats.length > 0 ? totalPrompts / categoriesWithStats.length : 0;

  return (
    <div className="p-6">
      {/* 页面标题和统计 */}
      <div className="mb-6">
        <Title level={2} className="mb-4">
          分类管理
        </Title>
        
        <Row gutter={16} className="mb-4">
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总分类数"
                value={categories.length}
                prefix={<FolderOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="总 Prompt 数"
                value={totalPrompts}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="平均每分类"
                value={avgPromptsPerCategory}
                precision={1}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="空分类数"
                value={categoriesWithStats.filter(cat => (cat.promptCount || 0) === 0).length}
                valueStyle={{ color: '#f5222d' }}
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
              placeholder="搜索分类名称或描述..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              创建分类
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 分类表格 */}
      <Card>
        {filteredCategories.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredCategories}
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
          <Empty
            description={searchText ? '没有找到匹配的分类' : '暂无分类'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {!searchText && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                创建第一个分类
              </Button>
            )}
          </Empty>
        )}
      </Card>

      {/* 创建/编辑分类模态框 */}
      <Modal
        title={editingCategory ? '编辑分类' : '创建分类'}
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
            label="分类名称"
            rules={[
              { required: true, message: '请输入分类名称' },
              { max: 50, message: '分类名称不能超过50个字符' },
              {
                validator: async (_, value) => {
                  if (value && value.trim()) {
                    // 检查名称是否重复（排除当前编辑的分类）
                    const exists = categories.some(
                      cat => cat.name.toLowerCase() === value.toLowerCase() && 
                      (!editingCategory || cat.id !== editingCategory.id)
                    );
                    if (exists) {
                      throw new Error('分类名称已存在');
                    }
                  }
                },
              },
            ]}
          >
            <Input
              placeholder="输入分类名称"
              showCount
              maxLength={50}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="分类描述"
            rules={[
              { max: 200, message: '描述不能超过200个字符' },
            ]}
          >
            <TextArea
              placeholder="输入分类描述（可选）"
              rows={4}
              showCount
              maxLength={200}
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
                {editingCategory ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 使用提示 */}
      <Card className="mt-4" bodyStyle={{ padding: '16px' }}>
        <div className="text-center">
          <Text type="secondary">
            💡 提示：分类用于组织您的 Prompt，删除分类前请确保该分类下没有 Prompt，或将 Prompt 移动到其他分类
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Categories;