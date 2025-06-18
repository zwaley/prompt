# Prompt Manager - AI提示词管理器

## 项目背景

随着AI应用的普及，高质量的prompt（提示词）变得越来越重要。开发者和用户经常需要收集、整理和复用各种优秀的prompt，但缺乏一个有效的管理工具。本项目旨在创建一个功能完善的prompt管理器，帮助用户高效地收集、分类、搜索和使用prompt。

## 项目目标

### 核心功能
1. **Prompt收集与存储**：支持手动添加和批量导入prompt
2. **智能分类管理**：支持标签、分类、优先级等多维度管理
3. **高效搜索功能**：支持关键词搜索、标签筛选、模糊匹配
4. **使用统计分析**：记录使用频率，推荐热门prompt
5. **导入导出功能**：支持多种格式的数据交换
6. **版本管理**：支持prompt的版本控制和历史记录

### 扩展功能
1. **AI辅助优化**：集成AI模型对prompt进行质量评估和优化建议
2. **协作分享**：支持团队协作和prompt分享
3. **模板系统**：提供常用prompt模板
4. **性能评估**：记录prompt在不同AI模型上的表现

## 技术架构

### 前端技术栈
- **框架**：React 18 + TypeScript
- **UI组件库**：Ant Design
- **状态管理**：Zustand
- **路由**：React Router v6
- **样式**：Tailwind CSS
- **构建工具**：Vite

### 后端技术栈
- **运行时**：Node.js
- **框架**：Express.js + TypeScript
- **数据库**：SQLite（本地存储）+ Prisma ORM
- **搜索引擎**：内置全文搜索 + Fuse.js（模糊搜索）
- **文件处理**：支持JSON、CSV、Markdown格式

### 数据库设计

```sql
-- Prompts表
CREATE TABLE prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    priority INTEGER DEFAULT 0,
    use_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 分类表
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#1890ff',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 标签表
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#87d068'
);

-- Prompt标签关联表
CREATE TABLE prompt_tags (
    prompt_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (prompt_id, tag_id),
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 使用历史表
CREATE TABLE usage_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id INTEGER,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    context TEXT,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);
```

## 项目结构

```
prompt-manager/
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── components/       # 可复用组件
│   │   ├── pages/           # 页面组件
│   │   ├── hooks/           # 自定义hooks
│   │   ├── store/           # 状态管理
│   │   ├── utils/           # 工具函数
│   │   ├── types/           # TypeScript类型定义
│   │   └── api/             # API调用
│   ├── public/
│   └── package.json
├── backend/                  # 后端API
│   ├── src/
│   │   ├── routes/          # 路由定义
│   │   ├── controllers/     # 控制器
│   │   ├── models/          # 数据模型
│   │   ├── middleware/      # 中间件
│   │   ├── utils/           # 工具函数
│   │   └── database/        # 数据库配置
│   ├── prisma/              # Prisma配置
│   └── package.json
├── shared/                   # 共享类型和工具
├── docs/                     # 文档
└── README.md
```

## 核心功能实现方案

### 1. 搜索功能
- **全文搜索**：使用SQLite的FTS5扩展进行全文搜索
- **模糊搜索**：使用Fuse.js实现智能模糊匹配
- **高级筛选**：支持按分类、标签、时间范围、使用频率等筛选
- **搜索建议**：基于历史搜索和热门关键词提供搜索建议

### 2. 数据管理
- **批量导入**：支持从JSON、CSV、Markdown文件批量导入
- **数据导出**：支持导出为多种格式，便于备份和迁移
- **数据同步**：支持云端同步（可选功能）

### 3. 用户体验
- **快捷操作**：支持键盘快捷键
- **拖拽排序**：支持prompt的拖拽重排
- **预览功能**：实时预览prompt效果
- **收藏夹**：支持创建个人收藏夹

## 开发计划

### 第一阶段：基础功能（1-2周）
1. 项目初始化和环境搭建
2. 数据库设计和基础API开发
3. 前端基础界面和组件开发
4. 基本的CRUD功能实现

### 第二阶段：核心功能（2-3周）
1. 搜索功能实现
2. 分类和标签管理
3. 导入导出功能
4. 使用统计和分析

### 第三阶段：优化和扩展（1-2周）
1. 性能优化
2. 用户体验改进
3. 高级功能实现
4. 测试和文档完善

## 技术特色

1. **本地优先**：数据存储在本地，保护隐私
2. **响应式设计**：适配各种屏幕尺寸
3. **离线可用**：核心功能支持离线使用
4. **扩展性强**：模块化设计，易于扩展新功能
5. **类型安全**：全面使用TypeScript，减少运行时错误

## 安装和使用

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装步骤
```bash
# 克隆项目
git clone <repository-url>
cd prompt-manager

# 安装依赖
npm install

# 初始化数据库
npm run db:init

# 启动开发服务器
npm run dev
```

### 使用说明
1. 打开浏览器访问 http://localhost:3000
2. 点击"添加Prompt"开始创建你的第一个prompt
3. 使用搜索框快速查找需要的prompt
4. 通过分类和标签组织你的prompt库

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目。在贡献代码前，请确保：

1. 代码符合项目的编码规范
2. 添加必要的测试用例
3. 更新相关文档

## 许可证

MIT License

---

**注意**：这是一个活跃开发中的项目，功能和API可能会发生变化。建议定期查看更新日志。