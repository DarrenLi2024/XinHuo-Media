# SPEC.md - 抽奖系统技术规格文档

> 本文档详细定义抽奖系统的功能规格、接口契约、数据结构与业务规则，供 AI 工具精准实现与验证。

---

## 1. 功能规格总览

### 1.1 系统定位
大型活动现场智能抽奖管理系统，支持 500-1000 人规模，浏览器独立运行。

### 1.2 核心功能模块

| 模块 | 功能描述 | 页面路径 |
|------|----------|----------|
| 大屏展示 | 炫酷抽奖动画、实时中奖展示 | `/screen` |
| 参会人员管理 | 导入、编辑、黑名单管理 | `/admin/attendees` |
| 奖项管理 | 奖项创建、编辑、删除、排序 | `/admin/prizes` |
| 锁定中奖管理 | 预设中奖人员、生效时间 | `/admin/locked-winners` |
| 抽奖记录 | 历史中奖记录查询、弃奖补位 | `/admin/draw-records` |
| 用户管理 | 四级权限用户管理 | `/admin/users` |
| 活动信息配置 | 名称、主题、LOGO、底部信息 | `/admin/event-info` |
| 系统设置 | 数据清理、导出、配置 | `/admin/settings` |

### 1.3 权限等级

| 角色 | 权限范围 | 角色值 |
|------|----------|--------|
| superadmin | 全部功能 + 超级管理页面 | `superadmin` |
| admin | `/admin/*`（排除 super-admin） | `admin` |
| operator | `/admin/page` + `/screen` | `operator` |
| viewer | 仅 `/screen` | `viewer` |

---

## 2. 数据结构规格

### 2.1 用户 (User)

```typescript
interface User {
  id: string;                    // UUID
  username: string;              // 登录用户名
  password: string;              // 密码（当前明文存储）
  role: 'superadmin' | 'admin' | 'operator' | 'viewer';  // 权限角色
  createdAt: string;             // ISO 8601 时间戳
  updatedAt: string;             // ISO 8601 时间戳
}
```

### 2.2 参会人员 (Attendee)

```typescript
interface Attendee {
  id: string;                    // UUID
  name: string;                  // 姓名（必填）
  company: string;               // 公司/单位名称
  tableNumber: string;           // 桌号
  phone: string;                 // 手机号
  email: string;                 // 邮箱
  isBlacklisted: boolean;        // 是否黑名单（黑名单永远不中任何奖项）
  createdAt: string;             // ISO 8601 时间戳
  updatedAt: string;             // ISO 8601 时间戳
}
```

**业务规则**：
- `isBlacklisted = true` 的人员从所有抽奖池排除
- 黑名单人员不参与滚动展示，也不参与最终抽奖

### 2.3 奖项 (Prize)

```typescript
interface Prize {
  id: string;                    // UUID
  name: string;                  // 奖项名称（必填）
  order: number;                 // 抽奖顺序（升序执行）
  drawCount: number;             // 本奖项抽取人数
  image?: string;                // 奖品图片URL
  sponsor?: string;              // 赞助商名称
  description?: string;          // 奖项描述
  createdAt: string;             // ISO 8601 时间戳
  updatedAt: string;             // ISO 8601 时间戳
}
```

**业务规则**：
- `order` 决定抽奖顺序，从最小值开始
- `drawCount` 决定本轮奖项抽取的人数上限
- 已抽完的奖项（剩余名额为0）不可再次抽奖

### 2.4 锁定中奖人员 (LockedWinner)

```typescript
interface LockedWinner {
  id: string;                    // UUID
  prizeId: string;               // 关联奖项ID（外键）
  attendeeId: string;            // 关联参会人员ID（外键）
  attendeeName: string;          // 参会人员姓名（冗余存储，用于显示）
  effectStartTime: string;       // 生效开始时间（ISO 8601）
  effectEndTime: string;         // 生效结束时间（ISO 8601）
  createdAt: string;             // ISO 8601 时间戳
  updatedAt: string;             // ISO 8601 时间戳
}
```

