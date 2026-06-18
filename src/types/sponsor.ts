// 赞助商独立实体类型 — 平台方案 v2.0

export type SponsorLevel =
  | 'title'
  | 'co_host'
  | 'diamond'
  | 'platinum'
  | 'gold'
  | 'strategic'
  | 'silver'
  | 'bronze'
  | 'supporting'
  | 'dinner'
  | 'gift'
  | 'lottery'
  | 'souvenir'
  | 'media'
  | 'custom';

export const SPONSOR_LEVEL_LABELS: Record<SponsorLevel, string> = {
  title: '总冠名',
  co_host: '联合主办',
  diamond: '钻石赞助',
  platinum: '铂金赞助',
  gold: '黄金赞助',
  strategic: '战略合作',
  silver: '白银赞助',
  bronze: '青铜赞助',
  supporting: '支持单位',
  dinner: '晚宴赞助',
  gift: '礼品赞助',
  lottery: '抽奖赞助',
  souvenir: '伴手礼赞助',
  media: '媒体支持',
  custom: '自定义',
};

export type SponsorBenefit =
  | 'logo_display'
  | 'backdrop'
  | 'mc_mention'
  | 'brochure'
  | 'booth'
  | 'guest_slots'
  | 'vip_seats'
  | 'lottery_exposure'
  | 'wechat_article'
  | 'video_channel';

export const SPONSOR_BENEFIT_LABELS: Record<SponsorBenefit, string> = {
  logo_display: 'Logo展示',
  backdrop: '背板展示',
  mc_mention: '主持人口播',
  brochure: '宣传册露出',
  booth: '展位权益',
  guest_slots: '嘉宾名额',
  vip_seats: 'VIP座位',
  lottery_exposure: '抽奖露出',
  wechat_article: '公众号推文',
  video_channel: '视频号露出',
};

export type SponsorContractStatus = 'draft' | 'sent' | 'signed' | 'completed' | 'cancelled';
export type SponsorPaymentStatus = 'unpaid' | 'partial' | 'paid' | 'waived';

export interface Sponsor {
  id: string;
  event_id: string;
  customer_id?: string | null;

  // 基础信息
  name: string;
  level: SponsorLevel;
  level_name?: string;
  amount?: number;
  currency?: string;

  // 联系人
  contact_name?: string;
  contact_phone?: string;
  contact_wechat?: string;
  contact_email?: string;

  // 品牌素材
  logo_url?: string;
  company_intro?: string;
  promo_image_url?: string;

  // 展位
  booth_needed: boolean;
  booth_number?: string;
  booth_size?: string;

  // 合同与付款
  contract_status: SponsorContractStatus;
  payment_status: SponsorPaymentStatus;
  invoice_title?: string;
  invoice_tax_no?: string;

  // 权益
  benefits: SponsorBenefit[];
  benefit_notes?: string;

  // 对接人
  account_manager?: string;

  // 笔记
  notes?: string;

  created_at: string;
  updated_at: string;
}

export interface SponsorBenefitTemplate {
  level: SponsorLevel;
  benefits: SponsorBenefit[];
  guest_slots: number;
  vip_seats: number;
  description?: string;
}

// 默认权益模板
export const DEFAULT_BENEFIT_TEMPLATES: SponsorBenefitTemplate[] = [
  {
    level: 'title',
    benefits: ['logo_display', 'backdrop', 'mc_mention', 'brochure', 'booth', 'guest_slots', 'vip_seats', 'lottery_exposure', 'wechat_article', 'video_channel'],
    guest_slots: 10,
    vip_seats: 5,
    description: '全场最高级别赞助权益',
  },
  {
    level: 'diamond',
    benefits: ['logo_display', 'backdrop', 'mc_mention', 'brochure', 'booth', 'guest_slots', 'vip_seats', 'lottery_exposure', 'wechat_article'],
    guest_slots: 5,
    vip_seats: 3,
    description: '钻石级赞助权益',
  },
  {
    level: 'gold',
    benefits: ['logo_display', 'backdrop', 'mc_mention', 'brochure', 'booth', 'guest_slots', 'vip_seats'],
    guest_slots: 3,
    vip_seats: 2,
    description: '黄金级赞助权益',
  },
  {
    level: 'silver',
    benefits: ['logo_display', 'backdrop', 'mc_mention', 'guest_slots'],
    guest_slots: 2,
    vip_seats: 1,
    description: '白银级赞助权益',
  },
  {
    level: 'dinner',
    benefits: ['logo_display', 'backdrop', 'mc_mention', 'guest_slots', 'vip_seats'],
    guest_slots: 5,
    vip_seats: 3,
    description: '晚宴冠名赞助权益',
  },
  {
    level: 'media',
    benefits: ['logo_display', 'backdrop', 'mc_mention', 'wechat_article'],
    guest_slots: 1,
    vip_seats: 0,
    description: '媒体合作伙伴权益',
  },
];
