# SPEC.md - 智能排座系统功能规格说明书

> 本文档详细描述每个功能的具体实现细节，供 AI 精准复刻使用。

## 1. 核心功能概览

| 功能模块 | 优先级 | 复杂度 |
|----------|--------|--------|
| 可视化拖拽排座 | P0 | 高 |
| 多格式导入 | P0 | 高 |
| 多格式导出 | P0 | 中 |
| 桌位牌生成 | P1 | 中 |
| Canvas 布局图 | P1 | 高 |
| 人员搜索定位 | P1 | 低 |
| 快速换桌 | P1 | 中 |
| 快速调序 | P1 | 中 |
| 锁定机制 | P0 | 中 |
| 智能去重 | P0 | 中 |
| 人员详情编辑 | P1 | 低 |
| 一键清空 | P2 | 低 |

---

## 2. 可视化拖拽排座

### 2.1 功能描述
支持将未分配人员拖拽到桌位，或在不同桌位之间换座。

### 2.2 技术实现

#### 使用的库
- `@dnd-kit/core`: 核心拖拽功能
- `@dnd-kit/sortable`: 排序拖拽
- `@dnd-kit/utilities`: 工具函数

#### 关键代码结构

```typescript
// 1. DndContext 包裹整个应用
<DndContext
  sensors={sensors}
  onDragEnd={handleDragEnd}
  onDragOver={handleDragOver}
>
  {/* 未分配人员池 */}
  <SortableContext items={activity.persons.map(p => p.id)}>
    <PersonPool />
  </SortableContext>
  
  {/* 桌位区域 */}
  {activity.tables.map(table => (
    <SortableContext key={table.id} items={table.persons.map(p => p.id)}>
      <TableCard table={table} />
    </SortableContext>
  ))}
</DndContext>
```

#### 拖拽结束处理逻辑

```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over) return;

  const activeData = active.data.current;
  const overData = over.data.current;

  // 场景1: 从未分配池拖到桌位
  if (activeData.type === 'person' && overData.type === 'table') {
    movePersonToTable(active.id, overData.table.id);
  }
  
  // 场景2: 从桌位拖到桌位
  if (activeData.type === 'table-person' && overData.type === 'table') {
    swapPersonsBetweenTables(activeData.tableId, overData.table.id, active.id);
  }
  
  // 场景3: 从桌位拖回未分配池
  if (activeData.type === 'table-person' && overData.type === 'person-pool') {
    movePersonToPool(active.id, activeData.tableId);
  }
  
  // 场景4: 桌内重排
  if (activeData.type === 'table-person' && overData.type === 'table-person') {
    reorderInTable(tableId, oldIndex, newIndex);
  }
};
```

### 2.3 锁定检查

在拖拽开始前检查锁定状态：

```typescript
// 桌员锁定检查
if (table.seatLock) {
  // 禁止任何拖拽操作
  return;
}

// 位置锁定检查（仅影响桌位移动）
if (table.positionLock) {
  // 禁止桌位排序移动
}
```

### 2.4 视觉反馈

```typescript
// 拖拽中的样式
const style = {
  transform: CSS.Transform.toString(transform),
  opacity: isDragging ? 0.5 : 1,
};

// 拖拽经过目标区域
const { isOver, setNodeRef } = useDroppable({ id: table.id });
const dropZoneClass = isOver ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700';
```

---

## 3. 多格式导入

### 3.1 支持的格式
- Excel (.xlsx, .xls)
- CSV (.csv)

### 3.2 智能字段识别

#### 手机号识别
```typescript
const isPhoneNumber = (text: string): boolean => {
  return /^1[3-9]\d{9}$/.test(text);
};
```

#### 姓名识别
```typescript
const isChineseName = (text: string): boolean => {
  // 2-4个汉字
  if (!/^[\u4e00-\u9fa5]{2,4}$/.test(text)) return false;
  
  // 常见姓氏开头更可靠
  const commonSurnames = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', ...];
  const compoundSurnames = ['欧阳', '上官', '诸葛', ...];
  
  return commonSurnames.some(s => text.startsWith(s)) ||
         compoundSurnames.some(s => text.startsWith(s));
};
```

