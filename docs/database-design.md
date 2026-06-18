# 芯火会务管理系统 - 数据库设计

> **文档版本**：v1.0.0  
> **创建日期**：2025-01-15  
> **数据库类型**：PostgreSQL (Supabase)  
> **ORM框架**：Prisma

---

## 一、数据库概述

### 1.1 设计原则

| 原则 | 描述 |
|------|------|
| **规范化** | 符合第三范式，减少数据冗余 |
| **性能优化** | 合理设计索引，优化查询性能 |
| **扩展性** | 预留扩展字段，支持业务演进 |
| **安全性** | 敏感数据加密存储，访问权限控制 |
| **审计追踪** | 关键表记录创建/更新时间和操作人 |

### 1.2 数据库命名规范

| 规则 | 示例 |
|------|------|
| 表名 | 小写蛇形，复数形式：`events`, `guests` |
| 字段名 | 小写蛇形：`event_id`, `check_in_time` |
| 主键 | `id` (UUID) |
| 外键 | `{关联表}_id`：`event_id`, `guest_id` |
| 时间戳 | `created_at`, `updated_at` |
| 状态字段 | `{实体}_status`：`event_status`, `task_status` |

---

## 二、核心数据模型

### 2.1 ER 图概览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌─────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐         │
│  │ users   │       │ events  │──────▶│ guests  │       │ venues  │         │
│  │ (用户)  │       │ (活动)  │       │ (嘉宾)  │       │ (场地)  │         │
│  └─────────┘       └─────────┘       └─────────┘       └─────────┘         │
│       │                │                │                  │               │
│       │                │                │                  │               │
│       ▼                ▼                ▼                  ▼               │
│  ┌─────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐         │
│  │ tasks   │       │ scripts │       │ seats   │       │ layouts │         │
│  │ (任务)  │       │ (台本)  │       │ (座位)  │       │ (布局)  │         │
│  └─────────┘       └─────────┘       └─────────┘       └─────────┘         │
│       │                │                │                  │               │
│       │                │                │                  │               │
│       ▼                ▼                ▼                  ▼               │
│  ┌─────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐         │
│  │ comments│       │segments │       │check_ins│       │ suppliers│        │
│  │ (评论)  │       │ (环节)  │       │ (签到)  │       │(供应商) │         │
│  └─────────┘       └─────────┘       └─────────┘       └─────────┘         │
│                                           │                                  │
│                                           ▼                                  │
│                                    ┌─────────┐       ┌─────────┐           │
│                                    │ prizes  │──────▶│lottery_ │           │
│                                    │ (奖品)  │       │ records │           │
│                                    └─────────┘       │(抽奖)   │           │
│                                                      └─────────┘           │
│                                                                              │
│                                    ┌─────────┐       ┌─────────┐           │
│                                    │ materials│─────▶│ orders  │           │
│                                    │ (物料)  │       │(订单)   │           │
│                                    └─────────┘       └─────────┘           │
│                                                                              │
│                                    ┌─────────┐                               │
│                                    │ reports │                               │
│                                    │(复盘)   │                               │
│                                    └─────────┘                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 三、表结构设计

### 3.1 用户与权限模块

#### users (用户表)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),  -- 可选，支持第三方登录
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    -- 角色: super_admin, event_manager, executor, staff, supplier, guest
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    -- 状态: active, inactive, suspended
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT valid_role CHECK (role IN ('super_admin', 'event_manager', 'executor', 'staff', 'supplier', 'guest')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- 索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

#### user_sessions (用户会话表)

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255) UNIQUE,
    device_info JSONB,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_token UNIQUE (token)
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
```

#### audit_logs (操作审计日志表)

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_time ON audit_logs(created_at);
```

---

### 3.2 活动管理模块

#### events (活动表)

