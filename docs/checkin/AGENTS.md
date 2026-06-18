# AGENTS.md - 项目概览

## 项目简介

**项目名称**：企业级活动签到管理系统
**项目类型**：Next.js 16 全栈应用（前后端分离）
**核心功能**：600人活动签到、扫码/手动签到、胸牌打印、管理后台、实时统计、数据备份

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 16.1.1 |
| 前端 | React | 19.2.3 |
| 语言 | TypeScript | 5.x |
| 样式 | Tailwind CSS | 4.x |
| UI组件 | shadcn/ui (Radix UI) | latest |
| 数据库 | Supabase (PostgreSQL) | 2.95.3 |
| 热敏打印 | ESC/POS Encoder | 3.0.0 |
| Excel导出 | xlsx | 0.18.5 |
| 长图导出 | html2canvas | 1.4.1 |

## 目录结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由（后端）
│   │   ├── auth/          # 认证相关（登录、登出、改密）
│   │   ├── backup/        # 数据备份（导入/导出JSON）
│   │   ├── check-in/      # 签到操作
│   │   ├── export/        # 数据导出（XLSX、配置）
│   │   ├── guests/        # 嘉宾管理（CRUD、批量操作）
│   │   ├── import/        # 数据导入
│   │   ├── logs/          # 签到日志
│   │   ├── print-*/       # 打印相关
│   │   ├── qrcode/        # 二维码生成
│   │   ├── stats/         # 统计数据
│   │   ├── templates/     # 打印模板
│   │   └── users/         # 用户管理
│   ├── admin/             # 管理后台页面
│   ├── checkin/           # 签到页面（核心页面）
│   ├── login/             # 登录页面
│   ├── stats/             # 统计看板页面
│   └── layout.tsx         # 全局布局
│
├── components/            # UI组件
│   ├── ui/               # shadcn/ui 基础组件
│   ├── TemplateEditor.tsx # 打印模板编辑器
│   ├── TemplateManager.tsx # 模板管理
│   ├── TemplateSelector.tsx # 模板选择器
│   └── UsersPage.tsx     # 用户管理组件
│
├── contexts/             # React Context
│   └── AuthContext.tsx   # 认证上下文
│
├── hooks/                # 自定义 Hooks
│   └── use-mobile.ts     # 移动端检测
│
├── lib/                  # 工具库
│   ├── auth-fetch.ts     # 认证相关的 fetch 封装
│   ├── auth-utils.ts     # 权限验证工具
│   ├── escpos-printer.ts # ESC/POS 打印封装
│   └── session.ts        # Session 管理
│
├── storage/database/     # 数据库层
│   ├── db.ts            # 数据库操作封装
│   ├── supabase-client.ts # Supabase 客户端
│   └── shared/schema.ts  # 数据表结构定义
│
└── types/                # 类型定义
    └── template.ts       # 模板类型
```

## 构建和运行命令

```bash
# 安装依赖（必须使用 pnpm）
pnpm install

# 开发模式
pnpm run dev

# 类型检查
pnpm ts-check

# 代码检查
pnpm lint

# 构建
pnpm run build

# 生产运行
pnpm run start
```

## 代码风格指南

### 1. 文件命名
- 组件文件：PascalCase（如 `UsersPage.tsx`）
- 工具文件：kebab-case（如 `auth-fetch.ts`）
- API路由：目录式（如 `api/guests/route.ts`）

### 2. TypeScript 规范
- 所有函数参数必须有类型标注
- 禁止隐式 `any`
- 使用 `interface` 定义对象类型
- API响应格式统一：`{ success: boolean; data?: T; error?: string }`

### 3. API 路由规范
- GET：查询操作
- POST：创建/执行操作
- PUT/PATCH：更新操作
- DELETE：删除操作
- 所有接口必须验证权限（使用 `requirePermission`）

### 4. 前端组件规范
- 使用 `'use client'` 标记客户端组件
- 状态管理使用 `useState`，复杂状态可用 Context
- 样式优先使用 Tailwind CSS 类名
- 避免在 JSX 中直接使用 `typeof window`、`Date.now()` 等（防止 Hydration 错误）

### 5. 颜色使用规范（关键）
**html2canvas 不支持 Tailwind CSS v4 的 `lab()` 颜色函数**

- 导出长图时必须使用**内联样式 + 十六进制颜色值**
- 禁止在导出长图的组件中使用 Tailwind 类名
- 颜色常量定义示例：
```typescript
const COLORS = {
  blue: '#3B82F6',
  green: '#10B981',
  orange: '#F59E0B',
  // ... 其他颜色
};
```

## 权限系统

### 三级权限设计

| 角色 | 权限范围 |
|------|---------|
| super_admin | 全部权限，包括用户管理 |
| admin | 嘉宾管理、模版设计、统计查看（无用户管理） |
| checker | 只能签到、查看统计 |

### 权限类型

```typescript
type Permission = 
  | 'guests:read'    | 'guests:create'    | 'guests:update'    | 'guests:delete'
  | 'guests:import'  | 'guests:export'    | 'guests:clear'
  | 'settings:read'  | 'settings:update'
  | 'template:read'  | 'template:update'
  | 'stats:read'
  | 'users:read'     | 'users:create'     | 'users:update'     | 'users:delete'
  | 'checkin:perform' | 'checkin:clear';
```

## 关键实现要点

### 1. 全局扫码监听
- 使用 `window.addEventListener('keydown')` 监听扫码枪输入
- 扫码枪输入特征：快速连续字符 + 结尾 Enter
- 使用缓冲区和超时机制处理扫码

### 2. 打印配置存储
- 打印配置存储在 `localStorage`（key: `eventSettings`）
- 各终端独立配置，不影响其他终端
- 配置项：打印机类型、纸张宽度、打印密度等

### 3. 签到并发处理
- 使用原子操作防止并发竞态
- 签到时检查 `check_in_status === 0` 条件
- 已签到嘉宾返回错误提示

### 4. 数据导出
- XLSX导出：文件名使用纯英文（避免 ByteString 编码错误）
- JSON导出：完整数据备份（嘉宾、日志、统计、配置）
- 长图导出：使用移动端视图 + 内联样式

## 常见问题修复

### 问题1：导出XLSX中文文件名错误
**原因**：HTTP Header 的 ByteString 不支持中文字符
**解决**：使用纯英文文件名 `checkin_data_YYYY-MM-DD.xlsx`

### 问题2：导出长图 lab() 颜色函数错误
**原因**：html2canvas 不支持 CSS `lab()`/`oklch()` 颜色函数
**解决**：
1. 统计页面使用内联样式 + 十六进制颜色值
2. 在 `onclone` 中移除外部样式表
3. 遍历元素将非标准颜色转换为十六进制

### 问题3：Hydration 错误
**原因**：服务端和客户端渲染不一致
**解决**：
- 使用 `'use client'` + `useEffect` + `useState` 处理动态内容
- 禁止在 JSX 中直接使用 `typeof window`、`Date.now()` 等

## 环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `COZE_WORKSPACE_PATH` | 工作目录 | `/workspace/projects` |
| `COZE_PROJECT_DOMAIN_DEFAULT` | 访问域名 | `https://xxx.dev.coze.site` |
| `DEPLOY_RUN_PORT` | 服务端口 | `5000` |
| `COZE_PROJECT_ENV` | 环境 | `DEV` / `PROD` |

## 数据库连接

使用 Supabase 云端数据库：
- 配置文件：`src/storage/database/supabase-client.ts`
- 支持：多终端并发、实时同步、数据持久化
- 注意：生产环境需要配置 Supabase 项目 URL 和 Anon Key