# EventSync Pro - 完整项目复刻指南

> 本文档面向 Cursor、Codex、Claude Code 等 AI 编程工具，提供项目的完整架构、文件清单、关键代码与实现细节，确保精准复刻。

---

## 一、项目概述

**EventSync Pro** 是一款面向活动策划与执行的**数字化流程管理工具**，通过可视化台本整合时间轴、职责分工、现场执行追踪与多格式导出。

### 1.1 核心功能

| 模块 | 功能描述 |
|------|---------|
| **台本编辑** | 可视化时间轴、环节拖拽排序、步骤增删改查、章节分组管理 |
| **多角色协同** | 7 大默认角色（主持/致辞/演讲/颁奖/演奏/表演/嘉宾）+ 自定义角色 |
| **实时追踪** | 现场执行状态跟踪、当前环节高亮、进度统计 |
| **多格式导出** | 高清 PNG 长图（300 DPI / 1206px 宽）、Excel 表格 |
| **参会名单管理** | Excel/CSV 文件导入、粘贴导入、手动添加、签到统计 |
| **多终端同步** | localStorage + 服务器 API 双向同步 |
| **多皮肤导出** | 千里江山图、清明上河图、辉煌盛世金、雅致青花紫 |

### 1.2 技术栈

```
Next.js 16 (App Router) + React 19 + TypeScript 5
+ shadcn/ui (Radix UI) + Tailwind CSS 4
+ @dnd-kit (拖拽) + modern-screenshot (图片导出) + xlsx (Excel)
```

---

## 二、项目初始化

### 2.1 使用 Coze CLI 初始化

```bash
coze init ./eventsync-pro --template nextjs
```

### 2.2 依赖安装

```bash
pnpm add modern-screenshot xlsx lucide-react
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu
pnpm add @radix-ui/react-popover @radix-ui/react-select
pnpm add @radix-ui/react-tabs @radix-ui/react-tooltip
pnpm add @radix-ui/react-checkbox @radix-ui/react-switch
pnpm add @radix-ui/react-progress @radix-ui/react-separator
pnpm add @radix-ui/react-scroll-area @radix-ui/react-slot
pnpm add class-variance-authority clsx tailwind-merge
```

### 2.3 shadcn/ui 组件

```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input label textarea
pnpm dlx shadcn@latest add dialog dropdown-menu select
pnpm dlx shadcn@latest add tabs tooltip popover
pnpm dlx shadcn@latest add badge card separator switch
pnpm dlx shadcn@latest add scroll-area checkbox progress
```

---

## 三、完整文件清单

```
eventsync-pro/
├── .coze                          # 沙箱配置
├── package.json                   # 依赖管理
├── tsconfig.json                  # TS 配置
├── next.config.ts                 # Next.js 配置
├── tailwind.config.ts             # Tailwind 配置
├── README.md                      # 项目说明
├── PRINT_GUIDE.md                 # 打印启动说明
└── src/
    ├── app/
    │   ├── layout.tsx             # 根布局
    │   ├── globals.css            # 全局样式
    │   ├── page.tsx               # 主页面（台本编辑）
    │   ├── checkin/
    │   │   └── page.tsx           # 签到管理页面
    │   └── api/
    │       ├── data/
    │       │   └── route.ts       # 通用数据存储
    │       ├── upload/
    │       │   ├── route.ts       # 文件上传
    │       │   └── [filename]/
    │       │       └── route.ts   # 文件访问
    │       ├── export/
    │       │   └── excel/
    │       │       └── route.ts   # Excel 导出
    │       └── save/
    │           └── route.ts       # 数据保存
    ├── components/
    │   ├── ui/                    # shadcn 组件（自动生成）
    │   ├── EventMetaEditor.tsx    # 活动信息编辑
    │   ├── EventTimeline.tsx      # 主时间轴（拖拽核心）
    │   ├── ChapterManager.tsx     # 章节管理
    │   ├── RoleManager.tsx        # 角色管理
    │   ├── SegmentCard.tsx        # 环节卡片
    │   ├── StepEditor.tsx         # 步骤编辑
    │   ├── ExportTemplate.tsx     # 导出模板（核心）
    │   ├── ImportExportPanel.tsx  # 导入导出面板
    │   ├── AttendeeImport.tsx     # 参会名单导入
    │   ├── AttendeeList.tsx       # 参会名单展示
    │   ├── ThemeSelector.tsx      # 主题选择
    │   ├── TemplateSelector.tsx   # 模板选择
    │   └── StatusBadge.tsx        # 状态标签
    ├── contexts/
    │   └── EventContext.tsx       # 全局状态管理
    ├── types/
    │   └── event.ts               # 数据类型定义
    ├── lib/
    │   ├── utils.ts               # 工具函数
    │   └── event.ts               # 业务工具
    └── config/
        └── constants.ts           # 常量配置
```

---

## 四、核心配置文件

### 4.1 `.coze`（沙箱配置）

```toml
[project]
requires = ["nodejs-24"]

[dev]
build = ["pnpm", "install"]
run = ["pnpm", "run", "dev"]

[deploy]
build = ["pnpm", "run", "build"]
run = ["pnpm", "run", "start"]
```

### 4.2 `package.json` 关键字段

```json
{
  "name": "eventsync-pro",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "16.0.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "modern-screenshot": "^4.4.39",
    "xlsx": "^0.18.5",
    "lucide-react": "^0.460.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4"
  }
}
```

---

## 五、核心数据模型

### 5.1 `src/types/event.ts`

