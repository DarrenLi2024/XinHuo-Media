# 任务分工跟进系统 - 功能模块详细设计

> **模块编号**：M08  
> **优先级**：P0  
> **负责人**：前后端开发工程师  
> **创建日期**：2025-01-15

---

## 一、模块概述

### 1.1 功能定位

任务分工跟进系统是活动管理的核心协调工具，用于活动筹备过程中的任务分解、分工分配、进度跟踪和协作沟通，确保活动筹备工作有序推进。

### 1.2 核心价值

| 价值点 | 描述 |
|--------|------|
| **任务清晰** | 任务分解明确，职责清晰 |
| **进度可视** | 实时查看任务进度，把控整体节奏 |
| **协作高效** | 多人协作，评论沟通，避免混乱 |
| **预警提醒** | 任务延期预警，及时干预 |

---

## 二、功能清单

### 2.1 任务管理功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S08-01 | 任务创建 | 创建活动筹备任务 | P0 |
| S08-02 | 任务编辑 | 编辑任务信息 | P0 |
| S08-03 | 任务删除 | 删除任务 | P0 |
| S08-04 | 任务分解 | 创建子任务 | P0 |
| S08-05 | 任务合并 | 合并多个任务 | P1 |
| S08-06 | 任务排序 | 调整任务顺序 | P0 |
| S08-07 | 任务搜索 | 搜索任务 | P0 |

### 2.2 任务信息管理

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S08-08 | 任务标题 | 设置任务标题 | P0 |
| S08-09 | 任务描述 | 设置任务详细描述 | P0 |
| S08-10 | 任务优先级 | 设置任务优先级（高/中/低） | P0 |
| S08-11 | 任务截止时间 | 设置任务截止日期 | P0 |
| S08-12 | 任务开始时间 | 设置任务开始日期 | P1 |
| S08-13 | 任务进度 | 设置/更新任务进度 | P0 |
| S08-14 | 任务附件 | 上传任务相关文件 | P1 |
| S08-15 | 任务标签 | 设置任务标签 | P1 |

### 2.3 任务分工功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S08-16 | 分配负责人 | 为任务分配负责人 | P0 |
| S08-17 | 多人分工 | 为任务分配多个负责人 | P0 |
| S08-18 | 任务依赖 | 设置任务之间的依赖关系 | P1 |
| S08-19 | 分工调整 | 调整任务负责人 | P0 |
| S08-20 | 批量分配 | 批量为多个任务分配负责人 | P1 |

### 2.4 任务状态管理

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S08-21 | 状态更新 | 更新任务状态 | P0 |
| S08-22 | 完成任务 | 标记任务完成 | P0 |
| S08-23 | 取消任务 | 取消任务 | P1 |
| S08-24 | 延期标记 | 标记任务延期 | P0 |

### 2.5 任务协作功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S08-25 | 任务评论 | 在任务下添加评论 | P0 |
| S08-26 | 评论回复 | 回复任务评论 | P0 |
| S08-27 | 评论附件 | 评论中上传附件 | P1 |
| S08-28 | 任务提醒 | 发送任务提醒通知 | P0 |

### 2.6 任务统计功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S08-29 | 任务统计 | 统计任务完成情况 | P0 |
| S08-30 | 进度概览 | 活动筹备进度概览 | P0 |
| S08-31 | 延期任务列表 | 查看延期任务列表 | P0 |
| S08-32 | 成员任务统计 | 查看各成员任务情况 | P0 |

### 2.7 任务视图功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S08-33 | 列表视图 | 表格列表展示任务 | P0 |
| S08-34 | 看板视图 | 看板卡片展示任务 | P0 |
| S08-35 | 时间线视图 | 时间线展示任务 | P1 |
| S08-36 | 日历视图 | 日历展示任务 | P1 |
| S08-37 | 我的任务 | 查看分配给我的任务 | P0 |

---

## 三、界面设计

### 3.1 任务看板界面

