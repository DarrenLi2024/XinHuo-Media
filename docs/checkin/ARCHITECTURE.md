# ARCHITECTURE.md - 架构设计文档

## 系统架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户界面层 (Frontend)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ 签到页面  │  │ 管理后台  │  │ 统计看板  │  │ 登录页面  │         │
│  │ /checkin │  │ /admin   │  │ /stats   │  │ /login   │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP/SSE
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API 服务层 (Backend)                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Next.js App Router                      │  │
│  │  /api/auth  /api/guests  /api/check-in  /api/stats  ...   │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      业务逻辑层                            │  │
│  │  权限验证 | 签到处理 | 统计计算 | 导入导出 | 打印编码        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │ Drizzle ORM
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        数据存储层 (Database)                     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Supabase PostgreSQL (云端托管)                │  │
│  │    guests | check_in_logs | users | sessions              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 技术选型说明

### 前端技术栈
| 技术 | 版本 | 选型原因 |
|------|------|---------|
| Next.js | 16.1.1 | App Router 支持 SSR/CSR、API Routes、HMR |
| React | 19.2.3 | 组件化开发、状态管理、生态成熟 |
| TypeScript | 5.x | 类型安全、代码提示、编译检查 |
| Tailwind CSS | 4.x | 快速样式开发、原子化 CSS |
| shadcn/ui | latest | 高质量组件、基于 Radix UI、可定制 |

### 后端技术栈
| 技术 | 版本 | 选型原因 |
|------|------|---------|
| Drizzle ORM | latest | 类型安全、轻量级、支持 PostgreSQL |
| Supabase | 2.95.3 | 云端托管、实时同步、多终端并发 |
| ESC/POS Encoder | 3.0.0 | 热敏打印机编码、支持多种打印机 |
| xlsx | 0.18.5 | Excel 导入导出、SheetJS |
| html2canvas | 1.4.1 | 长图生成、统计看板导出 |

---

## 目录结构设计

```
src/
├── app/                        # Next.js App Router
│   ├── api/                   # API Routes（后端）
│   │   ├── auth/             # 认证：登录、登出、改密
│   │   ├── backup/           # 数据备份：导入/导出 JSON
│   │   ├── check-in/         # 签到操作
│   │   ├── export/           # 数据导出：XLSX、配置模板
│   │   ├── guests/           # 嘉宾管理：CRUD、批量操作
│   │   ├── import/           # 数据导入：Excel
│   │   ├── logs/             # 签到日志
│   │   ├── print-*/          # 打印相关
│   │   ├── qrcode/           # 二维码生成
│   │   ├── stats/            # 统计数据
│   │   ├── templates/        # 打印模板
│   │   └── users/            # 用户管理
│   │
│   ├── admin/                # 管理后台页面
│   │   ├── guests/          # 嘉宾管理
│   │   ├── templates/       # 模板管理
│   │   ├── users/           # 用户管理
│   │   └── settings/        # 系统设置
│   │
│   ├── checkin/              # 签到页面（核心业务）
│   ├── login/                # 登录页面
│   ├── stats/                # 统计看板页面
│   ├── layout.tsx            # 全局布局
│   └── page.tsx              # 首页（重定向）
│
├── components/                # UI组件
│   ├── ui/                   # shadcn/ui 基础组件
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── TemplateEditor.tsx    # 打印模板编辑器
│   ├── TemplateManager.tsx   # 模板管理组件
│   ├── TemplateSelector.tsx  # 模板选择器
│   └── UsersPage.tsx         # 用户管理组件
│
├── contexts/                  # React Context
│   └── AuthContext.tsx       # 认证上下文（全局登录状态）
│
├── hooks/                     # 自定义 Hooks
│   └── use-mobile.ts         # 移动端检测
│
├── lib/                       # 工具库
│   ├── auth-fetch.ts         # 认证 fetch 封装（携带 Token）
│   ├── auth-utils.ts         # 权限验证工具
│   ├── escpos-printer.ts     # ESC/POS 打印封装
│   └── session.ts            # Session 管理（localStorage）
│
├── storage/                   # 数据存储层
│   └── database/
│       ├── db.ts            # 数据库操作封装
│       ├── supabase-client.ts # Supabase 客户端
│       └── shared/
│           └── schema.ts    # Drizzle Schema 定义
│
└── types/                     # 类型定义
    └── template.ts           # 打印模板类型
```

---

## 核心模块设计

### 1. 认证模块

#### 认证流程
```
用户登录 → 验证账号密码 → 生成 Token → 存储 Session
                │
                ▼
        检查 mustChangePassword
                │
        ┌───────┴───────┐
        │               │
     需要改密         不需要
        │               │
   强制跳转改密页    正常访问
```

#### Token 存储
- **前端**：`localStorage.setItem('session', JSON.stringify({ token, user }))`
- **请求携带**：`Authorization: Bearer <token>`
- **过期策略**：无固定过期时间，登出时清除

#### 权限验证
```typescript
// lib/auth-utils.ts
export function requirePermission(
  user: User,
  permission: Permission
): boolean {
  const rolePermissions: Record<Role, Permission[]> = {
    super_admin: ALL_PERMISSIONS,
    admin: ADMIN_PERMISSIONS, // 无 users:*
    checker: CHECKER_PERMISSIONS // 仅 checkin:perform, stats:read
  };
  return rolePermissions[user.role].includes(permission);
}
```

---

### 2. 签到模块