#### 桌号识别
```typescript
// 支持的格式: A1, B2, VIP1, 1号桌, 桌号1
const parseTableNumber = (text: string): string | null => {
  const match = text.match(/(?:^|[桌号])([A-Za-z]?\d+)|([A-Za-z]+\d+)(?:号?桌|$)/i);
  return match ? (match[1] || match[2]) : null;
};
```

#### 职位识别
```typescript
const titleKeywords = [
  '董事长', '总裁', '总经理', '副总经理', '总监', '副总监',
  '经理', '副经理', '主任', '副主任', '部长', '科长',
  'CEO', 'CFO', 'CTO', 'COO', 'CIO', 'VP',
  '合伙人', '创始人', '联合创始人', '执行董事', '董事',
  '教授', '博士', '专家', '顾问', '讲师',
  // 社会职务
  '会长', '副会长', '理事长', '秘书长', '理事',
  ...
];

const containsTitleKeyword = (text: string): boolean => {
  return titleKeywords.some(kw => text.includes(kw));
};
```

#### 标签识别
```typescript
// 支持三种格式
const extractTags = (text: string): string[] => {
  const tags: string[] = [];
  
  // @VIP 格式
  const atMatches = text.match(/@(\S+)/g);
  if (atMatches) tags.push(...atMatches.map(m => m.substring(1)));
  
  // #理事 格式
  const hashMatches = text.match(/#(\S+)/g);
  if (hashMatches) tags.push(...hashMatches.map(m => m.substring(1)));
  
  // 【嘉宾】 格式
  const bracketMatches = text.match(/【([^】]+)】/g);
  if (bracketMatches) tags.push(...bracketMatches.map(m => m.slice(1, -1)));
  
  return tags;
};
```

### 3.3 去重逻辑

```typescript
const deduplicatePersons = (persons: Person[]): {
  unique: Person[];
  duplicates: Person[];
  conflicts: Person[];
} => {
  const seen = new Map<string, Person>();
  const unique: Person[] = [];
  const duplicates: Person[] = [];
  const conflicts: Person[] = [];

  for (const person of persons) {
    const key = `${person.name}_${person.phone}`;
    
    if (seen.has(key)) {
      // 完全重复：姓名+手机号相同
      duplicates.push(person);
    } else {
      // 检查同名冲突
      const sameName = [...seen.values()].find(p => p.name === person.name);
      if (sameName && sameName.phone !== person.phone) {
        conflicts.push(person);
      } else {
        seen.set(key, person);
        unique.push(person);
      }
    }
  }

  return { unique, duplicates, conflicts };
};
```

### 3.4 导入流程

```
1. 用户选择文件
   ↓
2. 解析文件内容 (xlsx/csv)
   ↓
3. 智能识别列名和数据
   ↓
4. 创建 Person 对象
   ↓
5. 去重处理
   ↓
6. 显示预览和冲突提示
   ↓
7. 用户确认后添加到 store
```

---

## 4. 多格式导出

### 4.1 Excel 导出

```typescript
const exportToExcel = (tables: Table[], activityName: string) => {
  const workbook = XLSX.utils.book_new();
  
  // 构建数据
  const data = tables.flatMap(table => 
    table.persons.map((person, index) => ({
      '桌号': table.name,
      '座位': index + 1,
      '姓名': person.name,
      '公司': person.company,
      '职位': person.title,
      '手机': person.phone,
      '标签': person.tags.join(', '),
    }))
  );
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, '排座表');
  
  XLSX.writeFile(workbook, `${activityName}_排座表.xlsx`);
};
```

### 4.2 PDF 导出

使用 Canvas 绘制后转换为 PDF：

```typescript
const exportToPDF = (tables: Table[], activityName: string) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // 绘制标题
  pdf.setFontSize(18);
  pdf.text(activityName, 105, 15, { align: 'center' });
  
  // 绘制桌位列表
  let y = 30;
  tables.forEach((table, tableIndex) => {
    // 桌号
    pdf.setFontSize(14);
    pdf.text(`桌号: ${table.name}`, 15, y);
    y += 8;
    
    // 人员列表
    pdf.setFontSize(10);
    table.persons.forEach((person, index) => {
      const text = `${index + 1}. ${person.name} - ${person.companyShort || person.company}`;
      pdf.text(text, 20, y);
      y += 5;
    });
    y += 5;
    
    // 换页检查
    if (y > 280) {
      pdf.addPage();
      y = 15;
    }
  });
  
  pdf.save(`${activityName}_排座表.pdf`);
};
```