```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    -- 类型: annual_meeting, product_launch, seminar, appreciation, training, other
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    -- 状态: draft, pending, preparing, ongoing, completed, archived
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    location VARCHAR(255),
    address TEXT,
    expected_guests INTEGER DEFAULT 0,
    actual_guests INTEGER DEFAULT 0,
    cover_image_url TEXT,
    owner_id UUID NOT NULL REFERENCES users(id),
    budget DECIMAL(12, 2) DEFAULT 0,
    actual_cost DECIMAL(12, 2) DEFAULT 0,
    settings JSONB DEFAULT '{}',
    -- 配置: { require_check_in: boolean, allow_lottery: boolean, ... }
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT valid_event_type CHECK (type IN ('annual_meeting', 'product_launch', 'seminar', 'appreciation', 'training', 'other')),
    CONSTRAINT valid_event_status CHECK (status IN ('draft', 'pending', 'preparing', 'ongoing', 'completed', 'archived')),
    CONSTRAINT valid_dates CHECK (end_time > start_time)
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_owner ON events(owner_id);
CREATE INDEX idx_events_created ON events(created_at);
```

#### event_members (活动成员表)

```sql
CREATE TABLE event_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    -- 角色: owner, manager, executor, viewer
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_event_member UNIQUE (event_id, user_id),
    CONSTRAINT valid_member_role CHECK (role IN ('owner', 'manager', 'executor', 'viewer'))
);

CREATE INDEX idx_event_members_event ON event_members(event_id);
CREATE INDEX idx_event_members_user ON event_members(user_id);
```

#### tasks (任务表)

```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    -- 状态: pending, in_progress, completed, delayed, cancelled
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    -- 优先级: high, medium, low
    start_date TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    -- 支持子任务
    dependencies UUID[] DEFAULT '{}',
    -- 依赖任务ID列表
    assignees UUID[] NOT NULL DEFAULT '{}',
    -- 负责人ID列表
    tags JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    -- 文件附件列表 [{ url, name, type, size }]
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT valid_task_status CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed', 'cancelled')),
    CONSTRAINT valid_task_priority CHECK (priority IN ('high', 'medium', 'low'))
);

CREATE INDEX idx_tasks_event ON tasks(event_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_assignees ON tasks USING GIN (assignees);
CREATE INDEX idx_tasks_parent ON tasks(parent_id);
```

#### task_comments (任务评论表)

```sql
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_comments_task ON task_comments(task_id);
CREATE INDEX idx_task_comments_user ON task_comments(user_id);
```

---

### 3.3 嘉宾与签到模块

#### guests (嘉宾表)

```sql
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    -- 加密存储
    email VARCHAR(255),
    company VARCHAR(200),
    position VARCHAR(100),
    title VARCHAR(50),
    -- 职级: executive, manager, staff, other
    vip_level INTEGER DEFAULT 0 CHECK (vip_level >= 0 AND vip_level <= 5),
    group_id UUID REFERENCES guest_groups(id),
    avatar_url TEXT,
    qr_code_url TEXT,
    -- 个人签到二维码
    special_needs TEXT,
    -- 特殊需求（残障、饮食等）
    seat_id UUID REFERENCES seats(id),
    -- 分配的座位
    check_in_status BOOLEAN DEFAULT FALSE,
    check_in_time TIMESTAMP,
    check_in_method VARCHAR(20),
    -- 签到方式: qrcode, manual, face
    check_in_point VARCHAR(50),
    check_in_operator UUID REFERENCES users(id),
    notes TEXT,
    -- 内部备注
    is_invited BOOLEAN DEFAULT FALSE,
    invitation_sent_at TIMESTAMP,
    invitation_status VARCHAR(20) DEFAULT 'pending',
    -- 邀请状态: pending, sent, confirmed, declined
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT unique_event_guest UNIQUE (event_id, phone),
    CONSTRAINT valid_title CHECK (title IN ('executive', 'manager', 'staff', 'other')),
    CONSTRAINT valid_check_in_method CHECK (check_in_method IS NULL OR check_in_method IN ('qrcode', 'manual', 'face'))
);

CREATE INDEX idx_guests_event ON guests(event_id);
CREATE INDEX idx_guests_phone ON guests(phone);
CREATE INDEX idx_guests_vip ON guests(vip_level);
CREATE INDEX idx_guests_group ON guests(group_id);
CREATE INDEX idx_guests_seat ON guests(seat_id);
CREATE INDEX idx_guests_check_in ON guests(event_id, check_in_status);
CREATE INDEX idx_guests_invitation ON guests(invitation_status);
```

