# 智能排座系统 - 功能模块详细设计

> **模块编号**：M02  
> **优先级**：P0  
> **负责人**：前端开发工程师  
> **创建日期**：2025-01-15

---

## 一、模块概述

### 1.1 功能定位

智能排座系统是芯火会务管理系统的核心功能模块之一，旨在通过 AI 技术和可视化工具，高效、合理地完成活动座位安排，解决传统人工排座耗时耗力、难以兼顾多方需求的问题。

### 1.2 核心价值

| 价值点 | 描述 |
|--------|------|
| **效率提升** | AI 智能排座，分钟级完成座位安排 |
| **合理性保证** | 多规则约束求解，确保座位安排合理 |
| **可视化操作** | 直观的座位图编辑，降低操作门槛 |
| **灵活调整** | 支持手动微调，满足个性化需求 |

---

## 二、功能架构

```
┌─────────────────────────────────────────────────────────────┐
│                    智能排座系统                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   数据输入层                          │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐       │   │
│  │  │ 场地布局   │  │ 嘉宾数据   │  │ 排座规则   │       │   │
│  │  │  配置     │  │  导入     │  │  设置     │       │   │
│  │  └───────────┘  └───────────┘  └───────────┘       │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                  │
│                         ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   排座引擎层                          │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐       │   │
│  │  │ 规则解析   │  │ 约束求解   │  │ AI优化    │       │   │
│  │  │  处理     │  │  算法     │  │  推理     │       │   │
│  │  └───────────┘  └───────────┘  └───────────┘       │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                  │
│                         ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   结果展示层                          │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐       │   │
│  │  │ 座位图    │  │ 嘉宾列表   │  │ 导出功能   │       │   │
│  │  │  可视化   │  │  管理     │  │  输出     │       │   │
│  │  └───────────┘  └───────────┘  └───────────┘       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、功能清单

### 3.1 场地布局管理

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S02-01 | 场地模板库 | 预置多种场地布局模板（剧院式、圆桌式等） | P1 |
| S02-02 | 自定义布局 | 支持自定义场地尺寸、桌椅布局 | P0 |
| S02-03 | 舞台位置设置 | 设置舞台、出入口等关键位置 | P0 |
| S02-04 | 座位类型定义 | 定义VIP区、普通区、残障专区等 | P0 |
| S02-05 | 座位数量配置 | 配置总座位数、每桌座位数 | P0 |
| S02-06 | 布局预览 | 实时预览场地布局效果 | P0 |

### 3.2 嘉宾数据管理

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S02-07 | 嘉宾批量导入 | 支持Excel/CSV批量导入嘉宾信息 | P0 |
| S02-08 | 嘉宾分组管理 | 按公司、职级、关系等维度分组 | P0 |
| S02-09 | VIP等级设置 | 设置嘉宾VIP等级（影响排座权重） | P0 |
| S02-10 | 嘉宾关系录入 | 录入嘉宾关系（同事、冲突等） | P1 |
| S02-11 | 特殊需求标注 | 标注残障人士、饮食禁忌等 | P1 |
| S02-12 | 嘉宾信息编辑 | 单个嘉宾信息增删改 | P0 |

### 3.3 排座规则设置

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S02-13 | VIP优先规则 | VIP嘉宾优先安排前排中间 | P0 |
| S02-14 | 同组聚合规则 | 同一团队尽量安排同桌 | P0 |
| S02-15 | 冲突避让规则 | 有冲突关系的嘉宾避免同桌 | P1 |
| S02-16 | 职级排序规则 | 职级高的嘉宾安排更前排 | P0 |
| S02-17 | 性别平衡规则 | 每桌男女比例尽量均衡 | P1 |
| S02-18 | 无障碍规则 | 残障人士安排靠近通道 | P0 |
| S02-19 | 自定义规则 | 支持自定义排座规则 | P2 |
| S02-20 | 规则权重调整 | 调整各规则的优先级权重 | P1 |

### 3.4 AI 智能排座

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S02-21 | 一键智能排座 | 根据规则自动生成排座方案 | P0 |
| S02-22 | 排座方案评分 | 对生成的方案进行合理性评分 | P1 |
| S02-23 | 多方案对比 | 生成多个方案供选择对比 | P2 |
| S02-24 | 规则违反提示 | 显示未满足的规则及原因 | P0 |
| S02-25 | 优化建议生成 | AI生成排座优化建议 | P1 |
| S02-26 | 局部重排 | 对特定区域重新排座 | P1 |

### 3.5 座位图可视化

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S02-27 | 座位图绘制 | Canvas绘制可视化座位图 | P0 |
| S02-28 | 拖拽调整座位 | 拖拽座位调整位置 | P0 |
| S02-29 | 拖拽分配嘉宾 | 拖拽嘉宾到座位进行分配 | P0 |
| S02-30 | 座位互换 | 两个座位快速互换嘉宾 | P0 |
| S02-31 | 座位锁定 | 锁定座位禁止调整 | P1 |
| S02-32 | 区域缩放 | 座位图缩放、平移查看 | P0 |
| S02-33 | 嘉宾搜索定位 | 搜索嘉宾并高亮座位 | P1 |
| S02-34 | 颜色标识 | 不同类型座位用颜色区分 | P0 |

### 3.6 导出与查询

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S02-35 | 座位图导出PDF | 导出高清座位图PDF | P0 |
| S02-36 | 嘉宾座位表导出 | 导出Excel座位对照表 | P0 |
| S02-37 | 嘉宾座位查询 | 嘉宾扫码查询自己的座位 | P1 |
| S02-38 | 座位变更记录 | 记录座位调整历史 | P2 |

---

## 四、界面设计

### 4.1 主界面布局

```
┌─────────────────────────────────────────────────────────────────────┐
│  智能排座系统                          [活动选择] [布局选择] [保存]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────┐  ┌───────────────────────────┐│
│  │                                 │  │  嘉宾列表                 ││
│  │                                 │  │  ┌───────────────────────┐││
│  │                                 │  │  │ 🔍 搜索嘉宾           │││
│  │        座位图可视化区域          │  │  └───────────────────────┘││
│  │       (Canvas 绑定)             │  │  ┌───────────────────────┐││
│  │                                 │  │  │ 未分配嘉宾 (20人)      │││
│  │    ┌───┐ ┌───┐ ┌───┐           │  │  │ • 张三 - CEO (VIP3)   │││
│  │    │T1 │ │T2 │ │T3 │  ...      │  │  │ • 李四 - 总监 (VIP2)  │││
│  │    └───┘ └───┘ └───┘           │  │  │ • 王五 - 经理         │││
│  │                                 │  │  │ ...                   │││
│  │    ┌───┐ ┌───┐ ┌───┐           │  │  └───────────────────────┘││
│  │    │T4 │ │T5 │ │T6 │  ...      │  │  ┌───────────────────────┐││
│  │    └───┘ └───┘ └───┘           │  │  │ 分组列表               │││
│  │                                 │  │  │ ○ VIP嘉宾组 (10人)    │││
│  │         [舞台区域]              │  │  │ ○ 芯片公司A (15人)    │││
│  │                                 │  │  │ ○ 芯片公司B (12人)    │││
│  │                                 │  │  └───────────────────────┘││
│  └─────────────────────────────────┘  └───────────────────────────┘│
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  操作工具栏                                                    │ │
│  │  [AI智能排座] [清空座位] [锁定选中] [导出PDF] [导出Excel]       │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  排座规则设置                                                  │ │
│  │  ☑ VIP优先 (权重:10) ☑ 同组聚合 (权重:8) ☐ 性别平衡 (权重:5) │ │
│  │  ☑ 职级排序 (权重:7) ☑ 冲突避让 (权重:9) ☐ 自定义规则        │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 座位图详细设计

