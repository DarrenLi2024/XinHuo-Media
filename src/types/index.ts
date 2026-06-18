// 芯火会务管理系统 - 类型定义
export * from './report';
export * from './roster';

export * from './person';
export * from './forms';
export * from './sponsor';
import type { SponsorLevel } from './sponsor';
// ==================== 用户与权限 ====================

export type UserRole = 'super_admin' | 'event_manager' | 'executor' | 'staff' | 'supplier' | 'guest';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// ==================== 活动管理 ====================

export type EventType = 'annual_meeting' | 'product_launch' | 'seminar' | 'appreciation' | 'training' | 'other';
export type EventStatus = 'draft' | 'pending' | 'preparing' | 'ongoing' | 'completed' | 'archived';

export interface Event {
  id: string;
  name: string;
  type: EventType;
  status: EventStatus;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  address?: string;
  expected_guests: number;
  actual_guests: number;
  cover_image_url?: string;
  owner_id: string;
  primary_customer_id?: string;
  budget: number;
  actual_cost: number;
  settings: EventSettings;
  tags: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface EventSettings {
  require_check_in: boolean;
  allow_lottery: boolean;
  enable_seating: boolean;
  enable_script: boolean;
  enable_report: boolean;
}

// ==================== 任务管理 ====================

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  progress: number; // 0-100
  priority: TaskPriority;
  /** 负责人姓名 */
  assignee: string;
  /** 职责内容 - 该任务的具体工作描述 */
  responsibility: string;
  /** 任务开始时间 */
  start_date: string;
  /** 任务截止时间 */
  end_date: string;
  /** 交付物 - 任务完成后需要产出的具体成果 */
  deliverables: string;
  parent_task_id?: string;
  dependencies: string[]; // 依赖任务ID
  tags: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// ==================== 嘉宾管理 ====================

export type GuestStatus = 'invited' | 'confirmed' | 'checked_in' | 'absent';
export type GuestLevel = 'vip' | 'important' | 'normal';
export type GuestSource = 'manual' | 'import' | 'customer_contact' | 'registration' | 'legacy';
export type InviteStatus = 'draft' | 'invited' | 'confirmed' | 'declined' | 'waitlist';
export type GuestRole = 'speaker' | 'award_guest' | 'host' | 'attendee' | 'vip' | 'staff' | 'other';

export interface Guest {
  id: string;
  event_id: string;
  customer_id?: string;
  contact_id?: string;
  name: string;
  company?: string;
  position?: string;
  phone?: string;
  email?: string;
  level: GuestLevel;
  status: GuestStatus;
  source?: GuestSource;
  invite_status?: InviteStatus;
  guest_role?: GuestRole;
  profile_snapshot?: Record<string, unknown>;
  seat_id?: string;
  check_in_time?: string;
  notes?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// ==================== 客户主数据 ====================

export type CooperationIntent = 'high' | 'medium' | 'low' | 'none';
export type CustomerIntentLevel = 'strong' | 'medium' | 'weak' | 'none';
export type CustomerStatus = 'lead' | 'prospect' | 'active' | 'inactive' | 'archived';
export type Gender = 'male' | 'female' | 'other' | 'unknown';
export type EventCustomerRole = 'client' | 'host' | 'organizer' | 'co_organizer' | 'sponsor' | 'invited_org';
// SponsorLevel re-exported from ./sponsor

export interface EventSponsorProfile {
  level: SponsorLevel;
  level_name?: string;
  sponsorship_type?: 'cash' | 'in_kind' | 'service' | 'media' | 'mixed' | 'other';
  amount?: number;
  currency?: string;
  benefits?: string[];
  deliverables?: string[];
  logo_url?: string;
  booth_number?: string;
  booth_size?: string;
  speaking_slot?: string;
  ad_placements?: string[];
  material_requirements?: string[];
  contract_status?: 'draft' | 'sent' | 'signed' | 'paid' | 'completed' | 'cancelled';
  payment_status?: 'unpaid' | 'partial' | 'paid' | 'waived';
  invoice_title?: string;
  invoice_tax_no?: string;
  sponsor_contact_snapshot?: Record<string, unknown>;
  notes?: string;
}

export interface Customer {
  id: string;
  organization_name: string;
  company_name?: string;
  industry_category?: string;
  cooperation_intent: CooperationIntent;
  intent_level: CustomerIntentLevel;
  status: CustomerStatus;
  source?: string;
  address?: string;
  region?: string;
  website?: string;
  cooperation_count: number;
  last_cooperation_at?: string;
  owner_id?: string;
  tags: string[];
  notes?: string;
  custom_fields: Record<string, unknown>;
  contacts?: CustomerContact[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CustomerContact {
  id: string;
  customer_id: string;
  name: string;
  company_name?: string;
  position?: string;
  native_place?: string;
  gender?: Gender;
  address?: string;
  phone?: string;
  email?: string;
  wechat_qr_url?: string;
  wechat_id?: string;
  qq?: string;
  avatar_url?: string;
  motto?: string;
  is_primary: boolean;
  relationship_role?: string;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EventCustomer {
  id: string;
  event_id: string;
  customer_id: string;
  contact_id?: string;
  role: EventCustomerRole;
  is_primary: boolean;
  sponsor_level?: SponsorLevel;
  sponsor_profile?: EventSponsorProfile;
  notes?: string;
  customers?: Customer;
  customer_contacts?: CustomerContact;
  created_at: string;
  updated_at: string;
}

// ==================== 座位管理 ====================

export type SeatStatus = 'available' | 'occupied' | 'reserved' | 'blocked';

export interface Seat {
  id: string;
  event_id: string;
  venue_id: string;
  row: number;
  column: number;
  seat_number: string;
  status: SeatStatus;
  guest_id?: string;
  section?: string;
  x: number; // Canvas 坐标
  y: number;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: string;
  name: string;
  layout_type: 'rectangle' | 'round' | 'custom';
  rows: number;
  columns: number;
  settings: VenueSettings;
  created_at: string;
  updated_at: string;
}

export interface VenueSettings {
  stage_position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  seat_spacing: number;
  row_spacing: number;
  sections: VenueSection[];
}

export interface VenueSection {
  name: string;
  color: string;
  rows: number[];
  vip: boolean;
}

// ==================== 流程台本 ====================

export type SegmentType = 'speech' | 'performance' | 'video' | 'award' | 'lottery' | 'break' | 'interactive' | 'other';
export type SegmentStatus = 'pending' | 'ready' | 'ongoing' | 'completed' | 'skipped';

export interface Script {
  id: string;
  event_id: string;
  name: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  total_duration: number; // 分钟
  segments: ScriptSegment[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ScriptSegment {
  id: string;
  script_id: string;
  order: number;
  type: SegmentType;
  name: string;
  description?: string;
  duration: number; // 分钟
  start_time?: string;
  end_time?: string;
  status: SegmentStatus;
  speakers: string[];
  content?: string;
  notes?: string;
  materials: string[]; // 物料ID
  created_at: string;
  updated_at: string;
}

// ==================== 签到管理 ====================

export type CheckInMethod = 'qr_code' | 'face' | 'manual' | 'nfc';

export interface CheckIn {
  id: string;
  event_id: string;
  guest_id: string;
  method: CheckInMethod;
  check_in_time: string;
  location?: string;
  device_info?: string;
  operator_id?: string;
  created_at: string;
}

// ==================== 抽奖管理 ====================

export type PrizeType = 'physical' | 'cash' | 'voucher' | 'other';
export type LotteryStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface Prize {
  id: string;
  event_id: string;
  name: string;
  type: PrizeType;
  value: number;
  quantity: number;
  remaining: number;
  image_url?: string;
  description?: string;
  level: number; // 奖品等级 1-特等奖, 2-一等奖, 3-二等奖...
  sponsor?: string;
  created_at: string;
  updated_at: string;
}

export interface LotteryRecord {
  id: string;
  event_id: string;
  prize_id: string;
  guest_id: string;
  guest_name: string;
  prize_name: string;
  prize_level: number;
  lottery_time: string;
  claimed: boolean;
  claim_time?: string;
  created_at: string;
}

// ==================== 复盘报告 ====================

export type ReportStatus = 'draft' | 'published' | 'archived';

export interface Report {
  id: string;
  event_id: string;
  title: string;
  status: ReportStatus;
  summary: string;
  statistics: ReportStatistics;
  highlights: string[];
  issues: ReportIssue[];
  recommendations: string[];
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ReportStatistics {
  total_guests: number;
  checked_in_guests: number;
  check_in_rate: number;
  vip_attendance: number;
  lottery_participants: number;
  prize_claimed: number;
  task_completed: number;
  total_cost: number;
  budget_variance: number;
}

export interface ReportIssue {
  id: string;
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

// ==================== 供应商管理 ====================

export type SupplierCategory = 'venue' | 'equipment' | 'catering' | 'printing' | 'decoration' | 'photography' | 'other';
export type SupplierStatus = 'active' | 'inactive' | 'blacklisted';

export interface Supplier {
  id: string;
  name: string;
  category: SupplierCategory;
  contact_person: string;
  phone: string;
  email?: string;
  address?: string;
  status: SupplierStatus;
  rating: number; // 1-5
  cooperation_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierContact {
  id: string;
  supplier_id: string;
  name: string;
  company_name?: string;
  position?: string;
  native_place?: string;
  gender?: Gender;
  address?: string;
  phone?: string;
  email?: string;
  wechat_qr_url?: string;
  wechat_id?: string;
  qq?: string;
  avatar_url?: string;
  motto?: string;
  is_primary: boolean;
  relationship_role?: string;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SupplierEventLink {
  id: string;
  supplier_id: string;
  event_id: string;
  contact_id?: string;
  service_scope?: string;
  contract_amount?: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierReview {
  id: string;
  supplier_id: string;
  event_id?: string;
  rating: number;
  quality_score?: number;
  delivery_score?: number;
  communication_score?: number;
  content?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface MaterialOrder {
  id: string;
  event_id: string;
  supplier_id: string;
  material_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'completed' | 'cancelled';
  delivery_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// ==================== API 响应类型 ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==================== Dashboard 统计 ====================

export interface DashboardStats {
  total_events: number;
  ongoing_events: number;
  completed_events: number;
  total_guests: number;
  upcoming_events: Event[];
  recent_tasks: Task[];
}

// ==================== 签到嘉宾（扩展） ====================

export interface CheckinGuest {
  id: string;
  name: string;
  phone?: string | null;
  organization?: string | null;
  guestType: string;
  tableNumber?: string | null;
  qrCode: string;
  checkInStatus: number; // 0=未签到, 1=已签到
  checkInTime?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckinStats {
  total: number;
  checkedIn: number;
  notCheckedIn: number;
  checkInRate: number;
  byType: Record<string, number>;
  byTypeChecked: Record<string, number>;
}

export interface CheckInLog {
  id: string;
  guestId: string;
  guestName: string;
  organization?: string | null;
  guestType: string;
  tableNumber?: string | null;
  checkInTime: string;
  terminalId: string;
  operator: string;
}

// ==================== 抽奖扩展 ====================

export interface LotteryPrize {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  quantity: number;
  remaining: number;
  level: number;
  draw_count: number;
  allow_repeat: boolean;
  value?: number;
  sponsor?: string;
  image_url?: string;
  order: number;
}

export interface LotteryWinner {
  id: string;
  event_id: string;
  prize_id: string;
  guest_id: string;
  win_time: string;
  claimed: boolean;
  abandoned?: boolean;
}

export interface LockedWinner {
  id: string;
  event_id: string;
  guest_id?: string;
  name: string;
  company?: string;
  prize_ids: string[];
  is_blacklist: boolean;
  used: boolean;
  effect_time_start?: string;
  effect_time_end?: string;
}


export interface Attendee {
  id: string;
  name: string;
  company: string;
  phone?: string;
  tags?: string[];
}

export interface LotteryPrize {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  quantity: number;
  remaining: number;
  level: number;
  draw_count: number;
  allow_repeat: boolean;
  excludeIds?: string[];
  value?: number;
  sponsor?: string;
  image_url?: string;
  order: number;
}

export type DrawMode = 'random' | 'weighted';

export interface DrawResult {
  prize: LotteryPrize;
  winners: Attendee[];
  drawTime: Date;
  drawMode: DrawMode;
}

export interface LockedWinner {
  id: string;
  event_id: string;
  guest_id?: string;
  name: string;
  company?: string;
  prize_ids: string[];
  is_blacklist: boolean;
  used: boolean;
  effect_time_start?: string;
  effect_time_end?: string;
}

export interface DrawRecord {
  id: string;
  event_id: string;
  prize_id: string;
  attendee_ids: string[];
  draw_time: string;
  draw_mode: string;
  operator?: string;
}

export interface EventInfo {
  name: string;
  theme?: string;
  organizer?: string;
  date?: string;
  logoUrl?: string;
  footerInfo1?: string;
  footerInfo2?: string;
}

export interface SystemConfig {
  theme: string;
  bgMusicVolume: number;
  effectVolume: number;
  enableBgMusic: boolean;
  enableEffects: boolean;
}

export type Theme = 'tech-blue' | 'golden' | 'red-gold' | string;


// ==================== 排座系统类型（来自 seating 子系统） ====================

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