#### 全局扫码监听
```typescript
// 核心实现逻辑
const SCAN_TIMEOUT = 100; // 扫码枪输入间隔阈值
let scanBuffer = '';
let scanTimer: NodeJS.Timeout | null = null;

window.addEventListener('keydown', (e) => {
  // 忽略输入框内的输入
  if (document.activeElement.tagName === 'INPUT') return;
  
  if (e.key === 'Enter') {
    // 扫码结束，处理二维码
    handleScan(scanBuffer);
    scanBuffer = '';
    if (scanTimer) clearTimeout(scanTimer);
  } else if (e.key.length === 1) {
    // 字符输入，累积到缓冲区
    scanBuffer += e.key;
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(() => scanBuffer = '', SCAN_TIMEOUT);
  }
});
```

#### 签到并发处理
```typescript
// 原子操作 SQL
UPDATE guests 
SET check_in_status = 1, 
    check_in_time = NOW(), 
    updated_at = NOW()
WHERE id = ? AND check_in_status = 0
RETURNING *;

// 结果判断
if (updatedRows === 0) {
  // 已被其他终端签到，返回错误
  return { success: false, error: '该嘉宾已签到' };
}
```

---

### 3. 打印模块

#### ESC/POS 打印编码
```typescript
// lib/escpos-printer.ts
import ESCPOS from 'escpos-encoder';

export function encodeBadgePrint(data: BadgeData, config: PrintConfig) {
  const encoder = new ESCPOS();
  
  // 初始化
  encoder
    .initialize()
    .align('center')
    .size(2, 2) // 放大
    .text(data.name)
    .size(1, 1)
    .text(data.guestType)
    .text(`桌号：${data.tableNumber}`)
    .barcode(data.qrCode, 'CODE128') // 条形码/二维码
    .cut();
  
  return encoder.encode(); // 返回 Uint8Array
}
```

#### 打印方式
1. **网络打印机**：TCP Socket 连接（IP + Port）
2. **USB 打印机**：浏览器 WebUSB API
3. **蓝牙打印机**：Web Bluetooth API

---

### 4. 导入导出模块

#### Excel 导入
```typescript
import * as XLSX from 'xlsx';

export async function parseExcel(file: File): Promise<GuestData[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  
  return rows.map(row => ({
    name: row['姓名'],
    phone: row['电话'],
    organization: row['单位'],
    guestType: row['身份'] || '普通嘉宾',
    tableNumber: row['桌号'],
  }));
}
```

#### 长图导出（html2canvas）
```typescript
import html2canvas from 'html2canvas';

export async function exportAsImage(element: HTMLElement) {
  const canvas = await html2canvas(element, {
    scale: 2, // 高分辨率
    useCORS: true,
    backgroundColor: '#ffffff',
    onclone: (clonedDoc) => {
      // 移除 Tailwind CSS 样式表（解决 lab() 颜色函数问题）
      clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach(el => el.remove());
      clonedDoc.querySelectorAll('style').forEach(el => el.remove());
    }
  });
  
  return canvas.toDataURL('image/png');
}
```

---

### 5. 统计模块

#### 实时统计计算
```typescript
export async function getStats(): Promise<StatsData> {
  const guests = await getAllGuests();
  
  const total = guests.length;
  const checkedIn = guests.filter(g => g.checkInStatus === 1).length;
  const notCheckedIn = total - checkedIn;
  const checkInRate = total > 0 ? (checkedIn / total * 100) : 0;
  
  // 按身份类型统计
  const byType: Record<string, number> = {};
  const byTypeChecked: Record<string, number> = {};
  
  guests.forEach(g => {
    byType[g.guestType] = (byType[g.guestType] || 0) + 1;
    if (g.checkInStatus === 1) {
      byTypeChecked[g.guestType] = (byTypeChecked[g.guestType] || 0) + 1;
    }
  });
  
  return { total, checkedIn, notCheckedIn, checkInRate, byType, byTypeChecked };
}
```

---

## 多终端并发设计

### Supabase 实时同步
```typescript
// 订阅嘉宾数据变化
const channel = supabase
  .channel('guests-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'guests'
  }, (payload) => {
    // 实时更新本地状态
    refreshGuestList();
  })
  .subscribe();
```

### 数据一致性保证
1. **原子操作**：签到使用条件更新防止竞态
2. **唯一约束**：二维码字段数据库唯一约束
3. **乐观锁**：使用 `updated_at` 判断数据版本

---

## 部署架构

### 生产环境部署
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   用户终端   │────▶│   Vercel    │────▶│  Supabase   │
│  (浏览器)   │     │  (Next.js)  │     │ (PostgreSQL)│
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │                   │                   │
      ▼                   ▼                   ▼
  扫码枪/打印机      API Routes          云端数据库
  热敏打印机        静态资源 CDN         实时订阅推送
```

### 环境变量配置
```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx

# 应用
COZE_PROJECT_DOMAIN_DEFAULT=https://xxx.dev.coze.site
DEPLOY_RUN_PORT=5000
COZE_PROJECT_ENV=PROD
```

---

## 安全设计

### 1. 认证安全
- Token 随机生成（64字符）
- 密码加密存储（建议 bcrypt）
- 首次登录强制修改密码

### 2. 权限隔离
- 三级角色严格区分
- API 层权限验证
- 前端路由守卫

### 3. 数据安全
- Supabase 数据库加密
- 备份文件 JSON 格式
- 导出数据不含密码

---

## 性能优化

### 1. 前端优化
- React 组件懒加载
- 图片懒加载
- 虚拟列表（大量数据）

### 2. 后端优化
- API 响应缓存
- 批量操作事务处理
- 数据库索引优化

### 3. 网络优化
- CDN 静态资源
- Supabase 区域就近
- API 响应压缩