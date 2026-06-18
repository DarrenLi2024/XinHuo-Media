# 名单管理主数据接入审计

> 审计目标：各功能模块应从名单管理（Roster）读取统一主数据，消除数据孤岛。

---

## 现状：三套独立数据源并存

```
当前数据流：
  签到系统 ──→ lib/checkin/local-store (独立 GuestRow 表)
  抽奖系统 ──→ IndexedDB lottery/attendees (独立 Attendee 表)
  排座系统 ──→ demo-store seatingGuests (独立函数)
  名单管理 ──→ demo-store roster (AttendeeEntry/GuestEntry/ExecTeamMember)
```

**核心问题**：新增/编辑参会人要在 4 个不同地方各操作一遍，数据不互通。

---

## 模块逐一审计

### 1. 签到系统 `src/app/checkin/`

| 项 | 现状 | 改动 |
|----|------|------|
| **数据源** | `lib/checkin/local-store.ts` — 独立 GuestRow(8字段) | 改为从 `/api/roster?type=attendees` 读取参会人 |
| **嘉宾字段** | `name/phone/organization/guestType/tableNumber/qrCode` | 映射到 AttendeeEntry: name/phone/company/行业/座位号/checkin_status |
| **签到动作** | 本地 `checkInStatus=1` | PUT `/api/roster?type=attendees` → 更新 `checkin_status→checked_in` |
| **客人管理页** | 独立新增/批量导入/搜索/导出 | 保留搜索+导出功能，数据来自 roster API |
| **减少代码** | local-store.ts / schema.ts / supabase-store.ts 约 500 行可废弃 | 替换为约 30 行 API 调用 |

### 2. 抽奖系统 `src/app/(dashboard)/lottery/`

| 项 | 现状 | 改动 |
|----|------|------|
| **数据源** | IndexedDB `lottery/attendees` — 独立 Attendee(12字段) | 改为从 `/api/roster?type=attendees&status=checked_in` 读取 |
| **参会人管理页** | `attendees/page.tsx` — 独立增删改+Excel导入+平台导入 | 移除独立CRUD，改为"从名单同步"按钮 + 展示已签到人员 |
| **抽奖名单** | 基于 IndexedDB attendees  | 基于 roster attendees 中 `checkin_status=checked_in` + `lottery_eligible=true` |
| **同步逻辑** | `importFromPlatform()` 手动触发 | 自动从 roster API 读取，活动级别隔离 |
| **减少代码** | `lib/lottery/db/` 下 IndexedDB 操作约 300 行可简化为"只读+黑名单+中奖状态" | |

### 3. 智能排座 `src/app/(dashboard)/seating/`

| 项 | 现状 | 改动 |
|----|------|------|
| **数据源** | `listDemoSeatingGuests()` — 基于 guests 数组独立映射 | 改为从 `/api/roster?type=attendees` + `?type=guests` 读取 |
| **座位分配** | 独立 `Table.guests[]` 数据结构 | 更新 AttendeeEntry.table_id/seat_number / GuestEntry.seat_info |
| **人员池** | PersonPool 组件独立维护嘉宾列表 | 从 roster API 读取"待排座"人员 |
| **导入导出** | 独立 Excel 格式 | 统一到 roster 数据 |
| **减少代码** | demo-store 中 seating 相关函数约 200 行可简化 | 替换为 roster API 调用 |

### 4. 活动事件 `src/app/(dashboard)/events/`

| 项 | 现状 | 改动 |
|----|------|------|
| **活动详情页** | 展示 guests 数量等 | 从 roster stats API 读取各名单统计 |
| **活动列表** | 仅显示状态/时间/参会人数 | 增加名单概览快捷入口 |

### 5. 复盘报告 `src/app/(dashboard)/reports/`

| 项 | 现状 | 改动 |
|----|------|------|
| **签到统计** | 基于独立 checkin 数据 | 从 roster stats API 读取 |
| **嘉宾出席** | 无 | 从 roster guests 读取 confirmed/attended 数量 |
| **参会人数** | 基于独立 guests 数据 | 从 roster attendees 读取 total/checked_in |

---

## 审计结论

### 需要改动的文件

```
签到系统 (5 个文件):
  src/app/checkin/admin/page.tsx          → 加载数据源切换为 roster API
  src/app/checkin/entry/page.tsx          → 签到动作改为 PUT roster
  src/app/api/checkin/guests/route.ts     → GET 改读 roster
  src/app/api/checkin/checkin-action/route.ts → PUT 改写 roster attendee checkin_status
  src/app/api/checkin/guests-import/route.ts  → POST 改调 roster attendees_batch

抽奖系统 (3 个文件):
  src/app/(dashboard)/lottery/attendees/page.tsx → "同步名单"替换独立CRUD
  src/app/api/lottery/participants/route.ts      → GET 改读 roster checked_in attendees
  src/app/api/lottery/draw/route.ts              → 抽奖池从 roster 构建

排座系统 (2 个文件):
  src/app/api/seating/guests/route.ts            → GET 改读 roster
  src/app/(dashboard)/seating/page.tsx           → PersonPool 数据源切换

活动系统 (2 个文件):
  src/app/(dashboard)/events/[id]/page.tsx       → 增加名单统计入口
  src/app/(dashboard)/events/page.tsx            → 列表增加名单概览

复盘系统 (1 个文件):
  src/app/api/reports/route.ts                   → stats 从 roster 读取

侧边栏 (1 个文件):
  src/components/layout/sidebar.tsx              → 已修正
```

### 数据流的理想状态

```
                 ┌─────────────┐
                 │  名单管理    │  (统一主数据源)
                 │  /api/roster │
                 └──────┬──────┘
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   ┌─────────┐    ┌─────────┐    ┌─────────┐
   │ 签到系统 │    │ 抽奖系统 │    │ 排座系统 │
   │(读参会人)│    │(读已签到)│    │(读全员) │
   │(写签到态)│    │(写中奖态)│    │(写座位) │
   └─────────┘    └─────────┘    └─────────┘
```

所有模块的 `GET` 都从 `/api/roster` 读，`PUT` 也回写到 `/api/roster`。