**Canvas 绘制要素**：

| 元素 | 绘制方式 | 交互 |
|------|----------|------|
| **桌子** | 圆形/矩形，带编号 | 点击选中，拖拽移动 |
| **座位** | 围绕桌子的圆形/矩形，带编号 | 点击选中，拖拽分配嘉宾 |
| **舞台** | 大矩形区域，特殊颜色标识 | 不可拖拽 |
| **出入口** | 箭头标识 + 文字标注 | 不可拖拽 |
| **区域分隔线** | 虚线分隔VIP区、普通区 | 不可拖拽 |
| **嘉宾头像** | 圧座位的头像图片 | 显示嘉宾信息 |

**颜色编码**：

```css
/* 座位状态颜色 */
.seat-vip { fill: #FF6B6B; }       /* VIP座位 - 红色 */
.seat-normal { fill: #4ECDC4; }    /* 普通座位 - 绿色 */
.seat-occupied { fill: #95E1D3; }  /* 已占用 - 浅绿 */
.seat-locked { fill: #F38181; }    /* 锁定 - 深红 */
.seat-disabled { fill: #AA96DA; }  /* 无障碍 - 紫色 */
.seat-empty { fill: #F5F5F5; }     /* 空座位 - 灰色 */
```

---

## 五、排座算法设计