```typescript
// ====== 步骤 ======
export interface EventStep {
  id: string;
  order: number;
  content: string;
  duration?: number;
  notes?: string;
}

// ====== 环节 ======
export interface EventSegment {
  id: string;
  chapterId?: string;        // 所属章节
  order: number;             // 排序
  name: string;              // 环节名称
  startTime: string;         // "HH:MM"
  endTime: string;
  duration: number;          // 分钟
  isNextDay: boolean;        // 次日
  content: string;           // 环节内容
  responsibilities: {        // 角色职责
    [roleKey: string]: string;
  };
  notes?: string;            // 备注
  steps?: EventStep[];       // 子步骤
  status?: SegmentStatus;    // 执行状态
  actualStartTime?: string;
  actualEndTime?: string;
}

export type SegmentStatus = 'pending' | 'in-progress' | 'completed' | 'delayed' | 'cancelled';

// ====== 章节 ======
export interface EventChapter {
  id: string;
  name: string;
  color: string;             // 主题色 hex
  order: number;
  description?: string;
}

// ====== 活动元信息 ======
export interface EventMeta {
  id: string;
  name: string;
  theme?: string;
  date: string;              // "YYYY-MM-DD"
  location: string;
  organizer: string;
  planner?: string;
  startTime: string;         // "HH:MM"
  createdAt: string;         // ISO
  updatedAt: string;
}

// ====== 角色 ======
export interface Role {
  key: string;
  label: string;
  color?: string;
  isDefault?: boolean;
}

// ====== 完整台本 ======
export interface EventScript {
  meta: EventMeta;
  chapters: EventChapter[];
  segments: EventSegment[];
  roles: Role[];
}

// ====== 参会人员 ======
export interface Attendee {
  id: string;
  name: string;
  organization?: string;     // 单位
  position?: string;         // 职位
  phone?: string;
  email?: string;
  category?: string;         // VIP/普通/媒体
  seatNumber?: string;
  notes?: string;
  checkedIn: boolean;
  checkInTime?: string;
  importSource?: 'excel' | 'csv' | 'paste' | 'manual';
  importedAt: string;
}

export interface AttendeeImportResult {
  success: boolean;
  added: number;
  updated: number;
  failed: number;
  errors?: string[];
  attendees: Attendee[];
}

// ====== 导出配置 ======
export type ExportSkin = 'qianli' | 'qingming' | 'golden' | 'qinghua';

export interface SkinConfig {
  name: string;
  description: string;
  background: string;        // CSS background
  accentColor: string;       // 主题色
}

export const SKIN_CONFIGS: Record<ExportSkin, SkinConfig> = {
  qianli: {
    name: '千里江山图',
    description: '青绿山水，典雅大气',
    background: 'linear-gradient(135deg, #1a3a52 0%, #2d5a7b 50%, #1a3a52 100%)',
    accentColor: '#d4af37',
  },
  qingming: {
    name: '清明上河图',
    description: '淡雅水墨，古朴风韵',
    background: 'linear-gradient(135deg, #f5e6d3 0%, #ede0c8 50%, #f5e6d3 100%)',
    accentColor: '#8b4513',
  },
  golden: {
    name: '辉煌盛世金',
    description: '金碧辉煌，尊贵典雅',
    background: 'linear-gradient(135deg, #3d2914 0%, #5c3d1f 50%, #3d2914 100%)',
    accentColor: '#ffd700',
  },
  qinghua: {
    name: '雅致青花紫',
    description: '青花瓷韵，古雅清秀',
    background: 'linear-gradient(135deg, #1f1f3d 0%, #2d2d5a 50%, #1f1f3d 100%)',
    accentColor: '#9370db',
  },
};

export interface ExportTemplateConfig {
  logo?: string;              // LOGO URL
  eventName: string;
  eventTheme: string;
  organizer: string;
  footerLine1: string;
  footerLine2: string;
  skin: ExportSkin;
  selectedChapters: string[];
  selectedSegments: string[];
  hiddenFields: Array<'responsibilities' | 'notes' | 'duration' | 'status'>;
  showSteps: boolean;
}
```

### 5.2 `src/config/constants.ts`

```typescript
export const DEFAULT_ROLES: Role[] = [
  { key: 'host', label: '主持人', color: '#ef4444', isDefault: true },
  { key: 'speaker', label: '致辞嘉宾', color: '#f59e0b', isDefault: true },
  { key: 'presenter', label: '演讲嘉宾', color: '#10b981', isDefault: true },
  { key: 'awarder', label: '颁奖嘉宾', color: '#3b82f6', isDefault: true },
  { key: 'performer', label: '演出嘉宾', color: '#8b5cf6', isDefault: true },
  { key: 'musician', label: '演奏嘉宾', color: '#ec4899', isDefault: true },
  { key: 'guest', label: '参会嘉宾', color: '#6b7280', isDefault: true },
];

export const DEFAULT_CHAPTERS: EventChapter[] = [
  { id: 'ch-opening', name: '开场', color: '#ef4444', order: 0 },
  { id: 'ch-process', name: '正式环节', color: '#3b82f6', order: 1 },
  { id: 'ch-closing', name: '闭幕', color: '#10b981', order: 2 },
];

// 导出配置
export const EXPORT_CONFIG = {
  dpi: 300,
  scale: 300 / 96,
  baseWidth: 1206,           // iPhone 17 Pro 比例
  previewScale: 2.8,
  get previewWidth() {
    return Math.round(this.baseWidth / this.previewScale);
  },
};

export const DEFAULT_TEMPLATE_ID = 'standard-dinner';
```

### 5.3 `src/lib/event.ts` 业务工具

```typescript
import type { EventSegment } from '@/types/event';

/**
 * 根据环节列表自动计算开始/结束时间
 * @param segments 环节列表
 * @param startTime 活动开始时间 "HH:MM"
 * @param baseDate 基准日期 "YYYY-MM-DD"
 */
export function calculateSegmentTimes(
  segments: EventSegment[],
  startTime: string,
  baseDate: string
): EventSegment[] {
  let currentMinutes = parseTime(startTime);
  let currentDate = new Date(baseDate);

  return segments.map((seg) => {
    const start = currentMinutes;
    const end = start + (seg.duration || 0);

    if (end >= 24 * 60) {
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      currentMinutes = end - 24 * 60;
    } else {
      currentMinutes = end;
    }

    return {
      ...seg,
      startTime: formatTime(start),
      endTime: formatTime(end % (24 * 60)),
      isNextDay: end >= 24 * 60,
    };
  });
}

function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 生成唯一 ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** 重新排序 */
export function reorderSegments(segments: EventSegment[]): EventSegment[] {
  return segments
    .sort((a, b) => a.order - b.order)
    .map((s, i) => ({ ...s, order: i }));
}
```

---

## 六、状态管理（EventContext）

### 6.1 `src/contexts/EventContext.tsx`

