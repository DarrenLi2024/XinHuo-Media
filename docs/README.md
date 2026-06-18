# 芯火会务管理系统

面向芯片行业中小微企业的 AI Native 全栈会务管理平台，让会务管理更智能、更高效。

## 核心功能

- **活动管理** — 活动全生命周期管理，从创建到归档
- **智能排座** — 拖拽式交互，AI 辅助自动排座，支持桌位卡打印
- **签到系统** — 扫码签到 / 搜索签到，实时统计，支持 600 人规模
- **大屏抽奖** — 离线运行，炫酷大屏互动，锁定中奖，支持全局与平台打通
- **客户主数据** — 统一管理客户组织与联系人，支持标签与自定义字段
- **供应商管理** — 供应商评价、评分、订单追踪
- **名单管理** — 嘉宾、执行团队、参会人员统一管理与导入导出
- **任务分工** — 活动任务拆解、负责人指派、进度追踪
- **流程台本** — 活动流程分节编排，支持拖拽排序与多格式导出
- **表单回收** — 在线报名表单与赞助商报名表单，收集与导出
- **赞助商管理** — 分层赞助商权益配置、合同与付款跟踪
- **复盘报告** — AI 辅助生成活动复盘报告，数据分析与可视化

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| UI 库 | React 19 |
| 语言 | TypeScript 5 (Strict) |
| 组件 | shadcn/ui (Radix UI) |
| 样式 | Tailwind CSS 4 |
| 状态管理 | Zustand (persist) |
| 数据库 | Supabase (PostgreSQL) |
| 拖拽 | @dnd-kit |
| 动画 | Framer Motion |
| 图表 | Recharts |
| 文件导出 | xlsx, jspdf, jszip, file-saver |

## 快速开始

### 环境要求

- **Node.js** >= 18
- **pnpm** >= 9.0.0（仅允许 pnpm 作为包管理器）

### 环境变量

项目根目录创建 `.env.local` 文件：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 生产环境标识（空或未设置为开发模式）
COZE_PROJECT_ENV=PROD

# 服务端口（默认 3000）
PORT=3000
HOSTNAME=localhost
```

### 安装与启动

```bash
# 安装依赖
pnpm install

# 开发环境启动
pnpm dev

# 生产构建
pnpm build

# 生产环境启动
pnpm start
```

### 验证

```bash
# 类型检查
pnpm ts-check

# 代码规范检查
pnpm lint

# 全量验证（类型检查 + lint）
pnpm validate
```

## 项目结构

```
├── public/                     # 静态资源
├── scripts/                    # 构建与启动脚本
│   ├── build.sh                # 构建脚本
│   ├── dev.sh                  # 开发启动脚本
│   ├── prepare.sh              # 预处理脚本
│   ├── start.sh                # 生产启动脚本
│   └── validate.sh             # 验证脚本
├── docs/                       # 项目文档
├── src/
│   ├── app/                    # Next.js App Router 页面与 API
│   │   ├── (dashboard)/        # 后台管理路由组
│   │   │   ├── page.tsx        # 首页概览
│   │   │   ├── layout.tsx      # 后台布局 (AuthGate + Sidebar + Header)
│   │   │   ├── events/         # 活动管理
│   │   │   ├── customers/      # 客户管理
│   │   │   ├── suppliers/      # 供应商管理
│   │   │   ├── seating/        # 智能排座
│   │   │   ├── lottery/        # 大屏抽奖
│   │   │   ├── scripts/        # 流程台本
│   │   │   ├── forms/          # 表单回收
│   │   │   ├── reports/        # 复盘报告
│   │   │   └── settings/       # 系统设置
│   │   ├── (lottery)/          # 抽奖大屏路由组
│   │   ├── checkin/            # 签到系统（独立模块）
│   │   ├── login/              # 登录页
│   │   ├── forms/              # 表单公开页
│   │   ├── api/                # API Routes
│   │   ├── globals.css         # 全局样式
│   │   └── layout.tsx          # 根布局
│   ├── components/             # 组件库
│   │   ├── ui/                 # shadcn/ui 基础组件
│   │   ├── layout/             # 布局组件 (Sidebar, Header)
│   │   ├── auth/               # 认证组件 (AuthGate)
│   │   ├── seating/            # 排座组件
│   │   └── lottery/            # 抽奖组件
│   ├── hooks/                  # 自定义 Hooks
│   ├── lib/                    # 工具库
│   │   ├── utils.ts            # 通用工具 (cn)
│   │   ├── supabase.ts         # Supabase 客户端
│   │   ├── checkin/            # 签到业务逻辑
│   │   ├── lottery/            # 抽奖业务逻辑
│   │   └── seating/            # 排座业务逻辑
│   ├── store/                  # Zustand 状态管理
│   ├── types/                  # TypeScript 类型定义
│   ├── contexts/               # React Context
│   └── config/                 # 常量配置
├── next.config.ts              # Next.js 配置
├── tsconfig.json               # TypeScript 配置
└── package.json                # 项目依赖
```

## 安全策略

项目配置了严格的 HTTP 安全头：

- **Content-Security-Policy** — 限制脚本、样式、图片来源
- **Strict-Transport-Security** — 强制 HTTPS
- **X-Frame-Options** — 禁止被嵌入 iframe
- **X-Content-Type-Options** — 禁止 MIME 类型嗅探
- **Referrer-Policy** — 控制 Referrer 信息
- **Permissions-Policy** — 禁用相机、麦克风、地理位置

## 许可与版权

芯火传媒 © 2025-2026
