# 流程台本管理系统 - 功能模块详细设计

> **模块编号**：M03  
> **优先级**：P0  
> **负责人**：前后端开发工程师  
> **创建日期**：2025-01-15

---

## 一、模块概述

### 1.1 功能定位

流程台本管理系统用于管理活动执行流程，支持多人协作编辑台本，实时同步更新，并在活动当天进行现场执行跟踪，确保活动流程有序进行。

### 1.2 核心价值

| 价值点 | 描述 |
|--------|------|
| **协作效率** | 多人同时编辑，实时同步，避免版本混乱 |
| **可视化呈现** | 时间轴视图直观展示流程节奏 |
| **现场执行** | 实时标记环节状态，把控执行进度 |
| **灵活调整** | 现场快速调整，应对突发情况 |

---

## 二、功能架构

```
┌─────────────────────────────────────────────────────────────┐
│                    流程台本管理系统                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   台本编辑层                          │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐       │   │
│  │  │ 台本创建   │  │ 环节管理   │  │ 多人协作   │       │   │
│  │  │  编辑     │  │  编辑     │  │  同步     │       │   │
│  │  └───────────┘  └───────────┘  └───────────┘       │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                  │
│                         ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   展示分析层                          │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐       │   │
│  │  │ 时间轴    │  │ 统计分析   │  │ 版本管理   │       │   │
│  │  │  视图     │  │  报告     │  │  历史     │       │   │
│  │  └───────────┘  └───────────┘  └───────────┘       │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                  │
│                         ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   现场执行层                          │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐       │   │
│  │  │ 执行状态   │  │ 进度跟踪   │  │ 实时调整   │       │   │
│  │  │  管理     │  │  监控     │  │  操作     │       │   │
│  │  └───────────┘  └───────────┘  └───────────┘       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、功能清单

### 3.1 台本编辑功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S03-01 | 台本创建 | 创建新台本，设置基础信息 | P0 |
| S03-02 | 台本编辑 | 编辑台本名称、总时长等 | P0 |
| S03-03 | 台本定稿 | 定稿后锁定编辑，生成正式版 | P0 |
| S03-04 | 台本模板 | 从模板库快速创建台本 | P1 |
| S03-05 | 台本复制 | 复制历史台本作为新台本基础 | P1 |
| S03-06 | 台本删除 | 删除未定稿的台本 | P1 |

### 3.2 环节管理功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S03-07 | 环节创建 | 创建活动环节，设置时间和内容 | P0 |
| S03-08 | 环节编辑 | 编辑环节名称、时间、内容等 | P0 |
| S03-09 | 环节删除 | 删除活动环节 | P0 |
| S03-10 | 环节排序 | 调整环节顺序 | P0 |
| S03-11 | 环节类型选择 | 选择环节类型（致辞、演讲、颁奖等） | P0 |
| S03-12 | 时间设置 | 设置环节开始/结束时间 | P0 |
| S03-13 | 内容编辑 | 编辑环节详细内容、台词 | P0 |
| S03-14 | 负责人分配 | 为环节分配执行负责人 | P0 |
| S03-15 | 设备需求标注 | 标注音响、灯光、PPT等设备需求 | P1 |
| S03-16 | 物料需求标注 | 标注环节所需物料 | P1 |

### 3.3 多人协作功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S03-17 | 实时同步 | 多人编辑实时同步更新 | P0 |
| S03-18 | 编辑锁 | 正在编辑的环节显示编辑锁 | P0 |
| S03-19 | 协作者标识 | 显示当前正在编辑的用户 | P0 |
| S03-20 | 变更通知 | 环节变更通知相关协作者 | P1 |
| S03-21 | 评论功能 | 在环节下添加评论讨论 | P1 |

### 3.4 版本管理功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S03-22 | 版本保存 | 保存台本历史版本 | P1 |
| S03-23 | 版本列表 | 查看台本历史版本列表 | P1 |
| S03-24 | 版本对比 | 对比两个版本的差异 | P2 |
| S03-25 | 版本回滚 | 回滚到历史版本 | P1 |

### 3.5 展示分析功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S03-26 | 时间轴视图 | 时间轴可视化展示流程 | P0 |
| S03-27 | 列表视图 | 表格列表展示环节详情 | P0 |
| S03-28 | 卡片视图 | 卡片式展示各环节 | P1 |
| S03-29 | 时间统计 | 统计各类型环节时长占比 | P1 |
| S03-30 | 空白检测 | 检测流程中的空白时段 | P2 |

### 3.6 导出功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S03-31 | PDF导出 | 导出PDF格式台本 | P0 |
| S03-32 | Word导出 | 导出Word格式台本 | P1 |
| S03-33 | 打印优化 | 打印排版优化 | P1 |

### 3.7 现场执行功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S03-34 | 执行模式切换 | 进入执行模式，锁定编辑 | P0 |
| S03-35 | 环节状态更新 | 更新环节执行状态（进行中、已完成等） | P0 |
| S03-36 | 实时时间记录 | 记录环节实际开始/结束时间 | P0 |
| S03-37 | 进度看板 | 显示整体执行进度 | P0 |
| S03-38 | 倒计时提醒 | 环节结束前倒计时提醒 | P0 |
| S03-39 | 跳过环节 | 现场跳过某个环节 | P1 |
| S03-40 | 延迟调整 | 现场调整后续环节时间 | P1 |
| S03-41 | 紧急插入 | 现场插入新的环节 | P2 |
| S03-42 | 执行记录 | 记录执行过程中的偏差 | P1 |

### 3.8 AI 辅助功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S03-43 | AI台本生成 | 根据活动类型AI生成台本框架 | P2 |
| S03-44 | AI内容建议 | AI建议环节内容要点 | P2 |
| S03-45 | 时间优化建议 | AI分析流程节奏并提供优化建议 | P2 |

---

## 四、界面设计

### 4.1 台本编辑主界面

```
┌─────────────────────────────────────────────────────────────────────┐
│  流程台本管理                              [活动] [台本] [执行模式]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  台本信息                                                     │   │
│  │  名称: 2025年度盛典流程台本  版本: v1.2  状态: 编辑中         │   │
│  │  总时长: 480分钟  创建者: 张三  协作者: 李四、王五            │   │
│  │  [定稿] [保存版本] [导出PDF] [AI生成建议]                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  时间轴视图                                                    │ │
│  │  09:00 ────────────────────────────────────────────── 18:00  │ │
│  │  ├──[15min]──┼──[30min]──┼──[20min]──┼──[15min]──┼──...      │ │
│  │  │  开场     │  演讲     │  颁奖     │  茶歇     │           │ │
│  │  │ 致辞 🔵   │  报告 🟢  │  仪式 🟡 │           │           │ │
│  │                                                             │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  环节列表                                                      │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ #1 开场致辞 (09:00-09:15) 15分钟  [致辞] ⏳ 张总       │ │ │
│  │  │    内容: 感谢嘉宾出席，介绍活动主题...                     │ │ │
│  │  │    设备: 主麦克风、舞台灯光A                             │ │ │
│  │  │    [编辑] [删除] [添加评论]                              │ │ │
│  │  ├─────────────────────────────────────────────────────────┤ │ │
│  │  │ #2 年度总结报告 (09:15-09:45) 30分钟  [演讲] ⏳ 李总   │ │ │
│  │  │    内容: 公司年度业绩回顾，战略规划展望...                 │ │ │
│  │  │    设备: 主屏PPT、主麦克风                              │ │ │
│  │  │    物料: PPT文件(李总提供)、演讲稿                       │ │ │
│  │  │    [编辑] [删除] [添加评论]                              │ │ │
│  │  ├─────────────────────────────────────────────────────────┤ │ │
│  │  │ #3 表彰颁奖 (09:45-10:05) 20分钟  [颁奖] ⏳ 王经理     │ │ │
│  │  │    内容: 年度优秀员工表彰，颁发荣誉证书...                 │ │ │
│  │  │    [编辑] [删除] [添加评论]                              │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │  [+ 添加环节]                                                  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  统计信息                                                      │ │
│  │  致辞: 15min(3%) 演讲: 60min(13%) 颁奖: 40min(8%)             │ │
│  │  茶歇: 30min(6%) 用餐: 90min(19%) 其他: 245min(51%)          │ │
│  │  ⚠️ 检测到空白时段: 10:30-10:35 (5分钟)                       │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 现场执行界面

