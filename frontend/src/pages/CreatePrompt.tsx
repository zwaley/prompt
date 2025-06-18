/**
 * 创建Prompt页面
 * 提供表单界面用于创建新的Prompt
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
  Rate,
  Upload,
  Modal,
} from 'antd';
import {
  SaveOutlined,
  EyeOutlined,
  ClearOutlined,
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
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

const CreatePrompt: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const {
    categories,
    tags,
    createPrompt,
    fetchCategories,
    fetchTags,
    isLoading,
  } = usePromptStore();

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [newTag, setNewTag] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [newVariable, setNewVariable] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([fetchCategories(), fetchTags()]);
    } catch (error) {
      message.error('加载数据失败');
    }
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      // 构建提交数据
      const promptData: Partial<Prompt> = {
        title: values.title,
        content: values.content,
        description: values.description,
        tags: values.tagIds?.map(id => tags.find(tag => tag.id === id)?.name).filter(Boolean),
        categoryId: values.categoryId
      };

      // 打印提交的数据，便于调试
      console.log('提交的Prompt数据:', JSON.stringify(promptData));

      // 发送创建请求
      await createPrompt(promptData);
      message.success('Prompt 创建成功！');
      navigate('/prompts');
    } catch (error: any) {
      // 详细记录错误信息
      console.error('创建Prompt失败:', error);
      console.error('错误详情:', error.response?.data);
      
      // 显示更具体的错误信息
      const errorMsg = error.response?.data?.error || error.response?.data?.message || '创建失败，请重试';
      message.error(errorMsg);
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

  const handleClear = () => {
    confirm({
      title: '确认清空',
      content: '确定要清空所有内容吗？此操作不可恢复。',
      okText: '清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        form.resetFields();
        setVariables([]);
        message.success('已清空表单');
      },
    });
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

  const extractVariables = () => {
    const content = form.getFieldValue('content');
    if (!content) {
      message.warning('请先输入 Prompt 内容');
      return;
    }
    
    // 提取 {{variable}} 格式的变量
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    if (matches) {
      const extractedVars = matches.map(match => match.slice(2, -2).trim());
      const uniqueVars = [...new Set([...variables, ...extractedVars])];
      setVariables(uniqueVars);
      message.success(`提取到 ${extractedVars.length} 个变量`);
    } else {
      message.info('未找到变量（格式：{{变量名}}）');
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

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <Title level={2} className="mb-2">
          创建新 Prompt
        </Title>
        <Text type="secondary">
          填写下面的信息来创建一个新的 Prompt
        </Text>
      </div>

      <Row gutter={24}>
        {/* 主表单 */}
        <Col xs={24} lg={16}>
          <Card title="基本信息">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                isPublic: true,
                difficulty: 'beginner',
                language: 'Chinese',
              }}
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
                  placeholder="输入您的 Prompt 内容...\n\n例如：\n请帮我分析 {{主题}} 的优缺点，并给出 {{数量}} 个改进建议。"
                  rows={8}
                  showCount
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
                    保存 Prompt
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
                  <Button
                    danger
                    icon={<ClearOutlined />}
                    onClick={handleClear}
                  >
                    清空
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
              onClick={extractVariables}
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

          {/* 使用提示 */}
          <Card title="💡 使用提示">
            <div className="space-y-3 text-sm">
              <div>
                <Text strong>变量语法：</Text>
                <br />
                <Text type="secondary">
                  使用 <code>{`{{变量名}}`}</code> 格式定义可替换的变量
                </Text>
              </div>
              
              <Divider className="my-3" />
              
              <div>
                <Text strong>标题建议：</Text>
                <br />
                <Text type="secondary">
                  使用简洁明了的标题，描述 Prompt 的主要功能
                </Text>
              </div>
              
              <Divider className="my-3" />
              
              <div>
                <Text strong>内容建议：</Text>
                <br />
                <Text type="secondary">
                  • 使用清晰的指令<br />
                  • 提供具体的上下文<br />
                  • 定义期望的输出格式
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
    </div>
  );
};

export default CreatePrompt;