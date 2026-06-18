# 复盘报告管理 - 功能模块详细设计

> **模块编号**：M06  
> **优先级**：P1  
> **负责人**：前后端开发工程师  
> **创建日期**：2025-01-15

---

## 一、模块概述

### 1.1 功能定位

复盘报告管理系统用于活动结束后生成活动复盘报告，支持 AI 自动生成和人工编辑，帮助团队总结经验教训，优化未来活动策划和执行流程。

### 1.2 核心价值

| 价值点 | 描述 |
|--------|------|
| **数据驱动** | 自动收集活动数据，生成客观报告 |
| **AI辅助** | AI分析问题，提供优化建议 |
| **知识沉淀** | 形成可复用的经验知识库 |
| **持续改进** | 为下次活动提供改进参考 |

---

## 二、功能清单

### 2.1 报告生成功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S06-01 | AI自动生成 | AI自动分析数据生成报告 | P0 |
| S06-02 | 手动创建报告 | 手动创建空白报告 | P0 |
| S06-03 | 报告模板选择 | 选择预设报告模板 | P1 |
| S06-04 | 数据自动采集 | 自动采集活动各项数据 | P0 |

### 2.2 报告编辑功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S06-05 | 内容编辑 | 编辑报告各章节内容 | P0 |
| S06-06 | 问题录入 | 录入活动中发现的问题 | P0 |
| S06-07 | 改进建议编写 | 编写改进建议 | P0 |
| S06-08 | 经验教训总结 | 总结活动经验教训 | P0 |
| S06-09 | 图片附件上传 | 上传活动现场图片 | P1 |
| S06-10 | 报告定稿 | 定稿后不可编辑 | P1 |

### 2.3 数据分析功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S06-11 | 签到数据分析 | 分析签到数据、签到率、时间分布 | P0 |
| S06-12 | 任务完成分析 | 分析任务完成情况 | P0 |
| S06-13 | 预算执行分析 | 分析预算执行情况 | P0 |
| S06-14 | 供应商评估 | 分析供应商服务质量 | P1 |
| S06-15 | 抽奖数据分析 | 分析抽奖数据 | P1 |
| S06-16 | 台本执行分析 | 分析台本执行偏差 | P0 |

### 2.4 问题管理功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S06-17 | 问题分类 | 按类型分类问题 | P0 |
| S06-18 | 严重程度标注 | 标注问题严重程度 | P0 |
| S06-19 | 问题归因分析 | 分析问题原因 | P0 |
| S06-20 | 解决方案建议 | 提供问题解决方案 | P0 |
| S06-21 | 防范措施建议 | 提供防范措施建议 | P0 |

### 2.5 报告导出分享功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S06-22 | PDF导出 | 导出PDF格式报告 | P0 |
| S06-23 | Word导出 | 导出Word格式报告 | P1 |
| S06-24 | 报告分享 | 分享报告链接给团队 | P1 |
| S06-25 | 报告归档 | 归档历史报告 | P0 |

---

## 三、报告结构设计

### 3.1 报告章节结构

```
复盘报告结构
│
├── 1. 活动概况
│   ├── 活动基本信息（名称、时间、地点、参与人数）
│   ├── 活动目标达成情况
│   └── 整体评价（成功/一般/需改进）
│
├── 2. 数据统计
│   ├── 签到统计（签到率、VIP签到率、时间分布）
│   ├── 任务完成统计（完成率、延期情况）
│   ├── 预算执行统计（预算使用率、超支情况）
│   ├── 供应商服务统计（各供应商评分）
│   └── 其他数据统计
│
├── 3. 活动亮点
│   ├── 亮点1（描述、效果、可复用性）
│   ├── 亮点2
│   └── ...
│
├── 4. 问题与不足
│   ├── 问题1
│   │   ├── 问题描述
│   │   ├── 影响
│   │   ├── 原因分析
│   │   ├── 解决方案
│   │   └── 防范措施
│   ├── 问题2
│   └── ...
│
├── 5. 改进建议
│   ├── 下次活动改进建议1
│   ├── 下次活动改进建议2
│   └── ...
│
├── 6. 经验教训
│   ├── 经验1（可复用的成功经验）
│   ├── 教训1（需避免的失败经验）
│   └── ...
│
├── 7. 附录
│   ├── 活动照片
│   ├── 详细数据表
│   └── 相关文档
│
└── 8. 总结与展望
    ├── 活动整体总结
    └── 未来活动展望
```

