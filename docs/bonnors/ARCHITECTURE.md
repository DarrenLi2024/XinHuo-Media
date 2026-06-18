# ARCHITECTURE.md - 技术架构文档

> 本文档详细说明项目的技术架构、数据模型、核心算法，帮助 AI 工具精准理解并复刻功能。

---

## 系统架构概览

### 架构模式
```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面层                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  大屏展示   │  │  后台管理   │  │  登录认证   │          │
│  │ /screen     │  │ /admin/*    │  │ /login      │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│                        业务逻辑层                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ 抽奖引擎    │  │ 权限控制    │  │ 数据同步    │          │
│  │ DrawEngine  │  │ AppContext  │  │ SSE Client  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│                        数据存储层                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   IndexedDB                          │    │
│  │  users | attendees | prizes | drawRecords | ...     │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                        API 层（可选）                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   /api/sync/*                        │    │
│  │          events | load | save | reset                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 核心特点
1. **完全离线**：所有数据存储在浏览器 IndexedDB，无需外部服务
2. **客户端渲染**：大屏展示页面完全在客户端运行
3. **可选同步**：支持多端数据同步，但不依赖同步服务

---

## 数据模型

### 实体关系图

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    User      │     │   Attendee   │     │    Prize     │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id           │     │ id           │     │ id           │
│ username     │     │ name         │     │ name         │
│ password     │     │ company      │     │ level        │
│ role         │────▶│ hasWon       │◀────│ prizeName    │
│ createdAt    │     │ prizeName    │     │ quantity     │
│ updatedAt    │     │ isLocked     │     │ drawCount    │
└──────────────┘     └──────────────┘     │ allowRepeat  │
                     │                      │ order        │
                     │                      └──────────────┘
                     │                             │
                     │                             │
                     │     ┌──────────────┐        │
                     │     │ DrawRecord   │        │
                     │     ├──────────────┤        │
                     │     │ id           │        │
                     └────▶│ prizeId      │◀───────┘
                           │ prizeName    │
                           │ attendeeIds  │
                           │ drawTime     │
                           │ drawMode     │
                           └──────────────┘

┌──────────────┐     ┌──────────────┐
│LockedWinner  │     │ EventInfo    │
├──────────────┤     ├──────────────┤
│ id           │     │ id           │
│ name         │     │ name         │
│ prizeIds[]   │     │ theme        │
│ effectTime   │     │ organizer    │
│ isBlacklist  │     │ logoUrl      │
└──────────────┘     └──────────────┘
```

### 核心数据结构

#### User（用户）
```typescript
interface User {
  id: string;
  username: string;
  password: string; // 明文存储（演示）
  role: 'superadmin' | 'admin' | 'operator' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}
```

#### Attendee（参会人员）
```typescript
interface Attendee {
  id: string;
  name: string;           // 姓名（核心匹配字段）
  company?: string;       // 公司
  role?: string;          // 参会身份
  tableNumber?: string;   // 桌号
  seatNumber?: string;    // 座位号
  hasWon: boolean;        // 是否已中奖
  prizeName?: string;     // 中奖奖品名称
  isLocked?: boolean;     // 是否被锁定
}
```

#### Prize（奖项）
```typescript
interface Prize {
  id: string;
  name: string;           // 奖项名称（如"一等奖"）
  level: number;          // 奖项等级
  prizeName: string;      // 奖品名称（如"iPhone 15 Pro"）
  sponsor?: string;       // 赞助商
  imageUrl?: string;      // 奖品图片
  quantity: number;       // 奖品总数量
  drawCount: number;      // 单次抽取人数
  allowRepeat: boolean;   // 是否允许重复中奖
  order: number;          // 抽奖顺序
  drawByTable: boolean;   // 是否按桌号抽奖
  excludeIds?: string[];  // 排除名单
}
```

#### LockedWinner（锁定中奖人员）
```typescript
interface LockedWinner {
  id: string;
  name: string;           // 姓名（用于匹配 Attendee）
  company?: string;       // 公司（辅助匹配）
  prizeIds: string[];     // 锁定的奖品ID列表（支持多个）
  effectTimeStart?: Date; // 生效开始时间
  effectTimeEnd?: Date;   // 生效结束时间
  isBlacklist?: boolean;  // 是否为黑名单人员
}
```

#### DrawRecord（抽奖记录）
```typescript
interface DrawRecord {
  id: string;
  prizeId: string;
  prizeLevelName: string;
  prizeName: string;
  sponsorName?: string;
  prizeLevel: number;
  attendeeIds: string[];            // 中奖者ID列表
  abandonedAttendeeIds: string[];   // 弃奖者ID列表
  drawTime: Date;
  drawMode: 'random' | 'weighted' | 'controlled';
  operatorId: string;
  operatorName: string;
}
```

