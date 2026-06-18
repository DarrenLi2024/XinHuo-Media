# DATABASE.md - 数据库设计文档

## 数据库概述

- **数据库类型**：PostgreSQL（Supabase 云端托管）
- **ORM**：Drizzle ORM（类型安全）
- **连接方式**：Supabase Client（支持实时同步）

---

## 数据表设计

### 1. 嘉宾表 (guests)

存储所有嘉宾信息，包括签到状态。

```sql
CREATE TABLE guests (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,                   -- 姓名（必填）
  phone VARCHAR(20),                            -- 电话
  organization VARCHAR(200),                    -- 单位/机构
  guest_type VARCHAR(50) NOT NULL DEFAULT '普通嘉宾', -- 身份类型
  table_number VARCHAR(20),                     -- 桌号
  qr_code VARCHAR(50) NOT NULL UNIQUE,          -- 二维码（唯一约束）
  check_in_status INTEGER NOT NULL DEFAULT 0,   -- 签到状态：0未签到，1已签到
  check_in_time TIMESTAMP WITH TIME ZONE,       -- 签到时间
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_guests_qr_code ON guests(qr_code);
CREATE INDEX idx_guests_check_in_status ON guests(check_in_status);
CREATE INDEX idx_guests_name ON guests(name);
```

**Drizzle Schema 定义**：
```typescript
export const guests = pgTable("guests", {
  id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
  name: varchar({ length: 100 }).notNull(),
  phone: varchar({ length: 20 }),
  organization: varchar({ length: 200 }),
  guestType: varchar("guest_type", { length: 50 }).default('普通嘉宾').notNull(),
  tableNumber: varchar("table_number", { length: 20 }),
  qrCode: varchar("qr_code", { length: 50 }).notNull(),
  checkInStatus: integer("check_in_status").default(0).notNull(),
  checkInTime: timestamp("check_in_time", { withTimezone: true, mode: 'string' }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  unique("guests_qr_code_unique").on(table.qrCode),
]);
```

---

### 2. 签到日志表 (check_in_logs)

记录每次签到的详细信息，用于审计和统计。

```sql
CREATE TABLE check_in_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id VARCHAR(36) NOT NULL,                -- 嘉宾ID
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), -- 签到时间
  terminal_id VARCHAR(50),                      -- 终端标识（多终端场景）
  operator VARCHAR(50),                         -- 操作人
  sync_status INTEGER NOT NULL DEFAULT 0,       -- 同步状态
  
  CONSTRAINT fk_check_in_logs_guest FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_check_in_logs_guest_id ON check_in_logs(guest_id);
CREATE INDEX idx_check_in_logs_time ON check_in_logs(check_in_time DESC);
```

**Drizzle Schema 定义**：
```typescript
export const checkInLogs = pgTable("check_in_logs", {
  id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
  guestId: varchar("guest_id", { length: 36 }).notNull(),
  checkInTime: timestamp("check_in_time", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  terminalId: varchar("terminal_id", { length: 50 }),
  operator: varchar({ length: 50 }),
  syncStatus: integer("sync_status").default(0).notNull(),
});
```

---

### 3. 用户表 (users)

存储系统用户，支持三级权限管理。

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL UNIQUE,         -- 用户名（唯一）
  password VARCHAR(255) NOT NULL,               -- 密码（加密存储）
  name VARCHAR(100) NOT NULL,                   -- 显示姓名
  role VARCHAR(20) NOT NULL DEFAULT 'checker',  -- 角色：super_admin, admin, checker
  must_change_password INTEGER NOT NULL DEFAULT 0, -- 是否需要修改密码
  active INTEGER NOT NULL DEFAULT 1,            -- 是否启用
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
```

**Drizzle Schema 定义**：
```typescript
export const users = pgTable("users", {
  id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
  username: varchar({ length: 50 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 100 }).notNull(),
  role: varchar({ length: 20 }).default('checker').notNull(),
  mustChangePassword: integer("must_change_password").default(0).notNull(),
  active: integer().default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  unique("users_username_unique").on(table.username),
]);
```

---

### 4. Session 表（可选）

用于 Token 认证，存储用户会话信息。

```sql
CREATE TABLE sessions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(64) NOT NULL UNIQUE,            -- Token（唯一）
  user_id VARCHAR(36) NOT NULL,                 -- 用户ID
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 过期时间
  
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
```

---

## 数据库操作封装

### 核心文件：`src/storage/database/db.ts`

提供所有数据库操作的封装函数：

#### 嘉宾操作

```typescript
// 获取所有嘉宾
getAllGuests(): Promise<Guest[]>