### 5.1 算法流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI 智能排座算法流程                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: 数据预处理                                              │
│  ├─ 解析场地布局数据                                             │
│  ├─ 解析嘉宾数据（分组、VIP等级、关系）                          │
│  └─ 解析排座规则及权重                                           │
│                                                                 │
│  Step 2: 规则约束建模                                            │
│  ├─ VIP优先约束: vip_score = vip_level * seat_quality          │
│  ├─ 同组聚合约束: group_score = count(同桌同组嘉宾)              │
│  ├─ 冲突避让约束: conflict_score = -count(同桌冲突对)           │
│  ├─ 职级排序约束: rank_score = rank_position_weight             │
│  └─ 综合评分: total = Σ(rule_weight * rule_score)              │
│                                                                 │
│  Step 3: 初始分配                                                │
│  ├─ 按VIP等级降序排列嘉宾                                        │
│  ├─ VIP嘉宾分配到前排优质座位                                    │
│  ├─ 按分组将嘉宾批量分配到同桌                                   │
│  └─ 处理特殊需求嘉宾（无障碍座位）                               │
│                                                                 │
│  Step 4: 优化迭代                                                │
│  ├─ 计算当前方案评分                                            │
│  ├─ 识别违规规则并调整                                          │
│  ├─ 局部搜索优化（尝试座位互换）                                 │
│  ├─ 重复迭代直到评分收敛或达到迭代上限                           │
│  └─ 输出最优方案                                                │
│                                                                 │
│  Step 5: 结果输出                                                │
│  ├─ 生成座位分配列表                                            │
│  ├─ 计算方案总体评分                                            │
│  ├─ 生成规则违反报告                                            │
│  └─ 生成优化建议                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 核心算法代码框架