```
┌─────────────────────────────────────────────────────────────────────┐
│  现场执行模式                              [活动] [台本] [结束执行]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  执行进度                                                     │   │
│  │  当前环节: #5 年度总结报告                                    │   │
│  │  状态: 进行中 ⏱️ 已用时: 12分钟 / 计划: 30分钟               │   │
│  │  剩余时间: 18分钟                                             │   │
│  │  已完成: 4/20  进度: 20%                                      │   │
│  │                                                             │   │
│  │  ┌───────────────────────────────────────────────────────┐ │   │
│  │  │ ⏱️ 计划时间轴                                          │ │   │
│  │  │ 09:00 ──────────── 09:15 ──────────── 09:45 ─────...  │ │   │
│  │  │                                                       │ │   │
│  │  │ 📍 实际时间轴                                          │ │   │
│  │  │ 09:00 ──────────── 09:17 ──────────── 09:50 ─────...  │ │   │
│  │  │ (开场超时2分钟)                                        │ │   │
│  │  └───────────────────────────────────────────────────────┘ │   │
│  │                                                             │   │
│  │  ⚠️ 累计延迟: 5分钟  建议: 茶歇环节缩短为10分钟              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  环节执行状态                                                  │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ #1 开场致辞 ✅ 已完成 09:00-09:17 (超时2分钟)          │ │ │
│  │  │ #2 嘉宾介绍 ✅ 已完成 09:17-09:25                      │ │ │
│  │  │ #3 欢迎致辞 ✅ 已完成 09:25-09:50                      │ │ │
│  │  │ #4 茶歇安排 ✅ 已完成 09:50-10:00                      │ │ │
│  │  │ #5 年度总结 🔄 进行中 10:00-10:18 (已用12分钟)         │ │ │
│  │  │ #6 表彰颁奖 ⏳ 待执行 10:30-10:50                      │ │ │
│  │  │ #7 ...             ⏳ 待执行                            │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │  [完成当前] [跳过] [调整时间] [插入环节]                     │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  当前环节详情                                                  │ │
│  │  #5 年度总结报告                                              │ │
│  │  负责人: 李总                                                 │ │
│  │  设备需求: 主屏PPT、主麦克风                                  │ │
│  │  内容: 公司年度业绩回顾，战略规划展望...                       │ │
│  │  备注: 注意PPT切换，确保音响正常                              │ │
│  │                                                             │ │
│  │  执行备注: [添加备注]                                         │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 五、数据结构设计

### 5.1 台本数据结构

```typescript
interface Script {
  id: string;
  eventId: string;
  title: string;
  version: string;
  totalDuration: number;  // 分钟
  status: 'draft' | 'finalized' | 'executing' | 'completed';
  settings: {
    timezone: string;
    remindersEnabled: boolean;
    autoAdjust: boolean;  // 自动调整延迟环节
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  finalizedAt?: Date;
  finalizedBy?: string;
}

interface ScriptSegment {
  id: string;
  scriptId: string;
  segmentType: SegmentType;
  title: string;
  description?: string;
  startTime: string;  // HH:mm:ss
  endTime: string;
  duration: number;  // 分钟
  content?: string;  // 详细内容
  speakers: Speaker[];
  performers: Performer[];
  equipment: EquipmentRequirements;
  materials: Material[];
  assignees: string[];  // 用户ID
  notes?: string;
  sortOrder: number;
  executionStatus: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'delayed';
  actualStartTime?: Date;
  actualEndTime?: Date;
  executionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

type SegmentType = 
  | 'opening'      // 开场
  | 'speech'       // 演讲
  | 'presentation' // 展示
  | 'performance'  // 表演
  | 'award'        // 颁奖
  | 'lottery'      // 抽奖
  | 'break'        // 茶歇/休息
  | 'meal'         // 用餐
  | 'closing'      // 闭幕
  | 'other';       // 其他

interface Speaker {
  name: string;
  role?: string;
  company?: string;
}

interface EquipmentRequirements {
  audio?: string[];   // 音响设备
  video?: string[];   // 视频设备
  lighting?: string[]; // 灯光
  ppt?: boolean;      // 是否需要PPT
  other?: string[];
}
```

### 5.2 执行状态数据结构

```typescript
interface ExecutionProgress {
  scriptId: string;
  currentSegmentId: string;
  currentSegmentIndex: number;
  totalSegments: number;
  completedCount: number;
  inProgressCount: number;
  skippedCount: number;
  delayedCount: number;
  