**业务规则（围栏保护机制）**：
1. **围栏排除**：锁定名单人员（无论是否在生效时间）都从常规抽奖池排除
2. **生效锁定**：只有在生效时间范围内（`effectStartTime` ≤ 当前时间 ≤ `effectEndTime`），锁定人员才通过锁定机制中奖
3. **时间判断**：使用 `new Date(effectStartTime)` 和 `new Date(effectEndTime)` 与 `new Date()` 比较
4. **数量限制**：同一奖项的锁定人数不能超过 `prize.drawCount`

### 2.5 抽奖记录 (DrawRecord)

```typescript
interface DrawRecord {
  id: string;                    // UUID
  prizeId: string;               // 关联奖项ID
  prizeName: string;             // 奖项名称（冗余存储）
  attendeeId: string;            // 中奖人员ID
  attendeeName: string;          // 中奖人员姓名
  attendeeCompany: string;       // 中奖人员公司
  attendeeTableNumber: string;   // 中奖人员桌号
  drawTime: string;              // 抽奖时间（ISO 8601）
  isAbandoned: boolean;          // 是否弃奖
  replacedBy?: string;           // 补位人员ID（弃奖后补位）
  replacedByName?: string;       // 补位人员姓名
  replacedTime?: string;         // 补位时间
  createdAt: string;             // ISO 8601 时间戳
  updatedAt: string;             // ISO 8601 时间戳
}
```

**业务规则**：
- 正常中奖：`isAbandoned = false`，无补位信息
- 弃奖：`isAbandoned = true`，可选补位人员
- 补位后：补位人员从中奖名单显示，原弃奖人员标记弃奖状态

### 2.6 活动信息 (EventInfo)

```typescript
interface EventInfo {
  id: string;                    // 固定为 'event-info'
  eventName: string;             // 活动名称
  theme: 'tech-blue' | 'golden' | 'red-gold';  // 主题风格
  organizer: string;             // 主办方名称
  logo?: string;                 // LOGO图片URL（对象存储）
  footerText: string;            // 底部信息文本
  createdAt: string;             // ISO 8601 时间戳
  updatedAt: string;             // ISO 8601 时间戳
}
```

---

## 3. 抽奖引擎规格

### 3.1 核心流程