### 4.3 PNG 导出（现场布局图）

```typescript
const exportToPNG = (layout: Layout) => {
  const canvas = document.createElement('canvas');
  canvas.width = layout.canvasWidth;
  canvas.height = layout.canvasHeight;
  const ctx = canvas.getContext('2d');
  
  // 绘制背景
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 绘制网格
  if (layout.config.showGrid) {
    drawGrid(ctx, canvas.width, canvas.height, layout.config.gridSize);
  }
  
  // 绘制场地构件
  layout.venueElements.forEach(element => {
    drawVenueElement(ctx, element);
  });
  
  // 绘制桌位
  layout.tablePositions.forEach(pos => {
    drawTablePosition(ctx, pos);
  });
  
  // 导出为 PNG
  canvas.toBlob(blob => {
    saveAs(blob, `${layout.name}_布局图.png`);
  });
};
```

---

## 5. 桌位牌生成

### 5.1 功能描述
生成可打印的桌位牌 PDF，每个桌位一页。

### 5.2 桌位牌布局

```
┌─────────────────────────────────────────┐
│                                         │
│              [活动名称]                  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│               [桌号 A1]                  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│    姓名1 - 公司简称                      │
│    姓名2 - 公司简称                      │
│    ...                                  │
│                                         │
└─────────────────────────────────────────┘
```

### 5.3 实现代码

```typescript
const generateTableCards = (tables: Table[], activityName: string) => {
  const pdf = new jsPDF('l', 'mm', 'a4'); // 横向 A4
  const pageWidth = 297;
  const pageHeight = 210;
  
  tables.forEach((table, index) => {
    if (index > 0) pdf.addPage();
    
    // 活动名称
    pdf.setFontSize(24);
    pdf.text(activityName, pageWidth / 2, 30, { align: 'center' });
    
    // 桌号
    pdf.setFontSize(48);
    pdf.text(table.name, pageWidth / 2, 80, { align: 'center' });
    
    // 分隔线
    pdf.setLineWidth(0.5);
    pdf.line(20, 95, pageWidth - 20, 95);
    
    // 人员列表
    pdf.setFontSize(14);
    let y = 110;
    table.persons.forEach((person, seatIndex) => {
      const text = `${seatIndex + 1}. ${person.name} - ${person.companyShort || person.company}`;
      pdf.text(text, 30, y);
      y += 10;
    });
  });
  
  pdf.save(`${activityName}_桌位牌.pdf`);
};
```

---

## 6. Canvas 现场布局图

### 6.1 功能描述
可视化场地布局，支持拖拽桌位位置、添加场地构件（舞台、过道、柱子等）。

### 6.2 场地构件类型

| 类型 | 标识 | 颜色 | 形状 |
|------|------|------|------|
| 舞台 | `stage` | 紫色 | 圆角矩形 |
| 过道 | `aisle` | 灰色 | 虚线矩形 |
| 柱子 | `pillar` | 深灰 | 圆形 |
| 墙体 | `wall` | 深色 | 双线矩形 |
| 入口 | `entrance` | 绿色 | 矩形+箭头 |

### 6.3 Canvas 绘制函数

```typescript
// 绘制桌位
const drawTable = (ctx: CanvasRenderingContext2D, pos: TableLayoutPosition) => {
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(pos.rotation * Math.PI / 180);
  ctx.scale(pos.scale, pos.scale);
  
  // 桌位背景
  const width = 120;
  const height = 80;
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-width/2, -height/2, width, height, 8);
  ctx.fill();
  ctx.stroke();
  
  // 桌号
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px PingFang SC';
  ctx.textAlign = 'center';
  ctx.fillText(pos.tableName, 0, -height/2 + 25);
  
  // 入座人数
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px PingFang SC';
  ctx.fillText(`${pos.capacity}人桌`, 0, height/2 - 15);
  
  ctx.restore();
};

// 绘制场地构件
const drawVenueElement = (ctx: CanvasRenderingContext2D, element: VenueElement) => {
  const defaults = VENUE_ELEMENT_DEFAULTS[element.type];
  
  ctx.save();
  ctx.translate(element.x + element.width/2, element.y + element.height/2);
  ctx.rotate((element.rotation || 0) * Math.PI / 180);
  
  ctx.fillStyle = defaults.color;
  ctx.globalAlpha = 0.8;
  
  switch (element.type) {
    case 'stage':
      drawRoundRect(ctx, -element.width/2, -element.height/2, element.width, element.height, 8);
      ctx.fill();
      break;
    case 'pillar':
      ctx.beginPath();
      ctx.arc(0, 0, element.width/2, 0, Math.PI * 2);
      ctx.fill();
      break;
    // ... 其他类型
  }
  
  ctx.restore();
};
```

