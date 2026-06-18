# AGENTS.md - 智能排座系统项目规范

> 本文档帮助 AI 工具（Cursor、Codex、Claude Code 等）快速理解项目全貌并精准复刻功能。

## 1. 项目概览

### 1.1 项目名称
**Smart Seating System** - 智能排座系统

### 1.2 核心功能
- 可视化拖拽排座（支持人员拖拽到桌位、桌位间换座）
- 多格式导入（Excel/CSV，智能识别姓名/公司/职位/手机号/标签）
- 多格式导出（Excel/PDF/PNG）
- 桌位牌生成（PDF打印）
- Canvas 现场布局图（可视化场地布局）
- 人员搜索定位（高亮显示）
- 快速换桌（输入目标桌号直接换座）
- 智能去重（基于姓名+手机号）
- 锁定机制（桌员锁定、桌位锁定）
- 快速调序（输入目标桌号移动桌位）
- 人员详情编辑（弹窗编辑嘉宾信息）
- 一键清空未分配人员

### 1.3 技术栈
| 类型 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 19.2.4 |
| 语言 | TypeScript | 5.6.0 |
| 构建工具 | Vite | 7.2.4 |
| 样式 | TailwindCSS | 3.4.17 |
| 路由 | react-router-dom | 7.13.1 |
| 拖拽 | @dnd-kit/core + @dnd-kit/sortable | 6.3.1 / 10.0.0 |
| Excel | SheetJS (xlsx) | 0.18.5 |
| PDF | jspdf | 4.2.0 |
| 文件下载 | file-saver | 2.0.5 |
| 图标 | lucide-react | 0.577.0 |
| ID生成 | uuid | 13.0.0 |
| 后端服务 | Supabase | 2.95.3 |

## 2. 目录结构

```
src/
├── App.tsx                 # 主应用组件，核心排座页面
├── main.tsx                # 入口文件
├── index.css               # 全局样式
├── components/
│   ├── CreateTablesModal.tsx   # 批量创建桌位弹窗
│   ├── ExportModal.tsx         # 导出弹窗（Excel/PDF/PNG）
│   ├── ImportModal.tsx         # 导入弹窗（Excel/CSV）
│   ├── PersonDetailModal.tsx   # 人员详情编辑弹窗
│   ├── PersonPool.tsx          # 未分配人员池组件
│   ├── TableCard.tsx           # 桌位卡片组件
│   ├── TableCardGenerator.tsx  # 桌位牌生成器
│   ├── Toolbar.tsx             # 工具栏组件
│   └── LayoutPage.tsx          # Canvas 布局页面
├── pages/
│   └── LayoutPage.tsx          # 场地布局编辑器
├── store/
│   ├── useActivityStore.ts     # 排座数据状态管理（核心）
│   └── useLayoutStore.ts       # 布局数据状态管理
├── types/
│   ├── index.ts                # 核心类型定义（Person/Table/Activity）
│   └── layout.ts               # 布局相关类型定义
└── utils/
    ├── helpers.ts              # 工具函数（解析/去重/简化等）
    └── canvasRenderer.ts       # Canvas 绘制工具函数
```

## 3. 数据模型

### 3.1 核心类型 (src/types/index.ts)

```typescript
// 人员
interface Person {
  id: string;
  name: string;           // 姓名
  company: string;        // 公司全称
  companyShort?: string;  // 公司简称（自动提取）
  title: string;          // 嘉宾身份/职位
  phone: string;          // 手机号
  tags: string[];         // 标签数组
  tableNumber?: string;   // 预设桌号（导入时指定）
  locked?: boolean;       // 是否被桌员锁定
}

// 桌位
interface Table {
  id: string;
  name: string;           // 桌号（如 A1, B2）
  capacity: number;       // 容量（通常为 6 或 8）
  persons: Person[];      // 已入座人员
  seatLock?: boolean;     // 桌员锁定（锁定桌内全部成员）
  positionLock?: boolean; // 桌位锁定（锁定桌位位置）
}

// 活动
interface Activity {
  id: string;
  name: string;           // 活动名称
  persons: Person[];      // 未分配人员
  tables: Table[];        // 桌位数组
}

// 拖拽项
type DragItem = {
  type: 'person' | 'table-person';
  person: Person;
  tableId?: string;
};
```

### 3.2 布局类型 (src/types/layout.ts)