---

## 四、界面设计

### 4.1 报告编辑界面

```
┌─────────────────────────────────────────────────────────────────────┐
│  复盘报告编辑                          [活动] [AI生成] [导出] [定稿] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  报告信息                                                    │   │
│  │  名称: 2025年度盛典复盘报告    类型: 活动复盘    状态: 编辑   │   │
│  │  活动: 2025年度盛典           创建时间: 2025-02-16          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  目录导航                                                      │ │
│  │  1. 活动概况                                                    │ │
│  │  2. 数据统计                                                    │ │
│  │  3. 活动亮点                                                    │ │
│  │  4. 问题与不足                                                  │ │
│  │  5. 改进建议                                                    │ │
│  │  6. 经验教训                                                    │ │
│  │  7. 附录                                                        │ │
│  │  8. 总结与展望                                                  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  当前章节: 数据统计                                             │ │
│  │                                                             │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 签到统计                                                  │ │ │
│  │  │                                                         │ │ │
│  │  │ 签到率: 85%  VIP签到率: 90%  实到人数: 425/500          │ │ │
│  │  │                                                         │ │ │
│  │  │ 时间分布:                                               │ │ │
│  │  │ 09:00-09:15: 150人 (35%)                               │ │ │
│  │  │ 09:15-09:30: 100人 (24%)                               │ │ │
│  │  │ 09:30-10:00: 175人 (41%)                               │ │ │
│  │  │                                                         │ │ │
│  │  │ 分析: 签到率高于预期，VIP嘉宾到场情况良好...             │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 任务完成统计                                              │ │ │
│  │  │                                                         │ │ │
│  │  │ 完成率: 95%  延期任务: 2个  未完成任务: 0个              │ │ │
│  │  │                                                         │ │ │
│  │  │ 延期任务详情:                                           │ │ │
│  │  │ 1. 设计活动主视觉 - 延期1天                             │ │ │
│  │  │ 2. 物料采购验收 - 延期2小时                             │ │ │
│  │  │                                                         │ │ │
│  │  │ 分析: 任务整体完成情况良好，延期任务影响较小...           │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │  [编辑内容] [AI生成分析]                                      │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  问题录入                                                      │ │
│  │  [+ 新增问题]                                                  │ │
│  │                                                             │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 问题 #1                                                  │ │ │
│  │  │ 类型: 设备  严重程度: 中                                 │ │ │
│  │  │ 描述: 主会场音响出现杂音                                 │ │ │
│  │  │ 影响: 影响演讲效果，部分嘉宾反映听不清                   │ │ │
│  │  │ 原因: 设备老化，音频线接触不良                           │ │ │
│  │  │ 解决: 临时更换备用音响                                   │ │ │
│  │  │ 防范: 活动前进行全面设备检查                             │ │ │
│  │  │ [编辑] [删除]                                            │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 五、AI 自动生成报告

### 5.1 AI 报告生成流程

```typescript
class ReportGenerator {
  async generate(eventId: string): Promise<Report> {
    // Step 1: 收集活动数据
    const eventData = await this.collectEventData(eventId);
    
    // Step 2: 分析各项数据
    const analysis = await this.analyzeData(eventData);
    
    // Step 3: AI 生成报告内容
    const content = await this.generateContent(analysis);
    
    // Step 4: 生成报告结构
    const report = await this.buildReport(eventId, content);
    
    return report;
  }
  