#### guest_groups (嘉宾分组表)

```sql
CREATE TABLE guest_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(10) DEFAULT '#3B82F6',
    -- 分组颜色标识
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_event_group UNIQUE (event_id, name)
);

CREATE INDEX idx_guest_groups_event ON guest_groups(event_id);
```

#### guest_relations (嘉宾关系表)

```sql
CREATE TABLE guest_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    guest_id_a UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    guest_id_b UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    relation_type VARCHAR(50) NOT NULL,
    -- 关系类型: colleague, superior, subordinate, partner, conflict, family, other
    weight INTEGER DEFAULT 1,
    -- 关系权重：正数表示亲近，负数表示疏远/冲突
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_guest_relation UNIQUE (event_id, guest_id_a, guest_id_b),
    CONSTRAINT valid_relation_type CHECK (relation_type IN ('colleague', 'superior', 'subordinate', 'partner', 'conflict', 'family', 'other')),
    CONSTRAINT no_self_relation CHECK (guest_id_a != guest_id_b)
);

CREATE INDEX idx_guest_relations_event ON guest_relations(event_id);
CREATE INDEX idx_guest_relations_guest_a ON guest_relations(guest_id_a);
CREATE INDEX idx_guest_relations_guest_b ON guest_relations(guest_id_b);
```

#### check_in_records (签到记录表)

```sql
CREATE TABLE check_in_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP NOT NULL DEFAULT NOW(),
    check_in_method VARCHAR(20) NOT NULL,
    check_in_point VARCHAR(50),
    operator_id UUID REFERENCES users(id),
    device_info JSONB,
    -- { device_type, browser, os }
    location JSONB,
    -- { latitude, longitude }
    notes TEXT,
    
    CONSTRAINT valid_record_method CHECK (check_in_method IN ('qrcode', 'manual', 'face'))
);

CREATE INDEX idx_check_in_event ON check_in_records(event_id);
CREATE INDEX idx_check_in_guest ON check_in_records(guest_id);
CREATE INDEX idx_check_in_time ON check_in_records(check_in_time);
```

---

### 3.4 场地与排座模块

#### venues (场地表)

```sql
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    capacity INTEGER NOT NULL,
    area DECIMAL(10, 2),
    -- 面积（平方米）
    facilities JSONB DEFAULT '[]',
    -- 设施列表 [{ name, quantity, description }]
    images JSONB DEFAULT '[]',
    -- 图片URL列表
    price_range JSONB DEFAULT '{}',
    -- { min_price, max_price, unit }
    rating DECIMAL(3, 2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    -- 状态: active, inactive
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT valid_venue_status CHECK (status IN ('active', 'inactive'))
);

CREATE INDEX idx_venues_status ON venues(status);
CREATE INDEX idx_venues_capacity ON venues(capacity);
```

#### venue_layouts (场地布局表)

```sql
CREATE TABLE venue_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    layout_type VARCHAR(50) NOT NULL,
    -- 布局类型: theater, classroom, banquet, u_shape, custom
    total_seats INTEGER NOT NULL,
    tables_count INTEGER DEFAULT 0,
    seats_per_table INTEGER DEFAULT 0,
    stage_position JSONB DEFAULT '{}',
    -- { x, y, width, height }
    entrances JSONB DEFAULT '[]',
    -- [{ x, y, name }]
    exits JSONB DEFAULT '[]',
    -- [{ x, y, name }]
    layout_data JSONB NOT NULL,
    -- 详细布局数据（座位坐标等）
    is_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_layout_type CHECK (layout_type IN ('theater', 'classroom', 'banquet', 'u_shape', 'custom'))
);

CREATE INDEX idx_layouts_venue ON venue_layouts(venue_id);
CREATE INDEX idx_layouts_event ON venue_layouts(event_id);
CREATE INDEX idx_layouts_template ON venue_layouts(is_template);
```

