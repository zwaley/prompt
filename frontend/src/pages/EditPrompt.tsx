/**
 * 编辑Prompt页面
 * 提供表单界面用于编辑现有的Prompt
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  message,
  Row,
  Col,
  Tag,
  Divider,
  Switch,
  Modal,
  Spin,
  Empty,
} from 'antd';
import {
  SaveOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { usePromptStore } from '../store/promptStore';
import type { Prompt } from '../store/promptStore';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { confirm } = Modal;

interface FormValues {
  title: string;
  content: string;
  description?: string;
  categoryId?: number;
  tagIds?: number[];
  isPublic: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  language?: string;
  variables?: string[];
}

const EditPrompt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const {
    currentPrompt,
    categories,
    tags,
    fetchPromptById,
    updatePrompt,
    fetchCategories,
    fetchTags,
    isLoading,
    error,
  } = usePromptStore();

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [variables, setVariables] = useState<string[]>([]);
  const [newVariable, setNewVariable] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [originalContent, setOriginalContent] = useState('');

  useEffect(() => {
    if (id) {
      loadData(parseInt(id));
    }
  }, [id]);

  useEffect(() => {
    if (currentPrompt) {
      // 填充表单
      form.setFieldsValue({
        title: currentPrompt.title,
        content: currentPrompt.content,
        description: currentPrompt.description,
        categoryId: currentPrompt.category?.id,
        tagIds: currentPrompt.tags?.map(tag => tag.id),
        isPublic: currentPrompt.isPublic ?? true,
        difficulty: currentPrompt.difficulty || 'beginner',
        language: currentPrompt.language || 'Chinese',
      });
      
      // 提取变量
      extractVariables(currentPrompt.content);
      setOriginalContent(currentPrompt.content);
    }
  }, [currentPrompt, form]);

  const loadData = async (promptId: number) => {
    try {
      await Promise.all([
        fetchPromptById(promptId),
        fetchCategories(),
        fetchTags(),
      ]);
    } catch (error) {
      message.error('加载数据失败');
    }
  };

  const extractVariables = (content: string) => {
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    if (matches) {
      const vars = matches.map(match => match.slice(2, -2).trim());
      const uniqueVars = [...new Set(vars)];
      setVariables(uniqueVars);
    } else {
      setVariables([]);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    if (!currentPrompt) {
      console.error('currentPrompt 为空');
      return;
    }
    
    console.log('开始提交表单:', { values, currentPrompt });
    
    try {
      // 确保只发送后端期望的字段
      const submitData: any = {};
      
      // 只添加有值的字段
      if (values.title !== undefined && values.title !== '') {
        submitData.title = values.title;
      }
      if (values.content !== undefined && values.content !== '') {
        submitData.content = values.content;
      }
      if (values.description !== undefined) {
        submitData.description = values.description || '';
      }
      if (values.categoryId !== undefined) {
        submitData.categoryId = values.categoryId || null;
      }
      if (values.tagIds !== undefined) {
         submitData.tags = values.tagIds?.map(id => {
           const tag = tags.find(tag => tag.id === id);
           return tag?.name;
         }).filter(Boolean) || [];
       }
       if (values.priority !== undefined) {
         submitData.priority = values.priority || 0;
       }

      console.log('准备发送的数据:', submitData);
      
      const result = await updatePrompt(currentPrompt.id, submitData);
      console.log('更新成功:', result);
      
      message.success('Prompt 更新成功！');
      navigate(`/prompts/${currentPrompt.id}`);
    } catch (error) {
      console.error('更新失败详细信息:', error);
      if (error?.response?.data?.details) {
        console.error('验证错误详情:', error.response.data.details);
        error.response.data.details.forEach((detail: any) => {
          message.error(`${detail.field}: ${detail.message}`);
        });
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || '更新失败，请重试';
        message.error(errorMessage);
      }
    }
  };

  const handlePreview = () => {
    const content = form.getFieldValue('content');
    if (!content) {
      message.warning('请先输入 Prompt 内容');
      return;
    }
    setPreviewContent(content);
    setPreviewVisible(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setHasChanges(newContent !== originalContent);
    extractVariables(newContent);
  };

  const handleCopyContent = async () => {
    const content = form.getFieldValue('content');
    if (!content) {
      message.warning('没有内容可复制');
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      message.success('内容已复制到剪贴板');
    } catch (error) {
      message.error('复制失败');
    }
  };

  const addVariable = () => {
    if (newVariable && !variables.includes(newVariable)) {
      setVariables([...variables, newVariable]);
      setNewVariable('');
    }
  };

  const removeVariable = (variable: string) => {
    setVariables(variables.filter(v => v !== variable));
  };

  const extractVariablesFromContent = () => {
    const content = form.getFieldValue('content');
    if (!content) {
      message.warning('请先输入 Prompt 内容');
      return;
    }
    
    extractVariables(content);
    message.success('变量提取完成');
  };

  const handleCreateVersion = () => {
    if (!hasChanges) {
      message.info('内容没有变化，无需创建新版本');
      return;
    }
    setVersionModalVisible(true);
  };

  const handleCancel = () => {
    if (hasChanges) {
      confirm({
        title: '确认离开',
        content: '您有未保存的更改，确定要离开吗？',
        okText: '离开',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          navigate(`/prompts/${currentPrompt?.id}`);
        },
      });
    } else {
      navigate(`/prompts/${currentPrompt?.id}`);
    }
  };

  const difficultyOptions = [
    { value: 'beginner', label: '初级', color: 'green' },
    { value: 'intermediate', label: '中级', color: 'orange' },
    { value: 'advanced', label: '高级', color: 'red' },
  ];

  const languageOptions = [
    'Chinese',
    'English',
    'Japanese',
    'Korean',
    'French',
    'German',
    'Spanish',
    'Russian',
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !currentPrompt) {
    return (
      <div className="p-6">
        <Card>
          <Empty
            description="Prompt不存在或加载失败"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate('/prompts')}>
              返回列表
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleCancel}
            className="mb-2"
          >
            返回详情
          </Button>
          <Title level={2} className="mb-0">
            编辑 Prompt
          </Title>
          <Text type="secondary">
            编辑 "{currentPrompt.title}" 的信息
          </Text>
        </div>
        
        {hasChanges && (
          <Tag color="orange">有未保存的更改</Tag>
        )}
      </div>

      <Row gutter={24}>
        {/* 主表单 */}
        <Col xs={24} lg={16}>
          <Card title="编辑信息">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              onValuesChange={() => setHasChanges(true)}
            >
              <Form.Item
                name="title"
                label="标题"
                rules={[
                  { required: true, message: '请输入标题' },
                  { max: 100, message: '标题不能超过100个字符' },
                ]}
              >
                <Input
                  placeholder="为您的 Prompt 起一个描述性的标题"
                  showCount
                  maxLength={100}
                />
              </Form.Item>

              <Form.Item
                name="description"
                label="描述"
                rules={[
                  { max: 500, message: '描述不能超过500个字符' },
                ]}
              >
                <TextArea
                  placeholder="简要描述这个 Prompt 的用途和特点"
                  rows={3}
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item
                name="content"
                label="Prompt 内容"
                rules={[
                  { required: true, message: '请输入 Prompt 内容' },
                  { min: 10, message: 'Prompt 内容至少需要10个字符' },
                ]}
                extra="提示：使用 {{变量名}} 格式来定义可替换的变量"
              >
                <TextArea
                  placeholder="输入您的 Prompt 内容..."
                  rows={8}
                  showCount
                  onChange={handleContentChange}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="categoryId"
                    label="分类"
                  >
                    <Select
                      placeholder="选择分类"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {categories.map((category) => (
                        <Option key={category.id} value={category.id}>
                          {category.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="tagIds"
                    label="标签"
                  >
                    <Select
                      mode="multiple"
                      placeholder="选择标签"
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {tags.map((tag) => (
                        <Option key={tag.id} value={tag.id}>
                          {tag.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="difficulty"
                    label="难度等级"
                  >
                    <Select placeholder="选择难度">
                      {difficultyOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                          <Tag color={option.color}>{option.label}</Tag>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="language"
                    label="主要语言"
                  >
                    <Select placeholder="选择语言">
                      {languageOptions.map((lang) => (
                        <Option key={lang} value={lang}>
                          {lang}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="isPublic"
                    label="公开状态"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="公开"
                      unCheckedChildren="私有"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* 操作按钮 */}
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={isLoading}
                  >
                    保存更改
                  </Button>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={handlePreview}
                  >
                    预览
                  </Button>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={handleCopyContent}
                  >
                    复制内容
                  </Button>
                  {hasChanges && (
                    <Button
                      icon={<HistoryOutlined />}
                      onClick={handleCreateVersion}
                    >
                      创建版本
                    </Button>
                  )}
                  <Button onClick={handleCancel}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 侧边栏 */}
        <Col xs={24} lg={8}>
          {/* 变量管理 */}
          <Card title="变量管理" className="mb-4">
            <div className="mb-4">
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="添加变量"
                  value={newVariable}
                  onChange={(e) => setNewVariable(e.target.value)}
                  onPressEnter={addVariable}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={addVariable}
                >
                  添加
                </Button>
              </Space.Compact>
            </div>
            
            <Button
              block
              className="mb-4"
              onClick={extractVariablesFromContent}
            >
              从内容中提取变量
            </Button>

            <div>
              {variables.length > 0 ? (
                <div className="space-y-2">
                  {variables.map((variable, index) => (
                    <Tag
                      key={index}
                      closable
                      onClose={() => removeVariable(variable)}
                      className="mb-1"
                    >
                      {variable}
                    </Tag>
                  ))}
                </div>
              ) : (
                <Text type="secondary" className="text-sm">
                  暂无变量，您可以手动添加或从内容中提取
                </Text>
              )}
            </div>
          </Card>

          {/* 更改历史 */}
          <Card title="📝 更改提示">
            <div className="space-y-3 text-sm">
              <div>
                <Text strong>保存提示：</Text>
                <br />
                <Text type="secondary">
                  • 点击"保存更改"直接更新当前版本<br />
                  • 点击"创建版本"保存为新版本
                </Text>
              </div>
              
              <Divider className="my-3" />
              
              <div>
                <Text strong>变量提示：</Text>
                <br />
                <Text type="secondary">
                  修改内容后会自动重新提取变量
                </Text>
              </div>
              
              <Divider className="my-3" />
              
              <div>
                <Text strong>版本管理：</Text>
                <br />
                <Text type="secondary">
                  重要更改建议创建新版本以保留历史记录
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 预览模态框 */}
      <Modal
        title="Prompt 预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
          <Button
            key="copy"
            type="primary"
            icon={<CopyOutlined />}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(previewContent);
                message.success('内容已复制到剪贴板');
              } catch (error) {
                message.error('复制失败');
              }
            }}
          >
            复制
          </Button>,
        ]}
        width={800}
      >
        <div className="bg-gray-50 p-4 rounded border">
          <pre className="whitespace-pre-wrap font-sans text-sm">
            {previewContent}
          </pre>
        </div>
        
        {variables.length > 0 && (
          <div className="mt-4">
            <Text strong>检测到的变量：</Text>
            <div className="mt-2">
              {variables.map((variable, index) => (
                <Tag key={index} className="mb-1">
                  {variable}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* 创建版本模态框 */}
      <Modal
        title="创建新版本"
        open={versionModalVisible}
        onCancel={() => setVersionModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setVersionModalVisible(false)}>
            取消
          </Button>,
          <Button key="create" type="primary">
            创建版本
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item
            label="版本号"
            name="version"
            rules={[{ required: true, message: '请输入版本号' }]}
          >
            <Input placeholder="例如：v1.1, v2.0" />
          </Form.Item>
          
          <Form.Item
            label="更改说明"
            name="changeLog"
            rules={[{ required: true, message: '请输入更改说明' }]}
          >
            <TextArea
              placeholder="描述这次更改的内容..."
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EditPrompt;