```
┌─────────────────────────────────────────────────────────────────────┐
│  任务管理                              [活动] [视图切换] [新增任务]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  统计概览                                                      │ │
│  │  总任务: 25  待处理: 8  进行中: 12  已完成: 5  延期: 2         │ │
│  │  完成率: 20%                                                   │ │
│  │  ⚠️ 延期预警: 2个任务已延期                                   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │
│  │  待处理 (8)   │  │  进行中 (12)  │  │  已完成 (5)   │          │
│  │  ──────────   │  │  ──────────   │  │  ──────────   │          │
│  │               │  │               │  │               │          │
│  │  ┌─────────┐ │  │  ┌─────────┐ │  │  ┌─────────┐ │          │
│  │  │ 🔴 高优 │ │  │  │ 🟡 中优 │ │  │  │ ✅ 完成 │ │          │
│  │  │         │ │  │  │         │ │  │  │         │ │          │
│  │  │ 设计主  │ │  │  │ 场地预  │ │  │  │ 嘉宾名  │ │          │
│  │  │ 视觉    │ │  │  │ 订      │ │  │  │ 单整理  │ │          │
│  │  │         │ │  │  │         │ │  │  │         │ │          │
│  │  │ 张三    │ │  │  │ 李四    │ │  │  │ 王五    │ │          │
│  │  │ 02-01   │ │  │  │ 02-05   │ │  │  │ 01-20   │ │          │
│  │  └─────────┘ │  │  └─────────┘ │  │  └─────────┘ │          │
│  │               │  │               │  │               │          │
│  │  ┌─────────┐ │  │  ┌─────────┐ │  │               │          │
│  │  │ 🟡 中优 │ │  │  │ 🔴 高优 │ │  │               │          │
│  │  │ 物料采  │ │  │  │ 签到系  │ │  │               │          │
│  │  │ 购      │ │  │  │ 统配置  │ │  │               │          │
│  │  │ 李四    │ │  │  │ 张三    │ │  │               │          │
│  │  │ 02-03   │ │  │  │ 02-08   │ │  │               │          │
│  │  └─────────┘ │  │  └─────────┘ │  │               │          │
│  │               │  │               │  │               │          │
│  │  [+ 添加]    │  │               │  │               │          │
│  └───────────────┘  └───────────────┘  └───────────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 任务详情界面

```
┌─────────────────────────────────────────────────────────────────────┐
│  任务详情                              [编辑] [完成] [取消]         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  任务信息                                                    │   │
│  │  标题: 设计活动主视觉                                        │   │
│  │  优先级: 🔴 高                                               │   │
│  │  状态: 进行中                                                │   │
│  │  进度: 60%                                                   │   │
│  │                                                             │   │
│  │  描述:                                                       │   │
│  │  根据活动主题设计主视觉海报、背景板等                        │   │
│  │  包含以下内容：                                              │   │
│  │  1. 活动主海报                                               │   │
│  │  2. 背景板设计                                               │   │
│  │  3. 邀请函设计                                               │   │
│  │                                                             │   │
│  │  截止时间: 2025-02-01                                        │   │
│  │  开始时间: 2025-01-20                                        │   │
│  │                                                             │   │
│  │  负责人: 张三                                                │   │
│  │  协作人: 李四                                                │   │
│  │                                                             │   │
│  │  标签: [设计] [视觉]                                         │   │
│  │  附件: 设计参考.zip                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  子任务                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ ☑ 主海报设计 ✅ 已完成                                   │ │ │
│  │  │ ☑ 背景板设计 ✅ 已完成                                   │ │ │
│  │  │ □ 邀请函设计 ⏳ 进行中                                   │ │ │
│  │  │ □ VI延展物料 □ 待处理                                   │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │  [+ 添加子任务]                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  评论讨论                                                     │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 张三 (01-25 14:30)                                       │ │ │
│  │  │ "主海报初稿已完成，请大家查看附件确认"                   │ │ │
│  │  │                                                         │ │ │
│  │  │ 李四 (01-25 15:00)                                       │ │ │
│  │  │ "整体效果不错，建议调整一下主色调"                       │ │ │
│  │  │                                                         │ │ │
│  │  │ 张三 (01-25 16:00)                                       │ │ │
│  │  │ "已调整，请查看最新版本"                                 │ │ │
│  │  │ [主海报v2.pdf]                                           │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │  [添加评论]                                                    │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  进度更新                                                      │ │
│  │  进度: [━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░] 60%            │ │
│  │  [更新进度]                                                    │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 四、状态管理

