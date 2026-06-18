# 全栈项目性能优化与功能提升方案

> 基于四个维度审计结果 (API路由/页面组件/业务逻辑/架构配置) 的全量优化方案  
> 审计日期: 2026-06-16 | 审计覆盖: 53 API文件, 33页面组件, 28业务逻辑文件, 10+配置文件

---

## 发现总览

| 严重级别 | 数量 | 占比 |
|---------|------|------|
| **CRITICAL** | 34 | 19% |
| **HIGH** | 47 | 26% |
| **MEDIUM** | 59 | 33% |
| **LOW** | 38 | 21% |

---

## Phase 1: 安全加固 (Priority: P0 — 立即修复)

### 1.1 API 认证缺失

**问题**: 21个API路由完全没有调用 `requireAuth()`，任何人都可访问。

**影响路由**:
`/api/tasks`, `/api/roster`, `/api/suppliers/reviews`, `/api/budget`, `/api/reports`, `/api/forms`, `/api/forms/[id]/submissions`, `/api/events/[id]/sponsors`, `/api/lottery/draw`, `/api/lottery/participants`, `/api/checkin/guests`, `/api/checkin/guests/[id]`, `/api/checkin/checkin-action`, `/api/checkin/stats`, `/api/checkin/stats-detailed`, `/api/checkin/guests-export`, `/api/checkin/guests-import`, `/api/checkin/qrcode`, `/api/seating/guests`, `/api/ai/generate-report`, `/api/checkin/guests-batch`

**方案**:

```typescript
// 在每个路由文件的 handler 开头添加:
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);  // <-- 添加此行
    // ... 原有逻辑
  } catch (error) {
    return apiError(error);
  }
}
```

**预估工时**: 2-3小时 (批量修改)

### 1.2 创建全局 API 中间件

**问题**: 当前零 `middleware.ts`，API路由无集中保护，无CSRF防护，无统一请求ID。

**方案**: 创建 `src/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // 安全头加强
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Request-ID', crypto.randomUUID());
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

**预估工时**: 2-4小时

### 1.3 抽奖路由认证缺失 (Critical)

**问题**: `(lottery)/layout.tsx` 无 AuthGate，奖品/中奖数据完全公开。

**方案**:

```typescript
// src/app/(lottery)/layout.tsx
import { AuthGate } from '@/components/auth/auth-gate';

export default function LotteryLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
```

**注意**: `/screen` 大屏页面需要例外处理，通过 URL token 认证而非登录态。

**预估工时**: 1小时

### 1.4 CSP 安全头加固

**问题**: `script-src 'unsafe-inline' 'unsafe-eval'` 使 CSP 形同虚设。

**方案**: 在 `next.config.ts` 中移除 `unsafe-eval`，将内联脚本改为外部文件或 nonce 方式。

```typescript
// next.config.ts
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self'",           // 移除 unsafe-inline, unsafe-eval
    "style-src 'self' 'unsafe-inline'",
    "object-src 'none'",           // 新增
    "img-src 'self' data: blob: https://images.unsplash.com",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
}
```

**预估工时**: 1-2小时 (需要验证无内联脚本依赖)

### 1.5 敏感数据保护

**问题**: User 对象完整信息 (email, phone, role) 以明文存储在 localStorage 中。

**方案**: 
1. `useUserStore` 仅存储 session token，不存储完整 user 对象
2. 页面加载时通过 `/api/auth/me` 获取用户信息
3. 或者对存储数据做 `JSON.stringify` → `btoa` 基础编码

**预估工时**: 2小时

### 1.6 命令注入风险

**问题**: `src/lib/checkin/supabase-client.ts` 使用 `execSync` 执行内嵌 Python 代码。

**方案**: 将 Python 脚本提取为独立文件，通过 `child_process.execFile` 调用，避免 shell 注入。

**预估工时**: 1-2小时

---

## Phase 2: 输入验证与数据安全 (Priority: P0)

### 2.1 缺失 Zod 验证

**问题**: 10+ POST/PUT 路由直接 `request.json()` 而无 schema 验证。

**影响路由**: `reports`, `lottery/draw`, `checkin/guests`, `checkin/checkin-action`, `checkin/guests-import`, `checkin/guests-batch`, `print-escpos`, `print-encode`, `seating/guests`

**方案**: 为每个路由定义 Zod schema 并使用 `parseJsonBody()`

```typescript
const createReportSchema = z.object({
  event_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  summary: z.string().max(5000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request, createReportSchema);
    // ...
  } catch (error) {
    return apiError(error);
  }
}
```

**预估工时**: 3-4小时

### 2.2 错误客户端使用

**问题**: 11个路由文件使用浏览器端 `supabase` proxy 而非服务端 `createServerClient()`。

**影响路由**: `users`, `events`, `events/[id]`, `customers`, `guests`, `suppliers`, `seating`, `checkin`, `lottery`

**方案**: 全部替换导入

```typescript
// 修改前:
import { supabase } from '@/lib/supabase';

