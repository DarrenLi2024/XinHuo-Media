# 部署指南

## 构建流程

### 构建命令

```bash
pnpm build
```

构建过程由 `scripts/build.sh` 脚本编排，执行以下步骤：

1. **安装依赖** — `pnpm install --prefer-frozen-lockfile --prefer-offline`
2. **Next.js 构建** — `pnpm next build`
3. **服务端打包** — `pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting`

构建产物：
```
.next/          # Next.js 构建产物
dist/
└── server.js   # tsup 打包的自定义服务端入口 (CommonJS)
```

### 验证构建

```bash
pnpm validate
```

运行 TypeScript 类型检查和 ESLint 代码检查。

## 生产环境启动

### 启动命令

```bash
pnpm start
```

启动脚本 `scripts/start.sh` 执行：

```bash
cd ${COZE_WORKSPACE_PATH}
PORT=${DEPLOY_RUN_PORT:-3000} node dist/server.js
```

### 服务端入口 (`src/server.ts`)

项目使用自定义 HTTP 服务器而非 Next.js 默认启动方式：

```typescript
import { createServer } from 'http';
import next from 'next';

const app = next({ dev: false, hostname, port });
// ... createServer → app.getRequestHandler()
```

**注意事项：**
- 通过 `COZE_PROJECT_ENV=PROD` 环境变量区分生产/开发模式
- 服务端口通过 `PORT` 或 `DEPLOY_RUN_PORT` 环境变量指定（默认 3000）

## 环境变量配置

生产环境必须配置以下环境变量：

```bash
# 必填 - 生产模式标识
COZE_PROJECT_ENV=PROD

# 必填 - Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 可选 - 服务配置
PORT=3000
HOSTNAME=0.0.0.0
```

### 环境变量说明

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `COZE_PROJECT_ENV` | 生产必填 | 空(开发) | `PROD` 时为生产模式 |
| `NEXT_PUBLIC_SUPABASE_URL` | 是 | — | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 是 | — | Supabase 匿名密钥（公开） |
| `SUPABASE_SERVICE_ROLE_KEY` | 生产必填 | — | Supabase 服务角色密钥（私密） |
| `PORT` | 否 | `3000` | 服务端口 |
| `DEPLOY_RUN_PORT` | 否 | 继承 `PORT` | 部署平台注入的端口 |
| `HOSTNAME` | 否 | `localhost` | 服务主机名 |
| `COZE_WORKSPACE_PATH` | 否 | `pwd` | 工作目录路径 |

## Supabase 数据库设置

### 必要的数据库表

在生产环境中，以下表需要在 Supabase 项目中预先创建：

```
users              — 用户表
user_sessions      — 用户会话
audit_logs         — 审计日志
events             — 活动
event_members      — 活动成员
event_customers    — 活动关联客户
event_tasks        — 活动任务（关联 events）
tasks              — 任务
task_comments      — 任务评论
guests             — 嘉宾
customers          — 客户
customer_contacts  — 客户联系人
venues             — 场地
seats              — 座位
scripts            — 流程台本
script_segments    — 台本段落
check_ins          — 签到记录
check_in_records   — 签到记录（详细）
prizes             — 奖品
lottery_records    — 抽奖记录
reports            — 复盘报告
suppliers          — 供应商
supplier_contacts  — 供应商联系人
supplier_reviews   — 供应商评价
material_orders    — 物料订单
forms              — 表单模板
form_submissions   — 表单提交记录
```

### Row Level Security (RLS)

建议为所有表启用 RLS，并配置以下策略：

- **users** 表 — 用户只能读取自己的记录
- **events** 表 — 基于 `owner_id` 和 `event_members` 表的访问控制
- **guests** 表 — 基于关联活动的访问控制
- 其余表类似，通过与 `event_id` 或 `owner_id` 关联控制访问

### 认证设置

Supabase 项目中需要启用 Email/Password 认证方式。

## 部署平台

### 通用部署

项目支持部署到任何支持 Node.js 20+ 的平台：

1. 确保 Node.js 20+ 运行环境
2. 配置环境变量（见上文）
3. 运行 `pnpm build`
4. 运行 `pnpm start`

### 安全头配置

项目已配置以下 HTTP 安全头（`next.config.ts`）：

| Header | Value |
|--------|-------|
| `X-DNS-Prefetch-Control` | `on` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` |
| `Content-Security-Policy` | 限制脚本/样式/图片来源和 API 连接 |

### 图片域名

如需允许外部图片加载，在 `next.config.ts` 中配置 `images.remotePatterns`：

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
      pathname: '/**',
    },
    // 添加你的 CDN 域名
  ],
},
```

### 开发域名白名单

如果使用类似 `*.dev.coze.site` 的开发代理域名：

```typescript
allowedDevOrigins: ['*.dev.coze.site'],
```

## 健康检查

部署后可访问以下端点验证服务状态：

```bash
# 服务首页
curl http://localhost:3000/

# 登录 API
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@xinhuo.com","password":"demo123"}'

# 活动列表 API（需先登录获取 Cookie）
curl http://localhost:3000/api/events
```

## 常见问题

### 启动后提示 "Supabase 环境变量未配置"

确保 `.env.local`（本地）或环境变量（生产）中设置了 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。如无需 Supabase，系统将自动降级为 Demo 模式。

### 生产环境登录失败

1. 确认 Supabase 项目已创建 `users` 表
2. 确认 Email/Password 认证已在 Supabase 项目中启用
3. 确认 `SUPABASE_SERVICE_ROLE_KEY` 已正确配置

### 端口占用

开发脚本 `dev.sh` 会自动清理端口占用。生产环境需自行确保端口可用：

```bash
# 检查端口占用
lsof -i :3000

# 强制清理
kill -9 $(lsof -ti :3000)
```