---

## 核心算法

### 抽奖引擎算法

**文件位置**：`src/lib/draw-engine.ts`

#### 算法流程

```
┌─────────────────────────────────────────────────────────────┐
│                      抽奖算法流程                            │
├─────────────────────────────────────────────────────────────┤
│  1. 构建黑名单和围栏名单                                      │
│     - getBlacklistedNames() → 黑名单人员                      │
│     - getFencedNames() → 围栏保护人员                         │
├─────────────────────────────────────────────────────────────┤
│  2. 筛选可参与抽奖的人员                                      │
│     - 排除已中奖人员                                          │
│     - 排除黑名单人员                                          │
│     - 排除围栏保护人员                                        │
├─────────────────────────────────────────────────────────────┤
│  3. 处理锁定中奖人员                                          │
│     - 检查生效时间是否有效                                    │
│     - 匹配锁定人员姓名                                        │
│     - 限制锁定人数不超过 drawCount                            │
├─────────────────────────────────────────────────────────────┤
│  4. 随机抽取剩余中奖者                                        │
│     - Fisher-Yates 洗牌算法                                   │
│     - 取前 remainingDrawCount 人                              │
├─────────────────────────────────────────────────────────────┤
│  5. 组合最终中奖名单                                          │
│     - 锁定人员随机插入（避免首位）                             │
├─────────────────────────────────────────────────────────────┤
│  6. 返回抽奖结果                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Fisher-Yates 洗牌算法

```typescript
// 实现位置：DrawEngine.shuffle()
private static shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

#### 围栏保护机制（关键逻辑）

```typescript
// 围栏保护：锁定名单人员无论是否在生效时间，都不参与常规抽奖
// 只有生效时间内才通过锁定机制中奖

// 1. 获取围栏名单（排除黑名单）
const fencedNames = new Set(
  lockedWinners
    .filter(lw => !lw.isBlacklist)
    .map(lw => lw.name)
);

// 2. 从常规抽奖池排除围栏人员
availableAttendees = availableAttendees.filter(
  a => !fencedNames.has(a.name)
);

// 3. 仅在生效时间内选择锁定人员
if (isLockedWinnerEffectTimeValid(lockedWinner)) {
  // 将锁定人员加入中奖名单
}
```

### 3D 粒子球面分布算法

**文件位置**：`src/components/ParticleSphere.tsx`

#### 斐波那契球面分布

```typescript
// 确保粒子均匀分布在球面上
// 使用斐波那契螺旋算法

const phi = Math.PI * (3 - Math.sqrt(5)); // 黄金角度

for (let i = 0; i < particleCount; i++) {
  const y = 1 - (i / (particleCount - 1)) * 2; // y: 1 到 -1
  const radius = Math.sqrt(1 - y * y);
  const theta = phi * i;
  
  const x = Math.cos(theta) * radius;
  const z = Math.sin(theta) * radius;
  
  // (x, y, z) 是球面上的坐标点
}
```

---

## 状态管理

### AppContext（全局状态）

**文件位置**：`src/contexts/AppContext.tsx`

#### 核心状态

```typescript
interface AppState {
  // 用户相关
  currentUser: User | null;
  isLoggedIn: boolean;
  
  // 主题相关
  currentTheme: Theme;
  themeConfig: ThemeConfig;
  
  // 音效配置
  audioEnabled: boolean;
  systemConfig: SystemConfig;
  
  // 活动信息
  eventInfo: EventInfo | null;
}
```

#### 关键方法

```typescript
// 登录
login(username: string, password: string): Promise<boolean>

// 登出
logout(): void

// 切换主题
setTheme(theme: Theme): void

// 切换音效
toggleAudio(enabled: boolean): void
```

### 抽奖状态机

**文件位置**：`src/app/screen/page.tsx`

#### 状态定义

```typescript
type ScreenState = 'waiting' | 'rolling' | 'winner';

type WinnerSlot = {
  winner: Attendee | null;
  isNew: boolean;
  isRedrawn: boolean;
  originalPosition?: { x: number; y: number };
};
```

#### 状态流转

```
waiting ──────▶ rolling ──────▶ winner
   │               │               │
   │               │               │ (弃奖)
   │               │               │
   │               └──────────────▶ rolling (重抽)
   │                               │
   └──────────────────────────────▶ winner
```

---

## API 设计（可选同步）

### 同步接口

**文件位置**：`src/app/api/sync/*`