// 修改后:
import { createServerClient } from '@/lib/supabase';
const supabase = createServerClient();
```

**预估工时**: 1-2小时

### 2.3 SQL LIKE 注入防护

**问题**: `supabase-store.ts` 中 `searchGuests` 直接将用户输入嵌入 ILIKE。

**方案**: 在传入 `or()` 之前调用 `safeSearch()` 或手动转义 `%` `_`

```typescript
// 修改前:
.or(`name.ilike.%${keyword}%,phone.ilike.%${keyword}%`);

// 修改后:
const escaped = keyword.replace(/%/g, '\\%').replace(/_/g, '\\_');
.or(`name.ilike.%${escaped}%,phone.ilike.%${escaped}%`);
```

**预估工时**: 0.5小时

---

## Phase 3: 类型系统修复 (Priority: P1)

### 3.1 消除重复类型定义

**问题**: `LotteryPrize`, `LockedWinner`, `ReportStatus`, `GuestStatus`, `SponsorLevel`, `SegmentType`, `SegmentStatus` 在多个文件中重复定义且存在冲突。

| 类型 | 文件1 | 文件2 | 冲突 |
|------|-------|-------|------|
| `LotteryPrize` | `index.ts:566` | `index.ts:614` | `excludeIds` 仅存在于第二个 |
| `LockedWinner` | `index.ts:592` | `index.ts:640` | 完全相同(需去重) |
| `GuestStatus` | `index.ts:106` | `roster.ts:72` | 值集合不同: `checked_in` vs `attended`/`declined`/`pending` |
| `SponsorLevel` | `index.ts:143` | `sponsor.ts:3` | `strategic`/`supporting` vs `co_host`/`diamond`/`dinner`等 |
| `ReportStatus` | `index.ts:367` | `report.ts:5` | 完全相同(需去重) |

**方案**:
1. 将类型定义为 **单一模板出处 (Single Source of Truth)**
2. 从 `src/types/index.ts` 中移除内联定义，仅保留 re-export
3. 将 `Person`, `Table`, `Activity` 等从 `index.ts` 内联定义移除，统一从 `seating.ts` 导入
4. 合并 `GuestStatus` 为完整集合: `'pending' | 'invited' | 'confirmed' | 'checked_in' | 'attended' | 'declined' | 'absent'`
5. 统一 `SponsorLevel` 为完整集合，标记废弃值

**预估工时**: 4-6小时 (涉及多处引用更新)

### 3.2 启用 Zod 运行时验证

**问题**: `zod@4.3.5` 已安装但代码中完全未使用。

**方案**:
1. 创建 `src/lib/validation.ts` - 集中定义所有 Zod schema
2. 在 API 路由中统一使用 `parseJsonBody(request, schema)` (已有基础设施)
3. 在表单组件中用于客户端验证
4. 在文件导入解析中验证 CSV/Excel 数据结构

**预估工时**: 6-8小时

---

## Phase 4: 错误处理与可观测性 (Priority: P1)

### 4.1 添加 Error Boundaries

**问题**: 零 `error.tsx` 文件，任何 React 渲染错误使整个页面白屏。

**方案**: 在关键路由段添加 `error.tsx`

```
src/app/(dashboard)/error.tsx
src/app/checkin/error.tsx
src/app/error.tsx             (global)
```

```typescript
// src/app/(dashboard)/error.tsx
'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-lg font-semibold">出错了</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="mt-4">重试</button>
    </div>
  );
}
```

**预估工时**: 2小时

### 4.2 添加 try/catch 错误处理

**问题**: 15个API路由完全无 try/catch 包裹。

**方案**: 所有路由统一使用 `try { ... } catch (error) { return apiError(error); }` 模式。

**预估工时**: 1-2小时 (批量添加)

### 4.3 统一响应格式

**问题**: `{ data }` 与 `{ success: true, data }` 两种格式并存，约 25 个路由使用后者。

**方案**:
- **推荐格式 A**: `{ data: T }` 成功 / `{ error: string }` 失败 (更简洁，Next.js 社区标准)
- 将格式 B 路由 (tasks, roster, budget, reports, forms, lottery/draw, seating/*, checkin/*) 统一迁移

**迁移步骤**:
1. 格式 B 路由: 将 `{ success: true, data }` 替换为 `{ data }`
2. 格式 B 路由: 将 `{ success: false, error: msg }` 替换为 `{ error: msg }` + 非200状态码
3. 前端 `fetch` 调用: 移除所有对 `.success` 的检查，改为检查 `response.ok`

**预估工时**: 4-6小时 (涉及前后端多处修改)

### 4.4 添加 API 审计日志

**问题**: 14个 mutation 路由缺少 `writeAuditLog()` 调用。

**方案**: 在所有 POST/PUT/DELETE 路由中添加审计日志。

**预估工时**: 2小时

---

## Phase 5: 性能优化 (Priority: P1)

### 5.1 N+1 查询优化

**问题**: `events/[id]` GET 执行 7 次串行查询。

**方案**: 将独立查询改为 `Promise.all` 并行

```typescript
// 修改前:
const { data: event } = await supabase.from('events')...;
const { data: tasks } = await supabase.from('event_tasks')...;
const { data: guests } = await supabase.from('guests')...;
// ... 7 sequential awaits