```
┌─────────────────────────────────────────────────────────────┐
│                     抽奖引擎流程                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 选择奖项 → 2. 检查可抽性 → 3. 准备抽奖池                  │
│                                                             │
│                    ┌─────────────┐                          │
│                    │  围栏保护   │                          │
│                    │  排除锁定   │                          │
│                    │  排除黑名单 │                          │
│                    │  排除已中奖 │                          │
│                    └─────────────┘                          │
│                          ↓                                  │
│                    ┌─────────────┐                          │
│                    │  生效锁定   │                          │
│                    │  优先中奖   │                          │
│                    └─────────────┘                          │
│                          ↓                                  │
│  4. 滚动展示 → 5. 最终抽奖 → 6. 记录结果                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 抽奖池构建规则

```typescript
// 抽奖池构建伪代码
function buildDrawPool(prize, attendees, lockedWinners, drawRecords) {
  
  // 1. 获取围栏保护人员（锁定名单，无论是否在生效时间）
  const fencedNames = getFencedNames(lockedWinners);
  
  // 2. 获取黑名单人员
  const blacklistedNames = getBlacklistedNames(attendees);
  
  // 3. 获取已中奖人员
  const wonNames = getWonNames(drawRecords);
  
  // 4. 构建常规抽奖池（排除上述三类人员）
  const regularPool = attendees.filter(a => 
    !fencedNames.includes(a.name) &&
    !blacklistedNames.includes(a.name) &&
    !wonNames.includes(a.name)
  );
  
  // 5. 获取当前生效的锁定中奖人员
  const now = new Date();
  const effectLockedWinners = lockedWinners.filter(lw =>
    lw.prizeId === prize.id &&
    new Date(lw.effectStartTime) <= now &&
    new Date(lw.effectEndTime) >= now
  );
  
  return {
    regularPool,           // 常规抽奖池
    effectLockedWinners    // 生效锁定人员（优先中奖）
  };
}
```

### 3.3 抽奖执行规则

```typescript
// 抽奖执行伪代码
function executeDraw(prize, pool) {
  const winners = [];
  
  // 1. 优先处理生效锁定人员
  const lockedCount = Math.min(
    pool.effectLockedWinners.length,
    prize.drawCount
  );
  
  for (let i = 0; i < lockedCount; i++) {
    winners.push(pool.effectLockedWinners[i]);
  }
  
  // 2. 从常规池随机抽取剩余名额
  const remainingCount = prize.drawCount - lockedCount;
  
  if (remainingCount > 0 && pool.regularPool.length > 0) {
    // Fisher-Yates 洗牌算法
    const shuffled = shuffleArray(pool.regularPool);
    
    for (let i = 0; i < Math.min(remainingCount, shuffled.length); i++) {
      winners.push(shuffled[i]);
    }
  }
  
  return winners;
}
```

### 3.4 滚动展示规则

```typescript
// 滚动展示伪代码
function getRollingAttendees(attendees, lockedWinners, drawRecords, count) {
  
  // 排除围栏保护人员（锁定名单）
  const fencedNames = getFencedNames(lockedWinners);
  
  // 排除黑名单人员
  const blacklistedNames = getBlacklistedNames(attendees);
  
  // 排除已中奖人员
  const wonNames = getWonNames(drawRecords);
  
  // 构建滚动展示池
  const rollingPool = attendees.filter(a =>
    !fencedNames.includes(a.name) &&
    !blacklistedNames.includes(a.name) &&
    !wonNames.includes(a.name)
  );
  
  // 随机选择 count 个人员用于展示
  return shuffleArray(rollingPool).slice(0, count);
}
```

---

## 4. 音效系统规格

### 4.1 音效类型定义

| 音效类型 | 触发时机 | 音效特点 |
|----------|----------|----------|
| `rolling` | 抽奖滚动过程 | 300-600Hz sine波，50-100ms，轻快灵动 |
| `winner` | 中奖确认 | 渐进式欢快音调，持续欢呼 |
| `firework` | 烟花特效 | 爆炸音效，低频震动 |
| `shatter` | 卡牌碎裂 | 玻璃破碎声，快速下降音调 |
| `surprise` | 重抽惊喜 | 强化版中奖音效 |

### 4.2 AudioManager 类规格

```typescript
class AudioManager {
  private audioContext: AudioContext | null;
  private volume: number;                        // 音量配置 (0-1)
  private rollingBufferPool: AudioBuffer[];      // 滚动音效缓冲区池（30个）
  private rollSoundInterval: NodeJS.Timeout | null;
  
