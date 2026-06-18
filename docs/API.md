# API 接口文档

所有 API 基础路径为 `/api`，返回格式统一为 JSON。

## 通用规范

### 请求格式

- Content-Type: `application/json`
- 认证: Cookie-based Session（`credentials: 'include'`）

### 响应格式

```typescript
// 成功
{
  "data": T,                    // 响应数据
  "pagination"?: {              // 分页信息（列表接口）
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}

// 错误
{
  "error": string               // 错误描述
}
```

### 角色权限

| 角色 | Key | 权限范围 |
|------|-----|---------|
| 超级管理员 | `super_admin` | 全部操作 |
| 活动管理者 | `event_manager` | 管理所属活动 |
| 执行者 | `executor` | 执行操作（签到、抽奖等） |
| 工作人员 | `staff` | 只读查看 |
| 供应商 | `supplier` | 有限访问 |
| 嘉宾 | `guest` | 嘉宾端功能 |

---

## 一、认证模块 `/api/auth`

### POST `/api/auth/login` — 登录

**请求体：**
```json
{
  "email": "string (邮箱)",
  "password": "string (密码)"
}
```

**响应：**
```json
{
  "data": {
    "user": { "id": "...", "email": "...", "name": "...", "role": "...", "status": "..." },
    "token": "string",
    "refreshToken": "string",
    "expiresIn": number
  }
}
```

**注意：** 未配置 Supabase 时使用 Demo 模式，任意邮箱密码均可登录。

### GET `/api/auth/me` — 获取当前用户

**响应：**
```json
{
  "data": {
    "user": { "id": "...", "email": "...", "name": "...", "role": "...", "avatar_url": "..." }
  }
}
```

### POST `/api/auth/logout` — 登出

清除 Cookie，无返回体。

### POST `/api/auth/register` — 注册（管理员专用）

---

## 二、活动管理 `/api/events`

### GET `/api/events` — 获取活动列表

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `status` | string | 按状态筛选 |
| `search` | string | 搜索活动名称/地点 |
| `page` | number | 页码（默认 1） |
| `limit` | number | 每页数量（默认 10，最大 100） |

**响应：** 分页活动列表，含 `event_tasks` 和 `guests` 关联计数。

**权限：** 普通用户仅返回关联的活动；`super_admin` 可查看全部。

### POST `/api/events` — 创建活动

**请求体：**
```json
{
  "name": "string (活动名称)",
  "type": "annual_meeting | product_launch | seminar | appreciation | training | other",
  "description": "string?",
  "start_time": "ISO 8601",
  "end_time": "ISO 8601",
  "location": "string (地点)",
  "address": "string?",
  "expected_guests": "number?",
  "primary_customer_id": "uuid (主客户ID)",
  "budget": "number?",
  "settings": {
    "require_check_in": "boolean?",
    "allow_lottery": "boolean?",
    "enable_seating": "boolean?",
    "enable_script": "boolean?",
    "enable_report": "boolean?"
  }
}
```

**权限：** `super_admin`, `event_manager`

### GET `/api/events/[id]` — 获取活动详情

### PUT/PATCH `/api/events/[id]` — 更新活动

### GET `/api/events/[id]/customers` — 活动关联客户

### POST `/api/events/[id]/customers/[linkId]` — 添加活动客户关联

### GET `/api/events/[id]/sponsors` — 活动赞助商

---

## 三、客户管理 `/api/customers`

### GET `/api/customers` — 客户列表

支持 `search`, `status`, `intent_level`, `page`, `limit` 筛选。

### POST `/api/customers` — 创建客户

```json
{
  "organization_name": "string",
  "company_name": "string?",
  "industry_category": "string?",
  "cooperation_intent": "high | medium | low | none",
  "status": "lead | prospect | active | inactive | archived",
  "source": "string?",
  "address": "string?",
  "website": "string?",
  "tags": "string[]?"
}
```

### GET `/api/customers/[id]` — 客户详情

### PUT `/api/customers/[id]` — 更新客户

### GET `/api/customers/[id]/contacts` — 客户联系人列表

### POST `/api/customers/[id]/contacts` — 添加联系人

### PUT `/api/customers/[id]/contacts/[contactId]` — 更新联系人

### DELETE `/api/customers/[id]/contacts/[contactId]` — 删除联系人

### GET `/api/customers/[id]/events` — 客户关联活动

---