```typescript
'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import type {
  EventScript, EventMeta, EventSegment, EventChapter, Role, Attendee
} from '@/types/event';
import { DEFAULT_ROLES, DEFAULT_CHAPTERS } from '@/config/constants';
import { generateId, calculateSegmentTimes, reorderSegments } from '@/lib/event';

interface State {
  eventScript: EventScript;
  attendees: Attendee[];
  loading: boolean;
  syncing: boolean;
  lastSyncedAt?: string;
}

type Action =
  | { type: 'LOAD_STATE'; payload: State }
  | { type: 'UPDATE_META'; payload: Partial<EventMeta> }
  | { type: 'ADD_SEGMENT'; payload: EventSegment }
  | { type: 'UPDATE_SEGMENT'; payload: { id: string; data: Partial<EventSegment> } }
  | { type: 'DELETE_SEGMENT'; payload: string }
  | { type: 'REORDER_SEGMENTS'; payload: EventSegment[] }
  | { type: 'ADD_CHAPTER'; payload: EventChapter }
  | { type: 'UPDATE_CHAPTER'; payload: { id: string; data: Partial<EventChapter> } }
  | { type: 'DELETE_CHAPTER'; payload: string }
  | { type: 'ASSIGN_SEGMENT_TO_CHAPTER'; payload: { segmentId: string; chapterId: string | null } }
  | { type: 'ADD_STEP'; payload: { segmentId: string; content: string } }
  | { type: 'UPDATE_STEP'; payload: { segmentId: string; stepId: string; content: string } }
  | { type: 'DELETE_STEP'; payload: { segmentId: string; stepId: string } }
  | { type: 'SET_ROLES'; payload: Role[] }
  | { type: 'SET_STATUS'; payload: { segmentId: string; status: string } }
  | { type: 'SET_ATTENDEES'; payload: Attendee[] }
  | { type: 'ADD_ATTENDEE'; payload: Attendee }
  | { type: 'UPDATE_ATTENDEE'; payload: { id: string; data: Partial<Attendee> } }
  | { type: 'DELETE_ATTENDEE'; payload: string }
  | { type: 'BATCH_ADD_ATTENDEES'; payload: Attendee[] }
  | { type: 'TOGGLE_CHECKIN'; payload: string }
  | { type: 'SET_SYNCING'; payload: boolean };

const initialMeta: EventMeta = {
  id: 'default-event',
  name: '2024 年度盛典',
  theme: '携手共创未来',
  date: new Date().toISOString().split('T')[0],
  location: '北京·国家会议中心',
  organizer: 'XX 集团',
  planner: 'XX 活动公司',
  startTime: '18:00',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const initialState: State = {
  eventScript: {
    meta: initialMeta,
    chapters: DEFAULT_CHAPTERS,
    segments: [],
    roles: DEFAULT_ROLES,
  },
  attendees: [],
  loading: true,
  syncing: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;

    case 'UPDATE_META':
      return {
        ...state,
        eventScript: {
          ...state.eventScript,
          meta: { ...state.eventScript.meta, ...action.payload, updatedAt: new Date().toISOString() },
        },
      };

    case 'ADD_SEGMENT':
      return {
        ...state,
        eventScript: { ...state.eventScript, segments: [...state.eventScript.segments, action.payload] },
      };

    case 'UPDATE_SEGMENT': {
      const segments = state.eventScript.segments.map(s =>
        s.id === action.payload.id ? { ...s, ...action.payload.data } : s
      );
      return { ...state, eventScript: { ...state.eventScript, segments } };
    }

    case 'DELETE_SEGMENT': {
      const segments = state.eventScript.segments
        .filter(s => s.id !== action.payload)
        .map((s, i) => ({ ...s, order: i }));
      return { ...state, eventScript: { ...state.eventScript, segments } };
    }

    case 'REORDER_SEGMENTS':
      return {
        ...state,
        eventScript: { ...state.eventScript, segments: reorderSegments(action.payload) },
      };

    case 'ADD_CHAPTER':
      return {
        ...state,
        eventScript: {
          ...state.eventScript,
          chapters: [...state.eventScript.chapters, { ...action.payload, order: state.eventScript.chapters.length }],
        },
      };

    case 'UPDATE_CHAPTER': {
      const chapters = state.eventScript.chapters.map(c =>
        c.id === action.payload.id ? { ...c, ...action.payload.data } : c
      );
      return { ...state, eventScript: { ...state.eventScript, chapters } };
    }

    case 'DELETE_CHAPTER': {
      const chapters = state.eventScript.chapters
        .filter(c => c.id !== action.payload)
        .map((c, i) => ({ ...c, order: i }));
      // 解除环节绑定
      const segments = state.eventScript.segments.map(s =>
        s.chapterId === action.payload ? { ...s, chapterId: undefined } : s
      );
      // 重新计算时间
      const calculated = calculateSegmentTimes(
        segments,
        state.eventScript.meta.startTime,
        state.eventScript.meta.date
      );
      return {
        ...state,
        eventScript: { ...state.eventScript, chapters, segments: calculated },
      };
    }

    case 'ASSIGN_SEGMENT_TO_CHAPTER': {
      const segments = state.eventScript.segments.map(s =>
        s.id === action.payload.segmentId ? { ...s, chapterId: action.payload.chapterId || undefined } : s
      );
      // 重新计算时间
      const calculated = calculateSegmentTimes(
        segments,
        state.eventScript.meta.startTime,
        state.eventScript.meta.date
      );
      return { ...state, eventScript: { ...state.eventScript, segments: calculated } };
    }

    case 'ADD_STEP': {
      const segments = state.eventScript.segments.map(s => {
        if (s.id !== action.payload.segmentId) return s;
        const steps = s.steps || [];
        return {
          ...s,
          steps: [...steps, {
            id: generateId(),
            order: steps.length,
            content: action.payload.content,
          }],
        };
      });
      return { ...state, eventScript: { ...state.eventScript, segments } };
    }

    case 'UPDATE_STEP': {
      const segments = state.eventScript.segments.map(s => {
        if (s.id !== action.payload.segmentId) return s;
        return {
          ...s,
          steps: (s.steps || []).map(step =>
            step.id === action.payload.stepId ? { ...step, content: action.payload.content } : step
          ),
        };
      });
      return { ...state, eventScript: { ...state.eventScript, segments } };
    }

    case 'DELETE_STEP': {
      const segments = state.eventScript.segments.map(s => {
        if (s.id !== action.payload.segmentId) return s;
        return {
          ...s,
          steps: (s.steps || []).filter(step => step.id !== action.payload.stepId),
        };
      });
      return { ...state, eventScript: { ...state.eventScript, segments } };
    }

    case 'SET_ROLES':
      return { ...state, eventScript: { ...state.eventScript, roles: action.payload } };

    case 'SET_STATUS': {
      const segments = state.eventScript.segments.map(s =>
        s.id === action.payload.segmentId ? { ...s, status: action.payload.status as any } : s
      );
      return { ...state, eventScript: { ...state.eventScript, segments } };
    }

    case 'SET_ATTENDEES':
      return { ...state, attendees: action.payload };

    case 'ADD_ATTENDEE':
      return { ...state, attendees: [...state.attendees, action.payload] };

    case 'UPDATE_ATTENDEE':
      return {
        ...state,
        attendees: state.attendees.map(a =>
          a.id === action.payload.id ? { ...a, ...action.payload.data } : a
        ),
      };

    case 'DELETE_ATTENDEE':
      return { ...state, attendees: state.attendees.filter(a => a.id !== action.payload) };

    case 'BATCH_ADD_ATTENDEES':
      return { ...state, attendees: [...state.attendees, ...action.payload] };

    case 'TOGGLE_CHECKIN':
      return {
        ...state,
        attendees: state.attendees.map(a =>
          a.id === action.payload
            ? { ...a, checkedIn: !a.checkedIn, checkInTime: !a.checkedIn ? new Date().toISOString() : undefined }
            : a
        ),
      };

    case 'SET_SYNCING':
      return { ...state, syncing: action.payload };

    default:
      return state;
  }
}

interface EventContextType {
  state: State;
  dispatch: React.Dispatch<Action>;
  saveToServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化：先从 localStorage 加载，再从服务器拉取
  useEffect(() => {
    async function init() {
      // 1. localStorage
      try {
        const local = localStorage.getItem('eventsync-state');
        if (local) {
          const parsed = JSON.parse(local);
          dispatch({ type: 'LOAD_STATE', payload: { ...parsed, loading: false } });
        } else {
          dispatch({ type: 'LOAD_STATE', payload: { ...initialState, loading: false } });
        }
      } catch {
        dispatch({ type: 'LOAD_STATE', payload: { ...initialState, loading: false } });
      }

      // 2. 服务器
      await loadFromServer();
    }
    init();
  }, []);

  // 加载服务器数据
  const loadFromServer = useCallback(async () => {
    try {
      const [scriptRes, attendeesRes] = await Promise.all([
        fetch('/api/data?type=eventScript').then(r => r.json()).catch(() => null),
        fetch('/api/data?type=attendees').then(r => r.json()).catch(() => null),
      ]);

      if (scriptRes?.data?.eventScript) {
        dispatch({
          type: 'LOAD_STATE',
          payload: {
            ...state,
            eventScript: scriptRes.data.eventScript,
            attendees: state.attendees,
            loading: false,
            lastSyncedAt: new Date().toISOString(),
          },
        });
      }

      if (attendeesRes?.data?.attendees) {
        dispatch({ type: 'SET_ATTENDEES', payload: attendeesRes.data.attendees });
      }
    } catch (err) {
      console.error('Load from server failed:', err);
    }
  }, []);

  // 防抖保存到服务器
  const saveToServer = useCallback(async () => {
    dispatch({ type: 'SET_SYNCING', payload: true });
    try {
      await Promise.all([
        fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'eventScript', data: { eventScript: state.eventScript } }),
        }),
        fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'attendees', data: { attendees: state.attendees } }),
        }),
      ]);
    } catch (err) {
      console.error('Save to server failed:', err);
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false });
    }
  }, [state]);

  // 状态变化时自动保存（防抖 800ms）
  useEffect(() => {
    if (state.loading) return;
    // 写入 localStorage
    try {
      localStorage.setItem('eventsync-state', JSON.stringify(state));
    } catch {}

    // 防抖保存到服务器
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveToServer();
    }, 800);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [state, saveToServer]);

  return (
    <EventContext.Provider value={{ state, dispatch, saveToServer, loadFromServer }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvent must be used within EventProvider');
  return ctx;
}
```