  // 核心方法
  init(): void;                                  // 初始化 AudioContext
  warmup(): void;                                // 预生成 AudioBuffer 缓冲区池
  setVolume(vol: number): void;                  // 设置音量
  playStartDrawSound(): void;                    // 开始滚动音效
  stopRollSound(): void;                         // 停止滚动音效
  playWinSound(): void;                          // 中奖音效
  playFireworkSound(): void;                     // 烟花音效
  playShatterSound(): void;                      // 碎裂音效
  release(): void;                               // 释放资源
}
```

### 4.3 音效生成规格

```typescript
// 滚动音效缓冲区生成规格
function createRollingBuffer(audioContext: AudioContext): AudioBuffer {
  const duration = 0.05 + Math.random() * 0.05;  // 50-100ms
  const frequency = 300 + Math.random() * 300;   // 300-600Hz
  
  const sampleRate = audioContext.sampleRate;
  const length = duration * sampleRate;
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    // sine 波形 + 指数衰减包络
    const envelope = Math.exp(-t * 20);
    data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
  }
  
  return buffer;
}
```

### 4.4 性能要求

| 指标 | 要求 | 说明 |
|------|------|------|
| 预生成缓冲区数量 | ≥ 30个 | 避免重复单调 |
| 播放间隔 | 80-120ms | 轻快灵动节奏 |
| 单次抽奖创建节点数 | ≤ 0个 | 全部使用预生成 buffer |
| 内存占用 | ≤ 5MB | 30个 buffer 约占用 1-2MB |

---

## 5. 视觉特效规格

### 5.1 粒子地球仪

```typescript
interface ParticleSphereConfig {
  particleCount: number;         // 粒子数量（500-1000）
  particleSize: number;          // 粒子大小（2-4px）
  sphereRadius: number;          // 球体半径（视口比例）
  rotationSpeed: number;         // 旋转速度（rad/s）
  surgeAmplitude: number;        // 涌动幅度（px）
  surgeFrequency: number;        // 涌动频率（Hz）
  colors: string[];              // 粒子颜色（主题色渐变）
}
```

**斐波那契球面分布算法**：
```typescript
function fibonacciSphereDistribution(count: number): Vector3[] {
  const points = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  
  for (let i = 0; i < count; i++) {
    const theta = 2 * Math.PI * i / goldenRatio;
    const phi = Math.acos(1 - 2 * (i + 0.5) / count);
    
    points.push({
      x: Math.sin(phi) * Math.cos(theta),
      y: Math.sin(phi) * Math.sin(theta),
      z: Math.cos(phi)
    });
  }
  
  return points;
}
```

### 5.2 烟花特效

```typescript
interface FireworkConfig {
  particleCount: number;         // 烟花粒子数（100-200）
  explosionRadius: number;       // 爆炸半径（px）
  particleSpeed: number;         // 粒子速度
  particleLife: number;          // 粒子生命周期（ms）
  colors: string[];              // 烟花颜色
  gravity: number;               // 重力加速度
}
```

### 5.3 卡牌碎裂特效

```typescript
interface ShatterConfig {
  fragmentCount: number;         // 碎片数量（30-50）
  fragmentSize: number;          // 碎片大小（px）
  shatterDuration: number;       // 碎裂时长（ms）
  scatterRadius: number;         // 散开半径（px）
  fadeOutDuration: number;       // 消失时长（ms）
}
```

---

## 6. API 接口规格

### 6.1 同步接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/sync/events` | GET | SSE 实时事件推送 |
| `/api/sync/save` | POST | 保存抽奖结果 |
| `/api/sync/export` | GET | 导出抽奖数据 |

### 6.2 SSE 事件类型

```typescript
interface SSEEvent {
  type: 'draw_start' | 'draw_winner' | 'draw_complete' | 'draw_abandon';
  data: {
    prizeId: string;
    prizeName: string;
    winners?: WinnerInfo[];
    timestamp: string;
  };
}
```

---

## 7. 前端组件规格

### 7.1 中奖卡牌 (ShatterCard)

```typescript
interface ShatterCardProps {
  winner: {
    name: string;
    company: string;
    tableNumber: string;
  };
  isLatest: boolean;             // 是否最新中奖（发光脉冲）
  isReplaced: boolean;           // 是否补位中奖（金色持续发光）
  theme: ThemeConfig;
}
```

### 7.2 奖项侧边栏 (PrizeSidebar)

```typescript
interface PrizeSidebarProps {
  prizes: Prize[];
  currentPrizeId: string | null;
  onSelectPrize: (prizeId: string) => void;
  getRemainingCount: (prizeId: string) => number;
}
```

### 7.3 状态机定义

```typescript
type DrawState = 
  | 'waiting'      // 等待抽奖
  | 'rolling'      // 滚动展示
  | 'winner'       // 中奖展示
  | 'abandoning'   // 弃奖处理
  | 'completed';   // 抽奖完成

interface DrawStateMachine {
  state: DrawState;
  transition: (action: DrawAction) => DrawState;
}

type DrawAction =
  | 'START_DRAW'
  | 'STOP_ROLLING'
  | 'CONFIRM_WINNER'
  | 'ABANDON_WINNER'
  | 'COMPLETE_PRIZE';
```

---

## 8. IndexedDB 规格规格

### 8.1 数据库配置

```typescript
const DB_NAME = 'LotteryDB';
const DB_VERSION = 4;             // Schema 版本号（随表结构变化递增）
```

### 8.2 表结构