```typescript
// Zustand 状态管理
import { create } from 'zustand';

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  comments: TaskComment[];
  
  // 视图状态
  viewMode: 'list' | 'kanban' | 'timeline' | 'calendar';
  filters: TaskFilters;
  
  // Actions
  fetchTasks: (eventId: string) => Promise<void>;
  createTask: (eventId: string, data: Partial<Task>) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  createSubTask: (parentId: string, data: Partial<Task>) => void;
  
  assignTask: (taskId: string, userIds: string[]) => void;
  updateProgress: (taskId: string, progress: number) => void;
  completeTask: (taskId: string) => void;
  
  addComment: (taskId: string, content: string, attachments?: Attachment[]) => void;
  deleteComment: (commentId: string) => void;
  
  setViewMode: (mode: ViewMode) => void;
  setFilters: (filters: TaskFilters) => void;
  
  getStatistics: () => TaskStatistics;
}

interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignee?: string[];
  dueDateRange?: { start: Date; end: Date };
  keyword?: string;
}

type ViewMode = 'list' | 'kanban' | 'timeline' | 'calendar';

interface TaskStatistics {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  completionRate: number;
  overdueCount: number;
  dueTodayCount: number;
  dueThisWeekCount: number;
}

const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  currentTask: null,
  comments: [],
  viewMode: 'kanban',
  filters: {},
  
  fetchTasks: async (eventId) => {
    const tasks = await taskService.list(eventId);
    set({ tasks });
  },
  
  createTask: (eventId, data) => {
    const task: Task = {
      id: uuid(),
      eventId,
      title: data.title!,
      description: data.description,
      status: 'pending',
      progress: 0,
      priority: data.priority || 'medium',
      dueDate: data.dueDate!,
      startDate: data.startDate,
      assignees: data.assignees || [],
      tags: data.tags || [],
      attachments: data.attachments || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentUserId
    };
    
    set({ tasks: [...get().tasks, task] });
  },
  
  updateTask: (id, data) => {
    set({
      tasks: get().tasks.map(t => 
        t.id === id ? { ...t, ...data, updatedAt: new Date() } : t
      )
    });
  },
  
  deleteTask: (id) => {
    set({ tasks: get().tasks.filter(t => t.id !== id) });
  },
  
  createSubTask: (parentId, data) => {
    const parentTask = get().tasks.find(t => t.id === parentId);
    if (!parentTask) return;
    
    const subTask: Task = {
      id: uuid(),
      eventId: parentTask.eventId,
      title: data.title!,
      status: 'pending',
      progress: 0,
      priority: data.priority || parentTask.priority,
      dueDate: data.dueDate || parentTask.dueDate,
      assignees: data.assignees || parentTask.assignees,
      parentId: parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentUserId
    };
    
    set({ tasks: [...get().tasks, subTask] });
  },
  
  assignTask: (taskId, userIds) => {
    set({
      tasks: get().tasks.map(t => 
        t.id === taskId ? { ...t, assignees: userIds, updatedAt: new Date() } : t
      )
    });
  },
  
  updateProgress: (taskId, progress) => {
    set({
      tasks: get().tasks.map(t => 
        t.id === taskId ? { 
          ...t, 
          progress, 
          status: progress === 100 ? 'completed' : 'in_progress',
          completedAt: progress === 100 ? new Date() : undefined,
          updatedAt: new Date()
        } : t
      )
    });
  },
  
  completeTask: (taskId) => {
    set({
      tasks: get().tasks.map(t => 
        t.id === taskId ? { 
          ...t, 
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
          updatedAt: new Date()
        } : t
      )
    });
  },
  
  addComment: (taskId, content, attachments) => {
    const comment: TaskComment = {
      id: uuid(),
      taskId,
      userId: currentUserId,
      content,
      attachments: attachments || [],
      createdAt: new Date()
    };
    
    set({ comments: [...get().comments, comment] });
  },
  
  setViewMode: (mode) => set({ viewMode: mode }),
  setFilters: (filters) => set({ filters }),
  
  getStatistics: () => {
    const { tasks } = get();
    
    const total = tasks.length;
    const byStatus = {
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      delayed: tasks.filter(t => t.status === 'delayed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length
    };
    const byPriority = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    };
    
    const completionRate = (byStatus.completed / total) * 100;
    const overdueCount = tasks.filter(t => 
      t.dueDate < new Date() && t.status !== 'completed'
    ).length;
    
    const today = new Date();
    const dueTodayCount = tasks.filter(t => 
      isSameDay(t.dueDate, today)
    ).length;
    
    const dueThisWeekCount = tasks.filter(t => 
      isWithinWeek(t.dueDate, today)
    ).length;
    
    return {
      total,
      byStatus,
      byPriority,
      completionRate,
      overdueCount,
      dueTodayCount,
      dueThisWeekCount
    };
  }
}));
```

---

## 五、提醒机制设计

### 5.1 提醒规则

```typescript
// 任务提醒服务
class TaskReminderService {
  // 每天定时检查任务状态
  async dailyCheck() {
    const today = new Date();
    
    // 获取所有进行中和待处理的任务
    const activeTasks = await taskService.getActiveTasks();
    
    for (const task of activeTasks) {
      // 检查是否延期
      if (task.dueDate < today) {
        await this.sendOverdueAlert(task);
      }
      
      // 检查是否即将到期（提前1天、3天提醒）
      const daysUntilDue = getDaysDiff(task.dueDate, today);
      if (daysUntilDue === 1) {
        await this.sendDueTomorrowAlert(task);
      } else if (daysUntilDue === 3) {
        await this.sendDueIn3DaysAlert(task);
      }
    }
  }
  
  async sendOverdueAlert(task: Task) {
    // 发送延期提醒给负责人
    for (const userId of task.assignees) {
      await notificationService.send(userId, {
        type: 'task_overdue',
        title: `任务延期提醒`,
        content: `任务「${task.title}」已延期，请尽快处理`,
        taskId: task.id
      });
    }
    
    // 同时通知活动负责人
    const event = await eventService.get(task.eventId);
    await notificationService.send(event.ownerId, {
      type: 'task_overdue',
      title: `任务延期提醒`,
      content: `任务「${task.title}」已延期，负责人: ${task.assignees.join(',')}`,
      taskId: task.id
    });
  }
}
```

---

## 六、测试要点

### 6.1 功能测试

| 测试场景 | 验证点 |
|----------|--------|
| 任务创建 | 各字段正确保存 |
| 任务状态更新 | 状态流转正确 |
| 子任务创建 | 子任务正确关联父任务 |
| 任务评论 | 评论正确保存和显示 |
| 进度统计 | 统计数据准确 |

---

> **模块负责人**：前后端开发工程师  
> **最后更新**：2025-01-15