## 四、签到系统 `/api/checkin`

### GET `/api/checkin/stats` — 签到统计

**Query：** `event_id` (可选)

**响应：**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "checkedIn": 120,
    "notCheckedIn": 30,
    "checkInRate": 80,
    "byType": { "vip": 20, "normal": 130 },
    "byTypeChecked": { "vip": 18, "normal": 102 }
  }
}
```

### GET `/api/checkin/guests` — 嘉宾列表

### POST `/api/checkin/guests` — 添加嘉宾

### PUT `/api/checkin/guests/[id]` — 更新嘉宾

### DELETE `/api/checkin/guests/[id]` — 删除嘉宾

### POST `/api/checkin/guests-batch` — 批量操作嘉宾

### POST `/api/checkin/guests-import` — 批量导入嘉宾（Excel/CSV）

### GET `/api/checkin/guests-export` — 导出嘉宾列表

### POST `/api/checkin/checkin-action` — 执行签到操作

**请求体：**
```json
{
  "guestId": "string",
  "action": "checkin | undo"
}
```

### POST `/api/checkin/qrcode` — 生成嘉宾二维码

### GET `/api/checkin/history` — 签到历史记录

### POST `/api/checkin/print-escpos` — ESC/POS 小票打印

### GET `/api/checkin/stats-detailed` — 详细签到统计

### POST `/api/checkin/backup/export` — 备份导出

### POST `/api/checkin/backup/import` — 备份恢复

### POST `/api/checkin/checkin-clear` — 清除签到记录

### POST `/api/checkin/guests-clear` — 清除嘉宾名单

---

## 五、抽奖系统 `/api/lottery`

### POST `/api/lottery` — 获取抽奖可用嘉宾

**Query：** `event_id`

### POST `/api/lottery/draw` — 执行抽奖

### GET `/api/lottery/participants` — 获取参与者列表

### GET `/api/lottery/prizes` — 奖品列表

**Query：** `event_id`

### POST `/api/lottery/prizes` — 创建/更新奖品

### POST `/api/lottery/draw` — 抽奖接口

### GET `/api/lottery/history` — 抽奖历史记录

---

## 六、排座系统 `/api/seating`

### GET `/api/seating/guests` — 获取排座嘉宾

**Query：** `eventId`

### POST `/api/seating/tables` — 桌位列表

### POST `/api/seating/auto-arrange` — AI 自动排座

### PUT `/api/seating/route` — 更新排座

---

## 七、名单管理 `/api/roster`

### GET `/api/roster` — 获取名单

**Query：** `event_id`

**响应：** 包含 stats, exec_team, guests, sponsors, attendees。

---

## 八、任务管理 `/api/tasks`

### GET `/api/tasks` — 任务列表

**Query：** `event_id`, `status`, `assignee_id`, `priority`

### POST `/api/tasks` — 创建任务

### PUT `/api/tasks/[id]` — 更新任务

---

## 九、流程图本 `/api/scripts`

### GET `/api/scripts` — 流程图本列表

**Query：** `event_id`

### POST `/api/scripts` — 创建/更新图本

### PUT `/api/scripts/[id]` — 更新图本段落

---

## 十、表单管理 `/api/forms`

### GET `/api/forms` — 表单模板列表

**Query：** `event_id`

### POST `/api/forms` — 创建表单

### GET `/api/forms/[id]/submissions` — 表单提交记录

### POST `/api/forms/[id]/submissions` — 提交表单（公开）

---

## 十一、供应商管理 `/api/suppliers`

### GET `/api/suppliers` — 供应商列表

### POST `/api/suppliers` — 创建供应商

### GET `/api/suppliers/reviews` — 供应商评价

### POST `/api/suppliers/reviews` — 添加评价

---

## 十二、预算管理 `/api/budget`

### GET `/api/budget` — 预算列表

**Query：** `event_id`

### POST `/api/budget` — 创建/更新预算条目

---

## 十三、复盘报告 `/api/reports`

### GET `/api/reports` — 报告列表

**Query：** `event_id`

### POST `/api/reports` — 创建报告

### POST `/api/ai/generate-report` — AI 生成报告

**Query：** `event_id`

---

## 十四、用户管理 `/api/users`

### GET `/api/users` — 用户列表

### POST `/api/users` — 创建用户

### PUT `/api/users/[id]` — 更新用户

### PUT `/api/users/[id]/role` — 更新用户角色