  async collectEventData(eventId: string): Promise<EventData> {
    // 收集所有相关数据
    return {
      eventInfo: await this.getEventInfo(eventId),
      checkInData: await this.getCheckInData(eventId),
      taskData: await this.getTaskData(eventId),
      supplierData: await this.getSupplierData(eventId),
      lotteryData: await this.getLotteryData(eventId),
      scriptData: await this.getScriptData(eventId),
      guestFeedback: await this.getGuestFeedback(eventId)
    };
  }
  
  async analyzeData(data: EventData): Promise<AnalysisResult> {
    // 数据分析
    return {
      checkInAnalysis: this.analyzeCheckIn(data.checkInData),
      taskAnalysis: this.analyzeTasks(data.taskData),
      supplierAnalysis: this.analyzeSuppliers(data.supplierData),
      scriptAnalysis: this.analyzeScriptExecution(data.scriptData),
      issues: this.identifyIssues(data),
      highlights: this.identifyHighlights(data)
    };
  }
  
  async generateContent(analysis: AnalysisResult): Promise<ReportContent> {
    // 使用 LLM 生成报告内容
    const prompt = `
      活动数据分析结果：
      ${JSON.stringify(analysis, null, 2)}
      
      请根据以上数据生成一份活动复盘报告，包含：
      1. 活动概况总结
      2. 数据分析解读
      3. 活动亮点提炼
      4. 问题与不足分析
      5. 改进建议
      6. 经验教训总结
      
      请使用专业、客观的语言，突出关键数据和核心结论。
    `;
    
    const response = await llmClient.chat(prompt);
    
    return this.parseReportContent(response);
  }
  
  analyzeCheckIn(data: CheckInData): CheckInAnalysis {
    const totalGuests = data.totalGuests;
    const checkedIn = data.checkedIn;
    const checkInRate = (checkedIn / totalGuests) * 100;
    
    // 时间分布分析
    const peakTime = this.findPeakCheckInTime(data.timeDistribution);
    const lateGuests = data.guests.filter(g => 
      g.checkInTime && g.checkInTime > data.expectedStartTime
    );
    
    // VIP分析
    const vipTotal = data.vipGuests.length;
    const vipCheckedIn = data.vipGuests.filter(g => g.checkInStatus).length;
    
    return {
      checkInRate,
      vipCheckInRate: (vipCheckedIn / vipTotal) * 100,
      peakTime,
      lateGuestsCount: lateGuests.length,
      evaluation: this.evaluateCheckIn(checkInRate)
    };
  }
  
  evaluateCheckIn(rate: number): string {
    if (rate >= 90) return '签到情况优秀，嘉宾到场率超出预期';
    if (rate >= 80) return '签到情况良好，基本达到预期目标';
    if (rate >= 70) return '签到情况一般，需要加强嘉宾邀约确认';
    return '签到情况不佳，需要深入分析原因';
  }
  
  identifyIssues(data: EventData): Issue[] {
    const issues: Issue[] = [];
    
    // 检查签到问题
    if (data.checkInData.checkInRate < 80) {
      issues.push({
        category: 'attendance',
        severity: 'medium',
        description: `签到率仅${data.checkInData.checkInRate}%，低于预期`,
        cause: '嘉宾邀约确认不到位，或活动时间安排不便',
        solution: '加强嘉宾邀约确认流程，提前发送活动提醒'
      });
    }
    
    // 检查任务延期问题
    const delayedTasks = data.taskData.tasks.filter(t => t.status === 'delayed');
    if (delayedTasks.length > 0) {
      issues.push({
        category: 'coordination',
        severity: delayedTasks.length > 3 ? 'high' : 'medium',
        description: `${delayedTasks.length}个任务延期完成`,
        cause: '任务分工不明确或执行人员配合不足',
        solution: '优化任务分工，加强进度跟踪和预警机制'
      });
    }
    
    // 检查设备问题
    // ... 更多问题识别逻辑
    
    return issues;
  }
  
