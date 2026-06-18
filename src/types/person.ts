// 统一人员主数据类型定义 - 平台方案 v2.0
// 所有模块(签到/排座/抽奖/嘉宾/参会人)共享同一套 Person 数据

export type PersonRole =
  | 'attendee'
  | 'member'
  | 'sponsor_rep'
  | 'forum_guest'
  | 'speaker'
  | 'special_guest'
  | 'host'
  | 'organizer'
  | 'co_organizer'
  | 'media'
  | 'staff'
  | 'supplier_staff'
  | 'vip'
  | 'leader';

export const PERSON_ROLE_LABELS: Record<PersonRole, string> = {
  attendee: '普通参会人',
  member: '商会会员',
  sponsor_rep: '赞助商代表',
  forum_guest: '论坛嘉宾',
  speaker: '演讲嘉宾',
  special_guest: '特邀嘉宾',
  host: '主办方人员',
  organizer: '主办方人员',
  co_organizer: '协办方人员',
  media: '媒体人员',
  staff: '工作人员',
  supplier_staff: '供应商人员',
  vip: 'VIP',
  leader: '领导嘉宾',
};

export type PersonSource = 'form' | 'manual' | 'import' | 'customer_link' | 'legacy';

export type PersonInviteStatus = 'draft' | 'invited' | 'confirmed' | 'declined' | 'waitlist';

export type PersonCheckinStatus = 'pending' | 'checked_in';

export interface Person {
  id: string;
  event_id: string;

  // 基础信息
  name: string;
  phone?: string | null;
  wechat_id?: string | null;
  email?: string | null;

  // 公司信息
  company?: string | null;
  position?: string | null;
  industry?: string | null;
  city?: string | null;

  // 身份标签 (多标签, 核心设计)
  roles: PersonRole[];

  // 来源与状态
  source: PersonSource;
  invite_status: PersonInviteStatus;
  review_status: 'pending' | 'approved' | 'rejected';

  // 签到
  checkin_status: PersonCheckinStatus;
  checkin_time?: string | null;

  // 抽奖
  lottery_eligible: boolean;

  // 座位
  seated: boolean;
  table_id?: string | null;
  seat_number?: string | null;

  // 嘉宾专属 (有 speaker/forum_guest/special_guest 时启用)
  guest_type?: PersonRole | null;
  guest_bio?: string | null;
  guest_avatar_url?: string | null;
  guest_topic?: string | null;
  guest_segment?: string | null;
  guest_confirmed?: boolean | null;
  guest_reception?: boolean | null;
  guest_dinner?: boolean | null;

  // 客户关联
  customer_id?: string | null;
  contact_id?: string | null;

  // 灵活标签
  tags: string[];

  // 备注
  notes?: string | null;

  // 时间戳
  created_at: string;
  updated_at: string;
}

// 表单提交时的新增人员输入
export interface PersonCreateInput {
  event_id: string;
  name: string;
  phone?: string | null;
  wechat_id?: string | null;
  email?: string | null;
  company?: string | null;
  position?: string | null;
  industry?: string | null;
  city?: string | null;
  roles: PersonRole[];
  source: PersonSource;
  tags?: string[];
  notes?: string | null;
}

// 批量导入行
export interface PersonImportRow {
  name: string;
  phone?: string;
  wechat_id?: string;
  email?: string;
  company?: string;
  position?: string;
  industry?: string;
  city?: string;
  roles?: string;
  tags?: string;
  notes?: string;
  [key: string]: string | undefined;
}

// 去重结果
export interface DedupResult {
  isDuplicate: boolean;
  matchedPerson?: Person;
  matchReason?: 'phone' | 'name_company' | 'wechat' | 'email';
  confidence: 'high' | 'medium' | 'low';
}
