# 会务系统核心模块复刻说明：智能台本

## 1. 模块定位

来源附件：`会务系统-智能台本.tar.gz`

该模块是一个独立 Next.js 智能台本系统，包含活动元信息、流程环节、章节、分步骤、角色职责、主题、模板、参会名单、签到、保存和导出。复刻集成时应作为当前系统“流程台本”和“活动执行手册”的高精度参考。

核心目标：

- 快速创建活动台本，并自动计算每个环节开始/结束时间。
- 支持模板套用、章节分组、环节拖拽排序、分步骤编排。
- 支持 LED、音乐、策划、主持、酒店、AV、灯光、舞台等多角色职责。
- 支持主题切换和打印导出皮肤。
- 支持参会名单导入和签到记录，与台本执行联动。

## 2. 原项目结构

技术栈：

- Next.js 16 App Router
- React 19
- shadcn/ui
- Tailwind CSS 4
- xlsx
- html2canvas / modern-screenshot

关键入口：

- `/`：台本编辑主界面
- `/checkin`：参会人员签到管理
- `/api/data`：读取/保存台本和导出配置
- `/api/save`：保存数据
- `/api/export/excel`：导出 Excel 台本
- `/api/upload`：上传资源

关键组件：

- `EventMetaEditor`：活动基础信息编辑
- `EventTimeline`：流程时间线
- `TemplateSelector`：模板选择
- `ThemeSelector`：主题选择
- `AttendeeImport`：参会名单导入
- `ImportExportPanel`：导入导出
- `ExportTemplate`：长图/打印模板

核心上下文：

- `EventContext`：全局状态、reducer、localStorage/服务端保存、自动计算时间。
- `constants.ts`：主题和模板。
- `event.ts`：时间计算、持久化、导入导出工具。

## 3. 数据模型

```ts
type EventMeta = {
  id: string;
  name: string;
  theme?: string;
  logo?: string;
  date: string;
  location: string;
  organizer: string;
  planner: string;
  startTime: string;
  createdAt: string;
  updatedAt: string;
};

type RoleResponsibility = {
  led?: string;
  music?: string;
  planning?: string;
  host?: string;
  hotel?: string;
  av?: string;
  lighting?: string;
  stage?: string;
  custom?: string;
};

type SegmentStep = {
  id: string;
  order: number;
  name: string;
  content: string;
  duration: number;
  notes?: string;
};

type EventSegment = {
  id: string;
  order: number;
  name: string;
  content: string;
  duration: number;
  startTime: string;
  endTime: string;
  isNextDay: boolean;
  responsibilities: RoleResponsibility;
  notes?: string;
  status: 'pending' | 'active' | 'completed';
  chapterId?: string;
  steps?: SegmentStep[];
};

type EventChapter = {
  id: string;
  name: string;
  order: number;
  color?: string;
};

type EventScript = {
  meta: EventMeta;
  segments: EventSegment[];
  chapters: EventChapter[];
};
```

## 4. 必须复刻的功能点

活动信息：

- 活动名称、主题、Logo、日期、地点、主办方、策划方、开始时间。
- 修改开始时间后，所有环节时间自动重算。
- 更新任意字段时刷新 `updatedAt`。

流程环节：

- 新增、编辑、删除环节。
- 环节字段包括名称、内容、时长、职责、备注、状态。
- 支持环节状态：待执行、进行中、已完成。
- 支持拖拽排序，排序后重新计算每个环节时间。
- 支持跨日：结束时间超过当天时标记 `isNextDay=true`。
- 支持分步骤，步骤有名称、内容、时长、备注，并可排序。

章节：

- 新增、编辑、删除章节。
- 环节可归属章节。
- 删除章节时，该章节下环节回到未分组。
- 章节有颜色标识，适合大屏或打印区分流程段落。

模板：

- 年会流程模板。
- 新品发布会模板。
- 模板包含完整环节和角色职责。
- 套用模板后应自动生成 ID、排序和时间。

主题与导出：

- 主题：默认、深色、企业商务、节日庆典、极简。
- 导出皮肤：千里江山图、清明上河图、辉煌盛世金、雅致青花紫。
- Excel 导出包含活动信息表和活动流程表。
- 流程表列包括：序号、环节名称、开始时间、结束时间、时长、次日、环节内容、各职责角色、备注。
- 打印尺寸目标：95mm x 210mm，300 DPI。

参会与签到：

- 台本系统内包含 `Attendee` 模型。
- 可维护参会人姓名、公司、职位、电话、邮箱、分类、座位号、备注。
- `/checkin` 页面支持搜索、筛选、点击签到/取消签到。
- 可导出签到记录 CSV。

持久化：

- 本地状态保存在 localStorage。
- `/api/data` 支持按 type 读取/保存：
  - `event`
  - `export`
  - `all`
- 服务端文件路径原项目为 `/app/work/data/event-script.json` 和 `/app/work/data/export-config.json`。

## 5. 集成到当前系统的建议

当前系统已有 `/scripts` 和 `/api/scripts`，但数据模型过窄。建议升级为“台本主表 + 环节 + 章节 + 步骤”：

- `event_scripts`：活动台本元数据和当前版本。
- `script_chapters`：章节。
- `script_segments`：环节。
- `script_segment_steps`：分步骤。
- `script_export_configs`：导出皮肤和字段显隐配置。

推荐接口：

```http
GET  /api/scripts?event_id=...
POST /api/scripts
PUT  /api/scripts/meta
POST /api/scripts/segments
PUT  /api/scripts/segments/:id
DELETE /api/scripts/segments/:id
POST /api/scripts/segments/reorder
POST /api/scripts/chapters
PUT  /api/scripts/chapters/:id
DELETE /api/scripts/chapters/:id
POST /api/scripts/templates/apply
POST /api/scripts/export/excel
POST /api/scripts/export/image
```

当前系统字段映射：

- 当前 `script_segments.name` 对应原模块 `EventSegment.name`。
- 当前 `duration`、`speaker`、`content`、`notes` 可保留。
- 需要新增 `responsibilities`、`chapter_id`、`steps`、`is_next_day`、`end_time`。
- 当前 `/reports` 可读取台本完成状态作为复盘依据。
- 当前 `/checkin` 可共享台本模块的 `attendees` 数据，不应重复维护名单。

## 6. 复刻验收清单

- 新建活动后输入开始时间，新增多个环节时自动计算开始/结束时间。
- 修改任一环节时长后，后续全部环节时间自动联动更新。
- 跨日流程能正确显示次日标记。
- 套用“年会模板”和“新品发布会模板”后，环节、职责和时长完整。
- 拖拽排序后 order 连续，时间重新计算。
- 删除章节后，环节不丢失，只解除章节归属。
- Excel 导出包含活动信息和完整流程职责列。
- 打印/长图导出可按皮肤、章节、字段显隐配置生成。
- 签到页可按姓名、公司、电话搜索并导出签到 CSV。
