# 开发指南

## 环境搭建

### 前置条件

- **Node.js** >= 18
- **pnpm** >= 9.0.0
- **Supabase 项目**（可选，Demo 模式可跳过）

### 克隆与安装

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

开发服务器默认运行在 `http://localhost:3000`。

## 编码规范

### TypeScript

- 严格模式 (`strict: true`)
- 禁止隐式 `any`，禁止 `as any`
- 函数参数、返回值、事件对象必须有明确类型
- 使用 `type` 或 `interface` 定义数据结构
- 所有类型定义统一放在 `src/types/` 下

### 组件规范

- 使用 `'use client'` 指令标记客户端组件
- 服务端组件可省略 `'use client'`
- 优先使用 shadcn/ui 组件（位于 `src/components/ui/`）
- 使用 `cn()` 合并 Tailwind 类名

```typescript
import { cn } from '@/lib/utils';

<div className={cn('base-class', condition && 'conditional-class')} />
```

### Hydration 防范

- 禁止在 JSX 中直接使用 `typeof window`、`Date.now()`、`Math.random()` 等
- 动态数据必须通过 `useEffect` + `useState` 在客户端挂载后赋值
- 禁止 `<p>` 嵌套 `<div>` 等非法 HTML 嵌套
- 使用 `suppressHydrationWarning` 标记服务端/客户端差异

### CSS / 样式

- 全局样式定义在 `src/app/globals.css`
- 使用 Tailwind CSS 4 的 `@theme inline` 定义 CSS 变量
- 深色模式通过 `.dark` 选择器 + `@custom-variant dark` 实现

## 目录与文件规范

### 新增页面

```
src/app/(dashboard)/new-feature/
├── page.tsx          # 页面组件（'use client'）
├── layout.tsx        # 可选布局（需要时）
```

### 新增 API

```
src/app/api/new-feature/
├── route.ts          # 支持 GET/POST/PUT/DELETE
```

### 新增组件

- 通用 UI 组件 → `src/components/ui/`
- 业务组件 → `src/components/<feature>/`
- 布局组件 → `src/components/layout/`

### 新增工具函数

- 通用工具 → `src/lib/utils.ts`
- 功能相关工具 → `src/lib/<feature>/`

## API 开发指南

