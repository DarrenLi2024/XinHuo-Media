# 会务系统核心模块复刻说明：大屏抽奖

## 1. 模块定位

来源附件：`会务系统-大屏抽奖.tar.gz`

该模块是一个独立 Next.js 抽奖系统，包含管理后台、抽奖大屏、中奖记录、奖项配置、参会人管理、锁定中奖人、黑名单、主题和数据同步。复刻集成时应作为本系统“抽奖系统”的高精度参考，而不是只复刻简单随机抽奖。

核心目标：

- 后台配置参会人、奖项、活动信息、锁定中奖人和系统设置。
- 大屏执行滚动抽奖、停止抽奖、展示中奖卡片、弃奖、补抽、音效和粒子特效。
- 保证中奖规则可控：当前奖项不重复、可选跨奖项重复、黑名单永不中奖、锁定中奖人在生效时间内必中。
- 支持本地 IndexedDB 与服务器文件同步，避免单浏览器数据孤岛。

## 2. 原项目结构

技术栈：

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- shadcn/ui
- framer-motion
- IndexedDB
- xlsx

关键入口：

- `/screen`：抽奖大屏
- `/admin`：后台仪表盘
- `/admin/attendees`：参会名单
- `/admin/prizes`：奖项配置
- `/admin/records`：中奖记录
- `/admin/locked-winners`：锁定中奖/黑名单
- `/admin/event-info`：活动信息
- `/admin/settings`：系统设置
- `/api/sync/load`、`/api/sync/save`、`/api/sync/reset`、`/api/sync/events`：数据同步

关键组件：

- `ParticleSphere`：粒子球/大屏氛围视觉
- `PrizeSidebar`：奖项侧栏与剩余数量
- `ShatterCard`：中奖卡片碎裂/弃奖动效

核心逻辑：

- `DrawEngine.draw()`：抽奖规则引擎
- `audioManager`：滚动、开始、停止、中奖音效
- `getAllAttendees()`、`getPrizesByOrder()`、`createDrawRecord()`：IndexedDB 数据访问

## 3. 核心数据模型

复刻时应映射到本系统现有表或 API：

```ts
type Attendee = {
  id: string;
  name: string;
  company?: string;
  role?: string;
  tableNumber?: string;
  seatNumber?: string;
  phone?: string;
  hasWon: boolean;
  prizeName?: string;
  isLocked?: boolean;
};

type Prize = {
  id: string;
  name: string;       // 奖项名：一等奖、二等奖
  level: number;      // 抽奖排序等级
  prizeName: string;  // 奖品名：iPhone、礼盒
  sponsor?: string;
  imageUrl?: string;
  value?: string;
  quantity: number;
  drawCount: number;  // 单次抽取人数
  allowRepeat: boolean;
  order: number;
  drawByTable: boolean;
  excludeIds?: string[];
};

type LockedWinner = {
  id: string;
  name: string;
  company?: string;
  prizeIds: string[];
  effectTimeStart?: Date;
  effectTimeEnd?: Date;
  isBlacklist?: boolean;
};

type DrawRecord = {
  id: string;
  prizeId: string;
  prizeLevelName: string;
  prizeName: string;
  sponsorName?: string;
  prizeLevel: number;
  attendeeIds: string[];
  abandonedAttendeeIds: string[];
  drawTime: Date;
  drawMode: 'random' | 'weighted' | 'controlled';
  operatorId: string;
  operatorName: string;
};
```

## 4. 必须复刻的功能点

抽奖规则：

- 同一奖项内，已经中过该奖项的人不能再次中同一奖项。
- `allowRepeat=false` 的奖项中奖者，不参与其他不可重复奖项。
- `allowRepeat=true` 的奖项只排除当前奖项已中奖者。
- 黑名单人员永远不中奖。
- 锁定中奖人不参与常规抽奖；只有在生效时间内，且绑定当前奖项时，才进入必中逻辑。
- 锁定中奖人随机插入中奖名单，避免固定出现在第一位。
- 可扩展 weighted 模式，但当前原项目实际仍使用随机抽取。

大屏交互：

- 等待态、滚动态、中奖态三态切换。
- 开始抽奖后姓名滚动，停止后生成中奖卡片。
- 支持多中奖卡片槽位，弃奖后保留空槽并补抽。
- 弃奖记录进入 `abandonedAttendeeIds`，不计入有效中奖人数。
- 奖项剩余数量按有效中奖人数计算：`attendeeIds.length - abandonedAttendeeIds.length`。
- 支持粒子背景、音效、中奖卡片动画、碎裂卡片效果。

后台能力：

- 导入/维护参会人。
- 配置奖项、奖品、数量、单次抽取人数、是否允许重复中奖、排序。
- 查看和导出中奖记录。
- 超级管理员维护锁定中奖和黑名单。
- 配置主题、音量、音效、同步策略。

数据同步：

- 客户端 IndexedDB 为主存储。
- `/api/sync/save` 将完整数据保存到服务器文件。
- `/api/sync/load` 从服务器恢复数据。
- `/api/sync/events` 用于通知前端数据更新。

## 5. 集成到当前系统的建议

当前系统已有 `/lottery`、`/screen` 和 `/api/lottery`，但需要补齐以下能力：

- 将 `lottery_prizes` 扩展为支持 `draw_count`、`allow_repeat`、`order`、`sponsor`、`image_url`、`exclude_ids`。
- 新增或扩展 `lottery_winners`，保存一次抽奖的完整记录，而不是只保存单个中奖人。
- 新增 `lottery_locked_winners`，包含姓名、公司、奖项范围、生效时间、黑名单标记。
- `/api/lottery` 增加“开始/确认抽奖”的事务接口，服务端执行规则，前端只负责动画展示。
- 大屏和后台必须共用同一数据源，不能各自维护本地状态。

推荐接口：

```http
GET  /api/lottery?event_id=...
POST /api/lottery/draw
POST /api/lottery/records/:id/abandon
POST /api/lottery/records/:id/redraw
GET  /api/lottery/locked-winners?event_id=...
POST /api/lottery/locked-winners
```

`POST /api/lottery/draw` 请求体：

```json
{
  "event_id": "uuid",
  "prize_id": "uuid",
  "mode": "random"
}
```

返回体：

```json
{
  "record": {
    "id": "uuid",
    "prize_id": "uuid",
    "attendee_ids": ["uuid"],
    "abandoned_attendee_ids": [],
    "draw_time": "ISO"
  },
  "winners": []
}
```

## 6. 复刻验收清单

- 后台创建奖项后，大屏奖项侧栏立即能看到。
- 已签到人员进入抽奖池，未签到人员默认不参与。
- 同一奖项重复抽奖时，不会抽到该奖项已有有效中奖人。
- 黑名单人员不会出现在滚动名单和中奖名单。
- 锁定中奖人在生效时间内必中，非生效时间不会中奖。
- 弃奖后奖项剩余名额恢复，补抽只补空槽。
- 刷新页面后中奖记录、奖项剩余数量、弃奖状态不丢失。
- 管理后台和大屏同时打开时，数据状态一致。
