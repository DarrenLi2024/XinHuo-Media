# 会务系统核心模块复刻说明：活动签到

## 1. 模块定位

来源附件：`会务系统-活动签到.tar.gz`

该模块是一个独立 Next.js 活动签到系统，包含签到前台、管理后台、嘉宾导入、二维码生成、扫码枪监听、重复签到拦截、胸牌预览、静默打印、统计和导出。复刻集成时应作为当前系统“签到系统”的主参考。

核心目标：

- 管理端批量导入、编辑、筛选和导出嘉宾。
- 签到端支持扫码枪快速签到和手动搜索签到。
- 签到后展示胸牌预览，可对接 NPL/本地打印服务静默打印。
- 实时统计总人数、已签到、未签到、签到率和最近签到记录。

## 2. 原项目结构

技术栈：

- Next.js 16 App Router
- React 19
- Drizzle ORM
- Supabase/Postgres
- xlsx
- qrcode
- jszip/archiver/sharp 用于导出和资源处理

关键入口：

- `/checkin`：签到前台
- `/admin`：管理后台
- `/api/check-in`：执行签到
- `/api/check-in/clear`：清空签到状态
- `/api/guests`：嘉宾增删改查
- `/api/guests/import`：Excel 或粘贴导入
- `/api/guests/export`：导出名单或签到数据
- `/api/guests/batch`：批量修改嘉宾
- `/api/qrcode`：生成二维码图片
- `/api/stats`：统计数据

## 3. 数据模型

核心表：

```ts
type Guest = {
  id: string;
  name: string;
  phone?: string;
  organization?: string;
  guestType: string;
  tableNumber?: string;
  qrCode: string;
  checkInStatus: number; // 0 未签到，1 已签到
  checkInTime?: string;
  createdAt: string;
  updatedAt: string;
};

type CheckInLog = {
  id: string;
  guestId: string;
  checkInTime: string;
  terminalId?: string;
  operator?: string;
  syncStatus: number;
};
```

数据库约束：

- `guests.qr_code` 唯一。
- 签到时必须同时更新 `guests.check_in_status`、`guests.check_in_time` 并写入 `check_in_logs`。
- 重复签到必须返回明确错误，前端展示重复签到提示和嘉宾信息。

## 4. 必须复刻的功能点

签到前台：

- 两种模式：扫码模式、搜索模式。
- 扫码模式监听全局键盘输入，扫码枪输入缓冲，按 Enter 或 500ms 超时自动提交。
- 输入焦点在表单控件时，不拦截键盘输入。
- 签到成功后展示成功提示、胸牌预览，并刷新统计和最近记录。
- 重复签到时展示红色错误提示，并显示重复嘉宾胸牌预览。
- 搜索模式支持姓名、手机、单位关键字检索。
- 最近签到记录每 5 秒刷新。

管理后台：

- 嘉宾列表搜索、身份筛选、桌号筛选。
- 单个新增嘉宾。
- Excel 导入：支持 `姓名`、`手机号/手机`、`单位`、`身份/嘉宾身份`、`桌号`。
- 粘贴导入：每行一条，支持逗号或制表符分隔。
- 批量修改身份和桌号。
- 导出全部嘉宾、仅导出已签到数据。
- 统计卡片支持点击穿透查看已签到/未签到名单。
- 可维护嘉宾身份类型。

二维码和打印：

- `/api/qrcode?text=...&size=200` 返回 PNG。
- 签到端从 `localStorage.eventSettings` 读取打印服务配置。
- 静默打印请求：

```json
{
  "guest": {
    "name": "姓名",
    "organization": "单位",
    "guestType": "身份",
    "tableNumber": "桌号",
    "qrCode": "二维码"
  },
  "event": {
    "name": "活动名",
    "logo": "Logo",
    "date": "日期",
    "location": "地点"
  },
  "printer": "打印机名称"
}
```

## 5. 集成到当前系统的建议

当前系统已有 `/checkin/admin`、`/checkin/entry` 和 `/api/checkin/*`，但还缺少原模块的完整能力。建议：

- 统一字段：当前系统 `company` 对应原模块 `organization`，`level/category` 对应 `guestType`，`seat_number` 对应 `tableNumber`。
- 所有签到 API 必须强制携带 `event_id`，避免不同活动数据混用。
- 将当前内存签到 store 替换为数据库表：`guests` + `check_in_logs`。
- 新增二维码接口，二维码内容建议使用 `event_id:guest_id` 或单独生成 `qr_code`。
- 管理端补齐 Excel 导入、粘贴导入、批量修改、导出和二维码批量下载。
- 签到端补齐扫码枪缓冲逻辑、重复签到提示和胸牌打印。

推荐接口：

```http
GET  /api/checkin/guests?event_id=...&keyword=...
POST /api/checkin/guests
POST /api/checkin/guests/import
PUT  /api/checkin/guests/batch
GET  /api/checkin/guests/export?event_id=...&checked_only=true
POST /api/checkin
POST /api/checkin/clear
GET  /api/checkin/stats?event_id=...
GET  /api/checkin/qrcode?text=...
```

## 6. 复刻验收清单

- 导入 1000 条嘉宾后，列表、筛选、统计可正常响应。
- 扫码枪连续扫码不会丢码，也不会在处理上一条时重复提交。
- 同一个二维码第二次签到返回重复签到提示，而不是再次写入签到记录。
- 成功签到后统计和最近签到记录立即刷新。
- 已签到/未签到导出字段完整。
- 二维码接口返回可扫描 PNG。
- 未配置打印服务时不阻塞签到；配置后成功调用打印服务。
