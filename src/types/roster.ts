// 名单管理统一类型 — 执行小组 / 嘉宾 / 赞助商 / 参会人 四大名单视图

import type { PersonRole } from './person';
import type { SponsorLevel, SponsorBenefit } from './sponsor';

// ==================== 执行小组 ====================

export type ExecRole =
  | 'director'
  | 'planner'
  | 'logistics'
  | 'site_manager'
  | 'pr_manager'
  | 'attendee_manager'
  | 'investment_manager'
  | 'checkin_manager'
  | 'agency_liaison'
  | 'venue_liaison'
  | 'stage_manager'
  | 'finance'
  | 'mc'
  | 'custom';

export const EXEC_ROLE_LABELS: Record<ExecRole, string> = {
  director: '总导演',
  planner: '总策划',
  logistics: '后勤负责人',
  site_manager: '现场负责人',
  pr_manager: '宣传负责人',
  attendee_manager: '参会名单负责人',
  investment_manager: '招商负责人',
  checkin_manager: '签到负责人',
  agency_liaison: '策划公司对接人',
  venue_liaison: '活动场地对接人',
  stage_manager: '舞台控台负责人',
  finance: '财务负责人',
  mc: '主持人',
  custom: '自定义角色',
};

export interface ExecTeamMember {
  id: string;
  event_id: string;
  role: ExecRole;
  role_label?: string;
  name: string;
  phone?: string;
  wechat_id?: string;
  email?: string;
  responsibility: string;  // 职责分工
  notes?: string;
  order: number;
  created_at: string;
  updated_at: string;
}

// ==================== 嘉宾 ====================

export type GuestType = 'forum_guest' | 'speaker' | 'award_guest' | 'special_guest' | 'leader' | 'roundtable_guest' | 'mc' | 'custom';

export const GUEST_TYPE_LABELS: Record<GuestType, string> = {
  forum_guest: '论坛嘉宾',
  speaker: '演讲嘉宾',
  award_guest: '颁奖嘉宾',
  special_guest: '特邀嘉宾',
  leader: '领导贵宾',
  roundtable_guest: '圆桌嘉宾',
  mc: '主持人',
  custom: '自定义',
};

export type GuestStatus = 'pending' | 'invited' | 'confirmed' | 'declined' | 'attended' | 'absent';

export const GUEST_STATUS_LABELS: Record<GuestStatus, string> = {
  pending: '待邀请',
  invited: '已邀请',
  confirmed: '已确认',
  declined: '已婉拒',
  attended: '已出席',
  absent: '未出席',
};

export interface GuestEntry {
  id: string;
  event_id: string;
  name: string;
  guest_type: GuestType;
  guest_type_label?: string;
  title: string;           // 职称/职务
  company: string;
  avatar_url?: string;      // 形象照片
  bio: string;              // 背景介绍
  speech_topic?: string;    // 演讲主题
  segment?: string;         // 出场环节
  need_reception: boolean;  // 是否安排接待
  need_seat: boolean;       // 是否安排座位
  seat_info?: string;
  need_dinner: boolean;     // 是否参加晚宴
  status: GuestStatus;
  phone?: string;
  wechat_id?: string;
  email?: string;
  notes?: string;
  order: number;
  created_at: string;
  updated_at: string;
}

// ==================== 赞助商名单视图 (引用已有 Sponsor 数据) ====================

export interface SponsorRosterEntry {
  id: string;
  event_id: string;
  name: string;             // 赞助商名称
  level: SponsorLevel;
  level_label: string;
  amount: number;
  contact_name: string;
  contact_phone: string;
  contact_wechat: string;
  contact_email: string;
  logo_url?: string;
  benefits: SponsorBenefit[];
  booth_number?: string;
  contract_status: string;
  payment_status: string;
  guest_slots: number;      // 嘉宾名额
  vip_seats: number;        // VIP座位数
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ==================== 参会人 ====================

export type AttendeeSource = 'form' | 'import' | 'manual' | 'customer_link' | 'sponsor_link';

export const ATTENDEE_SOURCE_LABELS: Record<AttendeeSource, string> = {
  form: '表单回收',
  import: '批量导入',
  manual: '手动添加',
  customer_link: '客户关联',
  sponsor_link: '赞助商关联',
};

export interface AttendeeEntry {
  id: string;
  event_id: string;
  name: string;
  phone?: string;
  wechat_id?: string;
  email?: string;
  company?: string;
  position?: string;
  industry?: string;
  city?: string;
  source: AttendeeSource;
  review_status: 'pending' | 'approved' | 'rejected';
  is_member: boolean;        // 是否商会会员
  need_invoice: boolean;
  attend_dinner: boolean;
  tags: string[];            // 灵活标签
  notes?: string;
  checkin_status: 'pending' | 'checked_in';
  checkin_time?: string;
  lottery_eligible: boolean;
  seated: boolean;
  table_id?: string;
  seat_number?: string;
  created_at: string;
  updated_at: string;
}

// ==================== 名单统计 ====================

export interface RosterStats {
  total: number;
  exec_team: number;
  guests: number;
  sponsors: number;
  attendees: number;
  attendee_approved: number;
  attendee_checked_in: number;
  guest_confirmed: number;
  sponsor_total_amount: number;
}