  // 时间统计
  scheduledStartTime: Date;
  actualStartTime: Date;
  totalDelayMinutes: number;
  estimatedEndTime: Date;  // 根据延迟估算
  
  // 预警信息
  warnings: ExecutionWarning[];
}

interface ExecutionWarning {
  type: 'delay' | 'gap' | 'overlap' | 'equipment' | 'material';
  segmentId?: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  suggestedAction?: string;
}
```

---

## 六、技术实现要点

### 6.1 实时协作同步

```typescript
// WebSocket 协作同步
class ScriptCollaborationService {
  private ws: WebSocket;
  private scriptId: string;
  private userId: string;
  
  connect(scriptId: string) {
    this.ws = new WebSocket(`${WS_URL}/scripts/${scriptId}`);
    this.scriptId = scriptId;
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }
  
  // 发送编辑操作
  sendEditOperation(operation: EditOperation) {
    this.ws.send(JSON.stringify({
      type: 'EDIT',
      userId: this.userId,
      scriptId: this.scriptId,
      operation: operation,
      timestamp: new Date()
    }));
  }
  
  // 处理接收的消息
  handleMessage(message: CollaborationMessage) {
    switch (message.type) {
      case 'EDIT':
        this.applyRemoteEdit(message.operation);
        break;
      case 'LOCK':
        this.showEditLock(message.segmentId, message.userId);
        break;
      case 'UNLOCK':
        this.removeEditLock(message.segmentId);
        break;
      case 'NOTIFY':
        this.showNotification(message.content);
        break;
    }
  }
  
