# 会务系统核心模块复刻说明：智能排座

## 1. 模块定位

来源附件：`会务系统-智能排座.tar.gz`

该模块是一个 Vite React 智能排座工具，核心优势是高密度拖拽编排、名单导入去重、公司简称解析、桌位锁定、快速换桌、自动排座和多格式导出。复刻集成时应补强当前系统“智能排座”的交互深度。

核心目标：

- 维护活动人员池和桌位列表。
- 支持拖拽入座、桌内排序、整桌排序、移回未分配池。
- 支持一键自动排座，同时保留已锁定桌位和人员。
- 支持查找已入座人员并快速定位。
- 支持快速换桌、桌员锁定、桌位位置锁定。
- 支持 Excel/CSV/TXT/JSON 导入和 JSON/TXT/Excel/PNG 导出。

## 2. 原项目结构

技术栈：

- Vite
- React 19
- Tailwind CSS 3
- `@dnd-kit/core`、`@dnd-kit/sortable`
- `xlsx`
- `file-saver`
- `html2canvas`
- `jspdf`
- `uuid`

关键文件：

- `src/App.tsx`：主排座工作台
- `src/store/useActivityStore.ts`：活动、人员、桌位状态和核心动作
- `src/components/ImportModal.tsx`：多格式导入和去重
- `src/components/CreateTablesModal.tsx`：批量创建桌位
- `src/components/TableCard.tsx`：桌位卡片
- `src/components/PersonPool.tsx`：未分配人员池
- `src/components/ExportModal.tsx`：导入导出
- `src/utils/helpers.ts`：解析、去重、自动排座、导出工具

## 3. 数据模型

```ts
type Person = {
  id: string;
  name: string;
  company: string;
  companyShort?: string;
  title: string;
  phone: string;
  tags: string[];
  tableNumber?: string;
  locked?: boolean;
};

type Table = {
  id: string;
  name: string;
  capacity: number;
  persons: Person[];
  seatLock?: boolean;      // 锁定桌内成员
  positionLock?: boolean;  // 锁定桌位排序位置
};

type Activity = {
  id: string;
  name: string;
  persons: Person[]; // 未分配人员
  tables: Table[];
};
```

持久化：

- 原项目使用 `localStorage` 保存完整 `Activity`。
- 集成到当前系统时应保存到服务端，`event_id` 是所有排座数据的主键上下文。

## 4. 必须复刻的功能点

导入解析：

- 支持 `.xlsx`、`.xls`、`.csv`、`.txt`、`.json`。
- 支持粘贴文本导入。
- 支持从文本提取标签：
  - `@VIP`
  - `#理事`
  - `【嘉宾】`
- 导入时执行去重：
  - 同批重复
  - 与现有人员重复
  - 冲突数据提示
- 支持公司简称解析，规则包括：
  - 删除公司类型后缀：有限公司、股份有限公司、集团等。
  - 删除地域前缀：北京、上海、深圳、中国等。
  - 匹配品牌词典：腾讯、阿里、华为、小米、中国移动等。
  - 删除行业词和通用后缀。
  - 超长简称截断。

排座交互：

- 未分配人员拖拽到桌位。
- 桌内人员拖拽排序。
- 桌位卡片拖拽排序。
- 已入座人员可移回未分配池。
- 目标桌位满员时，原项目会随机挤出一个人回未分配池。
- 搜索已入座人员，点击结果滚动定位并高亮。
- 快速换桌：选择人员，输入目标桌号，自动移动到匹配桌位。
- 桌员锁定：锁定桌内所有人员，自动排座和清空排座时跳过。
- 位置锁定：锁定桌位位置，禁止整桌排序。
- 一键锁定/解锁全部桌员。

自动排座：

- 只处理未分配人员，不调动已入座人员。
- 保留桌员锁定桌位。
- 应优先使用预设桌号，其次按容量填充。
- 标签、公司简称、桌号等信息要随人员移动保持完整。

导出：

- JSON：完整排座数据，可重新导入。
- TXT：人类可读排座表。
- Excel：表格排座。
- PNG：将排座结果渲染成图片。

## 5. 集成到当前系统的建议

当前系统已有 `/seating`、`/seating/layout` 和 `/api/seating/*`。建议：

- 将当前 `Guest` 扩展为兼容 `Person`：
  - `companyShort`
  - `title/position`
  - `tags`
  - `preset_table_number`
  - `locked`
- 将当前 `Table` 扩展：
  - `seat_lock`
  - `position_lock`
  - `order`
- 排座 API 需要支持完整动作，而不是只返回布局：

```http
GET  /api/seating?event_id=...
POST /api/seating/import
POST /api/seating/tables
PUT  /api/seating/tables/:id
POST /api/seating/assign
POST /api/seating/unassign
POST /api/seating/reorder-person
POST /api/seating/reorder-table
POST /api/seating/auto-arrange
POST /api/seating/swap
POST /api/seating/lock
GET  /api/seating/export?format=json|txt|xlsx|png
```

推荐状态结构：

```ts
type SeatingSnapshot = {
  event_id: string;
  activity_name: string;
  unassigned: Person[];
  tables: Table[];
  updated_at: string;
};
```

## 6. 复刻验收清单

- 导入 Excel/CSV/TXT/JSON 后人员字段、标签、公司简称正确。
- 重复导入时能识别重复和冲突。
- 创建 50 张桌、导入 500 人后拖拽仍可用。
- 桌位满员时移动人员的行为符合设定：阻止或挤出，必须全系统统一。
- 自动排座不会移动已入座人员，不会破坏锁定桌位。
- 搜索人员后能定位到所在桌位和座位序号。
- 快速换桌支持输入 `1`、`桌1`、`第1桌` 等形式。
- JSON 导出后重新导入，排座结果完全一致。
- Excel/TXT/PNG 导出包含桌名、容量、已入座人员、未分配人员。