// 修改后:
const [eventResult, tasksResult, guestsResult, ...] = await Promise.all([
  supabase.from('events').select().eq('id', id).single(),
  supabase.from('event_tasks').select().eq('event_id', id),
  supabase.from('guests').select().eq('event_id', id),
  // ...
]);
```

**预估工时**: 1-2小时

### 5.2 组件拆分 (大文件处理)

**问题**: 3个页面组件过大，影响加载和可维护性。

| 文件 | 行数 | 建议拆分 |
|------|------|---------|
| `checkin/admin/page.tsx` | 2400+ | 拆分为 GuestTable, StatsPanel, TemplateDesigner, ImportModal, ExportPanel |
| `events/[id]/page.tsx` | 1370 | 拆分为 OverviewTab, TasksTab, GuestsTab, SuppliersTab, CustomersTab |
| `scripts/page.tsx` | 1054 | 拆分为 TimelineEditor, ChapterList, SegmentEditor, ExportWorkspace |

**预估工时**: 8-12小时

### 5.3 Eager Import 优化

**问题**: 3个页面 bundle 中包含未使用的重型库:

| 文件 | 导入 | 影响 |
|------|------|------|
| `lottery/attendees/page.tsx:14` | `import * as XLSX from 'xlsx'` | ~500KB |
| `lottery/draw-records/page.tsx:8` | `import * as XLSX from 'xlsx'` | ~500KB |
| `scripts/page.tsx:22` | `import * as XLSX from 'xlsx'` | ~500KB |

**方案**: 改为动态导入

```typescript
// 修改前:
import * as XLSX from 'xlsx';