#### seats (座位表)

```sql
CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID NOT NULL REFERENCES venue_layouts(id) ON DELETE CASCADE,
    seat_number VARCHAR(20) NOT NULL,
    -- 座位编号: A1, B2, T1-1 (桌号-座位号)
    table_number VARCHAR(20),
    -- 桌号（圆桌布局时）
    row_number INTEGER,
    column_number INTEGER,
    seat_type VARCHAR(30) DEFAULT 'normal',
    -- 类型: normal, vip, vip_premium, disabled, media, staff
    status VARCHAR(20) DEFAULT 'available',
    -- 状态: available, occupied, locked, reserved
    x_position DECIMAL(8, 2),
    y_position DECIMAL(8, 2),
    rotation DECIMAL(5, 2) DEFAULT 0,
    -- 座位朝向角度
    guest_id UUID REFERENCES guests(id),
    locked_by UUID REFERENCES users(id),
    lock_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_layout_seat UNIQUE (layout_id, seat_number),
    CONSTRAINT valid_seat_type CHECK (seat_type IN ('normal', 'vip', 'vip_premium', 'disabled', 'media', 'staff')),
    CONSTRAINT valid_seat_status CHECK (status IN ('available', 'occupied', 'locked', 'reserved'))
);

CREATE INDEX idx_seats_layout ON seats(layout_id);
CREATE INDEX idx_seats_status ON seats(status);
CREATE INDEX idx_seats_type ON seats(seat_type);
CREATE INDEX idx_seats_guest ON seats(guest_id);
```

#### seating_rules (排座规则表)

```sql
CREATE TABLE seating_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL,
    -- 规则类型: vip_priority, group_together, conflict_avoid, rank_order, gender_balance, accessibility
    weight INTEGER DEFAULT 1 CHECK (weight >= 0 AND weight <= 10),
    -- 规则权重
    params JSONB DEFAULT '{}',
    -- 规则参数
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_rule_type CHECK (rule_type IN ('vip_priority', 'group_together', 'conflict_avoid', 'rank_order', 'gender_balance', 'accessibility', 'custom'))
);

CREATE INDEX idx_seating_rules_event ON seating_rules(event_id);
```

---

### 3.5 台本管理模块

#### scripts (台本表)

```sql
CREATE TABLE scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    version VARCHAR(20) DEFAULT 'v1.0',
    total_duration INTEGER NOT NULL,
    -- 总时长（分钟）
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    -- 状态: draft, finalized, executing, completed
    settings JSONB DEFAULT '{}',
    -- 配置: { timezone, reminders_enabled, ... }
    created_by UUID NOT NULL REFERENCES users(id),
    finalized_at TIMESTAMP,
    finalized_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_event_script UNIQUE (event_id, version),
    CONSTRAINT valid_script_status CHECK (status IN ('draft', 'finalized', 'executing', 'completed'))
);

CREATE INDEX idx_scripts_event ON scripts(event_id);
CREATE INDEX idx_scripts_status ON scripts(status);
```

#### script_segments (台本环节表)

```sql
CREATE TABLE script_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
    segment_type VARCHAR(50) NOT NULL,
    -- 环节类型: opening, speech, presentation, performance, award, lottery, break, meal, closing, other
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration INTEGER NOT NULL,
    -- 时长（分钟）
    content TEXT,
    -- 详细内容/台词
    speakers JSONB DEFAULT '[]',
    -- 发言人 [{ name, role, company }]
    performers JSONB DEFAULT '[]',
    -- 表演者 [{ name, role }]
    equipment JSONB DEFAULT '{}',
    -- 设备需求 { audio, video, lighting, ppt }
    materials JSONB DEFAULT '[]',
    -- 所需物料 [{ name, quantity, notes }]
    assignees UUID[] DEFAULT '{}',
    -- 负责人ID列表
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    execution_status VARCHAR(30) DEFAULT 'pending',
    -- 执行状态: pending, in_progress, completed, skipped, delayed
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    execution_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_segment_type CHECK (segment_type IN ('opening', 'speech', 'presentation', 'performance', 'award', 'lottery', 'break', 'meal', 'closing', 'other')),
    CONSTRAINT valid_segment_status CHECK (execution_status IN ('pending', 'in_progress', 'completed', 'skipped', 'delayed')),
    CONSTRAINT positive_duration CHECK (duration > 0)
);

CREATE INDEX idx_segments_script ON script_segments(script_id);
CREATE INDEX idx_segments_order ON script_segments(script_id, sort_order);
CREATE INDEX idx_segments_time ON script_segments(start_time);
CREATE INDEX idx_segments_status ON script_segments(execution_status);
```