| 表名 | 主键 | 索引 |
|------|------|------|
| `users` | `id` | `username` |
| `attendees` | `id` | `name`, `company`, `tableNumber` |
| `prizes` | `id` | `order` |
| `lockedWinners` | `id` | `prizeId`, `attendeeId` |
| `drawRecords` | `id` | `prizeId`, `attendeeId`, `drawTime` |
| `eventInfo` | `id` | - |

### 8.3 版本迁移

```typescript
// DB_VERSION 升级时需添加迁移逻辑
function upgrade(db: IDBDatabase, oldVersion: number) {
  if (oldVersion < 1) {
    // 创建初始表结构
  }
  if (oldVersion < 2) {
    // 新增字段/索引
  }
  // ...
}
```

---

## 9. 安全与权限规格

### 9.1 权限验证流程

```typescript
function checkPermission(user: User, path: string): boolean {
  const role = user.role;
  
  // superadmin: 全部权限
  if (role === 'superadmin') return true;
  
  // viewer: 仅 screen
  if (role === 'viewer') return path.startsWith('/screen');
  
  // operator: screen + admin/page
  if (role === 'operator') {
    return path.startsWith('/screen') || path === '/admin/page';
  }
  
  // admin: admin/*（排除 super-admin）
  if (role === 'admin') {
    return path.startsWith('/admin') && !path.includes('super-admin');
  }
  
  return false;
}
```

### 9.2 敏感信息保护

| 信息类型 | 保护措施 |
|----------|----------|
| 超级管理员存在 | 移除所有提示，改为"联系系统管理员" |
| 锁定名单页面 | 仅 superadmin 可见 |
| 用户密码 | 当前明文存储（仅演示），生产应加密 |
| 数据导出 | 需 superadmin/admin 权限 |

---

## 10. 测试验收规格

### 10.1 功能测试清单

| 测试项 | 验收标准 |
|--------|----------|
| 参会人员导入 | 支持Excel导入，≥500人无卡顿 |
| 黑名单生效 | 黑名单人员不参与任何抽奖 |
| 围栏保护生效 | 锁定人员不在常规池滚动展示 |
| 生效锁定中奖 | 生效时间内锁定人员必定中奖 |
| 抽奖音效 | 全程轻快灵动，无凝滞延迟 |
| 粒子动画 | 1000粒子流畅运行，帧率≥30fps |
| 烟花特效 | 爆炸动画流畅，无性能问题 |
| 数据持久化 | IndexedDB数据正确存储与读取 |
| 权限验证 | 各角色权限范围正确生效 |

### 10.2 性能指标

| 指标 | 要求 |
|------|------|
| 参会人员上限 | ≥1000人 |
| 粒子数量上限 | ≥1000个 |
| 抽奖响应时间 | ≤500ms |
| 音效延迟 | ≤50ms |
| 页面帧率 | ≥30fps |
| IndexedDB 操作 | ≤100ms |

---

## 11. 扩展与维护

### 11.1 新增数据字段流程

1. 在 `src/lib/db/types.ts` 添加类型定义
2. 在 `src/lib/db/index.ts` 的 `upgrade()` 中添加迁移
3. 递增 `DB_VERSION`
4. 更新相关 CRUD 操作函数

### 11.2 新增奖项配置项流程

1. 修改 `Prize` 类型
2. 更新奖项管理页面 UI
3. 同步修改抽奖引擎逻辑

### 11.3 新增音效流程

1. 在 `AudioManager` 中添加方法
2. 预生成 AudioBuffer（性能优化）
3. 在 screen/page.tsx 中调用

---

## 附录：关键业务规则速查

| 规则 | 描述 |
|------|------|
| 围栏保护 | 锁定名单人员无论是否在生效时间，都从常规抽奖池排除 |
| 生效锁定 | 只有在生效时间内才通过锁定机制中奖 |
| 黑名单排除 | 黑名单人员永远不中任何奖项 |
| 数量限制 | 同一奖项锁定人数不能超过 drawCount |
| 滚动排除 | 滚动展示池也排除围栏保护和黑名单人员 |