```typescript
// 排座引擎核心类
class SeatingEngine {
  private venue: VenueLayout;
  private guests: Guest[];
  private rules: SeatingRule[];
  
  constructor(venue: VenueLayout, guests: Guest[], rules: SeatingRule[]) {
    this.venue = venue;
    this.guests = guests;
    this.rules = rules;
  }
  
  // 主排座算法
  async generate(): Promise<SeatingResult> {
    // Step 1: 数据预处理
    const processedData = this.preprocess();
    
    // Step 2: 初始分配
    const initialAssignment = this.initialAssign(processedData);
    
    // Step 3: 优化迭代
    const optimizedAssignment = await this.optimize(initialAssignment);
    
    // Step 4: 评分与验证
    const score = this.calculateScore(optimizedAssignment);
    const violations = this.validateRules(optimizedAssignment);
    const suggestions = this.generateSuggestions(violations);
    
    return {
      assignments: optimizedAssignment,
      score,
      violations,
      suggestions
    };
  }
  
  // 初始分配策略
  private initialAssign(data: ProcessedData): SeatAssignment[] {
    const assignments: SeatAssignment[] = [];
    const sortedGuests = this.sortByPriority(data.guests);
    const availableSeats = this.getAvailableSeats();
    
    // VIP优先分配
    for (const guest of sortedGuests.filter(g => g.vipLevel > 0)) {
      const bestSeat = this.findBestVipSeat(availableSeats);
      if (bestSeat) {
        assignments.push({ seatId: bestSeat.id, guestId: guest.id });
        availableSeats.splice(availableSeats.indexOf(bestSeat), 1);
      }
    }
    
    // 分组批量分配
    for (const group of data.groups) {
      const groupSeats = this.findGroupSeats(availableSeats, group.size);
      for (const guest of group.guests) {
        if (!assignments.find(a => a.guestId === guest.id)) {
          const seat = groupSeats.shift();
          if (seat) {
            assignments.push({ seatId: seat.id, guestId: guest.id });
          }
        }
      }
    }
    
    // 剩余嘉宾随机分配
    for (const guest of sortedGuests) {
      if (!assignments.find(a => a.guestId === guest.id)) {
        const seat = availableSeats.shift();
        if (seat) {
          assignments.push({ seatId: seat.id, guestId: guest.id });
        }
      }
    }
    
    return assignments;
  }
  
  // 优化迭代
  private async optimize(assignments: SeatAssignment[]): Promise<SeatAssignment[]> {
    let currentAssignments = assignments;
    let currentScore = this.calculateScore(currentAssignments);
    let iterations = 0;
    const maxIterations = 100;
    
    while (iterations < maxIterations) {
      // 尝试座位互换
      const swapResult = this.trySwap(currentAssignments);
      if (swapResult.score > currentScore) {
        currentAssignments = swapResult.assignments;
        currentScore = swapResult.score;
      }
      
      // 处理冲突
      const conflicts = this.detectConflicts(currentAssignments);
      for (const conflict of conflicts) {
        const resolution = this.resolveConflict(currentAssignments, conflict);
        currentAssignments = resolution;
      }
      
      iterations++;
      
      // 评分收敛则停止
      if (this.isConverged(currentScore)) break;
    }
    
    return currentAssignments;
  }
  
  // 计算方案评分
  private calculateScore(assignments: SeatAssignment[]): number {
    let totalScore = 0;
    
    for (const rule of this.rules) {
      const ruleScore = this.evaluateRule(assignments, rule);
      totalScore += ruleScore * rule.weight;
    }
    
    return totalScore / this.rules.reduce((sum, r) => sum + r.weight, 0);
  }
}
```

### 5.3 AI 辅助推理

**使用场景**：当规则约束无法求解时，调用大语言模型进行推理辅助。

```typescript
// AI 推理辅助
class AISittingAssistant {
  async analyzeSituation(
    venue: VenueLayout,
    guests: Guest[],
    constraints: Constraint[]
  ): Promise<AIAnalysis> {
    const prompt = `
      场地信息：${JSON.stringify(venue)}
      嘉宾数量：${guests.length}
      VIP嘉宾：${guests.filter(g => g.vipLevel > 0).length}
      分组数量：${guests.groupedByCompany.length}
      约束条件：${JSON.stringify(constraints)}
      
      请分析排座难点，并提供策略建议。
    `;
    
    const response = await llmClient.chat(prompt);
    
    return {
      difficulties: this.parseDifficulties(response),
      suggestions: this.parseSuggestions(response),
      priorityGroups: this.parsePriorityGroups(response)
    };
  }
  
  async generateCustomRule(
    description: string
  ): Promise<SeatingRule> {
    const prompt = `
      用户需求：${description}
      请将其转化为可执行的排座规则。
    `;
    
    const response = await llmClient.chat(prompt);
    
    return this.parseRule(response);
  }
}
```

---

## 六、技术实现要点

### 6.1 Canvas 绑定实现

