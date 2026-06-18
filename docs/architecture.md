# 系统架构

## 整体架构概览

芯火会务管理系统采用 **Next.js 16 App Router** 全栈架构，前端使用 React 19 + shadcn/ui，后端 API 通过 Next.js Route Handlers 实现，数据存储在 Supabase (PostgreSQL)。

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端 (Browser)                       │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────┐ │
│  │ Dashboard │  │  Checkin   │  │ Lottery  │  │  Forms     │ │
│  │  (管理后台) │  │  (签到系统) │  │  (抽奖系统) │  │  (公开表单) │ │
│  └─────┬─────┘  └─────┬─────┘  └────┬─────┘  └─────┬─────┘ │
│        │              │              │              │        │
│  ┌─────┴──────────────┴──────────────┴──────────────┴─────┐ │
│  │                  Zustand Store (持久化)                   │ │
│  │  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌─────────────┐  │ │
│  │  │ useUser  │ │useEvent  │ │useTask  │ │ useUIStore  │  │ │
│  │  │  Store   │ │  Store   │ │ Store   │ │             │  │ │
│  │  └──────────┘ └──────────┘ └────────┘ └─────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                                │
│  ┌───────────────────────────┴───────────────────────────┐  │
│  │              IndexedDB (离线存储)                        │  │
│  │  ┌──────────────┐  ┌──────────────────────────────┐   │  │
│  │  │ 签到本地数据   │  │ 抽奖数据 (参会人/奖品/记录)   │   │  │
│  │  │ (local-store) │  │ (lottery/db)                 │   │  │
│  │  └──────────────┘  └──────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP / fetch()
┌─────────────────────────────┴───────────────────────────────┐
│                      服务端 (Node.js)                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  server.ts (自定义入口)                  │  │
│  │              http.createServer → next()                │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Next.js Route Handlers (API Routes)       │  │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌───────────┐  │  │
│  │  │ /api/   │ │ /api/    │ │ /api/   │ │ /api/     │  │  │
│  │  │ auth/*  │ │ events/* │ │checkin/*│ │lottery/*  │  │  │
│  │  └─────────┘ └──────────┘ └─────────┘ └───────────┘  │  │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌───────────┐  │  │
│  │  │ /api/   │ │ /api/    │ │ /api/   │ │ /api/     │  │  │
│  │  │seating/*│ │customers/│ │suppliers│ │reports/*  │  │  │
│  │  └─────────┘ └──────────┘ └─────────┘ └───────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                                │
│  ┌───────────────────────────┴───────────────────────────┐  │
│  │         Supabase Client (createServerClient)            │  │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │ Supabase SDK
┌─────────────────────────────┴───────────────────────────────┐
│                   Supabase (PostgreSQL)                       │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐        │
│  │  users  │ │  events  │ │ guests  │ │  tasks   │        │
│  ├─────────┤ ├──────────┤ ├─────────┤ ├──────────┤        │
│  │  seats  │ │  prizes  │ │ reports │ │suppliers │        │
│  ├─────────┤ ├──────────┤ ├─────────┤ ├──────────┤        │
│  │ scripts │ │check_ins │ │ venues  │ │  forms   │        │
│  └─────────┘ └──────────┘ └─────────┘ └──────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 路由设计

项目采用 Next.js App Router 文件系统路由，使用 Route Groups 组织页面：

### 路由分组

| 路由组 | 路径前缀 | 用途 | 认证 |
|--------|---------|------|------|
| `(dashboard)` | `/` | 管理后台 | AuthGate 强制登录 |
| `(lottery)` | `/lottery` | 抽奖大屏 | 独立布局，无侧边栏 |
| 无分组 | `/login` | 登录页面 | 公开 |
| 无分组 | `/checkin` | 签到系统 | 独立模块 |
| 无分组 | `/forms` | 公开表单 | 公开 |

### 页面路由树

```
/                               → 首页概览
/login                          → 登录页面
/events                         → 活动列表
/events/new                     → 创建活动
/events/[id]                    → 活动详情
/events/[id]/sponsors           → 活动赞助商
/events/[id]/roster             → 活动名单
/events/tasks                   → 任务分工
/events/sponsors                → 赞助商管理
/events/roster                  → 名单管理
/customers                      → 客户列表
/customers/[id]                 → 客户详情
/suppliers                      → 供应商管理
/seating                        → 智能排座
/seating/layout                 → 场地图编辑
/scripts                        → 流程台本
/forms                          → 表单管理
/forms/submissions              → 表单提交记录
/forms/[id]                     → 公开表单
/reports                        → 复盘报告
/settings                       → 系统设置
/checkin                        → 签到首页
/checkin/entry                  → 签到入口
/checkin/admin                  → 签到管理后台
/lottery                        → 抽奖总览
/lottery/attendees              → 参会人员
/lottery/prizes                 → 奖项管理
/lottery/locked-winners         → 锁定中奖
/lottery/draw-records           → 抽奖记录
/lottery/event-info             → 活动信息
/lottery/settings               → 抽奖设置
/lottery/dashboard              → 抽奖看板
/screen                         → 大屏抽奖画面
```

## 数据流向

### 管理后台数据流 (Dashboard)

```
用户操作 → Zustand Store → fetch() API → Route Handler → Supabase → PostgreSQL
               │                                                    │
               └──────────────── 响应 ← JSON ───────────────────────┘
```

### 签到系统数据流 (Checkin)

```
签到终端 → IndexedDB (本地存储) → fetch() → /api/checkin/* → Supabase
    │         ↕ 双向同步
    └── 离线可用，在线自动同步
```

### 抽奖系统数据流 (Lottery)

```
管理后台 → IndexedDB (离线数据库) → 大屏画面监听 (BroadcastChannel)
    │              │
    └── 抽奖引擎 ──┘
    
从平台活动导入嘉宾: /api/lottery → 写入 IndexedDB → 广播变化
```

## 状态管理

项目使用 Zustand 进行客户端状态管理，所有 Store 均通过 `persist` 中间件持久化到 `localStorage`：

| Store | 用途 | 持久化 Key |
|-------|------|-----------|
| `useUserStore` | 当前登录用户 | `user-storage` |
| `useEventStore` | 活动列表与当前活动 | `event-storage` |
| `useTaskStore` | 任务列表 | `task-storage` |
| `useUIStore` | 侧边栏折叠、主题 | `ui-storage` |
| `useActivityStore` | 排座活动数据 | 专用 persist |
| `useLayoutStore` | 场地布局数据 | 专用 persist |

### Context

| Context | 用途 |
|---------|------|
| `ScriptContext` | 流程台本全局状态 |
| `LotteryContext` | 抽奖大屏全局状态 |

## Supabase 客户端设计

项目提供三种 Supabase 客户端：

1. **`supabase` (Proxy)** — 浏览器端懒加载客户端，使用时通过 Proxy 自动初始化
2. **`getSupabaseClient()`** — 浏览器端显式获取客户端实例
3. **`createServerClient()`** — 服务端 API Routes 使用的服务端客户端（禁用 session 持久化）

```typescript
// 浏览器端
import { supabase } from '@/lib/supabase';
const { data } = await supabase.from('events').select();

// 服务端
import { createServerClient } from '@/lib/supabase';
const supabase = createServerClient();
```

## 认证流程

```
用户访问 / → AuthGate 拦截 → GET /api/auth/me
    │                           │
    ├── 200 + user ─────────────┤ → 渲染页面
    │                           │
    └── 401/error ──────────────┤ → 跳转 /login?next=原路径
                                    │
                                    POST /api/auth/login
                                    │
                                    ├── 成功 → 存储到 useUserStore → 跳转
                                    └── 失败 → 显示错误
```

认证基于 Cookie Session，`credentials: 'include'` 确保跨请求携带认证状态。

## IndexedDB 离线存储

签到和抽奖模块使用 IndexedDB 实现离线数据持久化：

- **签到** — `lib/checkin/local-store.ts` 封装本地存储操作
- **抽奖** — `lib/lottery/db/index.ts` 封装离线数据库操作，通过 `idb` 库管理
- **同步** — 抽奖模块使用 `BroadcastChannel` API 实现跨标签页的状态同步

## 安全架构

- **HTTP 安全头** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options 等
- **认证门控** — `AuthGate` 组件拦截所有管理后台页面
- **API 路由安全** — `lib/api/security.ts` 提供 API 级别的安全检查
- **输入验证** — 服务端 API 对输入进行验证
- **环境变量** — Supabase 密钥等敏感信息仅通过环境变量注入