### Route Handler 模板

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase';
import {
  apiError,
  requireAuth,
  requireRole,
  parseJsonBody,
  writeAuditLog,
} from '@/lib/api/security';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  // ... 更多字段
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    // 业务逻辑
    return NextResponse.json({ data: result });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireRole(user, ['super_admin', 'event_manager']);
    const body = await parseJsonBody(request, createSchema);
    
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('table_name')
      .insert(body)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    await writeAuditLog(request, user, 'resource.create', 'table_name', data.id, data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
```

### API 安全工具 (`lib/api/security.ts`)

| 函数 | 用途 |
|------|------|
| `requireAuth(request)` | 验证用户认证，返回 `AuthContext` |
| `requireRole(user, roles)` | 检查用户角色 |
| `requireMinimumRole(user, role)` | 检查最低角色等级 |
| `requireEventAccess(user, eventId, role)` | 检查活动访问权限 |
| `parseJsonBody(request, schema)` | Zod 验证请求体 |
| `assertRateLimit(request, scope, limit, window)` | 频率限制 |
| `safeSearch(value)` | SQL 注入防护的搜索参数处理 |
| `writeAuditLog(request, user, action, type, id, value)` | 写入审计日志 |
| `apiError(error)` | 统一错误处理 |

### 角色层级

```
super_admin (5) > event_manager (4) > executor (3) > staff (2) > supplier (1) > guest (0)
```

## 状态管理

### Zustand Store 模板

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MyState {
  data: SomeType[];
  setData: (data: SomeType[]) => void;
}

export const useMyStore = create<MyState>()(
  persist(
    (set) => ({
      data: [],
      setData: (data) => set({ data }),
    }),
    { name: 'my-storage-key' }
  )
);
```

## Demo 模式

未配置 Supabase 时，系统自动降级为 Demo 模式：

- 任意邮箱密码可登录
- 使用内存中的模拟数据（`lib/demo-store.ts`）
- API 返回预设的 Demo 数据
- 适用于本地开发和演示

切换到正式模式只需配置 Supabase 环境变量。

## 验证与检查

```bash
# TypeScript 类型检查
pnpm ts-check

# ESLint 代码检查
pnpm lint

# 全量验证
pnpm validate
```

## 脚本说明

| 脚本 | 用途 |
|------|------|
| `scripts/prepare.sh` | 预处理：安装依赖，检查 bin |
| `scripts/dev.sh` | 开发启动：清理端口，tsx watch |
| `scripts/build.sh` | 生产构建：安装依赖 → next build → tsup bundle |
| `scripts/start.sh` | 生产启动：node dist/server.js |
| `scripts/validate.sh` | 代码验证：运行 `pnpm validate` |

## shadcn/ui 组件列表

项目预装了 53 个 shadcn/ui 组件：

| 组件 | 文件 |
|------|------|
| Accordion | `accordion.tsx` |
| Alert / AlertDialog | `alert.tsx` / `alert-dialog.tsx` |
| AspectRatio | `aspect-ratio.tsx` |
| Avatar | `avatar.tsx` |
| Badge | `badge.tsx` |
| Breadcrumb | `breadcrumb.tsx` |
| Button / ButtonGroup | `button.tsx` / `button-group.tsx` |
| Calendar | `calendar.tsx` |
| Card | `card.tsx` |
| Carousel | `carousel.tsx` |
| Chart | `chart.tsx` |
| Checkbox | `checkbox.tsx` |
| Collapsible | `collapsible.tsx` |
| Command | `command.tsx` |
| ContextMenu | `context-menu.tsx` |
| Dialog / Drawer | `dialog.tsx` / `drawer.tsx` |
| DropdownMenu | `dropdown-menu.tsx` |
| Empty | `empty.tsx` |
| Field | `field.tsx` |
| Form | `form.tsx` |
| HoverCard | `hover-card.tsx` |
| Input / InputGroup / InputOTP | `input.tsx` / `input-group.tsx` / `input-otp.tsx` |
| Item | `item.tsx` |
| Kbd | `kbd.tsx` |
| Label | `label.tsx` |
| Menubar | `menubar.tsx` |
| NavigationMenu | `navigation-menu.tsx` |
| Pagination | `pagination.tsx` |
| Popover | `popover.tsx` |
| Progress | `progress.tsx` |
| RadioGroup | `radio-group.tsx` |
| Resizable | `resizable.tsx` |
| ScrollArea | `scroll-area.tsx` |
| Select | `select.tsx` |
| Separator | `separator.tsx` |
| Sheet | `sheet.tsx` |
| Sidebar | `sidebar.tsx` |
| Skeleton | `skeleton.tsx` |
| Slider | `slider.tsx` |
| Sonner | `sonner.tsx` |
| Spinner | `spinner.tsx` |
| Switch | `switch.tsx` |
| Table | `table.tsx` |
| Tabs | `tabs.tsx` |
| Textarea | `textarea.tsx` |
| Toggle / ToggleGroup | `toggle.tsx` / `toggle-group.tsx` |
| Tooltip | `tooltip.tsx` |

## 常用模式

### 数据获取

```typescript
'use client';

import { useEffect, useState } from 'react';

export default function MyPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/my-resource')
      .then(res => res.json())
      .then(json => {
        if (json.data) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>加载中...</div>;
  return <div>{/* 渲染数据 */}</div>;
}
```

### 搜索分页

```typescript
const [search, setSearch] = useState('');
const [page, setPage] = useState(1);

const fetchData = useCallback(async () => {
  const params = new URLSearchParams({ search, page: String(page), limit: '10' });
  const res = await fetch(`/api/my-resource?${params}`);
  // ...
}, [search, page]);
```

### 认证门控

Dashboard 布局 (`src/app/(dashboard)/layout.tsx`) 使用 `AuthGate` 包裹所有管理后台页面：

```typescript
<AuthGate>
  <div>
    <Sidebar />
    <main>{children}</main>
  </div>
</AuthGate>
```
