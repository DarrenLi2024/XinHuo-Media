# API.md - 接口文档

## API 规范

### 请求认证
所有需要认证的接口必须在 Header 中携带 Token：
```
Authorization: Bearer <token>
```

### 响应格式
统一响应格式：
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

错误响应：
```json
{
  "success": false,
  "data": null,
  "error": "错误信息"
}
```

### HTTP 状态码
- `200`：成功
- `400`：参数错误
- `401`：未登录或 Token 过期
- `403`：无权限
- `404`：资源不存在
- `500`：服务器错误

---

## 一、认证接口

### 1.1 检查初始化状态
```
GET /api/auth/check-init
```

**响应**：
```json
{
  "success": true,
  "showDefaultHint": true  // 是否显示默认账号提示
}
```

### 1.2 登录
```
POST /api/auth/login
```

**请求体**：
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "token": "xxx...",
    "user": {
      "id": "uuid",
      "username": "admin",
      "name": "超级管理员",
      "role": "super_admin",
      "mustChangePassword": true
    }
  }
}
```

### 1.3 登出
```
POST /api/auth/logout
```

**认证**：需要 Token

**响应**：
```json
{
  "success": true
}
```

### 1.4 修改密码
```
POST /api/auth/change-password
```

**认证**：需要 Token

**请求体**：
```json
{
  "oldPassword": "admin123",
  "newPassword": "newpass123"
}
```

**响应**：
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

---

## 二、嘉宾接口

### 2.1 获取嘉宾列表
```
GET /api/guests
```

**认证**：需要 `guests:read` 权限

**查询参数**：
- `keyword`: 搜索关键词（可选）
- `qrCode`: 二维码查询（可选）

**响应**：
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "张三",
      "phone": "13800138000",
      "organization": "测试公司",
      "guestType": "普通嘉宾",
      "tableNumber": "1",
      "qrCode": "EVTxxx",
      "checkInStatus": 0,
      "checkInTime": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 2.2 创建嘉宾
```
POST /api/guests
```

**认证**：需要 `guests:create` 权限

**请求体（单个）**：
```json
{
  "name": "张三",
  "phone": "13800138000",
  "organization": "测试公司",
  "guestType": "普通嘉宾",
  "tableNumber": "1"
}
```

**请求体（批量）**：
```json
{
  "guests": [
    { "name": "张三", ... },
    { "name": "李四", ... }
  ]
}
```

**响应**：
```json
{
  "success": true,
  "data": { ... },
  "count": 1  // 批量创建时返回数量
}
```

### 2.3 更新嘉宾
```
PUT /api/guests/[id]
```

**认证**：需要 `guests:update` 权限

**请求体**：
```json
{
  "name": "张三",
  "guestType": "特邀嘉宾",
  "tableNumber": "2"
}
```

### 2.4 删除嘉宾
```
DELETE /api/guests/[id]
```

**认证**：需要 `guests:delete` 权限

### 2.5 批量更新嘉宾
```
POST /api/guests/batch
```

**认证**：需要 `guests:update` 权限

**请求体**：
```json
{
  "ids": ["uuid1", "uuid2"],
  "guestType": "特邀嘉宾",
  "tableNumber": "VIP"
}
```

### 2.6 清空嘉宾
```
POST /api/guests/clear
```

**认证**：需要 `guests:clear` 权限

**响应**：
```json
{
  "success": true,
  "deleted": 100
}
```

### 2.7 导入嘉宾
```
POST /api/guests/import
```

**认证**：需要 `guests:import` 权限

**请求**：multipart/form-data
- `file`: Excel 文件 (.xlsx)

**响应**：
```json
{
  "success": true,
  "imported": 50,
  "skipped": 2,
  "errors": ["第3行：姓名为空"]
}
```

---

## 三、签到接口

### 3.1 执行签到
```
POST /api/check-in
```

**认证**：需要 `checkin:perform` 权限

**请求体**：
```json
{
  "qrCode": "EVTxxx"
}
```

**成功响应**：
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "张三",
    "checkInStatus": 1,
    "checkInTime": "2024-01-01T10:00:00Z",
    ...
  }
}
```

**失败响应（已签到）**：
```json
{
  "success": false,
  "error": "该嘉宾已签到"
}
```

### 3.2 清除签到状态
```
POST /api/check-in/clear
```

**认证**：需要 `checkin:clear` 权限

**响应**：
```json
{
  "success": true,
  "cleared": 50,
  "logsDeleted": 50
}
```

---

## 四、统计接口

### 4.1 获取统计数据
```
GET /api/stats
```

**认证**：需要 `stats:read` 权限

**响应**：
```json
{
  "success": true,
  "data": {
    "total": 100,
    "checkedIn": 50,
    "notCheckedIn": 50,
    "checkInRate": 50,
    "byType": {
      "普通嘉宾": 60,
      "特邀嘉宾": 40
    },
    "byTypeChecked": {
      "普通嘉宾": 30,
      "特邀嘉宾": 20
    }
  }
}
```