```typescript
// 场地构件类型
type VenueElementType = 'stage' | 'aisle' | 'pillar' | 'wall' | 'entrance';

// 场地构件
interface VenueElement {
  id: string;
  type: VenueElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  label?: string;
}

// 桌位布局位置
interface TableLayoutPosition {
  tableId: string;
  tableName: string;
  capacity: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

// 对齐模式
type AlignMode = 'free' | 'horizontal' | 'vertical' | 'grid';

// 布局配置
interface LayoutConfig {
  gridSize: number;       // 网格大小
  alignMode: AlignMode;   // 对齐模式
  showGrid: boolean;      // 显示网格
  snapToGrid: boolean;    // 吸附网格
  tablesPerRow: number;   // 每排桌位数
  rowSpacing: number;     // 排间距
  tableSpacing: number;   // 桌间距
}

// 布局状态
interface Layout {
  id: string;
  name: string;
  venueElements: VenueElement[];
  tablePositions: TableLayoutPosition[];
  config: LayoutConfig;
  canvasWidth: number;
  canvasHeight: number;
}
```

## 4. 核心状态管理 (useActivityStore)

### 4.1 导出的函数

| 函数名 | 参数 | 说明 |
|--------|------|------|
| `activity` | - | 活动状态对象 |
| `updateActivityName` | name: string | 更新活动名称 |
| `addPersons` | persons: Person[] | 添加人员到未分配池 |
| `removePerson` | personId: string | 删除人员（从所有位置） |
| `clearUnassignedPersons` | - | 清空未分配人员（跳过锁定） |
| `updatePerson` | personId, updates | 更新人员信息 |
| `createTables` | count, capacity, prefix | 批量创建桌位 |
| `removeTable` | tableId | 删除桌位 |
| `updateTable` | tableId, updates | 更新桌位信息 |
| `movePersonToTable` | personId, tableId, seatIndex | 移动人员到桌位 |
| `movePersonToPool` | personId, tableId | 移动人员到未分配池 |
| `reorderInTable` | tableId, oldIndex, newIndex | 桌内人员重排 |
| `clearSeating` | - | 清空所有排座 |
| `clearPersons` | - | 清空所有人员 |
| `clearTables` | - | 清空所有桌位 |
| `performAutoSeat` | - | 执行自动排座 |
| `importSeatingData` | data | 导入排座数据 |
| `swapPersonsBetweenTables` | sourceTableId, targetTableId, personId | 快速换桌 |
| `toggleSeatLock` | tableId | 切换桌员锁定 |
| `togglePositionLock` | tableId | 切换桌位锁定 |
| `unlockAllSeatLocks` | - | 解锁所有桌员锁定 |
| `lockAllSeatLocks` | - | 锁定所有桌员 |
| `isAllSeatLocked` | - | 检查是否全部锁定 |
| `reorderTables` | fromIndex, toIndex | 桌位排序（部分重新编号） |
| `movePersonUp` | tableId, personIndex | 桌内人员上移 |
| `movePersonDown` | tableId, personIndex | 桌内人员下移 |

### 4.2 数据持久化
- 使用 `localStorage` 自动保存
- Key: `smart-seating-activity`
- 每次状态变更自动保存

## 5. 构建与运行命令

```bash
# 安装依赖（必须使用 pnpm）
pnpm install

# 开发模式（热更新）
pnpm dev

# 类型检查
pnpm ts-check

# 代码检查
pnpm lint

# 构建生产版本
pnpm build

# 启动生产服务
pnpm start
```

## 6. 关键算法

### 6.1 公司简称提取算法 (extractCompanyShortName)
位置: `src/utils/helpers.ts`

算法流程：
1. 文本标准化（删除空格、括号）
2. 删除公司类型后缀（有限公司、股份有限公司等）
3. 品牌词典匹配（优先返回品牌名）
4. 删除地域前缀（北京、上海等）
5. 循环删除通用后缀词（管理、服务、文化等）
6. 删除行业词（科技、技术、网络等，长度>6时才删）
7. 最终长度处理（超过6字截取前4字）

关键词典：
- `COMPANY_SUFFIXES`: 公司类型后缀
- `REGION_PREFIXES`: 地域前缀
- `INDUSTRY_WORDS`: 行业描述词
- `COMMON_SUFFIXES`: 通用后缀词
- `BRAND_DICT`: 品牌词典

### 6.2 智能导入解析算法
位置: `src/utils/helpers.ts` -> `parseImportFile`

字段识别规则：
- **手机号**: 11位数字，1开头
- **姓名**: 2-4个汉字，常见姓氏开头
- **桌号**: A1, B2, VIP1, 1号桌, 桌号1 等格式
- **职位**: 匹配职位关键词（董事长、总经理等）
- **标签**: 支持 @VIP、#理事、【嘉宾】 三种格式

