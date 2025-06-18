/**
 * Prompt详情页面
 * 显示单个Prompt的详细信息，支持编辑、使用、收藏等操作
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Tag,
  Rate,
  Divider,
  message,
  Modal,
  Input,
  List,
  Tooltip,
  Spin,
  Empty,
  Row,
  Col,
  Statistic,
  Timeline,
  Tabs,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  HistoryOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  TagOutlined,
  FolderOutlined,
  StarOutlined,
  DownloadOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { usePromptStore } from '../store/promptStore';
import type { Prompt } from '../store/promptStore';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { confirm } = Modal;
const { TabPane } = Tabs;

interface PromptVersion {
  id: number;
  version: string;
  content: string;
  changeLog: string;
  createdAt: string;
}

const PromptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentPrompt,
    fetchPromptById,
    deletePrompt,
    toggleFavorite,
    ratePrompt,
    recordUsage,
    isLoading,
    error,
  } = usePromptStore();

  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [variables, setVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [processedContent, setProcessedContent] = useState('');

  useEffect(() => {
    if (id) {
      loadPromptDetail(parseInt(id));
    }
  }, [id]);

  useEffect(() => {
    if (currentPrompt) {
      extractVariables();
      setProcessedContent(currentPrompt.content);
    }
  }, [currentPrompt]);

  const loadPromptDetail = async (promptId: number) => {
    try {
      await fetchPromptById(promptId);
    } catch (error) {
      message.error('加载Prompt详情失败');
    }
  };

  const extractVariables = () => {
    if (!currentPrompt?.content) return;
    
    const matches = currentPrompt.content.match(/\{\{([^}]+)\}\}/g);
    if (matches) {
      const vars = matches.map(match => match.slice(2, -2).trim());
      const uniqueVars = [...new Set(vars)];
      setVariables(uniqueVars);
      
      // 初始化变量值
      const initialValues: Record<string, string> = {};
      uniqueVars.forEach(variable => {
        initialValues[variable] = '';
      });
      setVariableValues(initialValues);
    } else {
      setVariables([]);
      setVariableValues({});
    }
  };

  const processContent = () => {
    if (!currentPrompt) return '';
    
    let content = currentPrompt.content;
    Object.entries(variableValues).forEach(([variable, value]) => {
      if (value.trim()) {
        content = content.replace(
          new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, 'g'),
          value
        );
      }
    });
    return content;
  };

  const handleUse = async () => {
    if (!currentPrompt) return;
    
    try {
      const content = processContent();
      await navigator.clipboard.writeText(content);
      await recordUsage(currentPrompt.id);
      message.success('Prompt已复制到剪贴板并记录使用');
      // 重新加载以更新使用次数
      loadPromptDetail(currentPrompt.id);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = () => {
    if (!currentPrompt) return;
    
    confirm({
      title: '确认删除',
      content: '确定要删除这个Prompt吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deletePrompt(currentPrompt.id);
          message.success('删除成功');
          navigate('/prompts');
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleToggleFavorite = async () => {
    if (!currentPrompt) return;
    
    try {
      await toggleFavorite(currentPrompt.id);
      message.success('操作成功');
      loadPromptDetail(currentPrompt.id);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleRate = async (rating: number) => {
    if (!currentPrompt) return;
    
    try {
      await ratePrompt(currentPrompt.id, rating);
      message.success('评分成功');
      setRatingModalVisible(false);
      loadPromptDetail(currentPrompt.id);
    } catch (error) {
      message.error('评分失败');
    }
  };

  const handleShare = async () => {
    if (!currentPrompt) return;
    
    try {
      const shareUrl = `${window.location.origin}/prompts/${currentPrompt.id}`;
      await navigator.clipboard.writeText(shareUrl);
      message.success('分享链接已复制到剪贴板');
      setShareModalVisible(false);
    } catch (error) {
      message.error('复制失败');
    }
  };

  const handleExport = async () => {
    if (!currentPrompt) return;
    
    const exportData = {
      title: currentPrompt.title,
      content: currentPrompt.content,
      description: currentPrompt.description,
      category: currentPrompt.category?.name,
      tags: currentPrompt.tags?.map(tag => tag.name),
      variables,
      createdAt: currentPrompt.createdAt,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPrompt.title}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('导出成功');
  };

  const loadVersions = async () => {
    if (!currentPrompt) return;
    
    try {
      setLoadingVersions(true);
      // 这里应该调用API获取版本历史
      // const versions = await promptApi.getPromptVersions(currentPrompt.id);
      // setVersions(versions);
      
      // 模拟数据
      setVersions([
        {
          id: 1,
          version: 'v1.0',
          content: currentPrompt.content,
          changeLog: '初始版本',
          createdAt: currentPrompt.createdAt,
        },
      ]);
    } catch (error) {
      message.error('加载版本历史失败');
    } finally {
      setLoadingVersions(false);
    }
  };

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
      {/* 返回按钮 */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/prompts')}
        className="mb-4"
      >
        返回列表
      </Button>

      <Row gutter={24}>
        {/* 主内容区 */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex justify-between items-start">
                <div>
                  <Title level={3} className="mb-2">
                    {currentPrompt.title}
                  </Title>
                  {currentPrompt.description && (
                    <Text type="secondary">{currentPrompt.description}</Text>
                  )}
                </div>
                <Space>
                  <Tooltip title={currentPrompt.isFavorite ? '取消收藏' : '添加收藏'}>
                    <Button
                      type="text"
                      icon={
                        currentPrompt.isFavorite ? (
                          <HeartFilled className="text-red-500" />
                        ) : (
                          <HeartOutlined />
                        )
                      }
                      onClick={handleToggleFavorite}
                    />
                  </Tooltip>
                  <Button
                    icon={<ShareAltOutlined />}
                    onClick={() => setShareModalVisible(true)}
                  >
                    分享
                  </Button>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/prompts/${currentPrompt.id}/edit`)}
                  >
                    编辑
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDelete}
                  >
                    删除
                  </Button>
                </Space>
              </div>
            }
          >
            <Tabs defaultActiveKey="content">
              <TabPane tab="内容" key="content">
                <div className="space-y-4">
                  {/* 原始内容 */}
                  <div>
                    <Title level={5}>原始内容</Title>
                    <div className="bg-gray-50 p-4 rounded border">
                      <pre className="whitespace-pre-wrap font-sans text-sm">
                        {currentPrompt.content}
                      </pre>
                    </div>
                  </div>

                  {/* 变量设置 */}
                  {variables.length > 0 && (
                    <div>
                      <Title level={5}>变量设置</Title>
                      <div className="space-y-3">
                        {variables.map((variable) => (
                          <div key={variable}>
                            <Text strong className="block mb-1">
                              {variable}
                            </Text>
                            <Input
                              placeholder={`输入 ${variable} 的值`}
                              value={variableValues[variable] || ''}
                              onChange={(e) =>
                                setVariableValues({
                                  ...variableValues,
                                  [variable]: e.target.value,
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 处理后的内容 */}
                  {variables.length > 0 && (
                    <div>
                      <Title level={5}>预览内容</Title>
                      <div className="bg-blue-50 p-4 rounded border border-blue-200">
                        <pre className="whitespace-pre-wrap font-sans text-sm">
                          {processContent()}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* 使用按钮 */}
                  <div className="flex justify-center">
                    <Button
                      type="primary"
                      size="large"
                      icon={<CopyOutlined />}
                      onClick={handleUse}
                    >
                      使用此Prompt
                    </Button>
                  </div>
                </div>
              </TabPane>

              <TabPane tab="版本历史" key="versions">
                <div>
                  {versions.length === 0 && !loadingVersions && (
                    <div className="text-center py-8">
                      <Button onClick={loadVersions}>加载版本历史</Button>
                    </div>
                  )}
                  
                  <Spin spinning={loadingVersions}>
                    {versions.length > 0 && (
                      <Timeline>
                        {versions.map((version) => (
                          <Timeline.Item key={version.id}>
                            <div>
                              <Text strong>{version.version}</Text>
                              <Text type="secondary" className="ml-2">
                                {new Date(version.createdAt).toLocaleString()}
                              </Text>
                              <div className="mt-2">
                                <Text>{version.changeLog}</Text>
                              </div>
                            </div>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    )}
                  </Spin>
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        {/* 侧边栏 */}
        <Col xs={24} lg={8}>
          {/* 统计信息 */}
          <Card title="统计信息" className="mb-4">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="使用次数"
                  value={currentPrompt.usageCount || 0}
                  prefix={<EyeOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="评分"
                  value={currentPrompt.rating || 0}
                  precision={1}
                  prefix={<StarOutlined />}
                  suffix="/ 5"
                />
              </Col>
            </Row>
            
            <Divider />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text type="secondary">创建时间：</Text>
                <Text>{new Date(currentPrompt.createdAt).toLocaleDateString()}</Text>
              </div>
              {currentPrompt.updatedAt && (
                <div className="flex justify-between">
                  <Text type="secondary">更新时间：</Text>
                  <Text>{new Date(currentPrompt.updatedAt).toLocaleDateString()}</Text>
                </div>
              )}
            </div>
          </Card>

          {/* 分类和标签 */}
          <Card title="分类和标签" className="mb-4">
            <div className="space-y-3">
              {currentPrompt.category && (
                <div>
                  <Text type="secondary" className="block mb-1">
                    <FolderOutlined /> 分类
                  </Text>
                  <Tag color="blue">{currentPrompt.category.name}</Tag>
                </div>
              )}
              
              {currentPrompt.tags && currentPrompt.tags.length > 0 && (
                <div>
                  <Text type="secondary" className="block mb-1">
                    <TagOutlined /> 标签
                  </Text>
                  <div>
                    {currentPrompt.tags.map((tag) => (
                      <Tag key={tag.id} className="mb-1">
                        {tag.name}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* 操作按钮 */}
          <Card title="操作">
            <Space direction="vertical" className="w-full">
              <Button
                block
                icon={<StarOutlined />}
                onClick={() => setRatingModalVisible(true)}
              >
                评分
              </Button>
              <Button
                block
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                导出
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 评分模态框 */}
      <Modal
        title="为此Prompt评分"
        open={ratingModalVisible}
        onCancel={() => setRatingModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setRatingModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => handleRate(userRating)}
            disabled={userRating === 0}
          >
            提交评分
          </Button>,
        ]}
      >
        <div className="text-center py-4">
          <Rate
            value={userRating}
            onChange={setUserRating}
            style={{ fontSize: 32 }}
          />
          <div className="mt-2">
            <Text type="secondary">
              {userRating === 0 && '请选择评分'}
              {userRating === 1 && '很差'}
              {userRating === 2 && '较差'}
              {userRating === 3 && '一般'}
              {userRating === 4 && '良好'}
              {userRating === 5 && '优秀'}
            </Text>
          </div>
        </div>
      </Modal>

      {/* 分享模态框 */}
      <Modal
        title="分享Prompt"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setShareModalVisible(false)}>
            取消
          </Button>,
          <Button key="copy" type="primary" onClick={handleShare}>
            复制链接
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div>
            <Text strong>分享链接：</Text>
            <Input.Group compact className="mt-2">
              <Input
                value={`${window.location.origin}/prompts/${currentPrompt.id}`}
                readOnly
                style={{ width: 'calc(100% - 80px)' }}
              />
              <Button onClick={handleShare}>复制</Button>
            </Input.Group>
          </div>
          
          <div>
            <Text type="secondary">
              通过此链接，其他人可以查看这个Prompt的详细信息。
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PromptDetail;