---

## 七、API 路由

### 7.1 通用数据存储 `src/app/api/data/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = '/app/work/data';

// 简单的基于文件 + 内存的存储
const memStore = new Map<string, any>();

async function ensureDir() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch {}
}

export async function GET(request: NextRequest) {
  await ensureDir();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const id = searchParams.get('id') || 'default';

  const key = `${id}:${type}`;

  // 优先从内存
  if (memStore.has(key)) {
    return NextResponse.json({ success: true, data: memStore.get(key) });
  }

  // 否则从文件
  try {
    const file = path.join(DATA_DIR, `${key}.json`);
    const content = await fs.readFile(file, 'utf-8');
    const data = JSON.parse(content);
    memStore.set(key, data);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: true, data: null });
  }
}

export async function POST(request: NextRequest) {
  await ensureDir();
  const body = await request.json();
  const { type, data } = body;
  const id = body.id || 'default';
  const key = `${id}:${type}`;

  memStore.set(key, data);

  try {
    const file = path.join(DATA_DIR, `${key}.json`);
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Persist data failed:', err);
  }

  return NextResponse.json({ success: true });
}
```

### 7.2 文件上传 `src/app/api/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = '/app/work/data/uploads';

export async function POST(request: NextRequest) {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file' }, { status: 400 });
    }

    // 验证类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only images allowed' }, { status: 400 });
    }

    // 验证大小 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // 生成文件名
    const ext = path.extname(file.name);
    const hash = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const filename = `${timestamp}-${hash}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const filepath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(filepath, buffer);

    const url = `/api/upload/${filename}`;
    return NextResponse.json({ success: true, url, filename });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

### 7.3 文件访问 `src/app/api/upload/[filename]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const UPLOAD_DIR = '/app/work/data/uploads';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    const fileBuffer = await fs.readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
```

### 7.4 Excel 导出 `src/app/api/export/excel/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import type { EventScript } from '@/types/event';
import { DEFAULT_ROLES } from '@/config/constants';