---

### 3.6 抽奖模块

#### prizes (奖品表)

```sql
CREATE TABLE prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    image_url TEXT,
    prize_level VARCHAR(30) NOT NULL,
    -- 奖品等级: grand, first, second, third, lucky
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    drawn_count INTEGER DEFAULT 0,
    value DECIMAL(10, 2),
    -- 原价值
    sponsor VARCHAR(200),
    -- 赞助商
    sponsor_logo TEXT,
    eligibility JSONB DEFAULT '{}',
    -- 参与条件 { vip_only: boolean, min_vip_level: number, exclude_winners: boolean }
    draw_method VARCHAR(30) DEFAULT 'random',
    -- 抽奖方式: random, rolling, preset
    animation_type VARCHAR(30) DEFAULT 'default',
    -- 动画类型: default, wheel, cards, numbers
    sort_order INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    -- 状态: active, completed, disabled
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_prize_level CHECK (prize_level IN ('grand', 'first', 'second', 'third', 'lucky')),
    CONSTRAINT valid_draw_method CHECK (draw_method IN ('random', 'rolling', 'preset')),
    CONSTRAINT valid_prize_status CHECK (status IN ('active', 'completed', 'disabled'))
);

CREATE INDEX idx_prizes_event ON prizes(event_id);
CREATE INDEX idx_prizes_status ON prizes(status);
CREATE INDEX idx_prizes_order ON prizes(event_id, sort_order);
```

#### lottery_records (抽奖记录表)

```sql
CREATE TABLE lottery_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    prize_id UUID NOT NULL REFERENCES prizes(id),
    guest_id UUID NOT NULL REFERENCES guests(id),
    draw_time TIMESTAMP NOT NULL DEFAULT NOW(),
    draw_method VARCHAR(30) NOT NULL,
    -- 抽奖方式: random, rolling, preset, manual
    operator_id UUID REFERENCES users(id),
    pickup_status VARCHAR(20) DEFAULT 'pending',
    -- 领取状态: pending, picked_up, distributed
    pickup_time TIMESTAMP,
    pickup_location VARCHAR(100),
    distributor_id UUID REFERENCES users(id),
    notes TEXT,
    
    CONSTRAINT valid_pickup_status CHECK (pickup_status IN ('pending', 'picked_up', 'distributed')),
    CONSTRAINT valid_draw_method CHECK (draw_method IN ('random', 'rolling', 'preset', 'manual'))
);

CREATE INDEX idx_lottery_event ON lottery_records(event_id);
CREATE INDEX idx_lottery_prize ON lottery_records(prize_id);
CREATE INDEX idx_lottery_guest ON lottery_records(guest_id);
CREATE INDEX idx_lottery_time ON lottery_records(draw_time);
```

---

### 3.7 供应商与物料模块

#### suppliers (供应商表)

```sql
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    -- 类型: venue, catering, equipment, printing, gift, photo, video, other
    contact_person VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255),
    address TEXT,
    bank_info JSONB DEFAULT '{}',
    -- { bank_name, account_name, account_number }
    description TEXT,
    services JSONB DEFAULT '[]',
    -- 服务项目列表 [{ name, description, price_range }]
    rating DECIMAL(3, 2) DEFAULT 0,
    cooperation_count INTEGER DEFAULT 0,
    last_cooperation_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    -- 状态: active, inactive, blacklist
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT valid_supplier_type CHECK (type IN ('venue', 'catering', 'equipment', 'printing', 'gift', 'photo', 'video', 'other')),
    CONSTRAINT valid_supplier_status CHECK (status IN ('active', 'inactive', 'blacklist'))
);

CREATE INDEX idx_suppliers_type ON suppliers(type);
CREATE INDEX idx_suppliers_status ON suppliers(status);
CREATE INDEX idx_suppliers_rating ON suppliers(rating);
```