### 6.4 拖拽交互

```typescript
const handleCanvasDrag = (e: React.MouseEvent) => {
  const rect = canvasRef.current.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // 查找点击的元素
  const clickedElement = findElementAtPosition(x, y);
  
  if (clickedElement) {
    setSelectedElement(clickedElement);
    setIsDragging(true);
  }
};

const handleCanvasMouseMove = (e: React.MouseEvent) => {
  if (!isDragging || !selectedElement) return;
  
  const rect = canvasRef.current.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // 更新元素位置
  updateElementPosition(selectedElement.id, x, y);
};

const handleCanvasMouseUp = () => {
  setIsDragging(false);
  setSelectedElement(null);
};
```

---

## 7. 人员搜索定位

### 7.1 功能描述
搜索已入座人员，高亮显示其所在桌位。

### 7.2 实现代码

```typescript
const [searchTerm, setSearchTerm] = useState('');
const [highlightedPersonId, setHighlightedPersonId] = useState<string | null>(null);

// 搜索结果
const searchResults = useMemo(() => {
  if (!searchTerm.trim()) return [];
  
  const results: SearchResult[] = [];
  
  activity.tables.forEach(table => {
    table.persons.forEach((person, index) => {
      const matches = 
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.company.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (matches) {
        results.push({
          person,
          tableId: table.id,
          tableName: table.name,
          seatNumber: index + 1,
        });
      }
    });
  });
  
  return results;
}, [searchTerm, activity.tables]);

// 高亮定位
const handleLocatePerson = (personId: string, tableId: string) => {
  setHighlightedPersonId(personId);
  
  // 滚动到桌位
  const tableElement = document.getElementById(`table-${tableId}`);
  if (tableElement) {
    tableElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  
  // 3秒后取消高亮
  setTimeout(() => setHighlightedPersonId(null), 3000);
};
```

### 7.3 高亮样式

```typescript
// 在 TableCard 中
const isHighlighted = table.persons.some(p => p.id === highlightedPersonId);

const highlightClass = isHighlighted
  ? 'ring-2 ring-lime-400 ring-offset-2 ring-offset-slate-900 animate-pulse'
  : '';
```

---

## 8. 快速换桌

### 8.1 功能描述
选择已入座人员，输入目标桌号，直接换到目标桌位。

### 8.2 实现代码

```typescript
const [selectedPersonForSwap, setSelectedPersonForSwap] = useState<{
  personId: string;
  sourceTableId: string;
  personName: string;
} | null>(null);
const [targetTableNumber, setTargetTableNumber] = useState('');

// 执行换桌
const handleQuickSwap = () => {
  if (!selectedPersonForSwap || !targetTableNumber.trim()) return;
  
  // 查找目标桌位
  const targetTable = activity.tables.find(
    t => t.name.toLowerCase() === targetTableNumber.toLowerCase()
  );
  
  if (!targetTable) {
    alert('未找到目标桌位');
    return;
  }
  
  // 检查目标桌位是否有空位
  if (targetTable.persons.length >= targetTable.capacity) {
    alert('目标桌位已满');
    return;
  }
  
  // 检查锁定状态
  if (targetTable.seatLock) {
    alert('目标桌位已锁定');
    return;
  }
  
  // 执行换桌
  swapPersonsBetweenTables(
    selectedPersonForSwap.sourceTableId,
    targetTable.id,
    selectedPersonForSwap.personId
  );
  
  // 清空状态
  setSelectedPersonForSwap(null);
  setTargetTableNumber('');
};
```

---

## 9. 快速调序

### 9.1 功能描述
输入目标桌号，将当前桌位移动到目标位置，后续桌位顺延。

### 9.2 实现代码

