# EventSync Pro - AI 快速上下文

> 给 Cursor / Codex / Claude Code 等 AI 工具的极简上下文，3 分钟理解项目全貌。

## 一句话定位

**EventSync Pro** = 活动流程数字化管理工具 = 可视化台本编辑 + 多角色协同 + 高清 PNG 导出 + 参会名单签到。

## 技术栈

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (Radix UI)
- **@dnd-kit** (拖拽) + **modern-screenshot** (图片导出) + **xlsx** (Excel)
- **包管理**: pnpm

## 项目结构

```
src/
├── app/
│   ├── page.tsx              # 主页面（编辑+导出 Tab 切换）
│   ├── checkin/page.tsx      # 签到管理页
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── data/route.ts           # 通用数据存储（事件脚本/导出配置/名单）
│       ├── upload/route.ts         # LOGO 上传
│       ├── upload/[filename]/route.ts  # LOGO 访问
│       └── export/excel/route.ts   # Excel 导出
├── components/
│   ├── EventTimeline.tsx     # 时间轴（拖拽核心）
│   ├── EventMetaEditor.tsx   # 活动信息编辑
│   ├── ChapterManager.tsx    # 章节管理
│   ├── ExportTemplate.tsx    # 导出模板（4 皮肤 + 现代截图）
│   ├── AttendeeImport.tsx    # 名单导入（文件/粘贴/手动）
│   ├── ImportExportPanel.tsx
│   └── ui/                   # shadcn 组件
├── contexts/
│   └── EventContext.tsx      # 全局状态（useReducer + localStorage + API）
├── types/
│   └── event.ts              # 全部数据类型 + SKIN_CONFIGS
├── lib/
│   ├── event.ts              # 业务工具：calculateSegmentTimes / generateId
│   └── utils.ts
└── config/
    └── constants.ts          # DEFAULT_ROLES / DEFAULT_CHAPTERS / EXPORT_CONFIG
```

## 核心数据模型（src/types/event.ts）

```typescript
EventStep        { id, order, content, duration?, notes? }
EventSegment     { id, chapterId?, order, name, startTime, endTime, duration, isNextDay, content, responsibilities, steps?, status? }
EventChapter     { id, name, color, order, description? }
EventMeta        { id, name, theme?, date, location, organizer, planner?, startTime, createdAt, updatedAt }
Role             { key, label, color?, isDefault? }
EventScript      { meta, chapters, segments, roles }
Attendee         { id, name, organization?, position?, phone?, email?, category?, seatNumber?, notes?, checkedIn, checkInTime?, importSource?, importedAt }
ExportSkin       'qianli' | 'qingming' | 'golden' | 'qinghua'
ExportTemplateConfig { logo?, eventName, eventTheme, organizer, footerLine1, footerLine2, skin, selectedChapters, selectedSegments, hiddenFields, showSteps }
```

## 4 大皮肤配置

```typescript
SKIN_CONFIGS = {
  qianli:   { background: 'linear-gradient(135deg, #1a3a52, #2d5a7b, #1a3a52)', accentColor: '#d4af37' }, // 千里江山图
  qingming: { background: 'linear-gradient(135deg, #f5e6d3, #ede0c8, #f5e6d3)', accentColor: '#8b4513' }, // 清明上河图
  golden:   { background: 'linear-gradient(135deg, #3d2914, #5c3d1f, #3d2914)', accentColor: '#ffd700' }, // 辉煌盛世金
  qinghua:  { background: 'linear-gradient(135deg, #1f1f3d, #2d2d5a, #1f1f3d)', accentColor: '#9370db' }, // 雅致青花紫
};
```

## 关键导出参数

```typescript
EXPORT_CONFIG = {
  dpi: 300,
  scale: 300 / 96,    // 3.125x 高清
  baseWidth: 1206,    // iPhone 17 Pro 比例
  previewScale: 2.8,  // 预览缩放
  // 预览宽度 = 1206 / 2.8 ≈ 431px
};
```

## 7 大默认角色

```
主持人 / 致辞嘉宾 / 演讲嘉宾 / 颁奖嘉宾 / 演出嘉宾 / 演奏嘉宾 / 参会嘉宾
```

## 核心业务逻辑

### 1. 拖拽排序
- 使用 `@dnd-kit/core` + `@dnd-kit/sortable`
- 拖拽时设置 `opacity: 0.5`，激活距离 5px

### 2. 时间自动计算
```typescript
calculateSegmentTimes(segments, startTime, baseDate)
// 任何环节变动都触发重算（增删改、跨章节、排序）
// 跨午夜自动标记 isNextDay: true
```

### 3. PNG 导出
```typescript
import { domToPng } from 'modern-screenshot';
const dataUrl = await domToPng(previewRef.current, { scale: 300/96 });
// 必须用 modern-screenshot，不用 html2canvas（兼容 lab() 颜色）
// 预览区域必须用纯内联样式，不用 Tailwind className
```

### 4. 数据持久化
```
localStorage: 立即写（防丢失）
API /api/data: 防抖 800ms 写（避免频繁请求）
加载顺序: localStorage → API 拉取
```

## 5 个 API 路由

| 路径 | 方法 | 用途 |
|------|------|------|
| `/api/data?type=eventScript` | GET/POST | 活动脚本 |
| `/api/data?type=export` | GET/POST | 导出配置 |
| `/api/data?type=attendees` | GET/POST | 参会名单 |
| `/api/upload` | POST | LOGO 上传 |
| `/api/upload/[filename]` | GET | LOGO 访问 |
| `/api/export/excel` | POST | Excel 导出 |

## 7 个核心 Action

```typescript
UPDATE_META / ADD_SEGMENT / UPDATE_SEGMENT / DELETE_SEGMENT
REORDER_SEGMENTS / ADD_CHAPTER / UPDATE_CHAPTER / DELETE_CHAPTER
ASSIGN_SEGMENT_TO_CHAPTER / ADD_STEP / UPDATE_STEP / DELETE_STEP
SET_ROLES / SET_STATUS
SET_ATTENDEES / ADD_ATTENDEE / BATCH_ADD_ATTENDEES / TOGGLE_CHECKIN
```

## 复刻时必须保留的特性

1. ✅ 4 种导出皮肤（千里江山图/清明上河图/辉煌盛世金/雅致青花紫）
2. ✅ PNG 导出宽度 1206px / 300 DPI / 高度自适应
3. ✅ 拖拽排序 + 章节分配
4. ✅ 步骤展开折叠
5. ✅ LOGO 上传（5MB 限制）
6. ✅ Excel/CSV/粘贴/手动 4 种名单导入
7. ✅ 签到页面（无清除签到按钮）
8. ✅ localStorage + 服务器双写同步
9. ✅ 导出预览用纯内联样式

## 禁止使用

- ❌ `html2canvas`（不兼容 lab() 颜色）
- ❌ `npm` / `yarn`（必须 pnpm）
- ❌ 硬编码端口 5000
- ❌ Tailwind className 在导出预览区（用内联样式）

## 一句话总结

> Next.js 16 + shadcn/ui + modern-screenshot + xlsx + @dnd-kit 实现的**活动台本编辑 + 高清长图导出 + 参会签到**一体化工具。