```typescript
// 使用 Konva.js 实现座位图
import Konva from 'konva';

class SeatingCanvas {
  private stage: Konva.Stage;
  private layer: Konva.Layer;
  
  constructor(container: HTMLElement) {
    this.stage = new Konva.Stage({
      container: container,
      width: container.offsetWidth,
      height: container.offsetHeight
    });
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);
  }
  
  // 绘制桌子
  drawTable(table: TableConfig) {
    const group = new Konva.Group({
      x: table.x,
      y: table.y,
      draggable: true
    });
    
    // 桌子主体
    const tableShape = new Konva.Circle({
      radius: table.radius,
      fill: '#F5F5F5',
      stroke: '#333',
      strokeWidth: 2
    });
    
    // 桌号
    const tableNumber = new Konva.Text({
      text: table.number,
      fontSize: 14,
      fill: '#333',
      align: 'center'
    });
    
    group.add(tableShape, tableNumber);
    
    // 绘制座位
    for (let i = 0; i < table.seatsCount; i++) {
      const seat = this.drawSeat(table, i);
      group.add(seat);
    }
    
    this.layer.add(group);
  }
  
  // 绘制座位
  drawSeat(table: TableConfig, seatIndex: number) {
    const angle = (seatIndex / table.seatsCount) * Math.PI * 2;
    const seatX = Math.cos(angle) * (table.radius + 20);
    const seatY = Math.sin(angle) * (table.radius + 20);
    
    const seat = new Konva.Circle({
      x: seatX,
      y: seatY,
      radius: 15,
      fill: '#4ECDC4',
      stroke: '#333',
      strokeWidth: 1
    });
    
    // 座位点击事件
    seat.on('click', () => {
      this.onSeatClick(seat, table.seats[seatIndex]);
    });
    
    return seat;
  }
  
  // 座位点击处理
  onSeatClick(seatShape: Konva.Circle, seatData: Seat) {
    // 高亮选中
    seatShape.fill('#FF6B6B');
    this.layer.draw();
    
    // 显示座位信息面板
    this.showSeatInfo(seatData);
  }
  
  // 拖拽分配嘉宾
  enableDragAssignment(guest: Guest) {
    // 创建可拖拽的嘉宾图标
    const guestIcon = new Konva.Circle({
      radius: 12,
      fill: guest.avatar ? null : '#95E1D3',
      stroke: '#333',
      strokeWidth: 1,
      draggable: true
    });
    
    guestIcon.on('dragend', (e) => {
      const dropPosition = { x: e.target.x(), y: e.target.y() };
      const targetSeat = this.findSeatAtPosition(dropPosition);
      
      if (targetSeat && targetSeat.status === 'available') {
        this.assignGuestToSeat(guest, targetSeat);
      }
    });
  }
}
```

### 6.2 数据状态管理

