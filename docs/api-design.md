# 芯火会务管理系统 - API 接口设计

> **文档版本**：v1.0.0  
> **创建日期**：2025-01-15  
> **API 风格**：RESTful + WebSocket  
> **基础路径**：`/api/v1`

---

## 一、API 设计规范

### 1.1 接口命名规范

| 规则 | 示例 |
|------|------|
| 使用 RESTful 风格 | `GET /events`, `POST /events`, `PUT /events/:id` |
| 资源使用复数形式 | `/guests`, `/tasks`, `/prizes` |
| 层级关系使用嵌套 | `/events/:id/guests` |
| 操作动词放在路径中 | `/events/:id/publish`, `/guests/:id/check-in` |
| 版本号放在路径前 | `/api/v1/events` |

### 1.2 请求响应格式

**请求头**：
```http
Content-Type: application/json
Authorization: Bearer {token}
X-Session: {session_token}  // Supabase Auth Session
```

**成功响应**：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    // 业务数据
  },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**错误响应**：
```json
{
  "code": 400,
  "message": "参数错误",
  "error": {
    "type": "ValidationError",
    "details": [
      { "field": "name", "message": "活动名称不能为空" }
    ]
  },
  "requestId": "abc123"
}
```

### 1.3 状态码规范

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | 成功 | GET、PUT、PATCH 成功 |
| 201 | 创建成功 | POST 创建资源成功 |
| 204 | 无内容 | DELETE 成功 |
| 400 | 请求错误 | 参数校验失败 |
| 401 | 未认证 | 缺少认证信息或认证失效 |
| 403 | 无权限 | 认证成功但无操作权限 |
| 404 | 未找到 | 资源不存在 |
| 409 | 冲突 | 资源已存在或状态冲突 |
| 422 | 无法处理 | 业务规则校验失败 |
| 429 | 请求过多 | 请求频率超限 |
| 500 | 服务器错误 | 服务器内部错误 |
| 503 | 服务不可用 | 服务暂时不可用 |

### 1.4 分页规范

**请求参数**：
```
?page=1&pageSize=20&sort=createdAt&order=desc
```

