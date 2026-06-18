import type { AuthContext } from '@/lib/api/security';

export type DemoEventSettings = {
  require_check_in: boolean;
  allow_lottery: boolean;
  enable_seating: boolean;
  enable_script: boolean;
  enable_report: boolean;
};

export type DemoEvent = {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  address: string;
  expected_guests: number;
  actual_guests: number;
  owner_id: string;
  primary_customer_id?: string;
  budget: number;
  actual_cost: number;
  settings: DemoEventSettings;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type DemoTask = {
  id: string;
  event_id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  priority: string;
  assignee: string;
  responsibility: string;
  start_date: string;
  end_date: string;
  deliverables: string;
  created_at: string;
  updated_at: string;
};

export type DemoGuest = {
  id: string;
  event_id: string;
  customer_id?: string;
  contact_id?: string;
  name: string;
  company: string;
  position: string;
  phone?: string;
  email?: string;
  level: string;
  source: string;
  invite_status: string;
  guest_role: string;
  profile_snapshot: Record<string, unknown>;
  seat_zone_id?: string;
  seat_number?: string;
  check_in_status: string;
  check_in_time?: string;
  created_at: string;
  updated_at: string;
};

export type DemoCustomer = {
  id: string;
  organization_name: string;
  company_name: string;
  industry_category: string;
  cooperation_intent: string;
  intent_level: string;
  status: string;
  source: string;
  address: string;
  region: string;
  website: string;
  cooperation_count: number;
  last_cooperation_at?: string;
  owner_id?: string;
  tags: string[];
  notes: string;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by?: string;
};

export type DemoCustomerContact = {
  id: string;
  customer_id: string;
  name: string;
  company_name: string;
  position: string;
  native_place?: string;
  gender?: string;
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
};

export type DemoEventCustomer = {
  id: string;
  event_id: string;
  customer_id: string;
  contact_id?: string;
  role: string;
  is_primary: boolean;
  sponsor_level?: string;
  sponsor_profile?: Record<string, unknown>;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type DemoSupplier = {
  id: string;
  name: string;
  category: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  rating: number;
  cooperation_count: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type DemoSupplierContact = {
  id: string;
  supplier_id: string;
  name: string;
  company_name: string;
  position: string;
  native_place?: string;
  gender?: string;
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
};

export type DemoSupplierEventLink = {
  id: string;
  supplier_id: string;
  event_id: string;
  contact_id?: string;
  service_scope: string;
  contract_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type DemoSupplierReview = {
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
};

export type DemoScriptSegment = {
  id: string;
  event_id: string;
  chapter_id?: string;
  order: number;
  type: string;
  name: string;
  duration: number;
  speaker?: string;
  content?: string;
  notes?: string;
  start_time?: string;
  end_time?: string;
  is_next_day?: boolean;
  responsibilities: string[];
  steps: DemoScriptStep[];
  status: string;
};

export type DemoScriptSyncPayload = {
  chapters: DemoScriptChapter[];
  segments: DemoScriptSegment[];
};

export type DemoScriptChapter = {
  id: string;
  event_id: string;
  order: number;
  name: string;
  description?: string;
};

export type DemoScriptStep = {
  id: string;
  title: string;
  owner?: string;
  duration?: number;
  status: 'pending' | 'done';
};

export type DemoReport = {
  id: string;
  event_id: string;
  title: string;
  summary: string;
  highlights: string[];
  issues: string[];
  recommendations: string[];
  statistics: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
};

export type DemoPrize = {
  id: string;
  event_id: string;
  name: string;
  description: string;
  quantity: number;
  level: number;
  remaining: number;
  draw_count: number;
  allow_repeat: boolean;
  order: number;
  created_at: string;
  updated_at: string;
};

export type DemoWinner = {
  id: string;
  event_id: string;
  prize_id: string;
  guest_id: string;
  record_id: string;
  win_time: string;
  claimed: boolean;
  abandoned: boolean;
  guests?: { name: string; company: string; level: string };
  prizes?: { name: string; level: number };
};

export type DemoLotteryRecord = {
  id: string;
  event_id: string;
  prize_id: string;
  attendee_ids: string[];
  abandoned_attendee_ids: string[];
  draw_time: string;
  draw_mode: 'manual' | 'auto' | 'redraw';
  operator?: string;
};

export type DemoLockedWinner = {
  id: string;
  event_id: string;
  guest_id?: string;
  name: string;
  company?: string;
  prize_ids: string[];
  effect_time_start?: string;
  effect_time_end?: string;
  is_blacklist: boolean;
  used: boolean;
  created_at: string;
};

export type DemoSeatingTable = {
  id: string;
  eventId: string;
  name: string;
  capacity: number;
  shape: 'round' | 'square' | 'long';
  locked: boolean;
  guests: { id: string; name: string; seatIndex: number; locked?: boolean }[];
};

export const demoUser: AuthContext = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'demo@xinhuo.local',
  name: '演示管理员',
  role: 'super_admin',
  status: 'active',
};

const now = new Date().toISOString();

const defaultSettings: DemoEventSettings = {
  require_check_in: true,
  allow_lottery: true,
  enable_seating: true,
  enable_script: true,
  enable_report: true,
};

const demoCustomerId = '44444444-4444-4444-8444-444444444444';
const demoCustomerContactId = '55555555-5555-4555-8555-555555555555';

const demoGlobal = globalThis as typeof globalThis & Record<string, unknown>;

function getDemoArray<T>(key: string, factory: () => T[]) {
  const existing = demoGlobal[key];
  if (Array.isArray(existing)) return existing as T[];
  const created = factory();
  demoGlobal[key] = created;
  return created;
}

const events: DemoEvent[] = getDemoArray('__xinhuo_demo_events', () => [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: '2026 芯火会务演示活动',
    type: 'annual_meeting',
    status: 'preparing',
    description: '用于本地无 Supabase 配置时验证完整业务链路的演示活动。',
    start_time: '2026-07-01T18:00',
    end_time: '2026-07-01T22:00',
    location: '深圳国际会展中心',
    address: '深圳市福田区福华三路',
    expected_guests: 120,
    actual_guests: 3,
    owner_id: demoUser.id,
    primary_customer_id: demoCustomerId,
    budget: 50000,
    actual_cost: 0,
    settings: defaultSettings,
    tags: [],
    created_at: now,
    updated_at: now,
  },
]);

const customers: DemoCustomer[] = getDemoArray('__xinhuo_demo_customers', () => [
  {
    id: demoCustomerId,
    organization_name: '芯火传媒集团',
    company_name: '深圳芯火传媒有限公司',
    industry_category: '会务与品牌传播',
    cooperation_intent: 'high',
    intent_level: 'strong',
    status: 'active',
    source: '老客户转介绍',
    address: '深圳市南山区科技园',
    region: '广东 深圳',
    website: 'https://example.com',
    cooperation_count: 3,
    last_cooperation_at: '2026-05-20T10:00:00.000Z',
    owner_id: demoUser.id,
    tags: ['重点客户', '年度合作'],
    notes: '偏好高规格品牌活动，对执行稳定性要求高。',
    custom_fields: {
      budget_level: '50-100万',
      decision_cycle: '2-4周',
    },
    created_at: now,
    updated_at: now,
    created_by: demoUser.id,
  },
]);

const customerContacts: DemoCustomerContact[] = getDemoArray('__xinhuo_demo_customer_contacts', () => [
  {
    id: demoCustomerContactId,
    customer_id: demoCustomerId,
    name: '陈总',
    company_name: '深圳芯火传媒有限公司',
    position: '市场负责人',
    native_place: '广东潮州',
    gender: 'female',
    address: '深圳市南山区',
    phone: '139-0000-1001',
    email: 'chen@example.com',
    wechat_id: 'chen-xinhuo',
    qq: '100100100',
    avatar_url: '',
    motto: '把每一次现场都当成品牌资产。',
    is_primary: true,
    relationship_role: '决策人',
    custom_fields: {
      communication_preference: '微信优先',
    },
    created_at: now,
    updated_at: now,
  },
]);

const eventCustomers: DemoEventCustomer[] = getDemoArray('__xinhuo_demo_event_customers', () => [
  {
    id: crypto.randomUUID(),
    event_id: events[0].id,
    customer_id: demoCustomerId,
    contact_id: demoCustomerContactId,
    role: 'client',
    is_primary: true,
    notes: '本活动主客户与主决策人。',
    created_at: now,
    updated_at: now,
  },
  {
    id: crypto.randomUUID(),
    event_id: events[0].id,
    customer_id: demoCustomerId,
    contact_id: demoCustomerContactId,
    role: 'sponsor',
    is_primary: false,
    sponsor_level: 'gold',
    sponsor_profile: {
      level: 'gold',
      level_name: '黄金赞助商',
      sponsorship_type: 'cash',
      amount: 100000,
      currency: 'CNY',
      benefits: ['主视觉 Logo 露出', '现场口播鸣谢', '资料袋品牌露出'],
      deliverables: ['高清 Logo', '品牌介绍 200 字', '赞助商宣传片'],
      logo_url: '',
      booth_number: 'S-01',
      booth_size: '3m x 3m',
      speaking_slot: '开场后 5 分钟品牌致辞',
      ad_placements: ['签到墙', '主屏轮播', '会刊内页'],
      material_requirements: ['6月25日前提交矢量 Logo', '6月28日前确认展位物料'],
      contract_status: 'signed',
      payment_status: 'partial',
      invoice_title: '深圳芯火传媒有限公司',
      invoice_tax_no: '91440300MA0000000X',
      sponsor_contact_snapshot: {
        name: '陈总',
        phone: '139-0000-1001',
        wechat_id: 'chen-xinhuo',
      },
      notes: '重点赞助商，需要在台本和抽奖奖品页同步露出。',
    },
    notes: '黄金赞助商权益包。',
    created_at: now,
    updated_at: now,
  },
]);

const tasks: DemoTask[] = getDemoArray('__xinhuo_demo_tasks', () => [
  {
    id: crypto.randomUUID(),
    event_id: events[0].id,
    title: '确认场地合同',
    description: '完成场地档期、费用、设备清单确认。',
    status: 'completed',
    progress: 100,
    priority: 'high',
    assignee: '张经理',
    responsibility: '对接会展中心销售，确认7月1日主厅档期，签订场地使用合同，确认配套设备清单及费用明细',
    start_date: '2026-06-10',
    end_date: '2026-06-20',
    deliverables: '已签署场地合同、设备清单确认单、付款凭证',
    created_at: now,
    updated_at: now,
  },
  {
    id: crypto.randomUUID(),
    event_id: events[0].id,
    title: '导入嘉宾名单',
    description: '整理并导入核心嘉宾信息。',
    status: 'in_progress',
    progress: 60,
    priority: 'medium',
    assignee: '李秘书',
    responsibility: '收集各部门提报嘉宾名单，核对姓名/公司/职务/电话，统一导入系统并标记嘉宾等级',
    start_date: '2026-06-15',
    end_date: '2026-06-24',
    deliverables: '完整嘉宾名单Excel、系统导入记录、VIP嘉宾接待方案',
    created_at: now,
    updated_at: now,
  },
  {
    id: crypto.randomUUID(),
    event_id: events[0].id,
    title: '舞台搭建与音响调试',
    description: '主舞台搭建、LED屏幕安装、音响灯光系统联调。',
    status: 'pending',
    progress: 0,
    priority: 'high',
    assignee: '王技术',
    responsibility: '协调搭建公司按设计图搭建主舞台，安装LED大屏，完成音响灯光系统联调，确保活动当天零故障',
    start_date: '2026-06-28',
    end_date: '2026-06-30',
    deliverables: '舞台搭建验收报告、音响灯光联调记录、应急预案',
    created_at: now,
    updated_at: now,
  },
  {
    id: crypto.randomUUID(),
    event_id: events[0].id,
    title: '赞助商权益物料准备',
    description: '收集赞助商Logo、制作背板/展位物料、确认口播稿。',
    status: 'in_progress',
    progress: 40,
    priority: 'high',
    assignee: '赵设计',
    responsibility: '跟进各赞助商提交高清Logo及宣传素材，设计主背景板、签到处背板、展位画面，输出制作文件并交付制作',
    start_date: '2026-06-18',
    end_date: '2026-06-27',
    deliverables: '主KV设计稿、各赞助商物料制作文件、口播稿件',
    created_at: now,
    updated_at: now,
  },
  {
    id: crypto.randomUUID(),
    event_id: events[0].id,
    title: '活动流程台本定稿',
    description: '完成活动全流程台本编写与各方确认。',
    status: 'in_progress',
    progress: 70,
    priority: 'high',
    assignee: '陈策划',
    responsibility: '编写活动全流程台本（开场→致辞→颁奖→抽奖→晚宴），与主持人、嘉宾、控台逐一确认各环节细节',
    start_date: '2026-06-20',
    end_date: '2026-06-28',
    deliverables: '活动流程台本终稿、环节时间表、控台提示卡',
    created_at: now,
    updated_at: now,
  },
  {
    id: crypto.randomUUID(),
    event_id: events[0].id,
    title: '伴手礼采购与分装',
    description: '伴手礼选品、采购、到货验收、分装打包。',
    status: 'pending',
    progress: 0,
    priority: 'medium',
    assignee: '刘行政',
    responsibility: '选定伴手礼方案（品牌礼品+活动定制周边），完成采购下单，到货后验收质检并分装成120份伴手礼袋',
    start_date: '2026-06-22',
    end_date: '2026-06-29',
    deliverables: '伴手礼实物120份、采购清单与发票、验收记录',
    created_at: now,
    updated_at: now,
  },
  {
    id: crypto.randomUUID(),
    event_id: events[0].id,
    title: '现场签到系统测试',
    description: '签到设备调试、二维码生成、签到大屏联调。',
    status: 'pending',
    progress: 0,
    priority: 'medium',
    assignee: '孙IT',
    responsibility: '准备签到终端设备（iPad x3），生成全部嘉宾签到二维码，部署签到大屏，完成全流程模拟测试',
    start_date: '2026-06-29',
    end_date: '2026-06-30',
    deliverables: '签到系统测试报告、备用设备方案、签到流程操作手册',
    created_at: now,
    updated_at: now,
  },
  {
    id: crypto.randomUUID(),
    event_id: events[0].id,
    title: '活动复盘报告编写',
    description: '汇总签到数据、抽奖数据、费用明细，编写复盘报告。',
    status: 'pending',
    progress: 0,
    priority: 'low',
    assignee: '陈策划',
    responsibility: '活动结束后汇总签到率、抽奖数据、赞助执行、费用决算，编写内部复盘报告及客户交付报告',
    start_date: '2026-07-02',
    end_date: '2026-07-07',
    deliverables: '内部复盘报告、客户交付报告、改进建议清单',
    created_at: now,
    updated_at: now,
  },
]);

const guests: DemoGuest[] = getDemoArray('__xinhuo_demo_guests', () => [
  {
    id: crypto.randomUUID(),
    event_id: events[0].id,
    customer_id: demoCustomerId,
    contact_id: demoCustomerContactId,
    name: '张三',
    company: '龙芯中科',
    position: '总经理',
    phone: '139-0000-2001',
    email: 'zhangsan@example.com',
    level: 'vip',
    source: 'customer_contact',
    invite_status: 'confirmed',
    guest_role: 'vip',
    profile_snapshot: {
      customer_id: demoCustomerId,
      contact_id: demoCustomerContactId,
      matched_by: 'demo',
    },
    seat_number: '主桌-1',
    check_in_status: 'checked_in',
    check_in_time: now,
    created_at: now,
    updated_at: now,
  },
  {
    id: crypto.randomUUID(),
    event_id: events[0].id,
    name: '李四',
    company: '华为海思',
    position: '技术总监',
    phone: '139-0000-2002',
    email: 'lisi@example.com',
    level: 'vip',
    source: 'manual',
    invite_status: 'confirmed',
    guest_role: 'speaker',
    profile_snapshot: {},
    seat_number: '主桌-2',
    check_in_status: 'pending',
    created_at: now,
    updated_at: now,
  },
  {
    id: crypto.randomUUID(),
    event_id: events[0].id,
    name: '王五',
    company: '紫光展锐',
    position: '市场经理',
    phone: '139-0000-2003',
    email: 'wangwu@example.com',
    level: 'important',
    source: 'manual',
    invite_status: 'invited',
    guest_role: 'attendee',
    profile_snapshot: {},
    check_in_status: 'pending',
    created_at: now,
    updated_at: now,
  },
]);

const suppliers: DemoSupplier[] = getDemoArray('__xinhuo_demo_suppliers', () => [
  {
    id: crypto.randomUUID(),
    name: '深圳会展服务有限公司',
    category: 'venue',
    contact: '张经理',
    phone: '138-0000-0001',
    email: 'venue@example.com',
    address: '深圳市福田区',
    description: '场地与会务执行服务',
    rating: 4.8,
    cooperation_count: 5,
    status: 'active',
    created_at: now,
    updated_at: now,
  },
  {
    id: crypto.randomUUID(),
    name: '广州音响设备租赁',
    category: 'equipment',
    contact: '李技术',
    phone: '138-0000-0002',
    email: 'equipment@example.com',
    address: '广州市天河区',
    description: '音响、灯光、屏幕租赁',
    rating: 4.5,
    cooperation_count: 3,
    status: 'active',
    created_at: now,
    updated_at: now,
  },
]);

const supplierContacts: DemoSupplierContact[] = getDemoArray('__xinhuo_demo_supplier_contacts', () => [
  {
    id: crypto.randomUUID(),
    supplier_id: suppliers[0].id,
    name: '张经理',
    company_name: suppliers[0].name,
    position: '客户经理',
    phone: suppliers[0].phone,
    email: suppliers[0].email,
    address: suppliers[0].address,
    is_primary: true,
    relationship_role: '商务对接',
    custom_fields: {},
    created_at: now,
    updated_at: now,
  },
  {
    id: crypto.randomUUID(),
    supplier_id: suppliers[1].id,
    name: '李技术',
    company_name: suppliers[1].name,
    position: '技术负责人',
    phone: suppliers[1].phone,
    email: suppliers[1].email,
    address: suppliers[1].address,
    is_primary: true,
    relationship_role: '现场技术',
    custom_fields: {},
    created_at: now,
    updated_at: now,
  },
]);

const supplierEventLinks: DemoSupplierEventLink[] = getDemoArray('__xinhuo_demo_supplier_event_links', () => [
  {
    id: crypto.randomUUID(),
    supplier_id: suppliers[0].id,
    event_id: events[0].id,
    contact_id: supplierContacts[0].id,
    service_scope: '场地与基础会务服务',
    contract_amount: 32000,
    status: 'confirmed',
    notes: '主会场与签到区搭建。',
    created_at: now,
    updated_at: now,
  },
]);

const supplierReviews: DemoSupplierReview[] = getDemoArray('__xinhuo_demo_supplier_reviews', () => [
  {
    id: crypto.randomUUID(),
    supplier_id: suppliers[0].id,
    event_id: events[0].id,
    rating: 4.8,
    quality_score: 5,
    delivery_score: 4.7,
    communication_score: 4.8,
    content: '响应及时，场地协作稳定。',
    created_at: now,
    updated_at: now,
    created_by: demoUser.id,
  },
]);

const scriptSegments: DemoScriptSegment[] = getDemoArray('__xinhuo_demo_script_segments', () => [
  {
    id: crypto.randomUUID(),
    event_id: events[0].id,
    chapter_id: 'chapter-opening',
    order: 1,
    type: 'speech',
    name: '主持人开场',
    duration: 10,
    speaker: '主持人',
    content: '欢迎嘉宾入场，介绍活动主题。',
    notes: '确认麦克风和开场音乐。',
    start_time: '18:00',
    end_time: '18:10',
    is_next_day: false,
    responsibilities: ['主持人: 开场串词', '控台: 播放开场音乐'],
    steps: [
      { id: crypto.randomUUID(), title: '开场音乐淡入', owner: '控台', duration: 1, status: 'pending' },
      { id: crypto.randomUUID(), title: '主持人登台', owner: '主持人', duration: 2, status: 'pending' },
    ],
    status: 'ready',
  },
  {
    id: crypto.randomUUID(),
    event_id: events[0].id,
    chapter_id: 'chapter-interaction',
    order: 2,
    type: 'lottery',
    name: '第一轮抽奖',
    duration: 15,
    speaker: '抽奖嘉宾',
    content: '抽取三等奖。',
    notes: '大屏确认中奖名单。',
    start_time: '19:00',
    end_time: '19:15',
    is_next_day: false,
    responsibilities: ['抽奖嘉宾: 点击抽奖', '会务: 引导领奖'],
    steps: [
      { id: crypto.randomUUID(), title: '切换抽奖大屏', owner: '控台', duration: 1, status: 'pending' },
      { id: crypto.randomUUID(), title: '核对中奖名单', owner: '会务', duration: 3, status: 'pending' },
    ],
    status: 'pending',
  },
]);

const scriptChapters: DemoScriptChapter[] = getDemoArray('__xinhuo_demo_script_chapters', () => [
  {
    id: 'chapter-opening',
    event_id: events[0].id,
    order: 1,
    name: '开场与嘉宾致辞',
    description: '入场、开场和领导致辞段落。',
  },
  {
    id: 'chapter-interaction',
    event_id: events[0].id,
    order: 2,
    name: '互动与抽奖',
    description: '互动游戏、抽奖和现场转场。',
  },
]);

const reports: DemoReport[] = getDemoArray('__xinhuo_demo_reports', () => []);

const prizes: DemoPrize[] = getDemoArray('__xinhuo_demo_prizes', () => [
  {
    id: '22222222-2222-4222-8222-222222222222',
    event_id: events[0].id,
    name: '特等奖 - iPhone 15 Pro',
    description: '年度大奖',
    quantity: 1,
    level: 1,
    remaining: 1,
    draw_count: 1,
    allow_repeat: false,
    order: 1,
    created_at: now,
    updated_at: now,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    event_id: events[0].id,
    name: '一等奖 - iPad Pro',
    description: '互动奖品',
    quantity: 3,
    level: 2,
    remaining: 3,
    draw_count: 1,
    allow_repeat: false,
    order: 2,
    created_at: now,
    updated_at: now,
  },
]);

const winners: DemoWinner[] = getDemoArray('__xinhuo_demo_winners', () => []);
const lotteryRecords: DemoLotteryRecord[] = getDemoArray('__xinhuo_demo_lottery_records', () => []);
const lockedWinners: DemoLockedWinner[] = getDemoArray('__xinhuo_demo_locked_winners', () => [
  {
    id: crypto.randomUUID(),
    event_id: events[0].id,
    guest_id: guests[1].id,
    name: guests[1].name,
    company: guests[1].company,
    prize_ids: [prizes[1].id],
    is_blacklist: false,
    used: false,
    created_at: now,
  },
]);

const seatingTables: DemoSeatingTable[] = getDemoArray('__xinhuo_demo_seating_tables', () => [
  {
    id: 'table-1',
    eventId: events[0].id,
    name: '主桌',
    capacity: 10,
    shape: 'round',
    locked: false,
    guests: [],
  },
]);

export function listDemoEvents(filters: { search?: string | null; status?: string | null } = {}) {
  const search = filters.search?.toLowerCase();
  return events
    .filter((event) => !filters.status || event.status === filters.status)
    .filter((event) => !search || event.name.toLowerCase().includes(search) || event.location.toLowerCase().includes(search))
    .map((event) => ({
      ...event,
      event_tasks: [{ count: tasks.filter((task) => task.event_id === event.id).length }],
      guests: [{ count: guests.filter((guest) => guest.event_id === event.id).length }],
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function createDemoEvent(input: Omit<DemoEvent, 'id' | 'owner_id' | 'actual_guests' | 'actual_cost' | 'tags' | 'created_at' | 'updated_at'>) {
  const timestamp = new Date().toISOString();
  const event: DemoEvent = {
    ...input,
    id: crypto.randomUUID(),
    owner_id: demoUser.id,
    actual_guests: 0,
    actual_cost: 0,
    tags: [],
    created_at: timestamp,
    updated_at: timestamp,
  };
  events.unshift(event);
  return event;
}

export function getDemoEvent(id: string) {
  const event = events.find((item) => item.id === id);
  if (!event) return null;

  const eventCustomerLinks = listDemoEventCustomers(id);

  return {
    ...event,
    tasks: tasks.filter((task) => task.event_id === id),
    guests: guests.filter((guest) => guest.event_id === id),
    event_customers: eventCustomerLinks,
    primary_customer: event.primary_customer_id ? getDemoCustomer(event.primary_customer_id) : null,
    supplier_event_links: supplierEventLinks
      .filter((link) => link.event_id === id)
      .map((link) => ({
        ...link,
        supplier: suppliers.find((supplier) => supplier.id === link.supplier_id) || null,
        contact: supplierContacts.find((contact) => contact.id === link.contact_id) || null,
      })),
    seating_zones: [],
    script_segments: [],
  };
}

export function updateDemoEvent(id: string, updates: Partial<DemoEvent>) {
  const event = events.find((item) => item.id === id);
  if (!event) return null;
  Object.assign(event, updates, { updated_at: new Date().toISOString() });
  return event;
}

export function deleteDemoEvent(id: string) {
  const index = events.findIndex((item) => item.id === id);
  if (index === -1) return false;
  events.splice(index, 1);
  return true;
}

function normalizeMatchValue(value: unknown) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}

function getPrimaryContact(customerId: string) {
  return customerContacts.find((contact) => contact.customer_id === customerId && contact.is_primary)
    || customerContacts.find((contact) => contact.customer_id === customerId);
}

export function listDemoCustomers(filters: {
  search?: string | null;
  industry?: string | null;
  cooperation_intent?: string | null;
  status?: string | null;
} = {}) {
  const search = normalizeMatchValue(filters.search);
  return customers
    .filter((customer) => !filters.industry || customer.industry_category === filters.industry)
    .filter((customer) => !filters.cooperation_intent || customer.cooperation_intent === filters.cooperation_intent)
    .filter((customer) => !filters.status || customer.status === filters.status)
    .filter((customer) => {
      if (!search) return true;
      const contactText = customerContacts
        .filter((contact) => contact.customer_id === customer.id)
        .map((contact) => `${contact.name}${contact.phone || ''}${contact.email || ''}${contact.wechat_id || ''}`)
        .join('');
      return normalizeMatchValue(`${customer.organization_name}${customer.company_name}${customer.industry_category}${contactText}`).includes(search);
    })
    .map((customer) => ({
      ...customer,
      contacts: customerContacts.filter((contact) => contact.customer_id === customer.id),
      primary_contact: getPrimaryContact(customer.id) || null,
      events_count: eventCustomers.filter((link) => link.customer_id === customer.id).length,
      guests_count: guests.filter((guest) => guest.customer_id === customer.id).length,
    }))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function getDemoCustomer(id: string) {
  const customer = customers.find((item) => item.id === id);
  if (!customer) return null;
  const links = eventCustomers.filter((link) => link.customer_id === id);
  const linkedEvents = links.map((link) => ({
    ...link,
    event: events.find((event) => event.id === link.event_id) || null,
    contact: link.contact_id ? customerContacts.find((contact) => contact.id === link.contact_id) || null : null,
  }));
  const customerGuests = guests
    .filter((guest) => guest.customer_id === id)
    .map((guest) => ({
      ...guest,
      event: events.find((event) => event.id === guest.event_id) || null,
    }));
  return {
    ...customer,
    contacts: customerContacts.filter((contact) => contact.customer_id === id),
    primary_contact: getPrimaryContact(id) || null,
    events: linkedEvents,
    guests: customerGuests,
    reports: reports
      .filter((report) => linkedEvents.some((link) => link.event_id === report.event_id))
      .map((report) => ({
        ...report,
        event: events.find((event) => event.id === report.event_id) || null,
      })),
  };
}

export function createDemoCustomer(input: {
  organization_name: string;
  company_name?: string;
  industry_category?: string;
  cooperation_intent?: string;
  intent_level?: string;
  status?: string;
  source?: string;
  address?: string;
  region?: string;
  website?: string;
  owner_id?: string;
  tags?: string[];
  notes?: string;
  custom_fields?: Record<string, unknown>;
  created_by?: string;
}) {
  const timestamp = new Date().toISOString();
  const customer: DemoCustomer = {
    id: crypto.randomUUID(),
    organization_name: input.organization_name,
    company_name: input.company_name || input.organization_name,
    industry_category: input.industry_category || '',
    cooperation_intent: input.cooperation_intent || 'medium',
    intent_level: input.intent_level || 'medium',
    status: input.status || 'prospect',
    source: input.source || '',
    address: input.address || '',
    region: input.region || '',
    website: input.website || '',
    cooperation_count: 0,
    owner_id: input.owner_id || demoUser.id,
    tags: input.tags || [],
    notes: input.notes || '',
    custom_fields: input.custom_fields || {},
    created_at: timestamp,
    updated_at: timestamp,
    created_by: input.created_by || demoUser.id,
  };
  customers.unshift(customer);
  return customer;
}

export function updateDemoCustomer(id: string, updates: Partial<DemoCustomer>) {
  const customer = customers.find((item) => item.id === id);
  if (!customer) return null;
  Object.assign(customer, updates, { updated_at: new Date().toISOString() });
  return getDemoCustomer(id);
}

export function deleteDemoCustomer(id: string) {
  if (eventCustomers.some((link) => link.customer_id === id) || guests.some((guest) => guest.customer_id === id)) {
    return { deleted: false, reason: '客户已关联活动或嘉宾，不能直接删除' };
  }
  const index = customers.findIndex((item) => item.id === id);
  if (index === -1) return { deleted: false, reason: '客户不存在' };
  customers.splice(index, 1);
  for (let index = customerContacts.length - 1; index >= 0; index -= 1) {
    if (customerContacts[index].customer_id === id) customerContacts.splice(index, 1);
  }
  return { deleted: true };
}

export function createDemoCustomerContact(input: {
  customer_id: string;
  name: string;
  company_name?: string;
  position?: string;
  native_place?: string;
  gender?: string;
  address?: string;
  phone?: string;
  email?: string;
  wechat_qr_url?: string;
  wechat_id?: string;
  qq?: string;
  avatar_url?: string;
  motto?: string;
  is_primary?: boolean;
  relationship_role?: string;
  custom_fields?: Record<string, unknown>;
}) {
  const customer = customers.find((item) => item.id === input.customer_id);
  if (!customer) return null;
  const timestamp = new Date().toISOString();
  if (input.is_primary) {
    customerContacts
      .filter((contact) => contact.customer_id === input.customer_id)
      .forEach((contact) => {
        contact.is_primary = false;
      });
  }
  const contact: DemoCustomerContact = {
    id: crypto.randomUUID(),
    customer_id: input.customer_id,
    name: input.name,
    company_name: input.company_name || customer.company_name || customer.organization_name,
    position: input.position || '',
    native_place: input.native_place,
    gender: input.gender,
    address: input.address,
    phone: input.phone,
    email: input.email,
    wechat_qr_url: input.wechat_qr_url,
    wechat_id: input.wechat_id,
    qq: input.qq,
    avatar_url: input.avatar_url,
    motto: input.motto,
    is_primary: input.is_primary ?? !customerContacts.some((item) => item.customer_id === input.customer_id),
    relationship_role: input.relationship_role,
    custom_fields: input.custom_fields || {},
    created_at: timestamp,
    updated_at: timestamp,
  };
  customerContacts.push(contact);
  customer.updated_at = timestamp;
  return contact;
}

export function updateDemoCustomerContact(customerId: string, contactId: string, updates: Partial<DemoCustomerContact>) {
  const contact = customerContacts.find((item) => item.customer_id === customerId && item.id === contactId);
  if (!contact) return null;
  if (updates.is_primary) {
    customerContacts
      .filter((item) => item.customer_id === customerId && item.id !== contactId)
      .forEach((item) => {
        item.is_primary = false;
      });
  }
  Object.assign(contact, updates, { updated_at: new Date().toISOString() });
  return contact;
}

export function deleteDemoCustomerContact(customerId: string, contactId: string) {
  if (guests.some((guest) => guest.customer_id === customerId && guest.contact_id === contactId)) {
    return { deleted: false, reason: '联系人已关联嘉宾，不能直接删除' };
  }
  const index = customerContacts.findIndex((item) => item.customer_id === customerId && item.id === contactId);
  if (index === -1) return { deleted: false, reason: '联系人不存在' };
  customerContacts.splice(index, 1);
  return { deleted: true };
}

export function listDemoEventCustomers(eventId: string) {
  return eventCustomers
    .filter((link) => link.event_id === eventId)
    .map((link) => {
      const customer = customers.find((item) => item.id === link.customer_id) || null;
      const contact = link.contact_id
        ? customerContacts.find((item) => item.id === link.contact_id) || null
        : getPrimaryContact(link.customer_id) || null;
      return {
        ...link,
        customer,
        contact,
      };
    });
}

export function linkDemoEventCustomer(input: {
  event_id: string;
  customer_id: string;
  contact_id?: string;
  role?: string;
  is_primary?: boolean;
  sponsor_level?: string;
  sponsor_profile?: Record<string, unknown>;
  notes?: string;
}) {
  const event = events.find((item) => item.id === input.event_id);
  const customer = customers.find((item) => item.id === input.customer_id);
  if (!event || !customer) return null;
  const timestamp = new Date().toISOString();
  const contactId = input.contact_id || getPrimaryContact(input.customer_id)?.id;
  if (input.is_primary) {
    eventCustomers
      .filter((link) => link.event_id === input.event_id)
      .forEach((link) => {
        link.is_primary = false;
      });
    event.primary_customer_id = input.customer_id;
  }
  const existing = eventCustomers.find((link) => (
    link.event_id === input.event_id &&
    link.customer_id === input.customer_id &&
    link.role === (input.role || 'client')
  ));
  if (existing) {
    Object.assign(existing, {
      contact_id: contactId,
      is_primary: Boolean(input.is_primary),
      sponsor_level: input.sponsor_level,
      sponsor_profile: input.sponsor_profile,
      notes: input.notes,
      updated_at: timestamp,
    });
    return existing;
  }
  const link: DemoEventCustomer = {
    id: crypto.randomUUID(),
    event_id: input.event_id,
    customer_id: input.customer_id,
    contact_id: contactId,
    role: input.role || 'client',
    is_primary: Boolean(input.is_primary),
    sponsor_level: input.sponsor_level,
    sponsor_profile: input.sponsor_profile,
    notes: input.notes,
    created_at: timestamp,
    updated_at: timestamp,
  };
  eventCustomers.push(link);
  customer.cooperation_count = new Set(eventCustomers.filter((item) => item.customer_id === customer.id).map((item) => item.event_id)).size;
  customer.last_cooperation_at = event.start_time;
  customer.updated_at = timestamp;
  event.updated_at = timestamp;
  return link;
}

export function unlinkDemoEventCustomer(eventId: string, linkId: string) {
  const index = eventCustomers.findIndex((link) => link.event_id === eventId && link.id === linkId);
  if (index === -1) return false;
  const [removed] = eventCustomers.splice(index, 1);
  const event = events.find((item) => item.id === eventId);
  if (event?.primary_customer_id === removed.customer_id) {
    event.primary_customer_id = eventCustomers.find((link) => link.event_id === eventId && link.is_primary)?.customer_id;
  }
  return true;
}

export function listDemoCustomerEvents(customerId: string) {
  return eventCustomers
    .filter((link) => link.customer_id === customerId)
    .map((link) => ({
      ...link,
      event: events.find((event) => event.id === link.event_id) || null,
      contact: link.contact_id ? customerContacts.find((contact) => contact.id === link.contact_id) || null : null,
    }));
}

export function matchDemoCustomerContact(input: {
  name?: unknown;
  company?: unknown;
  phone?: unknown;
  email?: unknown;
  wechat_id?: unknown;
}) {
  const phone = normalizeMatchValue(input.phone);
  const email = normalizeMatchValue(input.email);
  const wechatId = normalizeMatchValue(input.wechat_id);
  const name = normalizeMatchValue(input.name);
  const company = normalizeMatchValue(input.company);

  const exact = customerContacts.find((contact) => (
    (phone && normalizeMatchValue(contact.phone) === phone) ||
    (email && normalizeMatchValue(contact.email) === email) ||
    (wechatId && normalizeMatchValue(contact.wechat_id) === wechatId)
  ));
  const contact = exact || customerContacts.find((item) => (
    name &&
    normalizeMatchValue(item.name) === name &&
    company &&
    normalizeMatchValue(item.company_name).includes(company)
  ));
  if (!contact) return null;
  const customer = customers.find((item) => item.id === contact.customer_id) || null;
  return { customer, contact };
}

export function listDemoGuests(filters: { eventId?: string | null } = {}) {
  return guests
    .filter((guest) => !filters.eventId || guest.event_id === filters.eventId)
    .map((guest) => ({
      ...guest,
      customer: guest.customer_id ? customers.find((customer) => customer.id === guest.customer_id) || null : null,
      contact: guest.contact_id ? customerContacts.find((contact) => contact.id === guest.contact_id) || null : null,
    }));
}

export function createDemoGuest(input: {
  event_id: string;
  customer_id?: string;
  contact_id?: string;
  name: string;
  company?: string;
  position?: string;
  phone?: string;
  email?: string;
  level?: string;
  source?: string;
  invite_status?: string;
  guest_role?: string;
  profile_snapshot?: Record<string, unknown>;
}) {
  const timestamp = new Date().toISOString();
  const matched = input.contact_id
    ? {
        customer: input.customer_id ? customers.find((customer) => customer.id === input.customer_id) || null : null,
        contact: customerContacts.find((contact) => contact.id === input.contact_id) || null,
      }
    : matchDemoCustomerContact(input);
  const customer = matched?.customer || (input.customer_id ? customers.find((item) => item.id === input.customer_id) || null : null);
  const contact = matched?.contact || null;
  const guest: DemoGuest = {
    id: crypto.randomUUID(),
    event_id: input.event_id,
    customer_id: customer?.id || input.customer_id,
    contact_id: contact?.id || input.contact_id,
    name: input.name || contact?.name || '',
    company: input.company || contact?.company_name || customer?.company_name || customer?.organization_name || '',
    position: input.position || contact?.position || '',
    phone: input.phone || contact?.phone,
    email: input.email || contact?.email,
    level: input.level || 'normal',
    source: input.source || (contact ? 'customer_contact' : 'manual'),
    invite_status: input.invite_status || 'draft',
    guest_role: input.guest_role || 'attendee',
    profile_snapshot: {
      ...(input.profile_snapshot || {}),
      customer_id: customer?.id,
      contact_id: contact?.id,
      name: contact?.name,
      company_name: contact?.company_name,
      position: contact?.position,
      phone: contact?.phone,
      email: contact?.email,
      wechat_id: contact?.wechat_id,
    },
    check_in_status: 'pending',
    created_at: timestamp,
    updated_at: timestamp,
  };
  guests.push(guest);
  const event = events.find((item) => item.id === input.event_id);
  if (event) {
    event.actual_guests = guests.filter((item) => item.event_id === input.event_id).length;
    event.updated_at = timestamp;
  }
  return guest;
}

export function listDemoTasks(filters: { eventId?: string | null; status?: string | null } = {}) {
  return tasks
    .filter((task) => !filters.eventId || task.event_id === filters.eventId)
    .filter((task) => !filters.status || task.status === filters.status)
    .map((task) => ({
      ...task,
      events: { name: events.find((event) => event.id === task.event_id)?.name || '未关联活动' },
    }))
    .sort((a, b) => a.end_date.localeCompare(b.end_date));
}

export function createDemoTask(input: {
  event_id: string;
  title: string;
  description?: string;
  assignee?: string;
  responsibility?: string;
  start_date?: string;
  end_date: string;
  deliverables?: string;
  priority?: string;
}) {
  const timestamp = new Date().toISOString();
  const task: DemoTask = {
    id: crypto.randomUUID(),
    event_id: input.event_id,
    title: input.title,
    description: input.description || '',
    assignee: input.assignee || '',
    responsibility: input.responsibility || '',
    start_date: input.start_date || input.end_date,
    end_date: input.end_date,
    deliverables: input.deliverables || '',
    priority: input.priority || 'medium',
    status: 'pending',
    progress: 0,
    created_at: timestamp,
    updated_at: timestamp,
  };
  tasks.push(task);
  return task;
}

export function updateDemoTasks(taskIds: string[], updates: Partial<DemoTask>) {
  const timestamp = new Date().toISOString();
  return tasks
    .filter((task) => taskIds.includes(task.id))
    .map((task) => {
      Object.assign(task, updates, { updated_at: timestamp });
      return task;
    });
}

export function updateDemoTask(taskId: string, updates: Partial<DemoTask>): DemoTask | null {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;
  Object.assign(task, updates, { updated_at: new Date().toISOString() });
  return task;
}

export function deleteDemoTask(taskId: string): boolean {
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) return false;
  tasks.splice(idx, 1);
  return true;
}

export function listDemoSuppliers(filters: { search?: string | null; category?: string | null; status?: string | null } = {}) {
  const search = filters.search?.toLowerCase();
  return suppliers
    .filter((supplier) => !filters.category || supplier.category === filters.category)
    .filter((supplier) => !filters.status || supplier.status === filters.status)
    .filter((supplier) => !search || supplier.name.toLowerCase().includes(search) || supplier.contact.toLowerCase().includes(search))
    .map((supplier) => ({
      ...supplier,
      contacts: supplierContacts.filter((contact) => contact.supplier_id === supplier.id),
      event_links: supplierEventLinks.filter((link) => link.supplier_id === supplier.id),
      reviews: supplierReviews.filter((review) => review.supplier_id === supplier.id),
    }))
    .sort((a, b) => b.rating - a.rating);
}

export function createDemoSupplier(input: {
  name: string;
  category: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
}) {
  const timestamp = new Date().toISOString();
  const supplier: DemoSupplier = {
    id: crypto.randomUUID(),
    name: input.name,
    category: input.category,
    contact: input.contact || '',
    phone: input.phone || '',
    email: input.email || '',
    address: input.address || '',
    description: input.description || '',
    rating: 0,
    cooperation_count: 0,
    status: 'active',
    created_at: timestamp,
    updated_at: timestamp,
  };
  suppliers.unshift(supplier);
  return supplier;
}

function addMinutesToClock(startTime: string | undefined, minutes: number) {
  if (!startTime) return { end_time: undefined, is_next_day: false };
  const [hourText, minuteText] = startTime.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return { end_time: undefined, is_next_day: false };
  const total = hour * 60 + minute + minutes;
  const normalized = ((total % 1440) + 1440) % 1440;
  return {
    end_time: `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`,
    is_next_day: total >= 1440,
  };
}

function recalculateDemoScriptTimes(eventId: string) {
  const ordered = scriptSegments
    .filter((segment) => segment.event_id === eventId)
    .sort((a, b) => a.order - b.order);
  let cursor = ordered.find((segment) => segment.start_time)?.start_time;
  ordered.forEach((segment) => {
    if (segment.start_time) cursor = segment.start_time;
    const result = addMinutesToClock(cursor, segment.duration);
    segment.end_time = result.end_time;
    segment.is_next_day = result.is_next_day;
    cursor = result.end_time;
  });
  return ordered;
}

export function listDemoScriptSegments(eventId: string) {
  return recalculateDemoScriptTimes(eventId);
}

export function listDemoScriptChapters(eventId: string) {
  return scriptChapters
    .filter((chapter) => chapter.event_id === eventId)
    .sort((a, b) => a.order - b.order);
}

export function createDemoScriptSegment(input: {
  event_id: string;
  chapter_id?: string;
  order: number;
  type: string;
  name: string;
  duration: number;
  speaker?: string;
  content?: string;
  notes?: string;
  start_time?: string;
  responsibilities?: string[];
}) {
  const segment: DemoScriptSegment = {
    id: crypto.randomUUID(),
    event_id: input.event_id,
    chapter_id: input.chapter_id,
    order: input.order,
    type: input.type,
    name: input.name,
    duration: input.duration,
    speaker: input.speaker,
    content: input.content,
    notes: input.notes,
    start_time: input.start_time,
    ...addMinutesToClock(input.start_time, input.duration),
    responsibilities: input.responsibilities || [],
    steps: [],
    status: 'pending',
  };
  scriptSegments.push(segment);
  recalculateDemoScriptTimes(input.event_id);
  return segment;
}

export function updateDemoScriptSegment(segmentId: string, updates: { order?: number; status?: string; chapter_id?: string; responsibilities?: string[] }) {
  const segment = scriptSegments.find((item) => item.id === segmentId);
  if (!segment) return null;
  Object.assign(segment, updates);
  recalculateDemoScriptTimes(segment.event_id);
  return segment;
}

export function createDemoScriptChapter(input: { event_id: string; name: string; description?: string }) {
  const chapter: DemoScriptChapter = {
    id: crypto.randomUUID(),
    event_id: input.event_id,
    order: scriptChapters.filter((item) => item.event_id === input.event_id).length + 1,
    name: input.name,
    description: input.description,
  };
  scriptChapters.push(chapter);
  return chapter;
}

export function createDemoScriptStep(input: { segment_id: string; title: string; owner?: string; duration?: number }) {
  const segment = scriptSegments.find((item) => item.id === input.segment_id);
  if (!segment) return null;
  const step: DemoScriptStep = {
    id: crypto.randomUUID(),
    title: input.title,
    owner: input.owner,
    duration: input.duration,
    status: 'pending',
  };
  segment.steps.push(step);
  return segment;
}

export function updateDemoScriptStep(input: { segment_id: string; step_id: string; status: 'pending' | 'done' }) {
  const segment = scriptSegments.find((item) => item.id === input.segment_id);
  const step = segment?.steps.find((item) => item.id === input.step_id);
  if (!segment || !step) return null;
  step.status = input.status;
  return segment;
}

export function syncDemoScript(eventId: string, payload: DemoScriptSyncPayload) {
  for (let index = scriptSegments.length - 1; index >= 0; index -= 1) {
    if (scriptSegments[index].event_id === eventId) scriptSegments.splice(index, 1);
  }
  for (let index = scriptChapters.length - 1; index >= 0; index -= 1) {
    if (scriptChapters[index].event_id === eventId) scriptChapters.splice(index, 1);
  }

  payload.chapters.forEach((chapter, index) => {
    scriptChapters.push({
      id: chapter.id,
      event_id: eventId,
      order: chapter.order || index + 1,
      name: chapter.name,
      description: chapter.description,
    });
  });

  payload.segments.forEach((segment, index) => {
    scriptSegments.push({
      id: segment.id,
      event_id: eventId,
      chapter_id: segment.chapter_id,
      order: segment.order || index + 1,
      type: segment.type,
      name: segment.name,
      duration: segment.duration,
      speaker: segment.speaker,
      content: segment.content,
      notes: segment.notes,
      start_time: segment.start_time,
      end_time: segment.end_time,
      is_next_day: segment.is_next_day,
      responsibilities: segment.responsibilities || [],
      steps: segment.steps || [],
      status: segment.status || 'pending',
    });
  });

  return {
    chapters: listDemoScriptChapters(eventId),
    segments: listDemoScriptSegments(eventId),
  };
}

export function applyDemoScriptTemplate(eventId: string, template: 'annual_meeting' | 'launch') {
  for (let index = scriptSegments.length - 1; index >= 0; index -= 1) {
    if (scriptSegments[index].event_id === eventId) scriptSegments.splice(index, 1);
  }
  for (let index = scriptChapters.length - 1; index >= 0; index -= 1) {
    if (scriptChapters[index].event_id === eventId) scriptChapters.splice(index, 1);
  }

  const chapterNames = template === 'launch'
    ? ['暖场与开场', '产品发布', '媒体互动']
    : ['签到暖场', '领导致辞', '表彰抽奖'];
  const chapters = chapterNames.map((name, index) => {
    const chapter: DemoScriptChapter = {
      id: crypto.randomUUID(),
      event_id: eventId,
      order: index + 1,
      name,
    };
    scriptChapters.push(chapter);
    return chapter;
  });

  const templates = template === 'launch'
    ? [
        { chapter_id: chapters[0].id, type: 'video', name: '品牌预热视频', duration: 5, speaker: '控台', start_time: '14:00', content: '播放品牌主视觉视频。' },
        { chapter_id: chapters[0].id, type: 'speech', name: '主持人开场', duration: 8, speaker: '主持人', content: '介绍发布会主题和到场嘉宾。' },
        { chapter_id: chapters[1].id, type: 'speech', name: '产品发布演讲', duration: 25, speaker: '产品负责人', content: '讲解产品定位、核心能力和上市计划。' },
        { chapter_id: chapters[2].id, type: 'interactive', name: '媒体问答', duration: 20, speaker: '主持人', content: '媒体提问与嘉宾答复。' },
      ]
    : [
        { chapter_id: chapters[0].id, type: 'video', name: '暖场视频', duration: 6, speaker: '控台', start_time: '18:00', content: '循环播放年度回顾。' },
        { chapter_id: chapters[1].id, type: 'speech', name: '领导致辞', duration: 12, speaker: '董事长', content: '年度总结与新年展望。' },
        { chapter_id: chapters[2].id, type: 'award', name: '年度表彰', duration: 18, speaker: '颁奖嘉宾', content: '表彰优秀团队与个人。' },
        { chapter_id: chapters[2].id, type: 'lottery', name: '幸运抽奖', duration: 15, speaker: '抽奖嘉宾', content: '抽取幸运奖项。' },
      ];

  templates.forEach((item, index) => {
    createDemoScriptSegment({
      event_id: eventId,
      chapter_id: item.chapter_id,
      order: index + 1,
      type: item.type,
      name: item.name,
      duration: item.duration,
      speaker: item.speaker,
      content: item.content,
      start_time: item.start_time,
      responsibilities: [`${item.speaker}: 执行${item.name}`, '控台: 配合音视频切换'],
    });
  });

  return {
    chapters: listDemoScriptChapters(eventId),
    segments: listDemoScriptSegments(eventId),
  };
}

export function getDemoReportPayload(eventId: string) {
  const report = reports.find((item) => item.event_id === eventId);
  if (report) {
    return { exists: true, report };
  }

  const event = events.find((item) => item.id === eventId);
  const eventGuests = guests.filter((guest) => guest.event_id === eventId);
  const eventTasks = tasks.filter((task) => task.event_id === eventId);
  const checkedInGuests = eventGuests.filter((guest) => guest.check_in_status === 'checked_in').length;
  const completedTasks = eventTasks.filter((task) => task.status === 'completed').length;

  return {
    exists: false,
    event,
    statistics: {
      total_guests: eventGuests.length,
      checked_in_guests: checkedInGuests,
      check_in_rate: eventGuests.length > 0 ? Math.round((checkedInGuests / eventGuests.length) * 100) : 0,
      total_tasks: eventTasks.length,
      completed_tasks: completedTasks,
      lottery_winners: 0,
      claimed_prizes: 0,
    },
  };
}

export function upsertDemoReport(input: {
  event_id: string;
  title: string;
  summary?: string;
  highlights?: string[];
  issues?: string[];
  recommendations?: string[];
  statistics?: Record<string, unknown>;
}) {
  const timestamp = new Date().toISOString();
  const existing = reports.find((report) => report.event_id === input.event_id);
  if (existing) {
    Object.assign(existing, {
      title: input.title,
      summary: input.summary || '',
      highlights: input.highlights || [],
      issues: input.issues || [],
      recommendations: input.recommendations || [],
      statistics: input.statistics || {},
      status: 'published',
      updated_at: timestamp,
    });
    return existing;
  }

  const report: DemoReport = {
    id: crypto.randomUUID(),
    event_id: input.event_id,
    title: input.title,
    summary: input.summary || '',
    highlights: input.highlights || [],
    issues: input.issues || [],
    recommendations: input.recommendations || [],
    statistics: input.statistics || {},
    status: 'published',
    created_at: timestamp,
    updated_at: timestamp,
  };
  reports.push(report);
  return report;
}

export function getDemoLottery(eventId: string) {
  const eventPrizes = prizes.filter((prize) => prize.event_id === eventId).sort((a, b) => a.order - b.order || a.level - b.level);
  const eventWinners = winners
    .filter((winner) => winner.event_id === eventId && !winner.abandoned)
    .map((winner) => {
      const guest = guests.find((item) => item.id === winner.guest_id);
      const prize = prizes.find((item) => item.id === winner.prize_id);
      return {
        ...winner,
        guests: guest ? { name: guest.name, company: guest.company, level: guest.level } : undefined,
        prizes: prize ? { name: prize.name, level: prize.level } : undefined,
      };
    });
  const eligibleGuests = guests.filter((guest) => guest.event_id === eventId && guest.check_in_status === 'checked_in');
  const winnerIds = new Set(winners.filter((winner) => winner.event_id === eventId && !winner.abandoned).map((winner) => winner.guest_id));
  const blacklistIds = new Set(getActiveLockedWinners(eventId).filter((item) => item.is_blacklist).map((item) => item.guest_id).filter(Boolean));
  const availableGuests = eligibleGuests.filter((guest) => !winnerIds.has(guest.id));

  return {
    prizes: eventPrizes,
    winners: eventWinners,
    records: lotteryRecords.filter((record) => record.event_id === eventId).sort((a, b) => b.draw_time.localeCompare(a.draw_time)),
    locked_winners: lockedWinners.filter((item) => item.event_id === eventId),
    eligible_guests: eligibleGuests.length,
    available_guests: availableGuests.filter((guest) => !blacklistIds.has(guest.id)).length,
    available_guests_list: availableGuests.filter((guest) => !blacklistIds.has(guest.id)),
  };
}

export function drawDemoLottery(input: { event_id: string; prize_id: string; guest_ids: string[] }) {
  const prize = prizes.find((item) => item.id === input.prize_id && item.event_id === input.event_id);
  if (!prize || prize.remaining < input.guest_ids.length) {
    return null;
  }

  const timestamp = new Date().toISOString();
  const records = input.guest_ids.map((guestId) => ({
    id: crypto.randomUUID(),
    event_id: input.event_id,
    prize_id: input.prize_id,
    guest_id: guestId,
    record_id: crypto.randomUUID(),
    win_time: timestamp,
    claimed: false,
    abandoned: false,
  }));
  winners.push(...records);
  prize.remaining -= records.length;
  prize.updated_at = timestamp;

  return {
    winners: records,
    prize,
  };
}

function getActiveLockedWinners(eventId: string) {
  const timestamp = Date.now();
  return lockedWinners.filter((item) => {
    if (item.event_id !== eventId) return false;
    const startsAt = item.effect_time_start ? Date.parse(item.effect_time_start) : Number.NEGATIVE_INFINITY;
    const endsAt = item.effect_time_end ? Date.parse(item.effect_time_end) : Number.POSITIVE_INFINITY;
    return startsAt <= timestamp && timestamp <= endsAt;
  });
}

function getGuestPrizeWinCount(eventId: string, guestId: string, prizeId: string) {
  return winners.filter((winner) => (
    winner.event_id === eventId &&
    winner.guest_id === guestId &&
    winner.prize_id === prizeId &&
    !winner.abandoned
  )).length;
}

function getGuestAnyWinCount(eventId: string, guestId: string) {
  return winners.filter((winner) => winner.event_id === eventId && winner.guest_id === guestId && !winner.abandoned).length;
}

function pickDeterministic<T>(items: T[], count: number, seed: string) {
  const scored = items.map((item, index) => {
    let score = 0;
    for (const char of `${seed}-${index}`) score = (score * 31 + char.charCodeAt(0)) % 1000003;
    score = (score + Date.now() + index * 9973) % 1000003;
    return { item, score };
  });
  return scored.sort((a, b) => a.score - b.score).slice(0, count).map((entry) => entry.item);
}

function getLotteryCandidateGuests(eventId: string, prize: DemoPrize) {
  const activeRules = getActiveLockedWinners(eventId);
  const blacklistGuestIds = new Set(activeRules.filter((rule) => rule.is_blacklist).map((rule) => rule.guest_id).filter(Boolean));
  return guests.filter((guest) => {
    if (guest.event_id !== eventId || guest.check_in_status !== 'checked_in') return false;
    if (blacklistGuestIds.has(guest.id)) return false;
    if (getGuestPrizeWinCount(eventId, guest.id, prize.id) > 0) return false;
    if (!prize.allow_repeat && getGuestAnyWinCount(eventId, guest.id) > 0) return false;
    return true;
  });
}

export function drawDemoLotteryServer(input: {
  event_id: string;
  prize_id: string;
  draw_count?: number;
  mode?: 'auto' | 'redraw';
  operator?: string;
}) {
  const prize = prizes.find((item) => item.id === input.prize_id && item.event_id === input.event_id);
  if (!prize || prize.remaining <= 0) return null;

  const drawCount = Math.max(1, Math.min(input.draw_count || prize.draw_count || 1, prize.remaining));
  const candidates = getLotteryCandidateGuests(input.event_id, prize);
  if (candidates.length === 0) return null;

  const activeLocked = getActiveLockedWinners(input.event_id)
    .filter((rule) => !rule.is_blacklist && !rule.used && (!rule.prize_ids.length || rule.prize_ids.includes(prize.id)));
  const lockedGuests = activeLocked
    .map((rule) => candidates.find((guest) => guest.id === rule.guest_id || guest.name === rule.name))
    .filter((guest): guest is DemoGuest => Boolean(guest));
  const lockedGuestIds = new Set(lockedGuests.map((guest) => guest.id));
  const randomGuests = pickDeterministic(
    candidates.filter((guest) => !lockedGuestIds.has(guest.id)),
    Math.max(0, drawCount - lockedGuests.length),
    `${input.event_id}-${input.prize_id}-${lotteryRecords.length}`,
  );
  const selectedGuests = [...lockedGuests.slice(0, drawCount), ...randomGuests].slice(0, drawCount);
  if (selectedGuests.length === 0) return null;

  const timestamp = new Date().toISOString();
  const record: DemoLotteryRecord = {
    id: crypto.randomUUID(),
    event_id: input.event_id,
    prize_id: prize.id,
    attendee_ids: selectedGuests.map((guest) => guest.id),
    abandoned_attendee_ids: [],
    draw_time: timestamp,
    draw_mode: input.mode || 'auto',
    operator: input.operator,
  };
  lotteryRecords.unshift(record);

  const records: DemoWinner[] = selectedGuests.map((guest) => ({
    id: crypto.randomUUID(),
    event_id: input.event_id,
    prize_id: prize.id,
    guest_id: guest.id,
    record_id: record.id,
    win_time: timestamp,
    claimed: false,
    abandoned: false,
    guests: { name: guest.name, company: guest.company, level: guest.level },
    prizes: { name: prize.name, level: prize.level },
  }));
  winners.push(...records);
  prize.remaining -= records.length;
  prize.updated_at = timestamp;

  activeLocked.forEach((rule) => {
    if (selectedGuests.some((guest) => guest.id === rule.guest_id || guest.name === rule.name)) {
      rule.used = true;
    }
  });

  return { winners: records, record, prize };
}

export function abandonDemoLotteryWinner(input: { event_id: string; winner_id: string }) {
  const winner = winners.find((item) => item.id === input.winner_id && item.event_id === input.event_id && !item.abandoned);
  if (!winner) return null;
  const prize = prizes.find((item) => item.id === winner.prize_id && item.event_id === input.event_id);
  const record = lotteryRecords.find((item) => item.id === winner.record_id);
  winner.abandoned = true;
  winner.claimed = false;
  if (record && !record.abandoned_attendee_ids.includes(winner.guest_id)) record.abandoned_attendee_ids.push(winner.guest_id);
  if (prize) {
    prize.remaining += 1;
    prize.updated_at = new Date().toISOString();
  }
  return { winner, prize, record };
}

export function redrawDemoLotteryWinner(input: { event_id: string; winner_id: string }) {
  const abandoned = abandonDemoLotteryWinner(input);
  if (!abandoned?.prize) return null;
  return drawDemoLotteryServer({
    event_id: input.event_id,
    prize_id: abandoned.prize.id,
    draw_count: 1,
    mode: 'redraw',
  });
}

export function claimDemoLotteryWinner(input: { event_id: string; winner_id: string; claimed: boolean }) {
  const winner = winners.find((item) => item.id === input.winner_id && item.event_id === input.event_id && !item.abandoned);
  if (!winner) return null;
  winner.claimed = input.claimed;
  return winner;
}

export function createDemoLockedWinner(input: {
  event_id: string;
  guest_id?: string;
  name: string;
  company?: string;
  prize_ids?: string[];
  is_blacklist?: boolean;
  effect_time_start?: string;
  effect_time_end?: string;
}) {
  const guest = input.guest_id ? guests.find((item) => item.id === input.guest_id && item.event_id === input.event_id) : undefined;
  const item: DemoLockedWinner = {
    id: crypto.randomUUID(),
    event_id: input.event_id,
    guest_id: guest?.id || input.guest_id,
    name: guest?.name || input.name,
    company: guest?.company || input.company,
    prize_ids: input.prize_ids || [],
    effect_time_start: input.effect_time_start,
    effect_time_end: input.effect_time_end,
    is_blacklist: Boolean(input.is_blacklist),
    used: false,
    created_at: new Date().toISOString(),
  };
  lockedWinners.unshift(item);
  return item;
}

export function deleteDemoLockedWinner(eventId: string, id: string) {
  const index = lockedWinners.findIndex((item) => item.event_id === eventId && item.id === id);
  if (index === -1) return false;
  lockedWinners.splice(index, 1);
  return true;
}

export function listDemoSeatingGuests(eventId: string, seated?: string | null) {
  const mapped = guests
    .filter((guest) => guest.event_id === eventId)
    .map((guest) => ({
      id: guest.id,
      name: guest.name,
      company: guest.company,
      position: guest.position,
      category: guest.level === 'vip' ? 'VIP' : guest.level === 'important' ? '嘉宾' : '普通',
      tableId: seatingTables.find((table) => table.eventId === eventId && table.guests.some((item) => item.id === guest.id))?.id || null,
      seatIndex: seatingTables
        .find((table) => table.eventId === eventId && table.guests.some((item) => item.id === guest.id))
        ?.guests.find((item) => item.id === guest.id)?.seatIndex ?? null,
      locked: Boolean(seatingTables
        .find((table) => table.eventId === eventId && table.guests.some((item) => item.id === guest.id))
        ?.guests.find((item) => item.id === guest.id)?.locked),
    }));

  if (seated === 'true') return mapped.filter((guest) => guest.tableId);
  if (seated === 'false') return mapped.filter((guest) => !guest.tableId);
  return mapped;
}

export function importDemoSeatingGuests(eventId: string, rows: Array<Record<string, unknown>>) {
  const imported = rows.map((row, index) => {
    const name = String(row.name || row['姓名'] || `嘉宾${index + 1}`);
    const level = String(row.category || row.level || '普通') === 'VIP' ? 'vip' : 'normal';
    return createDemoGuest({
      event_id: eventId,
      name,
      company: String(row.company || row['公司'] || ''),
      position: String(row.position || row['职位'] || ''),
      phone: String(row.phone || row['电话'] || row['手机号'] || ''),
      email: String(row.email || row['邮箱'] || ''),
      level,
      source: 'import',
      invite_status: 'draft',
      guest_role: 'attendee',
      profile_snapshot: {
        import_row: index + 1,
        original: row,
      },
    });
  });
  return imported;
}

export function clearDemoSeatingGuests(eventId: string) {
  for (let index = guests.length - 1; index >= 0; index -= 1) {
    if (guests[index].event_id === eventId) guests.splice(index, 1);
  }
  seatingTables.filter((table) => table.eventId === eventId).forEach((table) => {
    table.guests = [];
  });
}

export function listDemoSeatingTables(eventId: string) {
  return seatingTables.filter((table) => table.eventId === eventId);
}

export function createDemoSeatingTable(input: { eventId: string; name: string; capacity: number; shape?: 'round' | 'square' | 'long' }) {
  const table: DemoSeatingTable = {
    id: crypto.randomUUID(),
    eventId: input.eventId,
    name: input.name,
    capacity: input.capacity,
    shape: input.shape || 'round',
    locked: false,
    guests: [],
  };
  seatingTables.push(table);
  return table;
}

export function updateDemoSeatingTable(input: {
  eventId: string;
  tableId: string;
  guestId: string;
  action: 'add' | 'remove' | 'lock' | 'unlock' | 'swap';
  targetTableId?: string;
}) {
  const table = seatingTables.find((item) => item.eventId === input.eventId && item.id === input.tableId);
  const guest = guests.find((item) => item.event_id === input.eventId && item.id === input.guestId);
  if (!table || !guest) return null;

  if (input.action === 'lock' || input.action === 'unlock') {
    const seatedGuest = table.guests.find((item) => item.id === input.guestId);
    if (!seatedGuest) return null;
    seatedGuest.locked = input.action === 'lock';
    return table;
  }

  if (input.action === 'swap') {
    if (!input.targetTableId) return null;
    const targetTable = seatingTables.find((item) => item.eventId === input.eventId && item.id === input.targetTableId);
    const seatedGuest = table.guests.find((item) => item.id === input.guestId);
    if (!targetTable || !seatedGuest || seatedGuest.locked || targetTable.locked || targetTable.guests.length >= targetTable.capacity) return null;
    table.guests = table.guests.filter((item) => item.id !== input.guestId);
    table.guests.forEach((item, index) => {
      item.seatIndex = index;
    });
    targetTable.guests.push({ ...seatedGuest, seatIndex: targetTable.guests.length });
    return targetTable;
  }

  const existingTable = seatingTables.find((item) => item.eventId === input.eventId && item.guests.some((seatedGuest) => seatedGuest.id === input.guestId));
  const existingGuest = existingTable?.guests.find((item) => item.id === input.guestId);
  if (existingGuest?.locked || table.locked) return null;

  seatingTables.filter((item) => item.eventId === input.eventId).forEach((item) => {
    item.guests = item.guests.filter((seatedGuest) => seatedGuest.id !== input.guestId || seatedGuest.locked);
    item.guests.forEach((seatedGuest, index) => {
      seatedGuest.seatIndex = index;
    });
  });

  if (input.action === 'add') {
    if (table.guests.length >= table.capacity) return null;
    table.guests.push({ id: guest.id, name: guest.name, seatIndex: table.guests.length });
  }
  return table;
}

export function updateDemoSeatingTableLock(input: { eventId: string; tableId: string; locked: boolean }) {
  const table = seatingTables.find((item) => item.eventId === input.eventId && item.id === input.tableId);
  if (!table) return null;
  table.locked = input.locked;
  return table;
}

export function deleteDemoSeatingTable(eventId: string, tableId: string) {
  const index = seatingTables.findIndex((table) => table.eventId === eventId && table.id === tableId);
  if (index === -1 || seatingTables[index].guests.length > 0) return false;
  seatingTables.splice(index, 1);
  return true;
}

export function autoArrangeDemoSeating(eventId: string) {
  const eventTables = seatingTables.filter((table) => table.eventId === eventId);
  const unseatedGuests = listDemoSeatingGuests(eventId, 'false');
  let arrangedCount = 0;
  for (const table of eventTables) {
    if (table.locked) continue;
    while (table.guests.length < table.capacity && unseatedGuests.length > 0) {
      const guest = unseatedGuests.shift();
      if (!guest) break;
      table.guests.push({ id: guest.id, name: guest.name, seatIndex: table.guests.length });
      arrangedCount += 1;
    }
  }
  return {
    arrangedCount,
    unassignedCount: unseatedGuests.length,
    assignments: eventTables.map((table) => ({ tableId: table.id, guests: table.guests })),
    unassignedGuests: unseatedGuests,
  };
}

// ==================== Person 统一主数据兼容层 ====================

import type { Person, PersonRole, PersonCreateInput, DedupResult } from '@/types/person';

export type DemoPerson = Person;

function getDemoPersons(eventId: string): DemoPerson[] {
  return getDemoArray(`__xinhuo_demo_persons_${eventId}`, () => {
    const eventGuests = guests.filter((g) => g.event_id === eventId);
    if (eventGuests.length === 0) return [];
    return eventGuests.map((g) => {
      const roles: PersonRole[] = [];
      if (g.guest_role === 'vip') roles.push('vip');
      if (g.guest_role === 'speaker') roles.push('speaker');
      if (g.guest_role === 'attendee') roles.push('attendee');
      if (!roles.length) roles.push('attendee');
      return {
        id: g.id,
        event_id: g.event_id,
        name: g.name,
        phone: g.phone || null,
        email: g.email || null,
        company: g.company || null,
        position: g.position || null,
        roles,
        source: (g.source as Person['source']) || 'manual',
        invite_status: (g.invite_status as Person['invite_status']) || 'confirmed',
        review_status: 'approved' as const,
        checkin_status: g.check_in_status === 'checked_in' ? 'checked_in' : 'pending',
        checkin_time: g.check_in_time || null,
        lottery_eligible: g.check_in_status === 'checked_in',
        seated: Boolean(g.seat_number),
        table_id: null,
        seat_number: g.seat_number || null,
        tags: [],
        notes: null,
        customer_id: g.customer_id || null,
        contact_id: g.contact_id || null,
        created_at: g.created_at,
        updated_at: g.updated_at,
      } satisfies DemoPerson;
    });
  });
}

export function listDemoPersons(eventId: string, filters?: { roles?: PersonRole[]; checkin_status?: string; search?: string }) {
  let items = getDemoPersons(eventId);
  if (filters?.roles?.length) {
    items = items.filter((p) => filters.roles!.some((r) => p.roles.includes(r)));
  }
  if (filters?.checkin_status) {
    items = items.filter((p) => p.checkin_status === filters.checkin_status);
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    items = items.filter((p) => p.name.toLowerCase().includes(s) || (p.company && p.company.toLowerCase().includes(s)) || (p.phone && p.phone.includes(s)));
  }
  return items;
}

export function addDemoPerson(input: PersonCreateInput): DemoPerson {
  const persons = getDemoPersons(input.event_id);
  const person: DemoPerson = {
    id: crypto.randomUUID(),
    event_id: input.event_id,
    name: input.name,
    phone: input.phone || null,
    wechat_id: input.wechat_id || null,
    email: input.email || null,
    company: input.company || null,
    position: input.position || null,
    industry: input.industry || null,
    city: input.city || null,
    roles: input.roles,
    source: input.source,
    invite_status: 'draft',
    review_status: 'pending',
    checkin_status: 'pending',
    checkin_time: null,
    lottery_eligible: false,
    seated: false,
    table_id: null,
    seat_number: null,
    tags: input.tags || [],
    notes: input.notes || null,
    customer_id: null,
    contact_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  persons.push(person);
  return person;
}

export function dedupDemoPerson(eventId: string, phone?: string | null, name?: string, company?: string, email?: string): DedupResult {
  const persons = getDemoPersons(eventId);
  if (phone) {
    const match = persons.find((p) => p.phone === phone);
    if (match) return { isDuplicate: true, matchedPerson: match, matchReason: 'phone', confidence: 'high' };
  }
  if (name && company) {
    const match = persons.find((p) => p.name === name && p.company === company);
    if (match) return { isDuplicate: true, matchedPerson: match, matchReason: 'name_company', confidence: 'medium' };
  }
  if (email) {
    const match = persons.find((p) => p.email === email);
    if (match) return { isDuplicate: true, matchedPerson: match, matchReason: 'email', confidence: 'high' };
  }
  return { isDuplicate: false, confidence: 'low' };
}

export function batchImportDemoPersons(eventId: string, rows: Array<Record<string, string>>): { created: number; skipped: number; errors: string[] } {
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  rows.forEach((row, index) => {
    const name = row.name || row['姓名'] || '';
    if (!name) { errors.push(`第${index + 1}行: 姓名为空`); return; }
    const phone = row.phone || row['手机号'] || row['电话'] || null;
    const dedup = dedupDemoPerson(eventId, phone, name, row.company || row['公司'] || undefined);
    if (dedup.isDuplicate && dedup.confidence === 'high') { skipped++; return; }
    const rolesRaw = (row.roles || row['身份'] || row['身份标签'] || 'attendee').split(/[,，;；]/).map((s) => s.trim()) as PersonRole[];
    const roles: PersonRole[] = rolesRaw.filter((r): r is PersonRole => true);
    addDemoPerson({
      event_id: eventId,
      name,
      phone,
      company: row.company || row['公司'] || null,
      position: row.position || row['职位'] || row['职务'] || null,
      email: row.email || row['邮箱'] || null,
      industry: row.industry || row['行业'] || null,
      city: row.city || row['城市'] || null,
      roles: roles.length > 0 ? roles : ['attendee'],
      source: 'import',
      tags: (row.tags || row['标签'] || '').split(/[,，]/).filter(Boolean).map((s) => s.trim()),
      notes: row.notes || row['备注'] || null,
    });
    created++;
  });
  return { created, skipped, errors };
}

export function getPersonStats(eventId: string) {
  const persons = getDemoPersons(eventId);
  const total = persons.length;
  const checkedIn = persons.filter((p) => p.checkin_status === 'checked_in').length;
  const roleCounts: Record<string, number> = {};
  persons.forEach((p) => {
    p.roles.forEach((role) => {
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
  });
  return { total, checkedIn, checkinRate: total > 0 ? Math.round((checkedIn / total) * 100) : 0, roleCounts };
}

// ==================== 表单回收模块 ====================

import type { FormTemplate, FormField, FormSubmission, REGISTRATION_FORM_DEFAULTS, SPONSOR_FORM_DEFAULTS } from '@/types/forms';

type DemoForm = FormTemplate;
type DemoSubmission = FormSubmission;

function getDemoFormsArray(): DemoForm[] {
  return getDemoArray('__xinhuo_demo_forms', () => []);
}

function getDemoSubmissionsArray(): DemoSubmission[] {
  return getDemoArray('__xinhuo_demo_submissions', () => []);
}

export function listDemoForms(eventId: string): DemoForm[] {
  return getDemoFormsArray().filter((f) => f.event_id === eventId);
}

export function getDemoForm(formId: string): DemoForm | undefined {
  return getDemoFormsArray().find((f) => f.id === formId);
}

export function createDemoForm(input: {
  event_id: string; type: 'registration' | 'sponsor'; title: string;
  description?: string; fields: FormField[]; auto_approve?: boolean;
}): DemoForm {
  const forms = getDemoFormsArray();
  const now = new Date().toISOString();
  const form: DemoForm = {
    id: crypto.randomUUID(),
    event_id: input.event_id,
    type: input.type,
    title: input.title,
    description: input.description || '',
    fields: input.fields,
    status: 'draft',
    auto_approve: input.auto_approve ?? false,
    created_at: now,
    updated_at: now,
  };
  forms.push(form);
  return form;
}

export function createDemoFormFromTemplate(eventId: string, type: 'registration' | 'sponsor', title: string): DemoForm {
  const defaults: FormField[] = type === 'registration'
    ? (globalThis as Record<string, unknown>).__REGISTRATION_DEFAULTS as FormField[] || [
        { id: 'name', label: '姓名', type: 'text', required: true, placeholder: '请输入姓名', order: 1 },
        { id: 'company', label: '公司', type: 'text', required: true, placeholder: '请输入公司名称', order: 2 },
        { id: 'position', label: '职务', type: 'text', required: false, placeholder: '请输入职务', order: 3 },
        { id: 'phone', label: '手机号', type: 'tel', required: true, placeholder: '请输入手机号', order: 4 },
        { id: 'wechat_id', label: '微信号', type: 'text', required: false, placeholder: '请输入微信号', order: 5 },
        { id: 'email', label: '邮箱', type: 'email', required: false, placeholder: '请输入邮箱', order: 6 },
        { id: 'city', label: '城市', type: 'text', required: false, placeholder: '请输入所在城市', order: 7 },
        { id: 'is_member', label: '是否会员', type: 'select', required: false, options: ['是', '否'], order: 8 },
        { id: 'need_invoice', label: '是否需要发票', type: 'select', required: false, options: ['需要', '不需要'], order: 9 },
        { id: 'attend_dinner', label: '是否参加晚宴', type: 'select', required: false, options: ['参加', '不参加'], order: 10 },
        { id: 'notes', label: '备注', type: 'textarea', required: false, placeholder: '如有特殊需求请说明', order: 11 },
      ]
    : [
        { id: 'company_name', label: '企业名称', type: 'text', required: true, placeholder: '请输入企业名称', order: 1 },
        { id: 'contact_name', label: '联系人', type: 'text', required: true, placeholder: '请输入联系人姓名', order: 2 },
        { id: 'contact_position', label: '职务', type: 'text', required: false, placeholder: '请输入职务', order: 3 },
        { id: 'phone', label: '手机号', type: 'tel', required: true, placeholder: '请输入手机号', order: 4 },
        { id: 'wechat_id', label: '微信号', type: 'text', required: false, placeholder: '请输入微信号', order: 5 },
        { id: 'email', label: '邮箱', type: 'email', required: false, placeholder: '请输入邮箱', order: 6 },
        { id: 'sponsor_intent', label: '赞助意向等级', type: 'select', required: true, options: ['总冠名', '联合主办', '钻石赞助', '黄金赞助', '白银赞助', '晚宴赞助', '礼品赞助', '媒体支持'], order: 7 },
        { id: 'sponsor_amount', label: '预计赞助金额', type: 'number', required: false, placeholder: '请输入金额(元)', order: 8 },
        { id: 'need_booth', label: '是否需要展位', type: 'select', required: false, options: ['需要', '不需要'], order: 9 },
        { id: 'has_logo', label: '是否提供Logo', type: 'select', required: false, options: ['已准备好', '稍后提供', '无需提供'], order: 10 },
        { id: 'has_materials', label: '是否提供宣传资料', type: 'select', required: false, options: ['已准备好', '稍后提供', '无需提供'], order: 11 },
        { id: 'notes', label: '备注', type: 'textarea', required: false, placeholder: '其他需求或说明', order: 12 },
      ];
  return createDemoForm({ event_id: eventId, type, title, fields: defaults, auto_approve: false });
}

export function updateDemoForm(formId: string, updates: Partial<Pick<DemoForm, 'title' | 'description' | 'fields' | 'status' | 'auto_approve'>>): DemoForm | null {
  const form = getDemoFormsArray().find((f) => f.id === formId);
  if (!form) return null;
  Object.assign(form, updates, { updated_at: new Date().toISOString() });
  return form;
}

export function deleteDemoForm(formId: string): boolean {
  const forms = getDemoFormsArray();
  const idx = forms.findIndex((f) => f.id === formId);
  if (idx === -1) return false;
  forms.splice(idx, 1);
  getDemoSubmissionsArray().filter((s) => s.form_id !== formId);
  return true;
}

export function publishDemoForm(formId: string): DemoForm | null {
  return updateDemoForm(formId, { status: 'published' });
}

export function closeDemoForm(formId: string): DemoForm | null {
  return updateDemoForm(formId, { status: 'closed' });
}

export function listDemoFormSubmissions(formId: string): DemoSubmission[] {
  return getDemoSubmissionsArray().filter((s) => s.form_id === formId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function submitDemoForm(formId: string, data: Record<string, unknown>): DemoSubmission {
  const form = getDemoFormsArray().find((f) => f.id === formId);
  if (!form) throw new Error('表单不存在');
  const submissions = getDemoSubmissionsArray();
  const now = new Date().toISOString();
  const submission: DemoSubmission = {
    id: crypto.randomUUID(),
    form_id: formId,
    event_id: form.event_id,
    data,
    status: form.auto_approve ? 'approved' : 'pending',
    created_at: now,
  };
  submissions.push(submission);

  if (form.auto_approve) {
    
    const name = String(data.name || data['姓名'] || data.contact_name || data['联系人'] || '');
    const phone = String(data.phone || data['手机号'] || data['电话'] || '');
    addDemoPerson({
      event_id: form.event_id,
      name,
      phone: phone || null,
      company: String(data.company || data.company_name || data['公司'] || data['企业名称'] || ''),
      position: String(data.position || data.contact_position || data['职务'] || ''),
      email: String(data.email || data['邮箱'] || ''),
      roles: form.type === 'sponsor' ? ['sponsor_rep'] : ['attendee'],
      source: 'form',
      notes: String(data.notes || data['备注'] || ''),
    });
  }

  return submission;
}

export function updateDemoSubmissionStatus(submissionId: string, status: 'pending' | 'approved' | 'rejected'): DemoSubmission | null {
  const sub = getDemoSubmissionsArray().find((s) => s.id === submissionId);
  if (!sub) return null;
  sub.status = status;
  if (status === 'approved') {
    try {
      
      const d = sub.data;
      const name = String(d.name || d['姓名'] || d.contact_name || d['联系人'] || '');
      addDemoPerson({
        event_id: sub.event_id,
        name,
        phone: String(d.phone || d['手机号'] || d['电话'] || '') || null,
        company: String(d.company || d.company_name || d['公司'] || d['企业名称'] || ''),
        position: String(d.position || d.contact_position || d['职务'] || ''),
        email: String(d.email || d['邮箱'] || ''),
        roles: ['attendee'],
        source: 'form',
        notes: String(d.notes || d['备注'] || ''),
      });
    } catch { /* ignore */ }
  }
  return sub;
}

// ==================== 赞助商独立模块 ====================

import type { Sponsor, SponsorLevel, SponsorBenefit, SponsorContractStatus, SponsorPaymentStatus } from '@/types/sponsor';

type DemoSponsor = Sponsor;

function getDemoSponsorsArray(): DemoSponsor[] {
  return getDemoArray('__xinhuo_demo_sponsors', () => {
    const now = new Date().toISOString();
    return [
      {
        id: 'sponsor-001',
        event_id: events[0].id,
        customer_id: demoCustomerId,
        name: '龙芯中科技术股份有限公司',
        level: 'gold' as SponsorLevel,
        level_name: '黄金赞助商',
        amount: 100000,
        currency: 'CNY',
        contact_name: '陈总',
        contact_phone: '139-0000-1001',
        contact_wechat: 'chen-xinhuo',
        contact_email: 'chen@example.com',
        logo_url: '',
        company_intro: '国产CPU领军企业',
        booth_needed: true,
        booth_number: 'S-01',
        booth_size: '3m x 3m',
        contract_status: 'signed' as SponsorContractStatus,
        payment_status: 'paid' as SponsorPaymentStatus,
        invoice_title: '龙芯中科技术股份有限公司',
        benefits: ['logo_display', 'backdrop', 'mc_mention', 'booth', 'guest_slots', 'vip_seats'] as SponsorBenefit[],
        notes: '重点赞助商',
        created_at: now,
        updated_at: now,
      },
    ] satisfies DemoSponsor[];
  });
}

export function listDemoSponsors(eventId: string): DemoSponsor[] {
  return getDemoSponsorsArray().filter((s) => s.event_id === eventId);
}

export function getDemoSponsor(sponsorId: string): DemoSponsor | undefined {
  return getDemoSponsorsArray().find((s) => s.id === sponsorId);
}

export function createDemoSponsor(input: Omit<DemoSponsor, 'id' | 'created_at' | 'updated_at' | 'contract_status' | 'payment_status' | 'booth_needed' | 'benefits' | 'currency'> & {
  benefits?: string[];
  level: string;
  booth_needed?: boolean;
}): DemoSponsor {
  const arr = getDemoSponsorsArray();
  const now = new Date().toISOString();
  const sponsor: DemoSponsor = {
    id: crypto.randomUUID(),
    event_id: input.event_id,
    name: input.name,
    level: input.level as SponsorLevel,
    level_name: input.level_name || '',
    amount: input.amount || 0,
    currency: 'CNY',
    contact_name: input.contact_name || '',
    contact_phone: input.contact_phone || '',
    contact_wechat: input.contact_wechat || '',
    contact_email: input.contact_email || '',
    logo_url: input.logo_url || '',
    company_intro: input.company_intro || '',
    booth_needed: input.booth_needed ?? false,
    contract_status: 'draft',
    payment_status: 'unpaid',
    benefits: (input.benefits || []) as SponsorBenefit[],
    notes: input.notes || '',
    created_at: now,
    updated_at: now,
  };
  arr.push(sponsor);
  return sponsor;
}

export function updateDemoSponsor(sponsorId: string, updates: Partial<DemoSponsor>): DemoSponsor | null {
  const sponsor = getDemoSponsorsArray().find((s) => s.id === sponsorId);
  if (!sponsor) return null;
  Object.assign(sponsor, updates, { updated_at: new Date().toISOString() });
  return sponsor;
}

export function deleteDemoSponsor(sponsorId: string): boolean {
  const arr = getDemoSponsorsArray();
  const idx = arr.findIndex((s) => s.id === sponsorId);
  if (idx === -1) return false;
  arr.splice(idx, 1);
  return true;
}

// ==================== 预算费用管理 ====================

export type DemoBudgetLine = {
  id: string;
  event_id: string;
  category: 'venue' | 'construction' | 'catering' | 'materials' | 'gifts' | 'personnel' | 'transport' | 'other';
  description: string;
  budget_amount: number;
  actual_amount: number;
  supplier_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

function getDemoBudgetArray(): DemoBudgetLine[] {
  return getDemoArray('__xinhuo_demo_budget', () => {
    const now = new Date().toISOString();
    return [
      { id: crypto.randomUUID(), event_id: events[0].id, category: 'venue' as const, description: '会展中心场地费', budget_amount: 15000, actual_amount: 15000, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: events[0].id, category: 'construction' as const, description: '主舞台搭建', budget_amount: 8000, actual_amount: 7800, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: events[0].id, category: 'catering' as const, description: '晚宴餐饮', budget_amount: 12000, actual_amount: 0, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: events[0].id, category: 'gifts' as const, description: '伴手礼采购', budget_amount: 5000, actual_amount: 4500, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: events[0].id, category: 'other' as const, description: '应急储备金', budget_amount: 10000, actual_amount: 0, created_at: now, updated_at: now },
    ];
  });
}

export function listDemoBudgetLines(eventId: string): DemoBudgetLine[] {
  return getDemoBudgetArray().filter((b) => b.event_id === eventId);
}

export function createDemoBudgetLine(input: Omit<DemoBudgetLine, 'id' | 'created_at' | 'updated_at' | 'actual_amount'> & { actual_amount?: number }): DemoBudgetLine {
  const arr = getDemoBudgetArray();
  const now = new Date().toISOString();
  const line: DemoBudgetLine = { ...input, actual_amount: input.actual_amount || 0, id: crypto.randomUUID(), created_at: now, updated_at: now };
  arr.push(line);
  return line;
}

export function updateDemoBudgetLine(id: string, updates: Partial<DemoBudgetLine>): DemoBudgetLine | null {
  const line = getDemoBudgetArray().find((b) => b.id === id);
  if (!line) return null;
  Object.assign(line, updates, { updated_at: new Date().toISOString() });
  return line;
}

export function deleteDemoBudgetLine(id: string): boolean {
  const arr = getDemoBudgetArray();
  const idx = arr.findIndex((b) => b.id === id);
  if (idx === -1) return false;
  arr.splice(idx, 1);
  return true;
}

// ==================== 供应商评价 ====================



function getDemoReviewsArray(): DemoSupplierReview[] {
  return getDemoArray('__xinhuo_demo_supplier_reviews', () => {
    const now = new Date().toISOString();
    return [
      { id: crypto.randomUUID(), supplier_id: suppliers[0].id, event_id: events[0].id, rating: 4.8, quality_score: 5, delivery_score: 4.5, communication_score: 5, content: '场地服务专业，搭建准时。', created_at: now, updated_at: now },
    ];
  });
}

export function listDemoSupplierReviews(supplierId: string): DemoSupplierReview[] {
  return getDemoReviewsArray().filter((r) => r.supplier_id === supplierId);
}

export function createDemoSupplierReview(input: Omit<DemoSupplierReview, 'id' | 'created_at' | 'updated_at'>): DemoSupplierReview {
  const arr = getDemoReviewsArray();
  const now = new Date().toISOString();
  const review: DemoSupplierReview = { ...input, id: crypto.randomUUID(), created_at: now, updated_at: now };
  arr.push(review);
  return review;
}

export function deleteDemoSupplierReview(id: string): boolean {
  const arr = getDemoReviewsArray();
  const idx = arr.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  arr.splice(idx, 1);
  return true;
}

// ==================== 名单管理 - 执行小组 ====================

import type {
  ExecTeamMember, ExecRole,
  GuestEntry, GuestType, GuestStatus,
  SponsorRosterEntry,
  AttendeeEntry, AttendeeSource,
  RosterStats,
} from '@/types/roster';

// -- 执行小组 --

function getDemoExecTeamArray(): ExecTeamMember[] {
  return getDemoArray('__xinhuo_demo_exec_team', () => {
    const now = new Date().toISOString();
    const eid = events[0].id;
    return [
      { id: crypto.randomUUID(), event_id: eid, role: 'director' as ExecRole, name: '陈总导演', phone: '138-0001-0001', wechat_id: 'chen-director', email: 'chen@xinhuo.com', responsibility: '全场活动总控，统筹各环节衔接，现场指挥调度，确保活动按台本执行', order: 1, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, role: 'planner' as ExecRole, name: '李策划', phone: '138-0001-0002', wechat_id: 'li-planner', responsibility: '活动整体方案策划，流程设计，嘉宾邀请策略，赞助方案制定', order: 2, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, role: 'logistics' as ExecRole, name: '王后勤', phone: '138-0001-0003', wechat_id: 'wang-logistics', responsibility: '场地物资采购调配，伴手礼发放，餐饮安排，交通调度，后勤保障', order: 3, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, role: 'site_manager' as ExecRole, name: '赵现场', phone: '138-0001-0004', wechat_id: 'zhao-site', responsibility: '活动当天现场总负责，舞台搭建验收，座位安排确认，流程彩排协调，应急处理', order: 4, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, role: 'pr_manager' as ExecRole, name: '钱宣传', phone: '138-0001-0005', wechat_id: 'qian-pr', responsibility: '活动预热宣传，媒体邀请与接待，新闻通稿撰写，公众号发布，现场拍摄管理', order: 5, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, role: 'attendee_manager' as ExecRole, name: '孙参会', phone: '138-0001-0006', wechat_id: 'sun-attendee', responsibility: '参会名单汇总整理，邀请函发送，回执收集，座位需求统计，签到名单导出', order: 6, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, role: 'investment_manager' as ExecRole, name: '周招商', phone: '138-0001-0007', wechat_id: 'zhou-investment', responsibility: '赞助商招商方案制定，赞助权益洽谈，合同签署跟进，赞助回报执行监督', order: 7, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, role: 'checkin_manager' as ExecRole, name: '吴签到', phone: '138-0001-0008', wechat_id: 'wu-checkin', responsibility: '签到系统部署测试，签到人员安排，现场签到引导，签到数据实时监控', order: 8, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, role: 'agency_liaison' as ExecRole, name: '郑对接', phone: '138-0001-0009', wechat_id: 'zheng-agency', responsibility: '策划公司沟通协调，设计方案确认，物料制作进度跟踪，现场搭建对接', order: 9, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, role: 'venue_liaison' as ExecRole, name: '冯场地', phone: '138-0001-0010', wechat_id: 'feng-venue', responsibility: '酒店/会展中心对接，场地合同确认，设备清单核对，场地进场撤场协调', order: 10, created_at: now, updated_at: now },
    ];
  });
}

export function listDemoExecTeam(eventId: string) { return getDemoExecTeamArray().filter((m) => m.event_id === eventId).sort((a, b) => a.order - b.order); }
export function createDemoExecMember(input: Omit<ExecTeamMember, 'id' | 'created_at' | 'updated_at'>): ExecTeamMember {
  const arr = getDemoExecTeamArray();
  const now = new Date().toISOString();
  const m: ExecTeamMember = { ...input, id: crypto.randomUUID(), created_at: now, updated_at: now };
  arr.push(m); return m;
}
export function updateDemoExecMember(id: string, updates: Partial<ExecTeamMember>): ExecTeamMember | null {
  const m = getDemoExecTeamArray().find((x) => x.id === id);
  if (!m) return null;
  Object.assign(m, updates, { updated_at: new Date().toISOString() }); return m;
}
export function deleteDemoExecMember(id: string): boolean {
  const arr = getDemoExecTeamArray(); const idx = arr.findIndex((x) => x.id === id); if (idx === -1) return false; arr.splice(idx, 1); return true;
}

// -- 嘉宾 --

function getDemoGuestEntriesArray(): GuestEntry[] {
  return getDemoArray('__xinhuo_demo_guest_entries', () => {
    const now = new Date().toISOString();
    const eid = events[0].id;
    return [
      { id: crypto.randomUUID(), event_id: eid, name: '张院士', guest_type: 'forum_guest' as GuestType, title: '中国科学院院士', company: '中科院计算所', avatar_url: '', bio: '芯片架构领域权威专家，主持多项国家重点研发计划，累计发表论文200余篇。', speech_topic: 'AI芯片架构发展趋势与国产替代路径', segment: '圆桌论坛', need_reception: true, need_seat: true, seat_info: '主桌-1', need_dinner: true, status: 'confirmed' as GuestStatus, phone: '139-0001-0001', wechat_id: 'zhang-academic', order: 1, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, name: '李董事长', guest_type: 'speaker' as GuestType, title: '董事长兼CEO', company: '龙芯中科', avatar_url: '', bio: '国产CPU产业领军人物，带领龙芯从实验室走向市场，年出货量突破百万。', speech_topic: '国产CPU的生态建设与实践', segment: '主旨演讲', need_reception: true, need_seat: true, seat_info: '主桌-2', need_dinner: true, status: 'confirmed' as GuestStatus, phone: '139-0001-0002', order: 2, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, name: '王教授', guest_type: 'roundtable_guest' as GuestType, title: '集成电路学院院长', company: '清华大学', avatar_url: '', bio: '集成电路学科带头人，培养芯片人才数千人，推动产教融合新模式。', speech_topic: '芯片人才培养与产业需求对接', segment: '圆桌对话', need_reception: false, need_seat: true, seat_info: '嘉宾席-1', need_dinner: true, status: 'confirmed' as GuestStatus, order: 3, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, name: '黄总', guest_type: 'special_guest' as GuestType, title: '副会长', company: '中国半导体行业协会', avatar_url: '', bio: '半导体行业资深人士，历任多家芯片企业中高管。', segment: '颁奖环节', need_reception: true, need_seat: true, seat_info: '主桌-3', need_dinner: true, status: 'invited' as GuestStatus, phone: '139-0001-0004', order: 4, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, name: '程司长', guest_type: 'leader' as GuestType, title: '副局长', company: '工信部', avatar_url: '', bio: '集成电路产业政策制定与实施负责人。', segment: '开幕致辞', need_reception: true, need_seat: true, seat_info: '主桌-4', need_dinner: true, status: 'pending' as GuestStatus, order: 5, created_at: now, updated_at: now },
    ];
  });
}

export function listDemoGuestEntries(eventId: string, filters?: { search?: string; status?: string }) {
  let items = getDemoGuestEntriesArray().filter((g) => g.event_id === eventId);
  if (filters?.search) { const s = filters.search.toLowerCase(); items = items.filter((g) => g.name.toLowerCase().includes(s) || g.company.toLowerCase().includes(s)); }
  if (filters?.status) items = items.filter((g) => g.status === filters.status);
  return items.sort((a, b) => a.order - b.order);
}
export function createDemoGuestEntry(input: Omit<GuestEntry, 'id' | 'created_at' | 'updated_at'>): GuestEntry {
  const arr = getDemoGuestEntriesArray(); const now = new Date().toISOString();
  const g: GuestEntry = { ...input, id: crypto.randomUUID(), created_at: now, updated_at: now };
  arr.push(g); return g;
}
export function updateDemoGuestEntry(id: string, updates: Partial<GuestEntry>): GuestEntry | null {
  const g = getDemoGuestEntriesArray().find((x) => x.id === id);
  if (!g) return null; Object.assign(g, updates, { updated_at: new Date().toISOString() }); return g;
}
export function deleteDemoGuestEntry(id: string): boolean {
  const arr = getDemoGuestEntriesArray(); const idx = arr.findIndex((x) => x.id === id); if (idx === -1) return false; arr.splice(idx, 1); return true;
}

// -- 赞助商名单视图 (引用现有 Sponsor 数据) --

export function listDemoSponsorRoster(eventId: string): SponsorRosterEntry[] {
  return listDemoSponsors(eventId).map((sponsor) => ({
    id: sponsor.id,
    event_id: sponsor.event_id,
    name: sponsor.name,
    level: sponsor.level,
    level_label: sponsor.level_name || sponsor.level,
    amount: sponsor.amount || 0,
    contact_name: sponsor.contact_name || '',
    contact_phone: sponsor.contact_phone || '',
    contact_wechat: sponsor.contact_wechat || '',
    contact_email: sponsor.contact_email || '',
    logo_url: sponsor.logo_url,
    benefits: sponsor.benefits,
    booth_number: sponsor.booth_number,
    contract_status: sponsor.contract_status,
    payment_status: sponsor.payment_status,
    guest_slots: sponsor.benefits.includes('guest_slots' as never) ? 5 : 2,
    vip_seats: sponsor.benefits.includes('vip_seats' as never) ? 3 : 1,
    notes: sponsor.notes,
    created_at: sponsor.created_at,
    updated_at: sponsor.updated_at,
  }));
}

// -- 参会人 --

function getDemoAttendeeEntriesArray(): AttendeeEntry[] {
  return getDemoArray('__xinhuo_demo_attendee_entries', () => {
    const now = new Date().toISOString();
    const eid = events[0].id;
    return [
      { id: crypto.randomUUID(), event_id: eid, name: '杨经理', phone: '137-0002-0001', wechat_id: 'yang-mgr', email: 'yang@chipco.com', company: '华为海思', position: '市场经理', industry: '芯片设计', city: '深圳', source: 'form' as AttendeeSource, review_status: 'approved' as const, is_member: true, need_invoice: false, attend_dinner: true, tags: ['VIP客户', '老客户'], checkin_status: 'checked_in' as const, checkin_time: '2026-06-14T18:30:00Z', lottery_eligible: true, seated: true, table_id: 'table-1', seat_number: '主桌-5', created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, name: '刘总', phone: '137-0002-0002', company: '紫光展锐', position: '副总', industry: '芯片设计', city: '上海', source: 'form' as AttendeeSource, review_status: 'approved' as const, is_member: false, need_invoice: true, attend_dinner: true, tags: [], checkin_status: 'checked_in' as const, checkin_time: '2026-06-14T18:45:00Z', lottery_eligible: true, seated: true, table_id: 'table-1', seat_number: '主桌-6', created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, name: '陈工', phone: '137-0002-0003', company: '中芯国际', position: '工程师', industry: '芯片制造', city: '上海', source: 'manual' as AttendeeSource, review_status: 'approved' as const, is_member: false, need_invoice: false, attend_dinner: true, tags: ['技术大咖'], checkin_status: 'pending' as const, lottery_eligible: false, seated: false, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, name: '赵经理', phone: '137-0002-0004', company: '华大九天', position: '销售经理', industry: 'EDA工具', city: '北京', source: 'import' as AttendeeSource, review_status: 'pending' as const, is_member: false, need_invoice: false, attend_dinner: false, tags: [], checkin_status: 'pending' as const, lottery_eligible: false, seated: false, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, name: '周主任', phone: '137-0002-0005', company: '电子科技大学', position: '实验室主任', industry: '高校', city: '成都', source: 'form' as AttendeeSource, review_status: 'approved' as const, is_member: true, need_invoice: false, attend_dinner: true, tags: ['学术合作'], checkin_status: 'pending' as const, lottery_eligible: false, seated: false, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, name: '吴投资', phone: '137-0002-0006', company: '深创投', position: '投资总监', industry: '投资', city: '深圳', source: 'manual' as AttendeeSource, review_status: 'approved' as const, is_member: false, need_invoice: false, attend_dinner: true, tags: ['投资机构', '重点关注'], checkin_status: 'pending' as const, lottery_eligible: false, seated: false, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, name: '郑媒体', phone: '137-0002-0007', company: '电子工程专辑', position: '记者', industry: '媒体', city: '深圳', source: 'form' as AttendeeSource, review_status: 'approved' as const, is_member: false, need_invoice: false, attend_dinner: true, tags: ['媒体'], checkin_status: 'pending' as const, lottery_eligible: false, seated: false, created_at: now, updated_at: now },
      { id: crypto.randomUUID(), event_id: eid, name: '冯合作', phone: '137-0002-0008', company: '粤芯半导体', position: '供应链总监', industry: '芯片制造', city: '广州', source: 'form' as AttendeeSource, review_status: 'pending' as const, is_member: false, need_invoice: true, attend_dinner: true, tags: [], checkin_status: 'pending' as const, lottery_eligible: false, seated: false, created_at: now, updated_at: now },
    ];
  });
}

export function listDemoAttendeeEntries(eventId: string, filters?: { search?: string; status?: string }) {
  let items = getDemoAttendeeEntriesArray().filter((a) => a.event_id === eventId);
  if (filters?.search) { const s = filters.search.toLowerCase(); items = items.filter((a) => a.name.toLowerCase().includes(s) || (a.company && a.company.toLowerCase().includes(s)) || (a.phone && a.phone.includes(s))); }
  if (filters?.status) {
    if (filters.status === 'checked_in') items = items.filter((a) => a.checkin_status === 'checked_in');
    else if (filters.status === 'pending_review') items = items.filter((a) => a.review_status === 'pending');
  }
  return items;
}
export function createDemoAttendeeEntry(input: Omit<AttendeeEntry, 'id' | 'checkin_status' | 'checkin_time' | 'lottery_eligible' | 'seated' | 'created_at' | 'updated_at'>): AttendeeEntry {
  const arr = getDemoAttendeeEntriesArray(); const now = new Date().toISOString();
  const a: AttendeeEntry = { ...input, id: crypto.randomUUID(), checkin_status: 'pending', lottery_eligible: false, seated: false, created_at: now, updated_at: now };
  arr.push(a); return a;
}
export function updateDemoAttendeeEntry(id: string, updates: Partial<AttendeeEntry>): AttendeeEntry | null {
  const a = getDemoAttendeeEntriesArray().find((x) => x.id === id);
  if (!a) return null; Object.assign(a, updates, { updated_at: new Date().toISOString() }); return a;
}
export function deleteDemoAttendeeEntry(id: string): boolean {
  const arr = getDemoAttendeeEntriesArray(); const idx = arr.findIndex((x) => x.id === id); if (idx === -1) return false; arr.splice(idx, 1); return true;
}
export function batchImportDemoAttendees(eventId: string, rows: Array<Record<string, string>>): { created: number; skipped: number; errors: string[] } {
  let created = 0; let skipped = 0; const errors: string[] = [];
  const existing = getDemoAttendeeEntriesArray().filter((a) => a.event_id === eventId);
  rows.forEach((row, i) => {
    const name = (row.name || row['姓名'] || '').trim();
    if (!name) { errors.push(`第${i + 1}行: 姓名为空`); return; }
    const phone = (row.phone || row['手机号'] || row['电话'] || '').trim();
    if (phone && existing.some((a) => a.phone === phone)) { skipped++; return; }
    createDemoAttendeeEntry({
      event_id: eventId, name,
      phone: phone || undefined,
      review_status: 'pending' as const,
      company: (row.company || row['公司'] || row['单位'] || '').trim() || undefined,
      position: (row.position || row['职位'] || row['职务'] || '').trim() || undefined,
      industry: (row.industry || row['行业'] || '').trim() || undefined,
      city: (row.city || row['城市'] || '').trim() || undefined,
      source: 'import',
      is_member: false,
      need_invoice: false,
      attend_dinner: true,
      tags: (row.tags || row['标签'] || '').split(/[,，]/).map((s) => s.trim()).filter(Boolean),
      notes: (row.notes || row['备注'] || '').trim() || undefined,
    });
    created++;
  });
  return { created, skipped, errors };
}

// -- 名单统计 --

export function getDemoRosterStats(eventId: string): RosterStats {
  const execTeam = getDemoExecTeamArray().filter((m) => m.event_id === eventId);
  const guests = getDemoGuestEntriesArray().filter((g) => g.event_id === eventId);
  const sponsors = listDemoSponsorRoster(eventId);
  const attendees = getDemoAttendeeEntriesArray().filter((a) => a.event_id === eventId);
  return {
    total: attendees.length + guests.length,
    exec_team: execTeam.length,
    guests: guests.length,
    sponsors: sponsors.length,
    attendees: attendees.length,
    attendee_approved: attendees.filter((a) => a.review_status === 'approved').length,
    attendee_checked_in: attendees.filter((a) => a.checkin_status === 'checked_in').length,
    guest_confirmed: guests.filter((g) => g.status === 'confirmed' || g.status === 'attended').length,
    sponsor_total_amount: sponsors.reduce((s, sp) => s + sp.amount, 0),
  };
}