```typescript
// TableCard 组件中
const [showQuickReorder, setShowQuickReorder] = useState(false);
const [targetTableNumber, setTargetTableNumber] = useState('');

const handleQuickReorder = () => {
  if (!targetTableNumber.trim()) return;
  
  // 解析目标桌号，支持多种格式
  const targetName = parseTableNumber(targetTableNumber);
  if (!targetName) {
    alert('桌号格式不正确');
    return;
  }
  
  // 查找目标索引
  const targetIndex = activity.tables.findIndex(
    t => t.name.toLowerCase() === targetName.toLowerCase()
  );
  
  if (targetIndex === -1) {
    alert('未找到目标桌位');
    return;
  }
  
  // 查找当前索引
  const currentIndex = activity.tables.findIndex(t => t.id === table.id);
  
  // 执行重新排序
  reorderTables(currentIndex, targetIndex);
  
  // 清空状态
  setShowQuickReorder(false);
  setTargetTableNumber('');
};
```

### 9.3 桌号重新编号算法

```typescript
const reorderTables = (fromIndex: number, toIndex: number) => {
  setActivity(prev => {
    const tables = [...prev.tables];
    const [movedTable] = tables.splice(fromIndex, 1);
    tables.splice(toIndex, 0, movedTable);
    
    // 固定每组容量为 6
    const GROUP_SIZE = 6;
    
    // 重新编号（目标位置之前的不变）
    const prefix = tables[0].name.match(/^[A-Za-z]+/)?.[0] || 'A';
    
    const newTables = tables.map((table, index) => ({
      ...table,
      name: `${prefix}${index + 1}`,
    }));
    
    return { ...prev, tables: newTables };
  });
};
```

---

## 10. 锁定机制

### 10.1 三种锁定类型

| 锁定类型 | 字段 | 作用范围 | 影响的操作 |
|----------|------|----------|------------|
| 桌员锁定 | `Table.seatLock` | 桌内全部成员 | 自动排座、拖拽换桌、清空名单 |
| 桌位锁定 | `Table.positionLock` | 桌位位置 | 桌位排序、快速调序 |
| 个人锁定 | `Person.locked` | 单个人员 | 清空未分配人员 |

### 10.2 实现代码

```typescript
// 切换桌员锁定
const toggleSeatLock = useCallback((tableId: string) => {
  setActivity(prev => ({
    ...prev,
    tables: prev.tables.map(t => 
      t.id === tableId ? { ...t, seatLock: !t.seatLock } : t
    ),
  }));
}, []);

// 切换桌位锁定
const togglePositionLock = useCallback((tableId: string) => {
  setActivity(prev => ({
    ...prev,
    tables: prev.tables.map(t => 
      t.id === tableId ? { ...t, positionLock: !t.positionLock } : t
    ),
  }));
}, []);

// 一键锁定全部
const lockAllSeatLocks = useCallback(() => {
  setActivity(prev => ({
    ...prev,
    tables: prev.tables.map(t => ({ ...t, seatLock: true })),
  }));
}, []);

// 一键解锁全部
const unlockAllSeatLocks = useCallback(() => {
  setActivity(prev => ({
    ...prev,
    tables: prev.tables.map(t => ({ ...t, seatLock: false })),
  }));
}, []);

// 检查是否全部锁定
const isAllSeatLocked = useCallback(() => {
  return activity.tables.every(t => t.seatLock);
}, [activity.tables]);
```

### 10.3 锁定状态下的行为

```typescript
// 自动排座时跳过锁定桌位
const autoSeat = (persons: Person[], tables: Table[]): Table[] => {
  const result = [...tables];
  let personIndex = 0;
  
  for (const table of result) {
    // 跳过锁定的桌位
    if (table.seatLock) continue;
    
    // 填充未满的桌位
    while (table.persons.length < table.capacity && personIndex < persons.length) {
      table.persons.push(persons[personIndex]);
      personIndex++;
    }
  }
  
  return result;
};

// 清空未分配人员时跳过锁定的人员
const clearUnassignedPersons = () => {
  setActivity(prev => ({
    ...prev,
    persons: prev.persons.filter(p => p.locked),
  }));
};
```

---

## 11. 人员详情编辑

### 11.1 功能描述
点击人员卡片，弹出详情弹窗，支持编辑姓名、公司、手机号、职位、标签。

### 11.2 弹窗结构