```typescript
// Zustand 状态管理
import { create } from 'zustand';

interface SeatingState {
  // 数据
  venueLayout: VenueLayout | null;
  guests: Guest[];
  assignments: SeatAssignment[];
  rules: SeatingRule[];
  
  // UI状态
  selectedSeat: string | null;
  selectedGuest: string | null;
  zoomLevel: number;
  
  // Actions
  setVenueLayout: (layout: VenueLayout) => void;
  setGuests: (guests: Guest[]) => void;
  assignGuest: (seatId: string, guestId: string) => void;
  swapSeats: (seatId1: string, seatId2: string) => void;
  lockSeat: (seatId: string) => void;
  generateSeating: () => Promise<void>;
  exportToPDF: () => void;
  exportToExcel: () => void;
}

const useSeatingStore = create<SeatingState>((set, get) => ({
  venueLayout: null,
  guests: [],
  assignments: [],
  rules: defaultRules,
  selectedSeat: null,
  selectedGuest: null,
  zoomLevel: 1,
  
  setVenueLayout: (layout) => set({ venueLayout: layout }),
  setGuests: (guests) => set({ guests }),
  
  assignGuest: (seatId, guestId) => {
    const { assignments, guests } = get();
    const guest = guests.find(g => g.id === guestId);
    const existingAssignment = assignments.find(a => a.guestId === guestId);
    
    // 移除原座位分配
    const newAssignments = assignments.filter(a => 
      a.seatId !== seatId && a.guestId !== guestId
    );
    
    // 添加新分配
    newAssignments.push({ seatId, guestId, guest });
    
    set({ assignments: newAssignments });
  },
  
  swapSeats: (seatId1, seatId2) => {
    const { assignments } = get();
    const assignment1 = assignments.find(a => a.seatId === seatId1);
    const assignment2 = assignments.find(a => a.seatId === seatId2);
    
    if (assignment1 && assignment2) {
      const newAssignments = assignments.map(a => {
        if (a.seatId === seatId1) return { ...a, guestId: assignment2.guestId };
        if (a.seatId === seatId2) return { ...a, guestId: assignment1.guestId };
        return a;
      });
      
      set({ assignments: newAssignments });
    }
  },
  
  generateSeating: async () => {
    const { venueLayout, guests, rules } = get();
    if (!venueLayout) return;
    
    const engine = new SeatingEngine(venueLayout, guests, rules);
    const result = await engine.generate();
    
    set({ assignments: result.assignments });
    
    // 显示评分和违规提示
    console.log('方案评分:', result.score);
    console.log('违规规则:', result.violations);
  },
  
  exportToPDF: () => {
    // 调用导出服务
    exportService.exportSeatingPDF(get());
  },
  
  exportToExcel: () => {
    exportService.exportSeatingExcel(get());
  }
}));
```

---

## 七、性能优化

### 7.1 大数据量处理

| 场景 | 优化策略 |
|------|----------|
| 1000+ 嘉宾 | 分批处理，增量更新 |
| 复杂布局 | Canvas 分层绘制，按需渲染 |
| 排座计算 | 后端异步计算，前端轮询进度 |
| 状态同步 | 使用 WebSocket 实时同步 |

### 7.2 渲染优化

```typescript
// Canvas 性能优化
class OptimizedSeatingCanvas {
  // 视口裁剪：只渲染可视区域
  renderViewport() {
    const viewport = this.getViewportBounds();
    const visibleSeats = this.seats.filter(seat => 
      this.isInViewport(seat, viewport)
    );
    
    // 清空图层
    this.layer.destroyChildren();
    
    // 只绘制可见元素
    for (const seat of visibleSeats) {
      this.drawSeat(seat);
    }
  }
  
  // 离屏渲染：复杂元素预渲染到缓存
  preRenderGuestAvatar(guest: Guest) {
    const cacheCanvas = document.createElement('canvas');
    const ctx = cacheCanvas.getContext('2d');
    
    // 预渲染头像
    ctx.drawImage(guest.avatar, 0, 0, 24, 24);
    
    guest.avatarCache = cacheCanvas;
  }
}
```

---

## 八、测试要点

### 8.1 功能测试

| 测试场景 | 验证点 |
|----------|--------|
| 场地布局创建 | 各种布局类型正确渲染 |
| 嘉宾导入 | Excel/CSV 正确解析，数据完整 |
| AI排座 | 方案评分合理，规则满足度高 |
| 手动调整 | 拖拽、互换操作正确执行 |
| 导出功能 | PDF/Excel 格式正确，数据完整 |

### 8.2 性能测试

| 测试场景 | 性能指标 |
|----------|----------|
| 1000嘉宾排座 | 计算时间 < 30s |
| Canvas渲染 | 首次渲染 < 2s |
| 拖拽操作 | 响应时间 < 100ms |
| 导出PDF | 生成时间 < 10s |

---

## 九、部署与运维

### 9.1 前端部署

- Next.js 应用部署到 Vercel/云服务器
- Canvas 渲染资源 CDN 加速

### 9.2 后端部署

- 排座计算服务独立部署，支持异步队列
- WebSocket 服务部署，支持大屏实时同步

---

> **模块负责人**：前端开发工程师  
> **最后更新**：2025-01-15