  // 开始编辑环节时发送锁
  startEditing(segmentId: string) {
    this.ws.send(JSON.stringify({
      type: 'LOCK',
      segmentId: segmentId,
      userId: this.userId
    }));
  }
  
  // 结束编辑时释放锁
  finishEditing(segmentId: string) {
    this.ws.send(JSON.stringify({
      type: 'UNLOCK',
      segmentId: segmentId,
      userId: this.userId
    }));
  }
}

// 编辑操作类型
type EditOperationType = 
  | 'ADD_SEGMENT'
  | 'UPDATE_SEGMENT'
  | 'DELETE_SEGMENT'
  | 'REORDER_SEGMENTS'
  | 'UPDATE_CONTENT';

interface EditOperation {
  type: EditOperationType;
  segmentId?: string;
  data?: any;
  previousState?: any;  // 用于冲突检测
}
```

### 6.2 时间轴可视化

```typescript
// 时间轴组件实现
import { useEffect, useRef } from 'react';

interface TimelineProps {
  segments: ScriptSegment[];
  startTime: Date;
  currentTime?: Date;
  executionProgress?: ExecutionProgress;
}

function Timeline({ segments, startTime, currentTime, executionProgress }: TimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    drawTimeline(ctx, segments, startTime, currentTime, executionProgress);
  }, [segments, startTime, currentTime, executionProgress]);
  
  const drawTimeline = (ctx, segments, startTime, currentTime, executionProgress) => {
    const width = canvas.width;
    const height = canvas.height;
    const totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制背景时间线
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // 绘制各环节
    let xOffset = 0;
    const timeScale = width / totalDuration;
    
    for (const segment of segments) {
      const segmentWidth = segment.duration * timeScale;
      
      // 根据状态选择颜色
      const color = getSegmentColor(segment.executionStatus);
      
      ctx.fillStyle = color;
      ctx.fillRect(xOffset, 20, segmentWidth, 40);
      
      // 绘制环节名称
      ctx.fillStyle = '#333';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(segment.title, xOffset + segmentWidth / 2, 70);
      
      // 绘制时间标签
      ctx.fillText(formatTime(segment.startTime), xOffset, 10);
      
      xOffset += segmentWidth;
    }
    
    // 绘制当前时间指示线
    if (currentTime) {
      const currentOffset = calculateTimeOffset(currentTime, startTime, timeScale);
      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentOffset, 0);
      ctx.lineTo(currentOffset, height);
      ctx.stroke();
    }
  };
  
  const getSegmentColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'in_progress': return '#2196F3';
      case 'delayed': return '#FF5722';
      case 'skipped': return '#9E9E9E';
      default: return '#E0E0E0';
    }
  };
  
  return (
    <canvas ref={canvasRef} width={800} height={100} />
  );
}
```

### 6.3 状态管理

```typescript
// Zustand 状态管理
import { create } from 'zustand';