// 根据二维码查找嘉宾
getGuestByQrCode(qrCode: string): Promise<Guest | null>

// 根据ID查找嘉宾
getGuestById(id: string): Promise<Guest | null>

// 搜索嘉宾（姓名/电话/单位）
searchGuests(keyword: string): Promise<Guest[]>

// 创建嘉宾（自动生成二维码）
createGuest(guest: InsertGuest): Promise<Guest>

// 批量创建嘉宾
createGuestsBatch(guests: InsertGuest[]): Promise<Guest[]>

// 更新嘉宾
updateGuest(id: string, guest: Partial<Guest>): Promise<Guest | null>

// 批量更新嘉宾
batchUpdateGuests(ids: string[], data: Partial<Guest>): Promise<number>

// 删除嘉宾
deleteGuest(id: string): Promise<void>
```

#### 签到操作

```typescript
// 签到（原子操作，防并发）
checkIn(guestId: string, terminalId?: string, operator?: string): Promise<Guest>

// 清除所有签到状态
clearAllCheckIns(): Promise<{ cleared: number; logsDeleted: number }>

// 清空所有数据
clearAllData(): Promise<void>
```

#### 统计操作

```typescript
// 获取统计数据
getStats(): Promise<{
  total: number;
  checkedIn: number;
  notCheckedIn: number;
  checkInRate: number;
  byType: Record<string, number>;
  byTypeChecked: Record<string, number>;
}>

// 获取签到日志
getCheckInLogs(limit?: number): Promise<Log[]>

// 获取所有签到日志（用于导出）
getAllCheckInLogs(): Promise<Log[]>
```

#### 用户操作

```typescript
// 初始化超级管理员
initSuperAdmin(): Promise<void>

// 用户登录验证
authenticateUser(username: string, password: string): Promise<User | null>

// 获取所有用户
getAllUsers(): Promise<User[]>

// 根据ID获取用户
getUserById(id: string): Promise<User | null>

// 创建用户
createUser(user: InsertUser): Promise<User>

// 更新用户
updateUser(id: string, data: Partial<User>): Promise<User | null>

// 修改密码
changePassword(id: string, newPassword: string): Promise<void>

// 重置密码（管理员操作）
resetPassword(id: string, newPassword: string): Promise<void>

// 删除用户
deleteUser(id: string): Promise<void>
```

---

## Supabase 客户端配置

### 文件：`src/storage/database/supabase-client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}
```

---

## 关键设计要点

### 1. 二维码生成
- **格式**：`EVT{timestamp}{random6chars}`
- **示例**：`EVT1704067200ABC123`
- **唯一性**：数据库唯一约束 + 自动生成

### 2. 签到并发处理
- **原子操作**：条件更新防止竞态
- **SQL 逻辑**：
  ```sql
  UPDATE guests 
  SET check_in_status = 1, check_in_time = NOW() 
  WHERE id = ? AND check_in_status = 0
  ```
- **结果判断**：更新成功 = 首次签到，更新失败 = 已被其他终端签到

### 3. 数据转换
- **数据库字段**：snake_case（如 `guest_type`）
- **TypeScript 属性**：camelCase（如 `guestType`）
- **转换函数**：`toGuest()`、`toUser()`

### 4. 密码存储
- **方式**：Base64 编码（简化版）
- **生产建议**：使用 bcrypt 或 argon2

---

## 数据初始化

### 首次运行自动初始化
- 创建超级管理员账号
- 用户名：`admin`
- 密码：`admin123`
- 角色：`super_admin`
- 状态：`must_change_password = 1`（强制修改）

```typescript
// 在 server.ts 或启动脚本中调用
await initSuperAdmin();
```