**响应元数据**：
```json
{
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 二、认证授权接口

### 2.1 用户认证

#### 用户注册

```http
POST /api/v1/auth/register
```

**请求体**：
```json
{
  "email": "user@example.com",
  "phone": "13800138000",
  "password": "password123",
  "name": "用户姓名"
}
```

**响应**：
```json
{
  "code": 201,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户姓名"
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### 用户登录

```http
POST /api/v1/auth/login
```

**请求体**：
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应**：
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户姓名",
      "role": "event_manager",
      "avatar": "url"
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresIn": 3600
  }
}
```

#### 手机验证码登录

```http
POST /api/v1/auth/login/phone
```

**请求体**：
```json
{
  "phone": "13800138000",
  "code": "123456"
}
```

#### 发送验证码

```http
POST /api/v1/auth/sms/send
```

**请求体**：
```json
{
  "phone": "13800138000",
  "type": "login"  // login | register | reset_password
}
```

#### 刷新令牌

```http
POST /api/v1/auth/refresh
```

**请求体**：
```json
{
  "refreshToken": "refresh_token"
}
```

#### 获取当前用户

```http
GET /api/v1/auth/me
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "用户姓名",
    "role": "event_manager",
    "avatar": "url",
    "permissions": ["event:create", "event:read", "guest:*"]
  }
}
```

#### 退出登录

```http
POST /api/v1/auth/logout
```

---

## 三、活动管理接口

### 3.1 活动 CRUD

#### 创建活动

```http
POST /api/v1/events
```

**请求体**：
```json
{
  "name": "2025年度盛典",
  "type": "annual_meeting",
  "description": "公司年度总结与表彰大会",
  "startTime": "2025-02-15T09:00:00Z",
  "endTime": "2025-02-15T18:00:00Z",
  "location": "上海国际会议中心",
  "address": "上海市浦东新区...",
  "expectedGuests": 500,
  "coverImageUrl": "https://...",
  "budget": 100000,
  "settings": {
    "requireCheckIn": true,
    "allowLottery": true,
    "publicSeating": true
  },
  "tags": ["年度", "表彰", "行业"]
}
```

**响应**：
```json
{
  "code": 201,
  "message": "活动创建成功",
  "data": {
    "id": "event_uuid",
    "name": "2025年度盛典",
    "status": "draft",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

#### 获取活动列表

```http
GET /api/v1/events
```

**查询参数**：
```
?status=preparing&type=annual_meeting&page=1&pageSize=20
&startTime=2025-01-01&endTime=2025-12-31
&keyword=盛典
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "event_uuid",
        "name": "2025年度盛典",
        "type": "annual_meeting",
        "status": "preparing",
        "startTime": "2025-02-15T09:00:00Z",
        "endTime": "2025-02-15T18:00:00Z",
        "location": "上海国际会议中心",
        "expectedGuests": 500,
        "owner": {
          "id": "user_uuid",
          "name": "张三"
        },
        "statistics": {
          "guestCount": 450,
          "taskCount": 25,
          "completedTaskCount": 10
        }
      }
    ],
    "meta": {
      "page": 1,
      "pageSize": 20,
      "total": 50
    }
  }
}
```

#### 获取活动详情

```http
GET /api/v1/events/:id
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "id": "event_uuid",
    "name": "2025年度盛典",
    "type": "annual_meeting",
    "status": "preparing",
    "description": "...",
    "startTime": "2025-02-15T09:00:00Z",
    "endTime": "2025-02-15T18:00:00Z",
    "location": "上海国际会议中心",
    "address": "...",
    "expectedGuests": 500,
    "actualGuests": 450,
    "coverImageUrl": "...",
    "budget": 100000,
    "actualCost": 85000,
    "owner": {
      "id": "user_uuid",
      "name": "张三",
      "avatar": "..."
    },
    "members": [
      { "id": "...", "name": "...", "role": "manager" }
    ],
    "statistics": {
      "checkInRate": 85.5,
      "taskCompletionRate": 40,
      "budgetUsage": 85
    },
    "settings": {},
    "tags": [],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### 更新活动

```http
PUT /api/v1/events/:id
```

**请求体**：
```json
{
  "name": "2025年度盛典（修订版）",
  "expectedGuests": 550,
  "status": "preparing"
}
```

#### 删除活动

```http
DELETE /api/v1/events/:id
```

#### 发布活动

```http
POST /api/v1/events/:id/publish
```

#### 归档活动

```http
POST /api/v1/events/:id/archive
```

### 3.2 活动成员管理

#### 添加活动成员

```http
POST /api/v1/events/:id/members
```

**请求体**：
```json
{
  "userId": "user_uuid",
  "role": "executor",
  "permissions": ["guest:read", "task:update"]
}
```

#### 获取活动成员列表

```http
GET /api/v1/events/:id/members
```

#### 移除活动成员

```http
DELETE /api/v1/events/:id/members/:userId
```

#### 更新成员权限

```http
PUT /api/v1/events/:id/members/:userId
```

---

## 四、任务管理接口

### 4.1 任务 CRUD

#### 创建任务

```http
POST /api/v1/events/:eventId/tasks
```

**请求体**：
```json
{
  "title": "设计活动主视觉",
  "description": "根据活动主题设计主视觉海报、背景板等",
  "priority": "high",
  "startDate": "2025-01-20T00:00:00Z",
  "dueDate": "2025-02-01T00:00:00Z",
  "assignees": ["user_uuid_1", "user_uuid_2"],
  "tags": ["设计", "视觉"],
  "attachments": [
    { "url": "...", "name": "参考图.jpg", "type": "image" }
  ]
}
```

#### 获取任务列表

```http
GET /api/v1/events/:eventId/tasks
```

**查询参数**：
```
?status=in_progress&priority=high&assignee=user_uuid
&page=1&pageSize=20
```

#### 获取任务详情

```http
GET /api/v1/tasks/:id
```

#### 更新任务

```http
PUT /api/v1/tasks/:id
```

**请求体**：
```json
{
  "title": "设计活动主视觉（修订）",
  "progress": 60,
  "status": "in_progress"
}
```

#### 更新任务状态

```http
PATCH /api/v1/tasks/:id/status
```

**请求体**：
```json
{
  "status": "completed",
  "progress": 100,
  "completedAt": "2025-02-01T10:00:00Z"
}
```

#### 删除任务

```http
DELETE /api/v1/tasks/:id
```

### 4.2 任务评论

#### 创建任务评论

```http
POST /api/v1/tasks/:taskId/comments
```

**请求体**：
```json
{
  "content": "设计稿已更新，请查看附件",
  "attachments": [
    { "url": "...", "name": "设计稿v2.pdf" }
  ]
}
```

#### 获取任务评论列表

```http
GET /api/v1/tasks/:taskId/comments
```

#### 删除任务评论

```http
DELETE /api/v1/tasks/:taskId/comments/:id
```

### 4.3 任务统计

#### 获取任务统计

```http
GET /api/v1/events/:eventId/tasks/statistics
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "total": 25,
    "byStatus": {
      "pending": 5,
      "in_progress": 10,
      "completed": 8,
      "delayed": 2
    },
    "byPriority": {
      "high": 5,
      "medium": 15,
      "low": 5
    },
    "completionRate": 32,
    "overdueCount": 2,
    "dueTodayCount": 3,
    "dueThisWeekCount": 7
  }
}
```

---

## 五、嘉宾管理接口

### 5.1 嘉宾 CRUD

#### 批量导入嘉宾

```http
POST /api/v1/events/:eventId/guests/import
```

**请求体** (multipart/form-data)：
```
file: Excel/CSV 文件
```

**或 JSON 格式**：
```json
{
  "guests": [
    {
      "name": "张三",
      "phone": "13800138001",
      "email": "zhang@example.com",
      "company": "芯片公司A",
      "position": "CEO",
      "title": "executive",
      "vipLevel": 3,
      "groupId": "group_uuid"
    }
  ]
}
```

**响应**：
```json
{
  "code": 200,
  "message": "导入成功",
  "data": {
    "imported": 48,
    "skipped": 2,
    "errors": [
      { "row": 10, "message": "手机号格式错误" }
    ]
  }
}
```

#### 创建单个嘉宾

```http
POST /api/v1/events/:eventId/guests
```

**请求体**：
```json
{
  "name": "李四",
  "phone": "13800138002",
  "company": "芯片公司B",
  "position": "技术总监",
  "title": "manager",
  "vipLevel": 2,
  "specialNeeds": "需要轮椅通道"
}
```

#### 获取嘉宾列表

```http
GET /api/v1/events/:eventId/guests
```

**查询参数**：
```
?checkInStatus=false&vipLevel=3&groupId=group_uuid
&keyword=张&page=1&pageSize=50
```

#### 获取嘉宾详情

```http
GET /api/v1/guests/:id
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "id": "guest_uuid",
    "name": "张三",
    "phone": "138****3801",
    "email": "zhang@example.com",
    "company": "芯片公司A",
    "position": "CEO",
    "title": "executive",
    "vipLevel": 3,
    "group": {
      "id": "group_uuid",
      "name": "VIP嘉宾组"
    },
    "seat": {
      "id": "seat_uuid",
      "seatNumber": "A1",
      "tableNumber": "VIP桌"
    },
    "checkInStatus": true,
    "checkInTime": "2025-02-15T09:05:00Z",
    "qrCodeUrl": "...",
    "specialNeeds": null,
    "invitationStatus": "confirmed"
  }
}
```

#### 更新嘉宾

```http
PUT /api/v1/guests/:id
```

#### 删除嘉宾

```http
DELETE /api/v1/guests/:id
```

#### 批量删除嘉宾

```http
POST /api/v1/events/:eventId/guests/batch-delete
```

**请求体**：
```json
{
  "guestIds": ["uuid1", "uuid2", "uuid3"]
}
```

### 5.2 嘉宾分组

#### 创建嘉宾分组

```http
POST /api/v1/events/:eventId/guest-groups
```

**请求体**：
```json
{
  "name": "VIP嘉宾组",
  "description": "公司高管及重要客户",
  "color": "#FF6B6B"
}
```

#### 获取嘉宾分组列表

```http
GET /api/v1/events/:eventId/guest-groups
```

#### 更新嘉宾分组

```http
PUT /api/v1/guest-groups/:id
```

#### 删除嘉宾分组

```http
DELETE /api/v1/guest-groups/:id
```

### 5.3 嘉宾关系管理

#### 创建嘉宾关系

```http
POST /api/v1/events/:eventId/guest-relations
```

**请求体**：
```json
{
  "guestIdA": "guest_uuid_1",
  "guestIdB": "guest_uuid_2",
  "relationType": "colleague",
  "weight": 5,
  "notes": "同一部门同事"
}
```

#### 获取嘉宾关系列表

```http
GET /api/v1/events/:eventId/guest-relations
```

#### 删除嘉宾关系

```http
DELETE /api/v1/guest-relations/:id
```

### 5.4 嘉宾邀请

#### 发送邀请

```http
POST /api/v1/events/:eventId/guests/invite
```

**请求体**：
```json
{
  "guestIds": ["uuid1", "uuid2"],
  "channel": "sms"  // sms | email | wechat
}
```

#### 获取邀请统计

```http
GET /api/v1/events/:eventId/guests/invitation-statistics
```

---

## 六、排座管理接口

### 6.1 场地布局

#### 创建场地布局

```http
POST /api/v1/events/:eventId/venue-layouts
```

**请求体**：
```json
{
  "name": "主会场布局",
  "layoutType": "banquet",
  "totalSeats": 500,
  "tablesCount": 50,
  "seatsPerTable": 10,
  "stagePosition": { "x": 0, "y": 0, "width": 10, "height": 3 },
  "entrances": [
    { "x": 5, "y": 20, "name": "正门" }
  ],
  "layoutData": {
    // 详细布局数据
  }
}
```

#### 获取场地布局列表

```http
GET /api/v1/events/:eventId/venue-layouts
```

#### 获取场地布局详情

```http
GET /api/v1/venue-layouts/:id
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "id": "layout_uuid",
    "name": "主会场布局",
    "layoutType": "banquet",
    "totalSeats": 500,
    "tablesCount": 50,
    "seatsPerTable": 10,
    "stagePosition": {},
    "entrances": [],
    "seats": [
      {
        "id": "seat_uuid",
        "seatNumber": "T1-1",
        "tableNumber": "T1",
        "seatType": "vip",
        "status": "available",
        "x": 1.5,
        "y": 2.0,
        "guest": null
      }
    ]
  }
}
```

#### 更新场地布局

```http
PUT /api/v1/venue-layouts/:id
```

#### 删除场地布局

```http
DELETE /api/v1/venue-layouts/:id
```

### 6.2 座位管理

#### 获取座位列表

```http
GET /api/v1/venue-layouts/:layoutId/seats
```

**查询参数**：
```
?status=available&seatType=vip&tableNumber=T1
```

#### 更新座位状态

```http
PATCH /api/v1/seats/:id
```

**请求体**：
```json
{
  "status": "locked",
  "lockReason": "预留给嘉宾张三"
}
```

#### 批量更新座位

```http
POST /api/v1/venue-layouts/:layoutId/seats/batch-update
```

**请求体**：
```json
{
  "seatIds": ["seat1", "seat2"],
  "status": "vip",
  "guestIdMap": {
    "seat1": "guest1",
    "seat2": "guest2"
  }
}
```

### 6.3 智能排座

#### 设置排座规则

```http
POST /api/v1/events/:eventId/seating-rules
```

**请求体**：
```json
{
  "rules": [
    { "type": "vip_priority", "weight": 10, "params": { "frontRows": 3 } },
    { "type": "group_together", "weight": 8, "params": {} },
    { "type": "conflict_avoid", "weight": 9, "params": {} },
    { "type": "gender_balance", "weight": 5, "params": { "ratio": 0.5 } }
  ]
}
```

#### 获取排座规则

```http
GET /api/v1/events/:eventId/seating-rules
```

#### AI 智能排座

```http
POST /api/v1/events/:eventId/seating/generate
```

**请求体**：
```json
{
  "layoutId": "layout_uuid",
  "rules": [
    // 可覆盖默认规则
  ],
  "options": {
    "respectExisting": true,  // 保留已有座位安排
    "optimizeIterations": 100
  }
}
```

**响应**：
```json
{
  "code": 200,
  "message": "排座方案生成成功",
  "data": {
    "score": 85.5,
    "assignments": [
      {
        "seatId": "seat_uuid",
        "seatNumber": "T1-1",
        "guestId": "guest_uuid",
        "guestName": "张三"
      }
    ],
    "violations": [
      { "rule": "group_together", "description": "分组A有2人未同桌" }
    ],
    "suggestions": [
      "建议将VIP桌调整至舞台正前方"
    ]
  }
}
```

#### 应用排座方案

```http
POST /api/v1/events/:eventId/seating/apply
```

**请求体**：
```json
{
  "assignments": [
    { "seatId": "seat_uuid", "guestId": "guest_uuid" }
  ]
}
```

#### 手动调整座位

```http
POST /api/v1/seating/swap
```

**请求体**：
```json
{
  "seatIdA": "seat1",
  "seatIdB": "seat2"
}
```

#### 清空座位安排

```http
POST /api/v1/venue-layouts/:layoutId/seating/clear
```

#### 导出座位图

```http
GET /api/v1/venue-layouts/:layoutId/export
```

**查询参数**：
```
?format=pdf&includeGuests=true
```

---

## 七、签到管理接口

### 7.1 签到操作

#### 获取签到二维码

```http
GET /api/v1/events/:eventId/check-in/qrcode
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "qrCodeUrl": "...",
    "qrCodeData": "check_in_event_uuid",
    "expiresAt": "2025-02-15T18:00:00Z"
  }
}
```

#### 扫码签到

```http
POST /api/v1/check-in
```

**请求体**：
```json
{
  "eventCode": "check_in_event_uuid",
  "guestId": "guest_uuid",  // 可选，通过二维码自动识别
  "checkInPoint": "main_entrance"
}
```

**响应**：
```json
{
  "code": 200,
  "message": "签到成功",
  "data": {
    "guest": {
      "id": "guest_uuid",
      "name": "张三",
      "company": "芯片公司A",
      "seatNumber": "T1-1"
    },
    "checkInTime": "2025-02-15T09:05:00Z"
  }
}
```

#### 手动签到

```http
POST /api/v1/events/:eventId/guests/:guestId/manual-check-in
```

**请求体**：
```json
{
  "checkInPoint": "staff_area",
  "notes": "嘉宾忘记扫码，手动签到"
}
```

#### 补签

```http
POST /api/v1/events/:eventId/guests/:guestId/late-check-in
```

**请求体**：
```json
{
  "actualTime": "2025-02-15T09:30:00Z",
  "reason": "嘉宾迟到",
  "operatorId": "user_uuid"
}
```

#### 取消签到

```http
POST /api/v1/events/:eventId/guests/:guestId/cancel-check-in
```

### 7.2 签到统计

#### 获取签到统计

```http
GET /api/v1/events/:eventId/check-in/statistics
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "totalGuests": 500,
    "checkedIn": 350,
    "checkInRate": 70,
    "vipTotal": 50,
    "vipCheckedIn": 45,
    "vipCheckInRate": 90,
    "recentCheckIns": [
      {
        "guestId": "uuid",
        "name": "张三",
        "company": "芯片公司A",
        "checkInTime": "...",
        "avatar": "..."
      }
    ],
    "byCheckInPoint": {
      "main_entrance": 300,
      "vip_entrance": 50
    },
    "byHour": {
      "09:00": 150,
      "09:30": 100,
      "10:00": 100
    }
  }
}
```

#### 获取签到记录列表

```http
GET /api/v1/events/:eventId/check-in/records
```

**查询参数**：
```
?startTime=2025-02-15T09:00:00Z&endTime=2025-02-15T10:00:00Z
&page=1&pageSize=50
```

#### 导出签到数据

```http
GET /api/v1/events/:eventId/check-in/export
```

**查询参数**：
```
?format=excel
```

---

## 八、抽奖管理接口

### 8.1 奖品管理

#### 创建奖品

```http
POST /api/v1/events/:eventId/prizes
```

**请求体**：
```json
{
  "name": "一等奖",
  "description": "iPhone 15 Pro",
  "imageUrl": "...",
  "prizeLevel": "first",
  "quantity": 3,
  "value": 8999,
  "sponsor": "科技公司",
  "sponsorLogo": "...",
  "eligibility": {
    "vipOnly": false,
    "minVipLevel": 0,
    "excludeWinners": true
  },
  "drawMethod": "random",
  "animationType": "wheel"
}
```

#### 获取奖品列表

```http
GET /api/v1/events/:eventId/prizes
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "prize_uuid",
        "name": "一等奖",
        "prizeLevel": "first",
        "quantity": 3,
        "drawnCount": 0,
        "remaining": 3,
        "status": "active",
        "winners": []
      }
    ]
  }
}
```

#### 更新奖品

```http
PUT /api/v1/prizes/:id
```

#### 删除奖品

```http
DELETE /api/v1/prizes/:id
```

### 8.2 抽奖操作

#### 开始抽奖

```http
POST /api/v1/prizes/:prizeId/draw
```

**请求体**：
```json
{
  "count": 1,  // 本次抽取数量
  "animationDuration": 5000  // 动画时长（毫秒）
}
```

**响应**：
```json
{
  "code": 200,
  "message": "抽奖完成",
  "data": {
    "prize": {
      "id": "prize_uuid",
      "name": "一等奖",
      "prizeLevel": "first"
    },
    "winners": [
      {
        "guestId": "guest_uuid",
        "name": "张三",
        "company": "芯片公司A",
        "vipLevel": 2
      }
    ],
    "drawTime": "2025-02-15T11:30:00Z"
  }
}
```

#### 预设中奖名单

```http
POST /api/v1/prizes/:prizeId/preset-winners
```

**请求体**：
```json
{
  "guestIds": ["guest_uuid_1", "guest_uuid_2"]
}
```

#### 取消中奖

```http
POST /api/v1/lottery-records/:id/cancel
```

**请求体**：
```json
{
  "reason": "嘉宾无法领取，重新抽取"
}
```

### 8.3 抽奖统计

#### 获取抽奖记录

```http
GET /api/v1/events/:eventId/lottery/records
```

#### 获取中奖名单

```http
GET /api/v1/events/:eventId/lottery/winners
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "prize": { "name": "一等奖", "level": "first" },
        "winner": { "name": "张三", "company": "..." },
        "drawTime": "...",
        "pickupStatus": "pending"
      }
    ]
  }
}
```

#### 更新领奖状态

```http
PATCH /api/v1/lottery-records/:id/pickup
```

**请求体**：
```json
{
  "pickupStatus": "picked_up",
  "pickupLocation": "领奖台A"
}
```

---

## 九、台本管理接口

### 9.1 台本 CRUD

#### 创建台本

```http
POST /api/v1/events/:eventId/scripts
```

**请求体**：
```json
{
  "title": "2025年度盛典流程台本",
  "totalDuration": 480,  // 分钟
  "settings": {
    "timezone": "Asia/Shanghai",
    "remindersEnabled": true
  }
}
```

#### 获取台本列表

```http
GET /api/v1/events/:eventId/scripts
```

#### 获取台本详情

```http
GET /api/v1/scripts/:id
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "id": "script_uuid",
    "title": "2025年度盛典流程台本",
    "version": "v1.0",
    "status": "draft",
    "totalDuration": 480,
    "segments": [
      {
        "id": "segment_uuid",
        "segmentType": "opening",
        "title": "开场致辞",
        "startTime": "09:00:00",
        "endTime": "09:15:00",
        "duration": 15,
        "content": "...",
        "speakers": [{ "name": "张总", "role": "CEO" }],
        "assignees": ["user_uuid"],
        "executionStatus": "pending"
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### 更新台本

```http
PUT /api/v1/scripts/:id
```

#### 定稿台本

```http
POST /api/v1/scripts/:id/finalize
```

### 9.2 台本环节管理

#### 创建环节

```http
POST /api/v1/scripts/:scriptId/segments
```

**请求体**：
```json
{
  "segmentType": "speech",
  "title": "年度总结报告",
  "startTime": "09:15:00",
  "endTime": "09:45:00",
  "duration": 30,
  "content": "演讲内容大纲...",
  "speakers": [
    { "name": "李总", "role": "总经理", "company": "公司" }
  ],
  "equipment": {
    "audio": "主麦克风",
    "video": "主屏PPT",
    "lighting": "舞台灯光方案A"
  },
  "materials": [
    { "name": "PPT文件", "notes": "演讲人提供" }
  ],
  "assignees": ["user_uuid_1"],
  "sortOrder": 2
}
```

#### 获取环节列表

```http
GET /api/v1/scripts/:scriptId/segments
```

#### 更新环节

```http
PUT /api/v1/segments/:id
```

#### 删除环节

```http
DELETE /api/v1/segments/:id
```

#### 调整环节顺序

```http
POST /api/v1/scripts/:scriptId/segments/reorder
```

**请求体**：
```json
{
  "order": ["segment_uuid_1", "segment_uuid_2", "segment_uuid_3"]
}
```

### 9.3 台本执行

#### 开始执行

```http
POST /api/v1/scripts/:id/start-execution
```

#### 更新环节执行状态

```http
PATCH /api/v1/segments/:id/execution
```

**请求体**：
```json
{
  "executionStatus": "in_progress",
  "actualStartTime": "2025-02-15T09:00:00Z"
}
```

#### 完成环节

```http
POST /api/v1/segments/:id/complete
```

**请求体**：
```json
{
  "actualEndTime": "2025-02-15T09:15:30Z",
  "executionNotes": "比计划超时30秒"
}
```

#### 跳过环节

```http
POST /api/v1/segments/:id/skip
```

**请求体**：
```json
{
  "reason": "演讲嘉宾临时缺席"
}
```

#### 获取执行进度

```http
GET /api/v1/scripts/:id/execution-progress
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "currentSegment": {
      "id": "segment_uuid",
      "title": "年度总结报告",
      "executionStatus": "in_progress"
    },
    "progress": {
      "total": 20,
      "completed": 5,
      "inProgress": 1,
      "remaining": 14
    },
    "timeline": {
      "scheduledEndTime": "10:00:00",
      "estimatedEndTime": "10:05:00",
      "delay": 5  // 分钟
    }
  }
}
```

---

## 十、供应商管理接口

### 10.1 供应商 CRUD

#### 创建供应商

```http
POST /api/v1/suppliers
```

**请求体**：
```json
{
  "name": "优质印刷公司",
  "type": "printing",
  "contactPerson": "王经理",
  "contactPhone": "13900139000",
  "contactEmail": "wang@print.com",
  "address": "上海市...",
  "bankInfo": {
    "bankName": "工商银行",
    "accountName": "优质印刷公司",
    "accountNumber": "..."
  },
  "services": [
    { "name": "海报印刷", "priceRange": { "min": 10, "max": 50 } }
  ]
}
```

#### 获取供应商列表

```http
GET /api/v1/suppliers
```

**查询参数**：
```
?type=printing&status=active&ratingMin=3&page=1&pageSize=20
```

#### 获取供应商详情

```http
GET /api/v1/suppliers/:id
```

#### 更新供应商

```http
PUT /api/v1/suppliers/:id
```

#### 删除供应商

```http
DELETE /api/v1/suppliers/:id
```

### 10.2 供应商评价

#### 创建评价

```http
POST /api/v1/suppliers/:supplierId/reviews
```

**请求体**：
```json
{
  "eventId": "event_uuid",
  "rating": 4,
  "qualityScore": 5,
  "serviceScore": 4,
  "priceScore": 3,
  "punctualityScore": 4,
  "comment": "质量很好，服务态度不错",
  "isAnonymous": false
}
```

#### 获取供应商评价列表

```http
GET /api/v1/suppliers/:supplierId/reviews
```

### 10.3 物料管理

#### 创建物料需求

```http
POST /api/v1/events/:eventId/materials
```

**请求体**：
```json
{
  "name": "活动背景板",
  "category": "decoration",
  "specification": "宽5米高3米，KT板材质",
  "quantity": 1,
  "unit": "块",
  "budgetUnitPrice": 2000,
  "requirementDate": "2025-02-10",
  "attachments": [
    { "url": "...", "name": "设计稿.pdf" }
  ]
}
```

#### 获取物料列表

```http
GET /api/v1/events/:eventId/materials
```

**查询参数**：
```
?status=delivered&category=decoration
```

#### 更新物料

```http
PUT /api/v1/materials/:id
```

#### 删除物料

```http
DELETE /api/v1/materials/:id
```

### 10.4 采购订单

#### 创建采购订单

```http
POST /api/v1/events/:eventId/orders
```

**请求体**：
```json
{
  "supplierId": "supplier_uuid",
  "items": [
    {
      "materialId": "material_uuid",
      "name": "活动背景板",
      "quantity": 1,
      "unitPrice": 1800,
      "totalPrice": 1800
    }
  ],
  "expectedDeliveryDate": "2025-02-12",
  "notes": "需要提前确认设计稿"
}
```

#### 获取订单列表

```http
GET /api/v1/events/:eventId/orders
```

#### 获取订单详情

```http
GET /api/v1/orders/:id
```

#### 更新订单状态

```http
PATCH /api/v1/orders/:id/status
```

**请求体**：
```json
{
  "status": "shipped",
  "notes": "供应商已发货"
}
```

#### 确认交付

```http
POST /api/v1/orders/:id/deliver
```

**请求体**：
```json
{
  "actualDeliveryDate": "2025-02-12T15:00:00Z",
  "qualityCheck": "passed",
  "qualityNotes": "质量符合要求"
}
```

---

## 十一、复盘报告接口

### 11.1 报告 CRUD

#### 创建报告

```http
POST /api/v1/events/:eventId/reports
```

**请求体**：
```json
{
  "title": "2025年度盛典复盘报告",
  "type": "post_event",
  "summary": "活动整体效果良好，签到率达85%..."
}
```

#### 获取报告列表

```http
GET /api/v1/events/:eventId/reports
```

#### 获取报告详情

```http
GET /api/v1/reports/:id
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "id": "report_uuid",
    "title": "2025年度盛典复盘报告",
    "type": "post_event",
    "status": "draft",
    "summary": "...",
    "statistics": {
      "checkInRate": 85,
      "budgetUsage": 85,
      "taskCompletionRate": 95
    },
    "content": {
      "overview": {},
      "dataAnalysis": {},
      "issues": [],
      "improvements": [],
      "lessons": []
    },
    "generatedByAI": false,
    "createdAt": "..."
  }
}
```

#### 更新报告

```http
PUT /api/v1/reports/:id
```

#### 发布报告

```http
POST /api/v1/reports/:id/publish
```

#### 删除报告

```http
DELETE /api/v1/reports/:id
```

### 11.2 AI 报告生成

#### AI 生成报告

```http
POST /api/v1/events/:eventId/reports/generate
```

**请求体**：
```json
{
  "type": "post_event",
  "options": {
    "includeIssues": true,
    "includeLessons": true,
    "language": "zh-CN"
  }
}
```

**响应**：
```json
{
  "code": 200,
  "message": "报告生成成功",
  "data": {
    "reportId": "report_uuid",
    "generatedByAI": true,
    "aiModel": "deepseek-chat",
    "content": {
      // 生成的报告内容
    }
  }
}
```

### 11.3 问题记录

#### 创建问题记录

```http
POST /api/v1/events/:eventId/issues
```

**请求体**：
```json
{
  "category": "equipment",
  "severity": "medium",
  "description": "主会场音响出现杂音",
  "impact": "影响演讲效果",
  "cause": "设备老化",
  "solution": "临时更换备用音响",
  "prevention": "下次活动前进行全面设备检查"
}
```

#### 获取问题列表

```http
GET /api/v1/events/:eventId/issues
```

#### 更新问题

```http
PUT /api/v1/issues/:id
```

#### 解决问题

```http
POST /api/v1/issues/:id/resolve
```

---

## 十二、WebSocket 接口

### 12.1 连接规范

**WebSocket URL**：
```
ws://{domain}/ws?token={jwt_token}
```

**消息格式**：
```json
{
  "type": "message_type",
  "eventId": "event_uuid",
  "payload": {},
  "timestamp": "2025-02-15T09:05:00Z"
}
```

### 12.2 消息类型

#### 签到消息

```json
// 客户端订阅
{
  "type": "subscribe",
  "channel": "checkin:event_uuid"
}

// 服务端推送签到事件
{
  "type": "CHECK_IN",
  "eventId": "event_uuid",
  "payload": {
    "guestId": "guest_uuid",
    "name": "张三",
    "company": "芯片公司A",
    "avatar": "url",
    "vipLevel": 3,
    "checkInTime": "..."
  }
}

// 服务端推送统计更新
{
  "type": "STATS_UPDATE",
  "eventId": "event_uuid",
  "payload": {
    "totalGuests": 500,
    "checkedIn": 351,
    "checkInRate": 70.2,
    "vipCheckedIn": 46
  }
}
```

#### 抽奖消息

```json
// 开始抽奖
{
  "type": "LOTTERY_START",
  "eventId": "event_uuid",
  "payload": {
    "prizeId": "prize_uuid",
    "prizeName": "一等奖",
    "prizeLevel": "first",
    "animationType": "wheel"
  }
}

// 抽奖结果
{
  "type": "LOTTERY_RESULT",
  "eventId": "event_uuid",
  "payload": {
    "prizeId": "prize_uuid",
    "prizeName": "一等奖",
    "winners": [
      {
        "guestId": "guest_uuid",
        "name": "张三",
        "company": "芯片公司A",
        "avatar": "url"
      }
    ]
  }
}
```

#### 台本执行消息

```json
// 环节状态变更
{
  "type": "SEGMENT_UPDATE",
  "eventId": "event_uuid",
  "payload": {
    "segmentId": "segment_uuid",
    "segmentTitle": "年度总结报告",
    "executionStatus": "completed",
    "actualEndTime": "..."
  }
}

// 执行进度更新
{
  "type": "EXECUTION_PROGRESS",
  "eventId": "event_uuid",
  "payload": {
    "currentSegmentId": "...",
    "currentSegmentTitle": "...",
    "completedCount": 5,
    "totalCount": 20,
    "delayMinutes": 2
  }
}
```

---

## 十三、文件上传接口

### 13.1 单文件上传

```http
POST /api/v1/files/upload
```

**请求体** (multipart/form-data)：
```
file: 文件内容
type: avatar | cover | attachment | document
eventId: event_uuid (可选)
```

**响应**：
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "https://...",
    "name": "文件名.jpg",
    "type": "image/jpeg",
    "size": 102400
  }
}
```

### 13.2 批量上传

```http
POST /api/v1/files/batch-upload
```

### 13.3 获取上传签名 URL

```http
POST /api/v1/files/presigned-url
```

**请求体**：
```json
{
  "filename": "design.jpg",
  "type": "image/jpeg",
  "eventId": "event_uuid"
}
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "uploadUrl": "https://...",
    "expiresIn": 3600,
    "fileKey": "events/event_uuid/design.jpg"
  }
}
```

---

## 十四、AI 服务接口

### 14.1 智能排座 AI

```http
POST /api/v1/ai/seating/analyze
```

**请求体**：
```json
{
  "eventId": "event_uuid",
  "layoutId": "layout_uuid",
  "prompt": "VIP嘉宾优先安排在前三排中间位置"
}
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "suggestions": [
      "建议将VIP区域扩展至前5排",
      "分组A建议集中安排在T1-T3桌"
    ],
    "estimatedScore": 88
  }
}
```

### 14.2 台本生成 AI

```http
POST /api/v1/ai/script/generate
```

**请求体**：
```json
{
  "eventId": "event_uuid",
  "eventInfo": {
    "name": "2025年度盛典",
    "type": "annual_meeting",
    "duration": 480
  },
  "requirements": {
    "includeOpening": true,
    "includeAwards": true,
    "includeLottery": true
  }
}
```

**响应**：
```json
{
  "code": 200,
  "data": {
    "segments": [
      {
        "segmentType": "opening",
        "title": "开场致辞",
        "duration": 15,
        "content": "建议内容..."
      }
    ]
  }
}
```

### 14.3 报告生成 AI

```http
POST /api/v1/ai/report/generate
```

---

## 十五、错误码表

| 错误码 | 错误类型 | 说明 |
|--------|----------|------|
| 1001 | ValidationError | 参数校验失败 |
| 1002 | InvalidFormat | 格式错误 |
| 1003 | MissingRequired | 缺少必填参数 |
| 2001 | AuthenticationFailed | 认证失败 |
| 2002 | TokenExpired | Token过期 |
| 2003 | InvalidToken | Token无效 |
| 3001 | PermissionDenied | 无权限 |
| 3002 | RoleNotAllowed | 角色不允许 |
| 4001 | ResourceNotFound | 资源不存在 |
| 4002 | EventNotFound | 活动不存在 |
| 4003 | GuestNotFound | 嘉宾不存在 |
| 5001 | ConflictError | 资源冲突 |
| 5002 | DuplicateError | 资源已存在 |
| 5003 | StatusConflict | 状态冲突 |
| 6001 | CheckInFailed | 签到失败 |
| 6002 | AlreadyCheckedIn | 已签到 |
| 6003 | LotteryFailed | 抽奖失败 |
| 7001 | FileUploadFailed | 文件上传失败 |
| 7002 | FileTooLarge | 文件过大 |
| 8001 | AIServiceError | AI服务错误 |
| 8002 | AIGenerationFailed | AI生成失败 |
| 9001 | DatabaseError | 数据库错误 |
| 9002 | InternalError | 内部错误 |

---

> **文档维护**：本文档随 API 演进持续更新  
> **负责人**：后端开发工程师  
> **最后更新**：2025-01-15