export async function POST(request: NextRequest) {
  try {
    const eventScript: EventScript = await request.json();
    const wb = XLSX.utils.book_new();

    // 活动信息表
    const metaSheet = [
      ['活动名称', eventScript.meta.name],
      ['活动日期', eventScript.meta.date],
      ['活动地点', eventScript.meta.location],
      ['主办方', eventScript.meta.organizer],
      ['策划方', eventScript.meta.planner || ''],
      ['开始时间', eventScript.meta.startTime],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(metaSheet), '活动信息');

    // 流程表
    const headers = [
      '序号', '环节名称', '开始时间', '结束时间', '时长(分钟)', '次日',
      '环节内容', ...DEFAULT_ROLES.map(r => r.label), '备注',
    ];
    const rows = eventScript.segments.map((seg, i) => [
      i + 1, seg.name, seg.startTime, seg.endTime, seg.duration,
      seg.isNextDay ? '是' : '否', seg.content,
      ...DEFAULT_ROLES.map(r => seg.responsibilities[r.key] || ''),
      seg.notes || '',
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 6 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 },
      { wch: 30 }, ...DEFAULT_ROLES.map(() => ({ wch: 20 })), { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, '活动流程');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(eventScript.meta.name)}.xlsx"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
```

---

## 八、核心 UI 组件

### 8.1 主页面 `src/app/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useEvent } from '@/contexts/EventContext';
import { EventMetaEditor } from '@/components/EventMetaEditor';
import { EventTimeline } from '@/components/EventTimeline';
import { ChapterManager } from '@/components/ChapterManager';
import { ExportTemplate } from '@/components/ExportTemplate';
import { AttendeeImport } from '@/components/AttendeeImport';
import { ImportExportPanel } from '@/components/ImportExportPanel';
import { Button } from '@/components/ui/button';
import { Users, Download, Upload as UploadIcon, FileText, Loader2, Cloud, CloudOff } from 'lucide-react';
import Link from 'next/link';

type ViewMode = 'edit' | 'export';

export default function HomePage() {
  const { state } = useEvent();
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [showAttendeeImport, setShowAttendeeImport] = useState(false);

  if (state.loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <header className="h-14 bg-white border-b flex items-center px-4 gap-3 shrink-0">
        <h1 className="text-lg font-bold text-gray-900">EventSync Pro</h1>
        <div className="text-sm text-gray-500">数字化台本系统</div>
        <div className="flex-1" />

        {/* 同步状态指示 */}
        {state.syncing ? (
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
        ) : state.lastSyncedAt ? (
          <Cloud className="w-4 h-4 text-green-500" />
        ) : (
          <CloudOff className="w-4 h-4 text-gray-400" />
        )}

        {/* 视图切换 */}
        <div className="flex border rounded">
          <button
            onClick={() => setViewMode('edit')}
            className={`px-3 py-1 text-sm ${viewMode === 'edit' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
          >
            <FileText className="w-4 h-4 inline mr-1" />编辑
          </button>
          <button
            onClick={() => setViewMode('export')}
            className={`px-3 py-1 text-sm ${viewMode === 'export' ? 'bg-blue-500 text-white' : 'text-gray-600'}`}
          >
            <Download className="w-4 h-4 inline mr-1" />导出
          </button>
        </div>

        {/* 操作按钮 */}
        <Button variant="outline" size="sm" onClick={() => setShowAttendeeImport(true)}>
          <UploadIcon className="w-4 h-4 mr-1" />
          导入名单
        </Button>
        <Link href="/checkin">
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-1" />
            签到 {state.attendees.length > 0 && `(${state.attendees.length})`}
          </Button>
        </Link>
      </header>

      {/* 主体 */}
      <main className="flex-1 flex overflow-hidden">
        {viewMode === 'edit' ? (
          <>
            <aside className="w-72 border-r bg-white overflow-y-auto">
              <EventMetaEditor />
              <div className="border-t" />
              <ChapterManager />
              <div className="border-t" />
              <ImportExportPanel />
            </aside>
            <section className="flex-1 overflow-y-auto p-4">
              <EventTimeline />
            </section>
          </>
        ) : (
          <ExportTemplate />
        )}
      </main>

      {/* 参会名单导入弹窗 */}
      {showAttendeeImport && (
        <AttendeeImport onClose={() => setShowAttendeeImport(false)} />
      )}
    </div>
  );
}
```

### 8.2 时间轴组件 `src/components/EventTimeline.tsx`（拖拽核心）

```typescript
'use client';

import { useState } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEvent } from '@/contexts/EventContext';
import { SegmentCard } from './SegmentCard';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { generateId } from '@/lib/event';

export function EventTimeline() {
  const { state, dispatch } = useEvent();
  const { segments, chapters, meta } = state.eventScript;
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = segments.findIndex(s => s.id === active.id);
    const newIndex = segments.findIndex(s => s.id === over.id);
    const reordered = arrayMove(segments, oldIndex, newIndex);
    dispatch({ type: 'REORDER_SEGMENTS', payload: reordered });
  };

  const addSegment = (chapterId?: string) => {
    const newSeg = {
      id: generateId(),
      chapterId,
      order: segments.length,
      name: '新环节',
      startTime: '00:00',
      endTime: '00:00',
      duration: 10,
      isNextDay: false,
      content: '',
      responsibilities: {},
    };
    dispatch({ type: 'ADD_SEGMENT', payload: newSeg });
  };

  // 按章节分组
  const segmentsByChapter = new Map<string | undefined, typeof segments>();
  segmentsByChapter.set(undefined, []);
  chapters.forEach(c => segmentsByChapter.set(c.id, []));
  segments.forEach(s => {
    const list = segmentsByChapter.get(s.chapterId) || [];
    list.push(s);
    segmentsByChapter.set(s.chapterId, list);
  });

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* 未分组环节 */}
        {segmentsByChapter.get(undefined)?.length > 0 && (
          <ChapterGroup
            title="未分组环节"
            color="#9ca3af"
            segments={segmentsByChapter.get(undefined)!}
            onAdd={() => addSegment()}
            collapsed={collapsedChapters.has('undefined')}
            onToggle={() => {
              const next = new Set(collapsedChapters);
              next.has('undefined') ? next.delete('undefined') : next.add('undefined');
              setCollapsedChapters(next);
            }}
          />
        )}

        {chapters.map(chapter => {
          const list = segmentsByChapter.get(chapter.id) || [];
          if (list.length === 0) return null;
          return (
            <ChapterGroup
              key={chapter.id}
              title={chapter.name}
              color={chapter.color}
              segments={list}
              onAdd={() => addSegment(chapter.id)}
              collapsed={collapsedChapters.has(chapter.id)}
              onToggle={() => {
                const next = new Set(collapsedChapters);
                next.has(chapter.id) ? next.delete(chapter.id) : next.add(chapter.id);
                setCollapsedChapters(next);
              }}
            />
          );
        })}

        <Button onClick={() => addSegment()} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-1" />添加环节
        </Button>
      </div>
    </DndContext>
  );
}

function ChapterGroup({
  title, color, segments, onAdd, collapsed, onToggle,
}: {
  title: string; color: string; segments: any[];
  onAdd: () => void; collapsed: boolean; onToggle: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div
        className="flex items-center px-4 py-2 border-b cursor-pointer"
        style={{ borderLeft: `4px solid ${color}` }}
        onClick={onToggle}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        <h3 className="font-semibold ml-2" style={{ color }}>{title}</h3>
        <span className="text-xs text-gray-500 ml-2">({segments.length} 个环节)</span>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onAdd(); }}>
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      {!collapsed && (
        <SortableContext items={segments.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="p-2 space-y-2">
            {segments.map(seg => <SortableSegment key={seg.id} segment={seg} />)}
          </div>
        </SortableContext>
      )}
    </div>
  );
}

function SortableSegment({ segment }: { segment: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: segment.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SegmentCard segment={segment} />
    </div>
  );
}
```

### 8.3 导出模板 `src/components/ExportTemplate.tsx`（核心）

> **关键技术点**：
> - 使用 `modern-screenshot` 替代 `html2canvas`（解决 Tailwind 4 的 `lab()` 颜色函数兼容问题）
> - 预览 DOM 使用**纯内联样式**（不依赖 Tailwind 类），确保导出图片样式正确
> - 预览宽度 = 1206/2.8 ≈ 431px（显示），导出时按 scale 3.125 渲染为 1206px

```typescript
import { domToPng } from 'modern-screenshot';

const handleExport = async () => {
  if (!previewRef.current) return;
  setIsExporting(true);
  try {
    const dataUrl = await domToPng(previewRef.current, {
      scale: 300 / 96,  // 3.125x for 300 DPI
    });
    const link = document.createElement('a');
    link.download = `${config.eventName}_${skinName}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    alert('导出失败：' + err.message);
  } finally {
    setIsExporting(false);
  }
};
```

### 8.4 参会名单导入 `src/components/AttendeeImport.tsx`

```typescript
'use client';

import { useState, useRef } from 'react';
import { useEvent } from '@/contexts/EventContext';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Clipboard, UserPlus, X } from 'lucide-react';
import { generateId } from '@/lib/event';
import type { Attendee } from '@/types/event';

export function AttendeeImport({ onClose }: { onClose: () => void }) {
  const { dispatch } = useEvent();
  const [tab, setTab] = useState<'file' | 'paste' | 'manual'>('file');
  const [pasteText, setPasteText] = useState('');
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    try {
      setError('');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // 智能识别表头
      const headers = rows[0].map((h: string) => String(h || '').trim());
      const nameIdx = headers.findIndex(h => /姓名|名字|name/i.test(h));
      const orgIdx = headers.findIndex(h => /单位|公司|组织|organization/i.test(h));
      const posIdx = headers.findIndex(h => /职位|职务|岗位|position/i.test(h));
      const phoneIdx = headers.findIndex(h => /电话|手机|phone|tel/i.test(h));
      const emailIdx = headers.findIndex(h => /邮箱|email|mail/i.test(h));
      const catIdx = headers.findIndex(h => /分类|类别|category/i.test(h));

      if (nameIdx < 0) {
        setError('未找到"姓名"列');
        return;
      }

      const attendees: Attendee[] = rows.slice(1)
        .filter(row => row[nameIdx])
        .map(row => ({
          id: generateId(),
          name: String(row[nameIdx] || '').trim(),
          organization: orgIdx >= 0 ? String(row[orgIdx] || '').trim() : '',
          position: posIdx >= 0 ? String(row[posIdx] || '').trim() : '',
          phone: phoneIdx >= 0 ? String(row[phoneIdx] || '').trim() : '',
          email: emailIdx >= 0 ? String(row[emailIdx] || '').trim() : '',
          category: catIdx >= 0 ? String(row[catIdx] || '').trim() : '',
          checkedIn: false,
          importSource: 'excel',
          importedAt: new Date().toISOString(),
        }));

      dispatch({ type: 'BATCH_ADD_ATTENDEES', payload: attendees });
      onClose();
    } catch (err) {
      setError('文件解析失败：' + (err as Error).message);
    }
  };

  const handlePaste = () => {
    try {
      setError('');
      const lines = pasteText.trim().split('\n').filter(l => l.trim());
      const attendees: Attendee[] = lines.map(line => {
        const cols = line.split(/\t|,/).map(c => c.trim());
        return {
          id: generateId(),
          name: cols[0] || '',
          organization: cols[1] || '',
          position: cols[2] || '',
          phone: cols[3] || '',
          email: cols[4] || '',
          checkedIn: false,
          importSource: 'paste',
          importedAt: new Date().toISOString(),
        };
      }).filter(a => a.name);

      if (attendees.length === 0) {
        setError('未识别到有效数据');
        return;
      }
      dispatch({ type: 'BATCH_ADD_ATTENDEES', payload: attendees });
      onClose();
    } catch (err) {
      setError('解析失败：' + (err as Error).message);
    }
  };

  const handleManual = () => {
    if (!name.trim()) {
      setError('请填写姓名');
      return;
    }
    dispatch({
      type: 'ADD_ATTENDEE',
      payload: {
        id: generateId(),
        name: name.trim(),
        organization: org.trim(),
        phone: phone.trim(),
        checkedIn: false,
        importSource: 'manual',
        importedAt: new Date().toISOString(),
      },
    });
    setName(''); setOrg(''); setPhone('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg w-[600px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center">
          <h2 className="font-bold text-lg">导入参会名单</h2>
          <div className="flex-1" />
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="file"><Upload className="w-4 h-4 mr-1" />文件</TabsTrigger>
              <TabsTrigger value="paste"><Clipboard className="w-4 h-4 mr-1" />粘贴</TabsTrigger>
              <TabsTrigger value="manual"><UserPlus className="w-4 h-4 mr-1" />手动</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-3">
              <p className="text-sm text-gray-500">支持 Excel (.xlsx/.xls) 和 CSV 文件</p>
              <p className="text-xs text-gray-400">表头需包含"姓名"列，可选：单位、职位、电话、邮箱、分类</p>
              <input
                type="file" accept=".xlsx,.xls,.csv"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="block w-full text-sm border rounded p-2"
              />
            </TabsContent>

            <TabsContent value="paste" className="space-y-3">
              <p className="text-sm text-gray-500">从 Excel/表格复制后粘贴（Tab 或逗号分隔）</p>
              <p className="text-xs text-gray-400">列顺序：姓名、单位、职位、电话、邮箱</p>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                className="w-full h-40 border rounded p-2 text-sm font-mono"
                placeholder="张三&#9;XX 公司&#9;总经理&#9;13800138000&#9;zhang@example.com"
              />
              <Button onClick={handlePaste}>解析并导入</Button>
            </TabsContent>

            <TabsContent value="manual" className="space-y-3">
              <Input placeholder="姓名 *" value={name} onChange={e => setName(e.target.value)} />
              <Input placeholder="单位" value={org} onChange={e => setOrg(e.target.value)} />
              <Input placeholder="电话" value={phone} onChange={e => setPhone(e.target.value)} />
              <Button onClick={handleManual}>添加</Button>
            </TabsContent>
          </Tabs>

          {error && <div className="mt-3 text-sm text-red-500">{error}</div>}
        </div>
      </div>
    </div>
  );
}
```

### 8.5 签到页面 `src/app/checkin/page.tsx`

```typescript
'use client';

import { useState, useMemo } from 'react';
import { useEvent } from '@/contexts/EventContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Check, Download } from 'lucide-react';
import Link from 'next/link';

export default function CheckinPage() {
  const { state, dispatch } = useEvent();
  const { attendees } = state;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'checked' | 'unchecked'>('all');

  const stats = useMemo(() => ({
    total: attendees.length,
    checked: attendees.filter(a => a.checkedIn).length,
    unchecked: attendees.filter(a => !a.checkedIn).length,
    rate: attendees.length > 0 ? Math.round(attendees.filter(a => a.checkedIn).length / attendees.length * 100) : 0,
  }), [attendees]);

  const filtered = useMemo(() => {
    return attendees.filter(a => {
      if (filter === 'checked' && !a.checkedIn) return false;
      if (filter === 'unchecked' && a.checkedIn) return false;
      if (search) {
        const s = search.toLowerCase();
        return a.name.toLowerCase().includes(s)
          || (a.organization || '').toLowerCase().includes(s)
          || (a.phone || '').includes(s);
      }
      return true;
    });
  }, [attendees, search, filter]);

  const toggleCheckin = (id: string) => {
    dispatch({ type: 'TOGGLE_CHECKIN', payload: id });
  };

  const exportCSV = () => {
    const headers = ['姓名', '单位', '电话', '签到状态', '签到时间'];
    const rows = attendees.map(a => [
      a.name, a.organization || '', a.phone || '',
      a.checkedIn ? '已签到' : '未签到',
      a.checkInTime ? new Date(a.checkInTime).toLocaleString('zh-CN') : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `签到记录_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部 */}
      <header className="h-14 bg-white border-b flex items-center px-4 gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />返回</Button>
        </Link>
        <h1 className="text-lg font-bold">签到管理</h1>
      </header>

      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="总人数" value={stats.total} color="blue" />
          <StatCard label="已签到" value={stats.checked} color="green" />
          <StatCard label="未签到" value={stats.unchecked} color="orange" />
          <StatCard label="签到率" value={`${stats.rate}%`} color="purple" />
        </div>

        {/* 工具栏 */}
        <div className="bg-white rounded-lg shadow p-3 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索姓名、单位、电话"
              className="pl-9"
            />
          </div>
          <div className="flex border rounded">
            {(['all', 'checked', 'unchecked'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-sm ${filter === f ? 'bg-blue-500 text-white' : ''}`}
              >
                {f === 'all' ? '全部' : f === 'checked' ? '已签到' : '未签到'}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1" />导出
          </Button>
        </div>

        {/* 名单 */}
        {attendees.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            暂无参会人员，请先在主页面导入名单
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map(a => (
              <div
                key={a.id}
                onClick={() => toggleCheckin(a.id)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                  a.checkedIn
                    ? 'bg-green-50 border-green-500'
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{a.name}</div>
                    {a.organization && <div className="text-xs text-gray-500">{a.organization}</div>}
                    {a.phone && <div className="text-xs text-gray-400 mt-1">{a.phone}</div>}
                  </div>
                  {a.checkedIn && <Check className="w-5 h-5 text-green-600" />}
                </div>
                {a.checkInTime && (
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(a.checkInTime).toLocaleTimeString('zh-CN')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className={`p-4 rounded-lg ${colors[color]}`}>
      <div className="text-sm opacity-80">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
```

---

## 九、关键技术决策

### 9.1 为什么用 modern-screenshot 而非 html2canvas？

| 问题 | 解决方案 |
|------|---------|
| `html2canvas` 不支持 Tailwind CSS 4 生成的 `lab()` 颜色函数 | `modern-screenshot` 原生支持现代 CSS 颜色函数 |
| `html2canvas` 渲染复杂样式（grid、flex）易错位 | `modern-screenshot` 基于真实 DOM 渲染，更准确 |
| 导出图片模糊 | scale = 300/96 ≈ 3.125x，达到 300 DPI 高清 |

### 9.2 预览与导出的尺寸策略

```
基础宽度 baseWidth = 1206px（iPhone 17 Pro 比例）
预览缩放 previewScale = 2.8
预览显示宽度 = 1206 / 2.8 ≈ 431px（用户能看完整布局）
导出时 scale = 300/96 ≈ 3.125
最终导出宽度 = 预览宽度 × scale ≈ 1348px → 实际按 baseWidth 1206px 渲染
高度 = 内容自适应（无固定高度）
```

### 9.3 拖拽 + 时间自动计算

```typescript
// 任何环节变动（增删改、跨章节、排序）都触发时间重算
const calculated = calculateSegmentTimes(segments, startTime, baseDate);
dispatch({ type: 'REORDER_SEGMENTS', payload: calculated });
```

### 9.4 数据同步策略

```
localStorage:  立即写入（防丢失）
服务器 API:    防抖 800ms 保存（避免频繁请求）
初始化加载:    先 localStorage（秒开）→ 后服务器（拉取最新）
```

---

## 十、UI 规范（DESIGN.md）

```markdown
# DESIGN.md

## Design Tokens

### 色彩
- 主色: blue-500 (#3b82f6) 用于操作按钮
- 危险: red-500 (#ef4444) 用于删除
- 成功: green-500 (#22c55e) 用于签到、完成
- 警告: orange-500 (#f59e0b) 用于待办
- 中性: gray-50 ~ gray-900 灰阶系统

### 字体
- 系统字体优先: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto
- 导出模板字体: "Noto Serif SC", "Songti SC", "STSong", serif（古风衬线）
- 等宽字体: "JetBrains Mono", "Fira Code", monospace（用于时间显示）

### 间距
- 卡片: p-3 ~ p-4 (12-16px)
- 区块: gap-3 ~ gap-4 (12-16px)
- 容器: p-4 ~ p-6 (16-24px)

### 圆角
- 卡片: rounded-lg (8px)
- 按钮: rounded (4px)
- 徽章: rounded-full 或 rounded (4px)

### 阴影
- 卡片: shadow-sm
- 弹窗: shadow-2xl
- 导出预览: 0 25px 50px -12px rgba(0,0,0,0.25)

## 布局
- 主页面: 顶部 56px 工具栏 + 左侧 288px 侧栏 + 右侧主区
- 签到页: 顶部 56px 工具栏 + 4 列统计卡片 + 3 列名单网格
- 导出页: 左侧 320px 配置 + 右侧预览

## 组件规范
- 按钮: 高度 32-40px，圆角 4px
- 卡片: 白底 + 1px 边框 + 阴影
- 标签: 12px 字号 + 圆角徽章

## 交互
- 拖拽: 5px 触发距离，排序时半透明
- 加载: 旋转 Loader2 图标
- 同步: 顶部 Cloud 图标实时反馈
```

---

## 十一、复刻实施步骤

按以下顺序逐步实现：

1. **初始化项目**：`coze init` → 安装依赖 → 配置 shadcn/ui
2. **类型与配置**：`src/types/event.ts` + `src/config/constants.ts` + `src/lib/event.ts`
3. **状态管理**：`src/contexts/EventContext.tsx`（reducer + localStorage + 服务器同步）
4. **API 路由**：4 个 API（data / upload / upload/[filename] / export/excel）
5. **主页面骨架**：`src/app/layout.tsx` + `src/app/page.tsx` + 顶部工具栏
6. **编辑组件**：`EventMetaEditor` + `ChapterManager` + `EventTimeline`（拖拽）+ `SegmentCard` + `StepEditor`
7. **导入导出**：`ImportExportPanel` + `AttendeeImport`
8. **导出模板**：`ExportTemplate`（含 4 种皮肤、modern-screenshot）
9. **签到页面**：`src/app/checkin/page.tsx`
10. **文档**：`README.md` + `PRINT_GUIDE.md`

每个步骤完成后必须通过 `npx tsc --noEmit` 静态检查。

---

## 十二、关键约束

1. **包管理器**：**仅使用 pnpm**，禁止 npm/yarn
2. **端口**：使用 `process.env.DEPLOY_RUN_PORT` 监听，禁止硬编码 5000
3. **客户端动态数据**：使用 `'use client'` + `useEffect` 避免 hydration 错误
4. **TypeScript 严格性**：所有函数参数必须有类型标注
5. **shadcn/ui 风格**：所有 UI 组件遵循 shadcn/ui 设计语言
6. **导出图片样式**：预览区域必须使用**纯内联样式**，不依赖 Tailwind className
7. **章节与时间**：任何环节变动都触发 `calculateSegmentTimes` 重算

---

## 十三、复刻 Checklist

AI 工具复刻时逐项确认：

- [ ] `package.json` 包含 `modern-screenshot` 和 `xlsx`
- [ ] `src/types/event.ts` 包含 EventStep / EventSegment / EventChapter / EventMeta / Role / Attendee / ExportTemplateConfig
- [ ] `SKIN_CONFIGS` 包含 4 个皮肤（qianli / qingming / golden / qinghua）
- [ ] `calculateSegmentTimes` 工具函数存在
- [ ] `EventContext` 使用 useReducer，包含 `ASSIGN_SEGMENT_TO_CHAPTER` 等 action
- [ ] 4 个 API 路由文件存在
- [ ] 主页面有 4 个按钮：编辑/导出/导入名单/签到
- [ ] 导出组件使用 `domToPng`（来自 modern-screenshot）而非 `html2canvas`
- [ ] 导出预览区域使用**纯内联样式**
- [ ] 导出宽度配置为 1206px，scale 300/96
- [ ] `/checkin` 页面存在且**无清除签到按钮**
- [ ] 参会名单导入支持 3 种方式：文件 / 粘贴 / 手动
- [ ] 拖拽使用 @dnd-kit
- [ ] 状态管理支持 localStorage + 服务器双写

---

**END** - 按本文档即可 1:1 复刻 EventSync Pro 全部功能。