### 4.2 获取签到日志
```
GET /api/logs
```

**认证**：需要 `stats:read` 权限

**查询参数**：
- `limit`: 返回数量（默认 50）

**响应**：
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "guestId": "uuid",
      "guestName": "张三",
      "organization": "测试公司",
      "guestType": "普通嘉宾",
      "tableNumber": "1",
      "checkInTime": "2024-01-01T10:00:00Z",
      "terminalId": "terminal-1",
      "operator": "admin"
    }
  ]
}
```

---

## 五、导出接口

### 5.1 导出签到数据（XLSX）
```
GET /api/export/checkin-data
```

**认证**：需要 `guests:export` 权限

**响应**：Excel 文件流
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="checkin_data_2024-01-01.xlsx"`

### 5.2 导出配置（XLSX）
```
GET /api/export/config
```

**认证**：需要 `guests:export` 权限

**响应**：配置模板 Excel 文件

### 5.3 导出 JSON 备份
```
GET /api/backup/export
```

**认证**：需要 `guests:read` 权限

**响应**：JSON 文件流
```json
{
  "version": "1.0",
  "exportedAt": "2024-01-01T10:00:00Z",
  "eventName": "活动签到",
  "eventDate": "2024-01-01",
  "stats": { ... },
  "guests": [ ... ],
  "checkInLogs": [ ... ]
}
```

### 5.4 导入 JSON 备份
```
POST /api/backup/import
```

**认证**：需要 `guests:create` 权限

**请求**：multipart/form-data
- `file`: JSON 文件
- `mode`: `merge` 或 `replace`

**响应**：
```json
{
  "success": true,
  "message": "导入完成：嘉宾 50 条导入，2 条跳过",
  "data": {
    "guestsImported": 50,
    "guestsSkipped": 2,
    "logsImported": 30,
    "logsSkipped": 0
  }
}
```

---

## 六、用户接口（仅超级管理员）

### 6.1 获取用户列表
```
GET /api/users
```

**认证**：需要 `users:read` 权限

### 6.2 创建用户
```
POST /api/users
```

**认证**：需要 `users:create` 权限

**请求体**：
```json
{
  "username": "checker1",
  "password": "pass123",
  "name": "签到员1",
  "role": "checker"
}
```

### 6.3 更新用户
```
PUT /api/users/[id]
```

**认证**：需要 `users:update` 权限

### 6.4 删除用户
```
DELETE /api/users/[id]
```

**认证**：需要 `users:delete` 权限

---

## 七、打印接口

### 7.1 生成二维码
```
GET /api/qrcode?text=EVTxxx&size=150
```

**参数**：
- `text`: 二维码内容
- `size`: 图片尺寸（像素）

**响应**：PNG 图片

### 7.2 获取打印编码数据
```
POST /api/print-encode
```

**请求体**：
```json
{
  "name": "张三",
  "guestType": "普通嘉宾",
  "tableNumber": "1",
  "qrCode": "EVTxxx",
  "eventName": "活动签到",
  "paperWidth": 58,
  "labelType": "badge"
}
```

**响应**：
```json
{
  "success": true,
  "data": "base64-encoded-print-data"
}
```

### 7.3 ESC/POS 打印
```
POST /api/print-escpos
```

**请求体**：
```json
{
  "printerAddress": "192.168.1.100",
  "printerPort": 9100,
  "printData": "base64..."
}
```

---

## 八、模板接口

### 8.1 获取模板列表
```
GET /api/templates
```

**认证**：需要 `template:read` 权限

### 8.2 创建/更新模板
```
POST /api/templates
```

**认证**：需要 `template:update` 权限

### 8.3 删除模板
```
DELETE /api/templates?id=xxx
```

---

## 权限对照表

| 接口 | 所需权限 |
|------|---------|
| `/api/guests` (GET) | `guests:read` |
| `/api/guests` (POST) | `guests:create` |
| `/api/guests/[id]` (PUT) | `guests:update` |
| `/api/guests/[id]` (DELETE) | `guests:delete` |
| `/api/guests/import` | `guests:import` |
| `/api/guests/export` | `guests:export` |
| `/api/guests/clear` | `guests:clear` |
| `/api/check-in` | `checkin:perform` |
| `/api/check-in/clear` | `checkin:clear` |
| `/api/stats` | `stats:read` |
| `/api/logs` | `stats:read` |
| `/api/users` (GET) | `users:read` |
| `/api/users` (POST) | `users:create` |
| `/api/users/[id]` (PUT) | `users:update` |
| `/api/users/[id]` (DELETE) | `users:delete` |
| `/api/templates` (GET) | `template:read` |
| `/api/templates` (POST) | `template:update` |
| `/api/backup/export` | `guests:read` |
| `/api/backup/import` | `guests:create` |