#### supplier_reviews (供应商评价表)

```sql
CREATE TABLE supplier_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
    service_score INTEGER CHECK (service_score >= 1 AND service_score <= 5),
    price_score INTEGER CHECK (price_score >= 1 AND price_score <= 5),
    punctuality_score INTEGER CHECK (punctuality_score >= 1 AND punctuality_score <= 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_supplier ON supplier_reviews(supplier_id);
CREATE INDEX idx_reviews_event ON supplier_reviews(event_id);
```

#### materials (物料表)

```sql
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    -- 类别: decoration, printed, gift, equipment, catering, other
    specification TEXT,
    -- 规格描述
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit VARCHAR(20) NOT NULL,
    budget_unit_price DECIMAL(10, 2),
    budget_total_price DECIMAL(12, 2),
    actual_unit_price DECIMAL(10, 2),
    actual_total_price DECIMAL(12, 2),
    supplier_id UUID REFERENCES suppliers(id),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    -- 状态: pending, quoted, ordered, in_production, delivered, settled
    requirement_date TIMESTAMP,
    -- 需求日期
    delivery_date TIMESTAMP,
    -- 预计交付日期
    actual_delivery_date TIMESTAMP,
    -- 实际交付日期
    quality_check VARCHAR(20),
    -- 质检状态: pending, passed, failed
    quality_notes TEXT,
    attachments JSONB DEFAULT '[]',
    -- 附件（设计稿、合同等）
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT valid_material_category CHECK (category IN ('decoration', 'printed', 'gift', 'equipment', 'catering', 'other')),
    CONSTRAINT valid_material_status CHECK (status IN ('pending', 'quoted', 'ordered', 'in_production', 'delivered', 'settled'))
);

CREATE INDEX idx_materials_event ON materials(event_id);
CREATE INDEX idx_materials_status ON materials(status);
CREATE INDEX idx_materials_supplier ON materials(supplier_id);
CREATE INDEX idx_materials_category ON materials(category);
```

#### purchase_orders (采购订单表)

```sql
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    order_number VARCHAR(50) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    -- 状态: pending, confirmed, in_progress, shipped, delivered, settled, cancelled
    order_date TIMESTAMP NOT NULL DEFAULT NOW(),
    expected_delivery_date TIMESTAMP,
    actual_delivery_date TIMESTAMP,
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    -- 付款状态: unpaid, partial, paid
    payment_amount DECIMAL(12, 2) DEFAULT 0,
    payment_date TIMESTAMP,
    items JSONB NOT NULL,
    -- 订单明细 [{ material_id, name, quantity, unit_price, total_price }]
    notes TEXT,
    attachments JSONB DEFAULT '[]',
    -- 合同、发票等附件
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_order_number UNIQUE (event_id, order_number),
    CONSTRAINT valid_order_status CHECK (status IN ('pending', 'confirmed', 'in_progress', 'shipped', 'delivered', 'settled', 'cancelled')),
    CONSTRAINT valid_payment_status CHECK (payment_status IN ('unpaid', 'partial', 'paid'))
);

CREATE INDEX idx_orders_event ON purchase_orders(event_id);
CREATE INDEX idx_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_orders_status ON purchase_orders(status);
CREATE INDEX idx_orders_number ON purchase_orders(order_number);
```

---

### 3.8 复盘报告模块

#### reports (复盘报告表)