去重逻辑：
- 完全重复：姓名+手机号相同
- 同名冲突：姓名相同但手机号不同

### 6.3 自动排座算法 (autoSeat)
位置: `src/utils/helpers.ts`

规则：
1. 保留已排座人员
2. 从未满桌位开始填充
3. 跳过已锁定的桌位
4. 按桌位顺序依次填充

### 6.4 桌位重新编号算法 (reorderTables)
位置: `src/store/useActivityStore.ts`

规则：
1. **固定每组容量**: 每组固定 6 个桌位
2. **部分重新编号**: 目标位置之前的桌号不变
3. **顺序后移**: 从目标位置开始按顺序重新编号

示例：
- 移动前: A1, A2, A3, A4, A5, A6, B1, B2...
- 将 A5 移动到 A2 位置后: A1, A5, A2, A3, A4, A6, B1, B2...

## 7. 锁定机制

### 7.1 桌员锁定 (seatLock)
- 作用于 `Table.seatLock`
- 效果：
  - 锁定桌内全部成员
  - 不参与自动排座
  - 禁止拖拽换桌
  - 清空名单时跳过

### 7.2 桌位锁定 (positionLock)
- 作用于 `Table.positionLock`
- 效果：
  - 锁定桌位在布局中的位置
  - 不参与桌位排序移动
  - 快速调序按钮隐藏

### 7.3 个人锁定 (locked)
- 作用于 `Person.locked`
- 效果：
  - 清空未分配人员时跳过

### 7.4 一键锁定
- `lockAllSeatLocks()`: 一键锁定所有桌员
- `unlockAllSeatLocks()`: 一键解锁所有桌员
- `isAllSeatLocked()`: 检查是否全部锁定

## 8. UI 组件规范

### 8.1 样式框架
- 使用 TailwindCSS
- 深色主题：主背景 `bg-slate-900`，卡片背景 `bg-slate-800`
- 强调色：蓝色 `blue-500`，绿色 `green-500`

### 8.2 拖拽实现
使用 `@dnd-kit` 库：

```typescript
// 可拖拽组件
const { attributes, listeners, setNodeRef, transform } = useSortable({
  id: person.id,
  data: { type: 'person', person }
});

// 可放置区域
const { setNodeRef, isOver } = useDroppable({
  id: table.id,
  data: { type: 'table', table }
});

// 拖拽上下文
<DndContext onDragEnd={handleDragEnd}>
  <SortableContext items={items}>
    {/* 可拖拽组件 */}
  </SortableContext>
</DndContext>
```

### 8.3 图标库
使用 `lucide-react`：
- 用户: `User`
- 搜索: `Search`
- 锁定: `Lock`, `Unlock`
- 移动: `ArrowRightLeft`, `Move`
- 清空: `Trash2`, `UserX`

## 9. 导入导出格式

### 9.1 导入 Excel 格式
支持的列名（自动识别）：
- 姓名 / 名字 / Name
- 公司 / 单位 / 企业 / Company
- 职位 / 身份 / 职务 / Title
- 手机 / 电话 / 手机号 / Phone
- 桌号 / 桌位 / 桌 / Table
- 标签 / 备注 / Tag

### 9.2 导出格式
- **Excel**: .xlsx 格式，包含桌号、姓名、公司、职位、手机
- **PDF**: 使用 Canvas 绘制，支持中文
- **PNG**: 使用 Canvas 绘制现场布局图

## 10. 常见问题与修复

### 10.1 拖拽不响应
检查：
1. `useSortable` 的 `id` 是否唯一
2. `SortableContext` 的 `items` 是否包含所有 id
3. `data` 属性是否正确设置

### 10.2 中文显示乱码
解决方案：
- Canvas 绘制时使用系统字体：`PingFang SC`, `Microsoft YaHei`
- 参考 `src/utils/canvasRenderer.ts`

### 10.3 自动排座不工作
检查：
1. 是否有未分配人员
2. 桌位是否有空位
3. 桌位是否被锁定

## 11. 扩展指南

### 11.1 添加新的导入字段
1. 在 `types/index.ts` 的 `Person` 接口添加字段
2. 在 `helpers.ts` 的 `parseImportFile` 添加识别逻辑
3. 在导入弹窗显示新字段

### 11.2 添加新的导出格式
1. 在 `ExportModal.tsx` 添加导出选项
2. 实现导出逻辑
3. 使用 `file-saver` 触发下载

### 11.3 添加新的锁定类型
1. 在 `Table` 或 `Person` 接口添加新字段
2. 在 store 添加切换函数
3. 在相关操作中检查锁定状态