// 修改后:
const handleExport = async () => {
  const XLSX = await import('xlsx');
  // ...
};
```

**预估工时**: 1小时

### 5.4 React 反向模式修复

| 文件 | 问题 | 方案 |
|------|------|------|
| `reports/page.tsx:356-383` | `document.getElementById` 绕过 React | 使用 controlled state |
| `forms/[id]/page.tsx:45` | `window.location.href` 全页刷新 | 使用 `router.push()` |
| `seating/layout/page.tsx:319` | 键盘事件闭包陈旧 | 添加 `handleDeleteSelected` 到 useEffect deps |
| `seating/page.tsx:36-39` | useEffect 空 deps 但读取 rosterEventId | 添加依赖或使用 useSearchParams |

**预估工时**: 2-3小时

### 5.5 内存泄漏修复

| 文件 | 问题 | 方案 |
|------|------|------|
| `api/security.ts:43` | Rate limit Map 永远不清理 | 添加定时清理或 LRU |
| `lottery/audio.ts:375` | `setInterval` 无卸载清理 | track interval IDs, cleanup in destroy() |
| `checkin/local-store.ts:48` | 非原子文件写入 | write temp → renameSync |
| `lottery/audio.ts:25` | SSR时构造函数访问 localStorage | guard with `typeof window` check in constructor |

**预估工时**: 2-3小时

---

## Phase 6: 数据一致性与可靠性 (Priority: P1)

### 6.1 本地 JSON 文件原子化写入

**问题**: `checkin/local-store.ts:48` 使用 `writeFileSync` 可能导致数据损坏。

**方案**:

```typescript
// 原子化写入
import { writeFileSync, renameSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

function persist(data: CheckinData): void {
  const tmpPath = join(tmpdir(), `checkin-${Date.now()}.tmp`);
  writeFileSync(tmpPath, JSON.stringify(data));
  renameSync(tmpPath, DATA_FILE);  // 原子操作
}
```

### 6.2 抽奖公平性

**问题**: `DrawEngine` 使用 `Math.random()` 而非密码学安全随机数。

**方案**:

```typescript
// draw-engine.ts
function secureRandom(): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / 0xFFFFFFFF;
}

// Fisher-Yates 替换:
for (let i = pool.length - 1; i > 0; i--) {
  const j = Math.floor(secureRandom() * (i + 1));  // 使用 crypto
  [pool[i], pool[j]] = [pool[j], pool[i]];
}
```

### 6.3 Supabase 服务端 Key 使用

**问题**: `checkin/supabase-store.ts` 中 checkin 操作和日志记录分开执行，非原子性。

**方案**:
1. 使用 Supabase RPC (PostgreSQL 函数) 实现原子 checkin 操作
2. 或使用数据库触发器: `ON UPDATE check_in_status` → 自动插入 check_in_log

---

## Phase 7: 开发体验提升 (Priority: P2)

### 7.1 环境变量运行时验证

**问题**: 零 env var 验证，缺失时运行时崩溃。

**方案**: 使用已安装的 zod 创建 `src/env.ts`

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  PORT: z.coerce.number().default(3000),
  HOSTNAME: z.string().default('localhost'),
});

export const env = envSchema.parse(process.env);
```

### 7.2 自定义服务器完善

**问题**: 
- `webpack: true` 禁用 Turbopack
- 无 SIGTERM/SIGINT 优雅关闭
- 无健康检查端点

**方案**:

```typescript
// server.ts 补充
const server = createServer(async (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200).end('OK');
    return;
  }
  await handle(req, res, parsedUrl);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

### 7.3 测试基础设施

**问题**: 零测试文件，零测试框架。

**方案**:
1. 安装 `vitest`, `@testing-library/react`, `@testing-library/jest-dom`
2. 为工具函数创建单元测试: `lib/checkin/schema.ts`, `lib/lottery/draw-engine.ts`, `lib/seating/helpers.ts`
3. 为核心 API 路由创建集成测试: `auth/login`, `events`, `checkin`
4. 添加 `test` script 到 `package.json`

### 7.4 可复用 Hook 提取

**问题**: 8个页面重复相同的 fetch events/roster 模式。

**方案**: 创建可复用 hooks:

```typescript
// src/hooks/use-events.ts
export function useEvents(params?: { status?: string; limit?: number }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const qs = new URLSearchParams({ limit: String(params?.limit ?? 100), ...params });
    fetch(`/api/events?${qs}`)
      .then(r => r.json())
      .then(j => setEvents(j.data ?? []))
      .finally(() => setLoading(false));
  }, [params?.status, params?.limit]);
  
  return { events, loading };
}