```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(30) DEFAULT 'post_event',
    -- 类型: post_event, weekly, milestone, custom
    status VARCHAR(20) DEFAULT 'draft',
    -- 状态: draft, published, archived
    summary TEXT,
    -- 报告摘要
    statistics JSONB DEFAULT '{}',
    -- 统计数据
    /*
    {
        check_in_rate: number,
        actual_guests: number,
        vip_attendance_rate: number,
        budget_usage: number,
        task_completion_rate: number,
        ...
    }
    */
    content JSONB DEFAULT '{}',
    -- 结构化报告内容
    /*
    {
        overview: { ... },
        data_analysis: { ... },
        highlights: [{ ... }],
        issues: [{ description, impact, solution }],
        improvements: [{ ... }],
        lessons: [{ ... }],
        recommendations: [{ ... }]
    }
    */
    attachments JSONB DEFAULT '[]',
    -- 附件（照片、视频、文档）
    generated_by_ai BOOLEAN DEFAULT FALSE,
    ai_model VARCHAR(50),
    -- AI生成模型
    created_by UUID NOT NULL REFERENCES users(id),
    published_at TIMESTAMP,
    published_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_report_type CHECK (type IN ('post_event', 'weekly', 'milestone', 'custom')),
    CONSTRAINT valid_report_status CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE INDEX idx_reports_event ON reports(event_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_type ON reports(type);
```

#### report_issues (问题记录表)

```sql
CREATE TABLE report_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    -- 类别: logistics, coordination, communication, equipment, timing, other
    severity VARCHAR(20) DEFAULT 'medium',
    -- 严重程度: low, medium, high, critical
    description TEXT NOT NULL,
    impact TEXT,
    cause TEXT,
    solution TEXT,
    prevention TEXT,
    -- 防范措施
    responsible_party VARCHAR(100),
    status VARCHAR(20) DEFAULT 'open',
    -- 状态: open, resolved, closed
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_issue_category CHECK (category IN ('logistics', 'coordination', 'communication', 'equipment', 'timing', 'other')),
    CONSTRAINT valid_issue_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT valid_issue_status CHECK (status IN ('open', 'resolved', 'closed'))
);

CREATE INDEX idx_issues_event ON report_issues(event_id);
CREATE INDEX idx_issues_category ON report_issues(category);
CREATE INDEX idx_issues_status ON report_issues(status);
```

---

### 3.9 系统配置模块

#### settings (系统设置表)

```sql
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    -- 类别: general, checkin, lottery, notification, ai
    is_public BOOLEAN DEFAULT FALSE,
    -- 是否公开（前端可访问）
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_settings_key ON settings(key);
CREATE INDEX idx_settings_category ON settings(category);
```

#### templates (模板表)

```sql
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    -- 类型: event, script, seating, task, report
    name VARCHAR(200) NOT NULL,
    description TEXT,
    content JSONB NOT NULL,
    -- 模板内容
    is_public BOOLEAN DEFAULT FALSE,
    -- 是否公开模板
    created_by UUID NOT NULL REFERENCES users(id),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_template_type CHECK (type IN ('event', 'script', 'seating', 'task', 'report'))
);

CREATE INDEX idx_templates_type ON templates(type);
CREATE INDEX idx_templates_public ON templates(is_public);
CREATE INDEX idx_templates_creator ON templates(created_by);
```

---

## 四、视图设计

### 4.1 活动统计视图

```sql
CREATE VIEW event_statistics AS
SELECT 
    e.id AS event_id,
    e.name,
    e.type,
    e.status,
    e.start_time,
    e.expected_guests,
    COUNT(DISTINCT g.id) AS total_guests,
    COUNT(DISTINCT CASE WHEN g.check_in_status THEN g.id END) AS checked_in_guests,
    ROUND(COUNT(DISTINCT CASE WHEN g.check_in_status THEN g.id END)::DECIMAL / 
          NULLIF(COUNT(DISTINCT g.id), 0) * 100, 2) AS check_in_rate,
    COUNT(DISTINCT CASE WHEN g.vip_level > 0 THEN g.id END) AS vip_guests,
    COUNT(DISTINCT CASE WHEN g.vip_level > 0 AND g.check_in_status THEN g.id END) AS vip_checked_in,
    COUNT(DISTINCT t.id) AS total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) AS completed_tasks,
    COUNT(DISTINCT p.id) AS total_prizes,
    SUM(p.drawn_count) AS drawn_prizes,
    e.budget,
    COALESCE(SUM(m.actual_total_price), 0) + COALESCE(SUM(po.total_amount), 0) AS actual_cost,
    COUNT(DISTINCT s.id) AS total_suppliers
FROM events e
LEFT JOIN guests g ON g.event_id = e.id
LEFT JOIN tasks t ON t.event_id = e.id
LEFT JOIN prizes p ON p.event_id = e.id
LEFT JOIN materials m ON m.event_id = e.id
LEFT JOIN purchase_orders po ON po.event_id = e.id AND po.status != 'cancelled'
LEFT JOIN suppliers s ON EXISTS (
    SELECT 1 FROM materials m2 WHERE m2.event_id = e.id AND m2.supplier_id = s.id
)
GROUP BY e.id;
```