```typescript
interface PersonDetailModalProps {
  person: Person;
  tableInfo?: {
    tableName: string;
    seatNumber: number;
    isLeader: boolean;
  };
  isLocked: boolean;
  onSave: (personId: string, updates: Partial<Person>) => void;
  onRemove: (personId: string) => void;
  onClose: () => void;
}
```

### 11.3 实现代码

```typescript
const PersonDetailModal: React.FC<PersonDetailModalProps> = ({
  person,
  tableInfo,
  isLocked,
  onSave,
  onRemove,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: person.name,
    company: person.company,
    phone: person.phone,
    title: person.title,
    tags: [...person.tags],
  });

  const handleSave = () => {
    onSave(person.id, {
      name: formData.name,
      company: formData.company,
      companyShort: extractCompanyShortName(formData.company),
      phone: formData.phone,
      title: formData.title,
      tags: formData.tags,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">人员详情</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400">姓名</label>
            <input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          {/* ... 其他字段 */}
        </div>

        {/* Info */}
        {tableInfo && (
          <div className="mt-4 p-3 bg-slate-700/50 rounded-lg text-sm text-slate-400">
            <p>桌位: {tableInfo.tableName}</p>
            <p>座位: {tableInfo.seatNumber}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          {!isLocked && (
            <button onClick={() => onRemove(person.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg">
              移除
            </button>
          )}
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg">
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 12. 一键清空未分配人员

### 12.1 功能描述
清空未分配人员池，跳过已锁定的人员。

### 12.2 实现代码

```typescript
// PersonPool 组件中
const handleClearAll = () => {
  if (persons.length === 0) return;
  
  if (confirm(`确定要清空全部 ${persons.length} 位未分配人员吗？`)) {
    onClearPersons?.();
  }
};

// Store 中
const clearUnassignedPersons = useCallback(() => {
  setActivity(prev => ({
    ...prev,
    persons: prev.persons.filter(p => p.locked), // 保留锁定的人员
  }));
}, []);
```

---

## 13. 公司简称智能提取

### 13.1 算法流程

```
输入: "深圳市腾讯计算机系统有限公司"

1. 文本标准化 → "深圳市腾讯计算机系统有限公司"
2. 删除公司类型后缀 → "深圳市腾讯计算机系统"
3. 品牌词典匹配 → 匹配到"腾讯" → 返回 "腾讯"

输入: "北京字节跳动科技有限公司"

1. 文本标准化 → "北京字节跳动科技有限公司"
2. 删除公司类型后缀 → "北京字节跳动科技"
3. 品牌词典匹配 → 匹配到"字节跳动" → 返回 "字节跳动"

输入: "杭州某某网络科技有限公司"

1. 文本标准化 → "杭州某某网络科技有限公司"
2. 删除公司类型后缀 → "杭州某某网络科技"
3. 品牌词典匹配 → 未匹配
4. 删除地域前缀 → "某某网络科技"
5. 删除通用后缀 → "某某网络科技"
6. 删除行业词(长度>6) → "某某"
7. 最终返回 → "某某"
```

### 13.2 关键词典

```typescript
// 公司类型后缀（从长到短排序，优先匹配长的）
const COMPANY_SUFFIXES = [
  '股份有限公司', '有限责任公司', '集团有限公司',
  '控股有限公司', '投资有限公司', '发展有限公司',
  '科技有限公司', '实业有限公司', '有限公司',
  '集团', '公司',
];

// 品牌词典（短词优先）
const BRAND_DICT = [
  '腾讯', '阿里', '阿里巴巴', '华为', '京东', '字节', '字节跳动',
  '美团', '小米', '百度', '网易', '拼多多', '米哈游',
  // ...
];

// 地域前缀
const REGION_PREFIXES = [
  '中国', '北京市', '北京', '上海市', '上海', '深圳市', '深圳',
  '广州市', '广州', '杭州市', '杭州', // ...
];

// 通用后缀词（始终删除）
const COMMON_SUFFIXES = [
  '管理', '服务', '文化', '传媒', '控股', '投资',
  '发展', '实业', '产业', '贸易', '销售', '商贸',
];