interface ScriptState {
  script: Script | null;
  segments: ScriptSegment[];
  executionProgress: ExecutionProgress | null;
  
  // UI 状态
  editingSegmentId: string | null;
  viewMode: 'timeline' | 'list' | 'card';
  isExecuting: boolean;
  
  // Actions
  setScript: (script: Script) => void;
  addSegment: (segment: ScriptSegment) => void;
  updateSegment: (id: string, data: Partial<ScriptSegment>) => void;
  deleteSegment: (id: string) => void;
  reorderSegments: (order: string[]) => void;
  
  startExecution: () => void;
  updateExecutionStatus: (segmentId: string, status: string) => void;
  completeSegment: (segmentId: string) => void;
  skipSegment: (segmentId: string) => void;
  adjustTime: (segmentId: string, newDuration: number) => void;
  
  finalizeScript: () => void;
  exportPDF: () => void;
}

const useScriptStore = create<ScriptState>((set, get) => ({
  script: null,
  segments: [],
  executionProgress: null,
  editingSegmentId: null,
  viewMode: 'timeline',
  isExecuting: false,
  
  setScript: (script) => set({ script }),
  
  addSegment: (segment) => {
    const { segments } = get();
    set({ segments: [...segments, segment] });
  },
  
  updateSegment: (id, data) => {
    const { segments } = get();
    set({
      segments: segments.map(s => s.id === id ? { ...s, ...data } : s)
    });
  },
  
  deleteSegment: (id) => {
    const { segments } = get();
    set({ segments: segments.filter(s => s.id !== id) });
  },
  
  reorderSegments: (order) => {
    const { segments } = get();
    const reordered = order.map(id => segments.find(s => s.id === id)!);
    set({ segments: reordered.map((s, i) => ({ ...s, sortOrder: i })) });
  },
  
  startExecution: () => {
    set({ isExecuting: true, executionProgress: {
      scriptId: get().script!.id,
      currentSegmentId: get().segments[0].id,
      currentSegmentIndex: 0,
      totalSegments: get().segments.length,
      completedCount: 0,
      inProgressCount: 1,
      skippedCount: 0,
      delayedCount: 0,
      scheduledStartTime: new Date(),
      actualStartTime: new Date(),
      totalDelayMinutes: 0,
      estimatedEndTime: new Date(),
      warnings: []
    } });
    
    // 更新第一个环节状态
    get().updateExecutionStatus(get().segments[0].id, 'in_progress');
  },
  
  updateExecutionStatus: (segmentId, status) => {
    const { segments, executionProgress } = get();
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;
    
    const updatedSegments = segments.map(s => 
      s.id === segmentId ? { ...s, executionStatus: status } : s
    );
    
    let updatedProgress = { ...executionProgress! };
    
    if (status === 'completed') {
      segment.actualEndTime = new Date();
      updatedProgress.completedCount++;
      updatedProgress.inProgressCount--;
      
      // 计算延迟
      const plannedDuration = segment.duration;
      const actualDuration = calculateDuration(segment.actualStartTime, segment.actualEndTime);
      if (actualDuration > plannedDuration) {
        updatedProgress.totalDelayMinutes += actualDuration - plannedDuration;
        updatedProgress.delayedCount++;
      }
      
      // 移动到下一环节
      const nextIndex = segments.findIndex(s => s.id === segmentId) + 1;
      if (nextIndex < segments.length) {
        const nextSegment = segments[nextIndex];
        updatedProgress.currentSegmentId = nextSegment.id;
        updatedProgress.currentSegmentIndex = nextIndex;
        updatedProgress.inProgressCount++;
        
        // 更新下一环节状态
        updatedSegments = updatedSegments.map(s => 
          s.id === nextSegment.id ? { ...s, executionStatus: 'in_progress', actualStartTime: new Date() } : s
        );
      }
    }
    
    if (status === 'skipped') {
      updatedProgress.skippedCount++;
      updatedProgress.inProgressCount--;
      
      // 移动到下一环节
      const nextIndex = segments.findIndex(s => s.id === segmentId) + 1;
      if (nextIndex < segments.length) {
        updatedProgress.currentSegmentId = segments[nextIndex].id;
        updatedProgress.currentSegmentIndex = nextIndex;
        updatedProgress.inProgressCount++;
      }
    }
    
    set({ segments: updatedSegments, executionProgress: updatedProgress });
  },
  
  completeSegment: (segmentId) => {
    get().updateExecutionStatus(segmentId, 'completed');
  },
  
  skipSegment: (segmentId) => {
    get().updateExecutionStatus(segmentId, 'skipped');
  },
  
  adjustTime: (segmentId, newDuration) => {
    const { segments } = get();
    const index = segments.findIndex(s => s.id === segmentId);
    if (index === -1) return;
    
    const segment = segments[index];
    const oldDuration = segment.duration;
    const diff = newDuration - oldDuration;
    
    // 更新当前环节
    const updatedSegments = segments.map((s, i) => {
      if (i === index) {
        return { ...s, duration: newDuration };
      }
      // 调整后续环节时间
      if (i > index) {
        const newStartTime = addMinutes(s.startTime, diff);
        const newEndTime = addMinutes(s.endTime, diff);
        return { ...s, startTime: newStartTime, endTime: newEndTime };
      }
      return s;
    });
    
    set({ segments: updatedSegments });
  },
  
  finalizeScript: () => {
    const { script } = get();
    if (!script) return;
    
    set({
      script: {
        ...script,
        status: 'finalized',
        finalizedAt: new Date()
      }
    });
    
    // 保存版本
    saveScriptVersion(script.id);
  },
  
  exportPDF: () => {
    const { script, segments } = get();
    exportService.exportScriptPDF(script!, segments);
  }
}));
```

---

## 七、AI 辅助功能实现

### 7.1 AI 台本生成

```typescript
// AI 台本生成服务
class AIScriptGenerator {
  async generate(eventInfo: EventInfo, requirements: GenerationRequirements): Promise<ScriptSegment[]> {
    const prompt = `
      活动信息：
      - 名称：${eventInfo.name}
      - 类型：${eventInfo.type}
      - 总时长：${eventInfo.duration}分钟
      - 参与人数：${eventInfo.guestCount}
      
      需求：
      - 包含开场致辞：${requirements.includeOpening ? '是' : '否'}
      - 包含表彰颁奖：${requirements.includeAwards ? '是' : '否'}
      - 包含抽奖环节：${requirements.includeLottery ? '是' : '否'}
      - 包含用餐：${requirements.includeMeal ? '是' : '否'}
      
      请生成一个合理的活动流程台本，包含以下内容：
      1. 环节名称
      2. 环节类型
      3. 建议时长
      4. 内容要点
      5. 设备需求
      
      请确保流程紧凑、节奏合理，并为每个环节提供详细建议。
    `;
    
    const response = await llmClient.chat(prompt);
    
    return this.parseSegments(response);
  }
  
  private parseSegments(response: string): ScriptSegment[] {
    // 解析 AI 返回的内容，转换为结构化数据
    const segments: ScriptSegment[] = [];
    
    // 解析逻辑...
    
    return segments;
  }
}
```

---

## 八、测试要点

### 8.1 功能测试

| 测试场景 | 验证点 |
|----------|--------|
| 台本创建 | 各字段正确保存 |
| 环节编辑 | 内容、时间正确更新 |
| 协作同步 | 多人编辑实时同步 |
| 版本管理 | 版本保存、回滚正确 |
| 现场执行 | 状态更新、时间记录正确 |

### 8.2 性能测试

| 测试场景 | 性能指标 |
|----------|----------|
| 大量环节 | 100+环节渲染 < 2s |
| 协作同步 | 消息延迟 < 100ms |
| 导出PDF | 生成时间 < 5s |

---

> **模块负责人**：前后端开发工程师  
> **最后更新**：2025-01-15