  identifyHighlights(data: EventData): Highlight[] {
    const highlights: Highlight[] = [];
    
    // 签到亮点
    if (data.checkInData.vipCheckInRate >= 95) {
      highlights.push({
        description: 'VIP嘉宾到场率高达95%，重要嘉宾参与度好',
        effect: '提升了活动档次，增强了行业影响力',
        reusable: true
      });
    }
    
    // ... 更多亮点识别逻辑
    
    return highlights;
  }
}
```

---

## 六、状态管理

```typescript
// Zustand 状态管理
import { create } from 'zustand';

interface ReportState {
  report: Report | null;
  sections: ReportSection[];
  issues: Issue[];
  highlights: Highlight[];
  
  // UI状态
  editingSectionId: string | null;
  
  // Actions
  createReport: (eventId: string, type: string) => void;
  generateByAI: (eventId: string) => Promise<void>;
  updateSection: (sectionId: string, content: any) => void;
  addIssue: (issue: Issue) => void;
  updateIssue: (issueId: string, data: Partial<Issue>) => void;
  deleteIssue: (issueId: string) => void;
  addHighlight: (highlight: Highlight) => void;
  deleteHighlight: (highlightId: string) => void;
  uploadAttachment: (file: File) => void;
  finalizeReport: () => void;
  exportPDF: () => void;
}

const useReportStore = create<ReportState>((set, get) => ({
  report: null,
  sections: [],
  issues: [],
  highlights: [],
  editingSectionId: null,
  
  createReport: (eventId, type) => {
    set({
      report: {
        id: uuid(),
        eventId,
        title: '',
        type,
        status: 'draft',
        content: {},
        createdAt: new Date()
      },
      sections: defaultSections
    });
  },
  
  generateByAI: async (eventId) => {
    const generator = new ReportGenerator();
    const report = await generator.generate(eventId);
    
    set({
      report: {
        ...report,
        generatedByAI: true
      },
      sections: report.sections,
      issues: report.issues,
      highlights: report.highlights
    });
  },
  
  updateSection: (sectionId, content) => {
    set({
      sections: get().sections.map(s => 
        s.id === sectionId ? { ...s, content } : s
      )
    });
  },
  
  addIssue: (issue) => {
    set({ issues: [...get().issues, issue] });
  },
  
  updateIssue: (issueId, data) => {
    set({
      issues: get().issues.map(i => 
        i.id === issueId ? { ...i, ...data } : i
      )
    });
  },
  
  deleteIssue: (issueId) => {
    set({ issues: get().issues.filter(i => i.id !== issueId) });
  },
  
  finalizeReport: () => {
    const { report, sections, issues, highlights } = get();
    
    set({
      report: {
        ...report!,
        status: 'published',
        publishedAt: new Date(),
        content: {
          sections,
          issues,
          highlights
        }
      }
    });
    
    // 保存到数据库
    saveReport(get().report!);
  },
  
  exportPDF: () => {
    exportService.exportReportPDF(get().report!);
  }
}));
```

---

## 七、测试要点

### 8.1 功能测试

| 测试场景 | 验证点 |
|----------|--------|
| AI生成报告 | 内容准确、逻辑清晰、格式规范 |
| 手动编辑报告 | 各章节编辑保存正确 |
| 问题录入 | 问题分类、严重程度正确 |
| 导出PDF | 格式正确、内容完整 |

### 8.2 数据准确性测试

| 测试场景 | 验证点 |
|----------|--------|
| 签到数据统计 | 统计数据与实际数据一致 |
| 任务完成统计 | 任务状态计算正确 |
| 问题识别 | AI正确识别关键问题 |

---

> **模块负责人**：前后端开发工程师  
> **最后更新**：2025-01-15