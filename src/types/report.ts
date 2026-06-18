// 复盘报告深度类型定义

// ====== 报告元数据 ======

export type ReportStatus = 'draft' | 'published' | 'archived';

export interface ReportMeta {
  id: string;
  event_id: string;
  title: string;
  version: number;
  status: ReportStatus;
  authors: string[];          // 编写人
  reviewed_by?: string;       // 审核人
  created_at: string;
  updated_at: string;
  published_at?: string;
}

// ====== 核心数据面板 ======

export interface AttendanceStats {
  registered: number;          // 报名人数
  attended: number;            // 实到人数
  rate: number;                // 签到率
  vip_count: number;           // VIP出席
  guest_confirmed: number;     // 嘉宾确认
  guest_attended: number;      // 嘉宾出席
  no_show: number;             // 未出席
  by_source: Record<string, number>; // 按来源渠道
}

export interface TaskStats {
  total: number;
  completed: number;
  in_progress: number;
  delayed: number;
  completion_rate: number;     // 完成率
  on_time_rate: number;        // 按期完成率
  avg_delay_days: number;      // 平均延期天数
}

export interface SponsorStats {
  count: number;
  total_amount: number;
  paid_amount: number;
  paid_rate: number;           // 收款率
  by_level: Record<string, { count: number; amount: number }>;
  benefits_fulfilled: number;  // 权益已履约数
  benefits_total: number;      // 权益总数
}

export interface BudgetStats {
  budget_total: number;
  actual_total: number;
  variance: number;            // 差异额
  variance_rate: number;       // 差异率
  by_category: Record<string, { budget: number; actual: number }>;
}

export interface LotteryStats {
  participants: number;        // 抽奖参与人数
  prizes_count: number;        // 奖品总数
  prizes_claimed: number;      // 已领取
  claim_rate: number;
}

export interface SupplierStats {
  count: number;
  avg_rating: number;
  ratings: { name: string; rating: number; category: string }[];
}

// ====== 定性分析维度 ======

export interface HighlightItem {
  id: string;
  category: 'execution' | 'guest' | 'sponsor' | 'content' | 'team' | 'innovation' | 'other';
  description: string;
  impact: 'high' | 'medium' | 'low';  // 影响力
  evidence?: string;                   // 佐证
}

export interface IssueItem {
  id: string;
  category: 'planning' | 'execution' | 'communication' | 'technical' | 'vendor' | 'budget' | 'other';
  description: string;
  severity: 'critical' | 'major' | 'minor';
  root_cause?: string;               // 根因分析
  occurred_at?: string;              // 发生环节
  resolved: boolean;
  resolution?: string;               // 解决措施
  owner?: string;                     // 责任人
}

export interface Recommendation {
  id: string;
  category: 'process' | 'tool' | 'team' | 'vendor' | 'budget' | 'format' | 'other';
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: 'small' | 'medium' | 'large';  // 实施成本
  expected_impact: string;                // 预期效果
  assigned_to?: string;
  target_date?: string;
}

// ====== 附件与素材 ======

export interface ReportAttachment {
  id: string;
  type: 'image' | 'video' | 'document' | 'spreadsheet' | 'link';
  name: string;
  url: string;
  description?: string;
  uploaded_at: string;
}

// ====== 完整报告 ======

export interface FullReport {
  meta: ReportMeta;
  summary: string;                     // 活动总述
  attendance: AttendanceStats;
  tasks: TaskStats;
  sponsors: SponsorStats;
  budget: BudgetStats;
  lottery: LotteryStats;
  suppliers: SupplierStats;
  highlights: HighlightItem[];
  issues: IssueItem[];
  recommendations: Recommendation[];
  attachments: ReportAttachment[];
  ai_analysis?: string;                // AI 深度分析
  next_event_suggestions?: string;     // 下届优化建议
}