### 4.2 嘉宾签到视图

```sql
CREATE VIEW guest_checkin_view AS
SELECT 
    g.id AS guest_id,
    g.event_id,
    e.name AS event_name,
    g.name,
    g.company,
    g.position,
    g.vip_level,
    g.check_in_status,
    g.check_in_time,
    g.check_in_method,
    g.check_in_point,
    s.seat_number,
    s.table_number,
    g.group_id,
    gg.name AS group_name
FROM guests g
JOIN events e ON e.id = g.event_id
LEFT JOIN seats s ON s.id = g.seat_id
LEFT JOIN guest_groups gg ON gg.id = g.group_id;
```

---

## 五、索引策略总结

### 5.1 关键索引清单

| 表名 | 索引名 | 索引字段 | 用途 |
|------|--------|----------|------|
| events | idx_events_status | status | 活动状态筛选 |
| events | idx_events_start_time | start_time | 活动时间排序 |
| guests | idx_guests_event | event_id | 活动嘉宾查询 |
| guests | idx_guests_check_in | event_id, check_in_status | 签到统计 |
| tasks | idx_tasks_event | event_id | 活动任务查询 |
| tasks | idx_tasks_due_date | due_date | 任务截止时间 |
| seats | idx_seats_layout | layout_id | 座位布局查询 |
| check_in_records | idx_check_in_time | check_in_time | 签到时间统计 |
| lottery_records | idx_lottery_event | event_id | 抽奖记录查询 |

### 5.2 性能优化建议

1. **分区表**：签到记录表按 event_id 分区，支持大数据量
2. **读写分离**：高频查询使用只读副本
3. **连接池**：配置合理的连接池大小
4. **查询优化**：避免 N+1 查询，使用 JOIN 和批量查询

---

## 六、Prisma Schema 示例

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 用户模型
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  phone         String?        @unique
  passwordHash  String?
  name          String
  avatarUrl     String?
  role          String         @default("staff")
  status        String         @default("active")
  lastLoginAt   DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  createdBy     String?
  
  events        Event[]
  tasks         Task[]
  guests        Guest[]
  auditLogs     AuditLog[]
  
  @@index([email])
  @@index([role])
  @@index([status])
  @@map("users")
}

// 活动模型
model Event {
  id              String        @id @default(uuid())
  name            String
  type            String
  status          String        @default("draft")
  description     String?
  startTime       DateTime
  endTime         DateTime
  location        String?
  address         String?
  expectedGuests  Int           @default(0)
  actualGuests    Int           @default(0)
  coverImageUrl   String?
  ownerId         String
  budget          Decimal       @default(0)
  actualCost      Decimal       @default(0)
  settings        Json?
  tags            Json?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  createdBy       String?
  
  owner           User          @relation(fields: [ownerId], references: [id])
  members         EventMember[]
  guests          Guest[]
  tasks           Task[]
  venues          VenueLayout[]
  scripts         Script[]
  prizes          Prize[]
  materials       Material[]
  reports         Report[]
  
  @@index([status])
  @@index([startTime])
  @@index([ownerId])
  @@map("events")
}

// 其他模型省略，详见完整 schema 文件
```

---

> **文档维护**：本文档随数据库演进持续更新  
> **负责人**：数据库管理员  
> **最后更新**：2025-01-15