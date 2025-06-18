/**
 * Prompt Manager 后端服务主入口文件
 * 启动Express服务器，配置中间件和路由
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// 导入路由
import promptRoutes from './routes/prompts';
import categoryRoutes from './routes/categories';
import tagRoutes from './routes/tags';
import searchRoutes from './routes/search';
import statsRoutes from './routes/stats';

// 导入中间件
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3001;

// 初始化Prisma客户端
export const prisma = new PrismaClient();

// 中间件配置
app.use(helmet()); // 安全头
app.use(cors()); // 跨域支持
app.use(compression()); // 响应压缩
app.use(morgan('combined')); // 请求日志
app.use(express.json({ limit: '10mb' })); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析

// 根路径 - API信息
app.get('/', (req, res) => {
  res.json({
    name: 'Prompt Manager API',
    version: process.env.npm_package_version || '1.0.0',
    description: 'Prompt管理系统后端API服务',
    endpoints: {
      health: '/health',
      prompts: '/api/prompts',
      categories: '/api/categories',
      tags: '/api/tags',
      search: '/api/search',
      stats: '/api/stats'
    },
    timestamp: new Date().toISOString()
  });
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API路由
app.use('/api/prompts', promptRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/stats', statsRoutes);

// 错误处理中间件
app.use(notFound);
app.use(errorHandler);

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`🚀 Prompt Manager API服务器已启动`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
  console.log(`📚 API文档: http://localhost:${PORT}/api`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('🔄 收到SIGTERM信号，正在关闭服务器...');
  
  server.close(async () => {
    console.log('📴 HTTP服务器已关闭');
    
    // 关闭数据库连接
    await prisma.$disconnect();
    console.log('🔌 数据库连接已关闭');
    
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🔄 收到SIGINT信号，正在关闭服务器...');
  
  server.close(async () => {
    console.log('📴 HTTP服务器已关闭');
    
    // 关闭数据库连接
    await prisma.$disconnect();
    console.log('🔌 数据库连接已关闭');
    
    process.exit(0);
  });
});

export default app;