#### 接口列表

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/sync/events` | GET | SSE 实时事件流 |
| `/api/sync/load` | GET | 加载服务器数据 |
| `/api/sync/save` | POST | 保存数据到服务器 |
| `/api/sync/reset` | POST | 重置服务器数据 |

#### SSE 实时同步

```typescript
// SSE 客户端实现
// 文件位置：src/lib/sync/sse-client.ts

class SyncClient {
  // 连接 SSE 事件流
  connect(url: string): void
  
  // 监听事件
  on(event: SyncEvent, callback: Function): void
  
  // 断开连接
  disconnect(): void
}
```

---

## 音效系统架构

### AudioManager

**文件位置**：`src/lib/audio.ts`

#### 设计特点

1. **单例模式**：全局唯一 AudioContext
2. **预生成 Buffer**：滚动音效预生成 AudioBuffer 池
3. **复用机制**：避免实时创建 OscillatorNode

#### 核心方法

```typescript
class AudioManager {
  // 预热 AudioContext
  warmup(): Promise<void>
  
  // 播放摇奖音效
  playStartDrawSound(): void
  
  // 停止摇奖音效
  stopRollSound(): void
  
  // 播放中奖音效
  playWinSound(): void
  
  // 播放喝彩声
  playCheerSound(): void
  
  // 播放碎裂音效
  playBreakSound(): void
  
  // 播放惊喜音效（重抽）
  playSurpriseSound(): void
}
```

#### 性能优化关键

```typescript
// 预生成 AudioBuffer 缓冲区池
// 避免实时创建 OscillatorNode

private generateRollingBufferPool(): void {
  // 预生成 30 个不同参数的滚动音效 buffer
  for (let i = 0; i < 30; i++) {
    const frequency = 300 + Math.random() * 300;
    const duration = 0.05 + Math.random() * 0.05;
    const buffer = this.createSimpleRollingBuffer(ctx, frequency, duration);
    this.rollingBufferPool.push(buffer);
  }
}
```

---

## 视觉特效系统

### 烟花特效

**文件位置**：`src/lib/fireworks.ts`

#### 实现特点
- 纯 Canvas 2D 实现
- 多粒子爆炸效果
- 渐变颜色动画
- requestAnimationFrame 优化

### 卡牌碎裂特效

**文件位置**：`src/components/ShatterCard.tsx`

#### 实现特点
- 卡牌分解为粒子碎片
- 粒子沿随机方向飞散
- 重力下落效果
- 新卡牌从碎裂位置出现

---

## 安全机制

### 权限控制流程

```
┌─────────────────────────────────────────────────────────────┐
│                      权限检查流程                            │
├─────────────────────────────────────────────────────────────┤
│  1. 用户登录                                                 │
│     - 验证用户名密码                                         │
│     - 加载用户角色                                           │
├─────────────────────────────────────────────────────────────┤
│  2. 页面访问                                                 │
│     - 检查路由权限                                           │
│     - superadmin → 全部                                      │
│     - admin → /admin/* (排除 super-admin)                    │
│     - operator → /admin/page + /screen                       │
│     - viewer → 仅 /screen                                    │
├─────────────────────────────────────────────────────────────┤
│  3. 功能操作                                                 │
│     - 检查操作权限                                           │
│     - 锁定名单 → 仅 superadmin                               │
│     - 系统设置 → 仅 superadmin                               │
│     - 抽奖操作 → admin + operator                            │
├─────────────────────────────────────────────────────────────┤
│  4. 数据导出                                                 │
│     - 超级管理员数据 → 仅 superadmin                          │
│     - 普通数据 → admin                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 扩展与维护

### 新增数据表

1. 在 `src/lib/db/types.ts` 定义类型
2. 在 `LotteryDB` interface 添加表定义
3. 在 `upgrade()` 函数添加创建逻辑
4. 递增 `DB_VERSION`
5. 添加 CRUD 操作函数

### 新增抽奖模式

1. 在 `DrawMode` 类型添加新模式
2. 在 `DrawEngine.draw()` 添加模式处理
3. 实现新的抽奖算法方法

### 新增视觉特效

1. 创建新的 Canvas 组件或函数
2. 在 `screen/page.tsx` 集成调用
3. 注意性能优化（requestAnimationFrame）

---

## 性能优化清单

### 已实施优化

| 优化项 | 实施方式 | 效果 |
|--------|----------|------|
| 音效卡顿 | 预生成 AudioBuffer 池 | 解决 540+ 人时卡顿 |
| 粒子性能 | requestAnimationFrame | 流畅 60fps |
| 数据导入 | 批量事务处理 | 快速导入 |
| 大屏渲染 | CSS transform 优化 | 减少 CPU 计算 |

### 性能监控点

- 抽奖过程音效播放流畅度
- 粒子动画帧率
- 数据导入速度
- 大屏渲染响应时间