// 行业词（长度>6时才删除）
const INDUSTRY_WORDS = [
  '科技', '技术', '网络', '信息', '电子', '软件', '数字',
  '智能', '数据', '健康', '酒业', '供应链',
];
```

---

## 14. 自动排座算法

### 14.1 算法规则

1. 保留已排座人员（不重新分配）
2. 从未满桌位开始填充
3. 跳过已锁定的桌位
4. 按桌位顺序依次填充

### 14.2 实现代码

```typescript
const autoSeat = (persons: Person[], tables: Table[]): {
  seatedCount: number;
  remainingCount: number;
  tables: Table[];
} => {
  const result = tables.map(t => ({ ...t, persons: [...t.persons] }));
  let personIndex = 0;
  
  // 从未分配池取人
  const availablePersons = persons.filter(p => !p.locked);
  
  for (const table of result) {
    // 跳过锁定的桌位
    if (table.seatLock) continue;
    
    // 填充空位
    while (
      table.persons.length < table.capacity &&
      personIndex < availablePersons.length
    ) {
      table.persons.push(availablePersons[personIndex]);
      personIndex++;
    }
  }
  
  return {
    seatedCount: personIndex,
    remainingCount: availablePersons.length - personIndex,
    tables: result,
  };
};
```

---

## 15. 数据持久化

### 15.1 存储方式
- 使用 `localStorage`
- Key: `smart-seating-activity`
- 自动保存（每次状态变更）

### 15.2 实现代码

```typescript
// 保存
const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

// 加载
const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

// 在 store 中自动保存
useEffect(() => {
  saveToStorage(STORAGE_KEY, activity);
}, [activity]);
```

---

## 附录：常用正则表达式

```typescript
// 手机号
const PHONE_REGEX = /^1[3-9]\d{9}$/;

// 中文姓名
const NAME_REGEX = /^[\u4e00-\u9fa5]{2,4}$/;

// 桌号
const TABLE_NUMBER_REGEX = /(?:^|[桌号])([A-Za-z]?\d+)|([A-Za-z]+\d+)(?:号?桌|$)/i;

// 标签提取
const TAG_AT_REGEX = /@(\S+)/g;          // @VIP
const TAG_HASH_REGEX = /#(\S+)/g;        // #理事
const TAG_BRACKET_REGEX = /【([^】]+)】/g; // 【嘉宾】

// 英文标签
const ENGLISH_TAG_REGEX = /^[A-Za-z]+$/;
```

---

## 附录：TypeScript 类型定义完整版

```typescript
// src/types/index.ts

export interface Person {
  id: string;
  name: string;
  company: string;
  companyShort?: string;
  title: string;
  phone: string;
  tags: string[];
  tableNumber?: string;
  locked?: boolean;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  persons: Person[];
  seatLock?: boolean;
  positionLock?: boolean;
}

export interface Activity {
  id: string;
  name: string;
  persons: Person[];
  tables: Table[];
}

export interface SeatingData {
  activity: string;
  tables: {
    name: string;
    capacity: number;
    persons: Person[];
  }[];
}

export interface ImportResult {
  success: boolean;
  persons: Person[];
  errors: string[];
}

export type DragItem = {
  type: 'person' | 'table-person';
  person: Person;
  tableId?: string;
};

// src/types/layout.ts

export type VenueElementType = 'stage' | 'aisle' | 'pillar' | 'wall' | 'entrance';

export interface VenueElement {
  id: string;
  type: VenueElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  label?: string;
}

export interface TableLayoutPosition {
  tableId: string;
  tableName: string;
  capacity: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export type AlignMode = 'free' | 'horizontal' | 'vertical' | 'grid';

export interface LayoutConfig {
  gridSize: number;
  alignMode: AlignMode;
  showGrid: boolean;
  snapToGrid: boolean;
  tablesPerRow: number;
  rowSpacing: number;
  tableSpacing: number;
}

export interface Layout {
  id: string;
  name: string;
  venueElements: VenueElement[];
  tablePositions: TableLayoutPosition[];
  config: LayoutConfig;
  canvasWidth: number;
  canvasHeight: number;
}

export const VENUE_ELEMENT_DEFAULTS: Record<VenueElementType, { color: string; width: number; height: number }> = {
  stage: { color: '#7c3aed', width: 200, height: 80 },
  aisle: { color: '#f1f5f9', width: 100, height: 200 },
  pillar: { color: '#475569', width: 40, height: 40 },
  wall: { color: '#334155', width: 300, height: 20 },
  entrance: { color: '#22c55e', width: 60, height: 80 },
};
```
