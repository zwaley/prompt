/**
 * 设置页面
 * 用户个人设置、系统配置等
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  Typography,
  Divider,
  message,
  Row,
  Col,
  Upload,
  Avatar,
  Space,
  Tabs,
  InputNumber,
  Radio,
  Slider,
  Alert,
  Modal,
  List,
  Tag,
  Popconfirm,
  Progress,
} from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  SecurityScanOutlined,
  BellOutlined,
  ExportOutlined,
  ImportOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  GlobalOutlined,
  MoonOutlined,
  SunOutlined,
  DatabaseOutlined,
  ApiOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { usePromptStore } from '../store/promptStore';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface UserSettings {
  // 个人信息
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  
  // 偏好设置
  language: string;
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  dateFormat: string;
  
  // 通知设置
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  newFeatures: boolean;
  
  // 隐私设置
  profilePublic: boolean;
  showEmail: boolean;
  showStats: boolean;
  allowIndexing: boolean;
  
  // 编辑器设置
  editorTheme: string;
  fontSize: number;
  autoSave: boolean;
  autoSaveInterval: number;
  showLineNumbers: boolean;
  wordWrap: boolean;
  
  // API设置
  apiKey?: string;
  apiQuota: number;
  apiUsage: number;
}

const Settings: React.FC = () => {
  const { prompts, categories, tags } = usePromptStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  
  // 模拟用户设置数据
  const [settings, setSettings] = useState<UserSettings>({
    username: 'demo_user',
    email: 'demo@example.com',
    bio: '热爱AI和编程的开发者',
    website: 'https://example.com',
    location: '北京, 中国',
    language: 'zh',
    theme: 'light',
    timezone: 'Asia/Shanghai',
    dateFormat: 'YYYY-MM-DD',
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    newFeatures: true,
    profilePublic: true,
    showEmail: false,
    showStats: true,
    allowIndexing: true,
    editorTheme: 'vs-light',
    fontSize: 14,
    autoSave: true,
    autoSaveInterval: 30,
    showLineNumbers: true,
    wordWrap: true,
    apiKey: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    apiQuota: 1000,
    apiUsage: 245,
  });

  useEffect(() => {
    // 初始化表单数据
    form.setFieldsValue(settings);
  }, [settings, form]);

  const handleSave = async (values: Partial<UserSettings>) => {
    setLoading(true);
    try {
      // 模拟保存设置
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSettings({ ...settings, ...values });
      message.success('设置保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload: UploadProps['customRequest'] = ({ file, onSuccess }) => {
    // 模拟头像上传
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSettings({ ...settings, avatar: e.target?.result as string });
        message.success('头像上传成功');
        onSuccess?.(file);
      };
      reader.readAsDataURL(file as File);
    }, 1000);
  };

  const handleExportData = () => {
    const exportData = {
      prompts: prompts.filter(p => !p.isPublic), // 只导出私有 Prompt
      categories,
      tags,
      settings,
      exportDate: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prompt-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    message.success('数据导出成功');
    setExportModalVisible(false);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        // 这里应该调用相应的 store 方法来导入数据
        message.success('数据导入成功');
        setImportModalVisible(false);
      } catch (error) {
        message.error('导入文件格式错误');
      }
    };
    reader.readAsText(file);
    return false; // 阻止默认上传行为
  };

  const handleResetApiKey = () => {
    const newApiKey = 'sk-' + Math.random().toString(36).substring(2, 34);
    setSettings({ ...settings, apiKey: newApiKey });
    message.success('API Key 已重置');
  };

  const handleDeleteAccount = () => {
    // 模拟删除账户
    message.success('账户删除请求已提交，我们会在24小时内处理');
    setDeleteAccountModalVisible(false);
  };

  const languageOptions = [
    { value: 'zh', label: '中文' },
    { value: 'en', label: 'English' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
  ];

  const timezoneOptions = [
    { value: 'Asia/Shanghai', label: '北京时间 (UTC+8)' },
    { value: 'America/New_York', label: '纽约时间 (UTC-5)' },
    { value: 'Europe/London', label: '伦敦时间 (UTC+0)' },
    { value: 'Asia/Tokyo', label: '东京时间 (UTC+9)' },
  ];

  const editorThemeOptions = [
    { value: 'vs-light', label: '浅色主题' },
    { value: 'vs-dark', label: '深色主题' },
    { value: 'hc-black', label: '高对比度' },
  ];

  return (
    <div className="p-6">
      <Title level={2} className="mb-6">
        设置
      </Title>

      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        {/* 个人资料 */}
        <TabPane tab={<span><UserOutlined />个人资料</span>} key="profile">
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              initialValues={settings}
            >
              <Row gutter={24}>
                <Col xs={24} md={8}>
                  <div className="text-center mb-6">
                    <Upload
                      name="avatar"
                      listType="picture-circle"
                      className="avatar-uploader"
                      showUploadList={false}
                      customRequest={handleAvatarUpload}
                      beforeUpload={(file) => {
                        const isImage = file.type.startsWith('image/');
                        if (!isImage) {
                          message.error('只能上传图片文件!');
                        }
                        const isLt2M = file.size / 1024 / 1024 < 2;
                        if (!isLt2M) {
                          message.error('图片大小不能超过 2MB!');
                        }
                        return isImage && isLt2M;
                      }}
                    >
                      <Avatar
                        size={100}
                        src={settings.avatar}
                        icon={<UserOutlined />}
                        className="cursor-pointer hover:opacity-80"
                      />
                    </Upload>
                    <div className="mt-2">
                      <Button icon={<UploadOutlined />} size="small">
                        更换头像
                      </Button>
                    </div>
                  </div>
                </Col>
                
                <Col xs={24} md={16}>
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="username"
                        label="用户名"
                        rules={[
                          { required: true, message: '请输入用户名' },
                          { min: 3, max: 20, message: '用户名长度为3-20个字符' },
                        ]}
                      >
                        <Input placeholder="输入用户名" />
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="email"
                        label="邮箱"
                        rules={[
                          { required: true, message: '请输入邮箱' },
                          { type: 'email', message: '请输入有效的邮箱地址' },
                        ]}
                      >
                        <Input placeholder="输入邮箱" />
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} sm={12}>
                      <Form.Item name="website" label="个人网站">
                        <Input placeholder="https://example.com" />
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} sm={12}>
                      <Form.Item name="location" label="所在地">
                        <Input placeholder="城市, 国家" />
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24}>
                      <Form.Item name="bio" label="个人简介">
                        <TextArea
                          rows={3}
                          placeholder="介绍一下自己..."
                          showCount
                          maxLength={200}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
              </Row>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存个人资料
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        {/* 偏好设置 */}
        <TabPane tab={<span><SettingOutlined />偏好设置</span>} key="preferences">
          <Card>
            <Form
              layout="vertical"
              onFinish={handleSave}
              initialValues={settings}
            >
              <Row gutter={24}>
                <Col xs={24} sm={12}>
                  <Form.Item name="language" label="界面语言">
                    <Select options={languageOptions} />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item name="theme" label="主题模式">
                    <Radio.Group>
                      <Radio.Button value="light">
                        <SunOutlined /> 浅色
                      </Radio.Button>
                      <Radio.Button value="dark">
                        <MoonOutlined /> 深色
                      </Radio.Button>
                      <Radio.Button value="auto">
                        <GlobalOutlined /> 自动
                      </Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item name="timezone" label="时区">
                    <Select options={timezoneOptions} />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item name="dateFormat" label="日期格式">
                    <Select>
                      <Option value="YYYY-MM-DD">2024-01-01</Option>
                      <Option value="MM/DD/YYYY">01/01/2024</Option>
                      <Option value="DD/MM/YYYY">01/01/2024</Option>
                      <Option value="YYYY年MM月DD日">2024年01月01日</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存偏好设置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        {/* 通知设置 */}
        <TabPane tab={<span><BellOutlined />通知设置</span>} key="notifications">
          <Card>
            <Form
              layout="vertical"
              onFinish={handleSave}
              initialValues={settings}
            >
              <List
                itemLayout="horizontal"
                dataSource={[
                  {
                    key: 'emailNotifications',
                    title: '邮件通知',
                    description: '接收重要更新和活动的邮件通知',
                  },
                  {
                    key: 'pushNotifications',
                    title: '推送通知',
                    description: '在浏览器中接收实时推送通知',
                  },
                  {
                    key: 'weeklyDigest',
                    title: '每周摘要',
                    description: '每周接收活动摘要和统计信息',
                  },
                  {
                    key: 'newFeatures',
                    title: '新功能通知',
                    description: '第一时间了解新功能和改进',
                  },
                ]}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Form.Item name={item.key} valuePropName="checked" className="mb-0">
                        <Switch />
                      </Form.Item>
                    ]}
                  >
                    <List.Item.Meta
                      title={item.title}
                      description={item.description}
                    />
                  </List.Item>
                )}
              />
              
              <Form.Item className="mt-4">
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存通知设置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        {/* 隐私设置 */}
        <TabPane tab={<span><SecurityScanOutlined />隐私设置</span>} key="privacy">
          <Card>
            <Form
              layout="vertical"
              onFinish={handleSave}
              initialValues={settings}
            >
              <List
                itemLayout="horizontal"
                dataSource={[
                  {
                    key: 'profilePublic',
                    title: '公开个人资料',
                    description: '允许其他用户查看您的个人资料',
                  },
                  {
                    key: 'showEmail',
                    title: '显示邮箱地址',
                    description: '在个人资料中显示邮箱地址',
                  },
                  {
                    key: 'showStats',
                    title: '显示统计信息',
                    description: '在个人资料中显示 Prompt 统计信息',
                  },
                  {
                    key: 'allowIndexing',
                    title: '允许搜索引擎索引',
                    description: '允许搜索引擎索引您的公开内容',
                  },
                ]}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Form.Item name={item.key} valuePropName="checked" className="mb-0">
                        <Switch />
                      </Form.Item>
                    ]}
                  >
                    <List.Item.Meta
                      title={item.title}
                      description={item.description}
                    />
                  </List.Item>
                )}
              />
              
              <Form.Item className="mt-4">
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存隐私设置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        {/* 编辑器设置 */}
        <TabPane tab={<span><SettingOutlined />编辑器</span>} key="editor">
          <Card>
            <Form
              layout="vertical"
              onFinish={handleSave}
              initialValues={settings}
            >
              <Row gutter={24}>
                <Col xs={24} sm={12}>
                  <Form.Item name="editorTheme" label="编辑器主题">
                    <Select options={editorThemeOptions} />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item name="fontSize" label="字体大小">
                    <Slider
                      min={12}
                      max={20}
                      marks={{
                        12: '12px',
                        14: '14px',
                        16: '16px',
                        18: '18px',
                        20: '20px',
                      }}
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item name="autoSave" label="自动保存" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item name="autoSaveInterval" label="自动保存间隔（秒）">
                    <InputNumber min={10} max={300} step={10} />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item name="showLineNumbers" label="显示行号" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item name="wordWrap" label="自动换行" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存编辑器设置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        {/* API设置 */}
        <TabPane tab={<span><ApiOutlined />API设置</span>} key="api">
          <Card>
            <Alert
              message="API 密钥安全提示"
              description="请妥善保管您的 API 密钥，不要在公开场所分享。如果怀疑密钥泄露，请立即重置。"
              type="warning"
              showIcon
              className="mb-4"
            />
            
            <div className="space-y-4">
              <div>
                <Text strong>API 密钥</Text>
                <div className="flex items-center mt-2">
                  <Input.Password
                    value={settings.apiKey}
                    readOnly
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    className="flex-1 mr-2"
                  />
                  <Button onClick={handleResetApiKey}>
                    重置密钥
                  </Button>
                </div>
              </div>
              
              <div>
                <Text strong>API 使用情况</Text>
                <div className="mt-2">
                  <Progress
                    percent={(settings.apiUsage / settings.apiQuota) * 100}
                    format={() => `${settings.apiUsage} / ${settings.apiQuota}`}
                  />
                  <Text type="secondary" className="text-sm">
                    本月已使用 {settings.apiUsage} 次，配额 {settings.apiQuota} 次
                  </Text>
                </div>
              </div>
              
              <div>
                <Text strong>API 文档</Text>
                <div className="mt-2">
                  <Button type="link" href="/api-docs" target="_blank">
                    查看 API 文档
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabPane>

        {/* 数据管理 */}
        <TabPane tab={<span><DatabaseOutlined />数据管理</span>} key="data">
          <Card>
            <div className="space-y-6">
              <div>
                <Title level={4}>数据导出</Title>
                <Paragraph type="secondary">
                  导出您的所有数据，包括 Prompt、分类、标签和设置。
                </Paragraph>
                <Button
                  icon={<ExportOutlined />}
                  onClick={() => setExportModalVisible(true)}
                >
                  导出数据
                </Button>
              </div>
              
              <Divider />
              
              <div>
                <Title level={4}>数据导入</Title>
                <Paragraph type="secondary">
                  从备份文件中导入数据。注意：这将覆盖现有数据。
                </Paragraph>
                <Button
                  icon={<ImportOutlined />}
                  onClick={() => setImportModalVisible(true)}
                >
                  导入数据
                </Button>
              </div>
              
              <Divider />
              
              <div>
                <Title level={4} className="text-red-500">
                  危险操作
                </Title>
                <Paragraph type="secondary">
                  删除账户将永久删除您的所有数据，此操作不可恢复。
                </Paragraph>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => setDeleteAccountModalVisible(true)}
                >
                  删除账户
                </Button>
              </div>
            </div>
          </Card>
        </TabPane>
      </Tabs>

      {/* 导出数据模态框 */}
      <Modal
        title="导出数据"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        onOk={handleExportData}
        okText="导出"
        cancelText="取消"
      >
        <div className="space-y-4">
          <Alert
            message="导出内容"
            description="将导出以下数据：私有 Prompt、分类、标签、个人设置"
            type="info"
            showIcon
          />
          <div>
            <Text strong>统计信息：</Text>
            <ul className="mt-2 ml-4">
              <li>Prompt: {prompts.filter(p => !p.isPublic).length} 个</li>
              <li>分类: {categories.length} 个</li>
              <li>标签: {tags.length} 个</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* 导入数据模态框 */}
      <Modal
        title="导入数据"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
      >
        <div className="space-y-4">
          <Alert
            message="注意"
            description="导入数据将覆盖现有的相同类型数据，请确保备份重要数据。"
            type="warning"
            showIcon
          />
          <Upload.Dragger
            accept=".json"
            beforeUpload={handleImportData}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">支持 JSON 格式的备份文件</p>
          </Upload.Dragger>
        </div>
      </Modal>

      {/* 删除账户确认模态框 */}
      <Modal
        title="删除账户"
        open={deleteAccountModalVisible}
        onCancel={() => setDeleteAccountModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDeleteAccountModalVisible(false)}>
            取消
          </Button>,
          <Button key="delete" type="primary" danger onClick={handleDeleteAccount}>
            确认删除
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <Alert
            message="警告：此操作不可恢复"
            description="删除账户将永久删除您的所有数据，包括 Prompt、分类、标签和个人设置。"
            type="error"
            showIcon
          />
          <div>
            <Text strong>删除后将失去：</Text>
            <ul className="mt-2 ml-4">
              <li>所有 Prompt 数据</li>
              <li>分类和标签</li>
              <li>个人设置和偏好</li>
              <li>使用统计和历史记录</li>
            </ul>
          </div>
          <div>
            <Text type="secondary">
              如果您只是想暂停使用，建议先导出数据备份。
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;