// src/hooks/use-roster.ts
export function useRoster(eventId: string) { /* ... */ }
```

---

## Phase 8: 架构改进 (Priority: P2)

### 8.1 座位 Store 架构修正

**问题**: `seating-activity-store` 和 `seating-layout-store` 是 plain hooks 而非 Zustand store，状态不跨组件共享。

**方案**: 转为 Zustand store with persist middleware

```typescript
// 改为 Zustand store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      activity: defaultActivity,
      addPersons: (persons) => set((state) => ({
        activity: { ...state.activity, persons: [...state.activity.persons, ...persons] }
      })),
      // ...
    }),
    { name: 'seating-activity' }
  )
);
```

### 8.2 元数据修复

**问题**: 根布局 OpenGraph 描述错误为 "扣子编程" 而非 "芯火会务"。

**方案**: 修正 `src/app/layout.tsx` 中 metadata

```typescript
openGraph: {
  title: '芯火会务管理系统 - 智能会务管理平台',
  description: '面向芯片行业的 AI Native 全栈会务管理平台，涵盖活动管理、智能排座、签到、抽奖全流程。',
  siteName: '芯火会务',
  // ...
}
```

### 8.3 数据分页补全

**问题**: `customers`, `suppliers`, `guests` 列表接口无分页，可能返回数百条记录。

**方案**: 添加 `page`/`limit` 参数及默认上限 (max 100)

### 8.4 生产环境 debug log 清理

**问题**: `seating/helpers.ts:1257-1364` 有 15+ 处 `console.log` 在生产代码中。

**方案**: 移除或使用条件日志:

```typescript
const DEBUG = process.env.NODE_ENV === 'development';
if (DEBUG) console.log('dedup:', ...);
```

---

## 实施优先级矩阵

| Phase | Priority | 预估工时 | 安全影响 | 性能影响 | 可维护性 |
|-------|----------|---------|---------|---------|---------|
| Phase 1: 安全加固 | **P0** | 8-12h | ⬆⬆⬆ | - | ⬆ |
| Phase 2: 输入验证 | **P0** | 4-6h | ⬆⬆⬆ | ⬆ | ⬆ |
| Phase 3: 类型系统 | **P1** | 10-14h | ⬆ | - | ⬆⬆⬆ |
| Phase 4: 错误处理 | **P1** | 9-12h | ⬆ | - | ⬆⬆ |
| Phase 5: 性能优化 | **P1** | 14-20h | - | ⬆⬆⬆ | ⬆⬆ |
| Phase 6: 数据一致性 | **P1** | 6-8h | ⬆⬆ | ⬆ | ⬆ |
| Phase 7: 开发体验 | **P2** | 12-16h | - | - | ⬆⬆⬆ |
| Phase 8: 架构改进 | **P2** | 8-12h | - | - | ⬆⬆⬆ |

**总计预估工时**: 71-100 小时

---

## 关键审计来源

- [页面组件审计](41e4097e-c8f3-4316-8101-103efdcd333b) - 33页面, 12项严重/高优先级发现
- [API路由审计](8abaa3a0-d461-4f4e-9003-fe491e8ac335) - 53路由, 9项严重/高优先级发现
- [架构与配置审计](a6ecab09-b70c-4c68-b6dd-bf4a4463a743) - 14项严重发现
- [业务逻辑审计](9b6ed2ae-71f7-465f-a8d8-5c3e60dce68c) - 28源文件, 4项严重/20+项高优先级发现
