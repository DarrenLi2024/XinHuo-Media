// 大屏抽奖系统 - 离线数据类型定义
//
// 忠实复刻 docs/bonnors/SPEC.md 的实体结构，采用浏览器 IndexedDB 离线存储；
// 同时通过 eventId 字段与平台活动打通：每条记录归属某个平台活动，
// 抽奖在「当前活动」作用域内独立运行，互不干扰。

// 主题风格
export type LotteryTheme = 'tech-blue' | 'golden' | 'red-gold';

// 抽奖状态机
export type DrawState = 'waiting' | 'rolling' | 'winner';

// 参会人员
export interface Attendee {
  id: string;
  eventId: string;
  name: string; // 姓名（核心匹配字段，必填）
  company: string; // 公司/单位
  role: string; // 参会身份
  tableNumber: string; // 桌号
  seatNumber: string; // 座位号
  phone: string;
  email: string;
  isBlacklisted: boolean; // 黑名单：永远不中任何奖项
  hasWon: boolean; // 是否已中奖
  prizeName: string; // 中奖奖品名称
  createdAt: string;
  updatedAt: string;
}

// 奖项
export interface Prize {
  id: string;
  eventId: string;
  name: string; // 奖项名称（如「一等奖」）
  level: number; // 奖项等级（1=特等，越小越高）
  order: number; // 抽奖顺序（升序执行）
  quantity: number; // 奖品总数量
  drawCount: number; // 单次抽取人数
  allowRepeat: boolean; // 是否允许重复中奖
  prizeName: string; // 奖品名称（如「iPhone 15 Pro」）
  sponsor: string; // 赞助商
  value: string; // 奖品价值
  image: string; // 奖品图片 URL
  description: string; // 奖项描述
  createdAt: string;
  updatedAt: string;
}

// 锁定中奖人员（围栏保护机制）
export interface LockedWinner {
  id: string;
  eventId: string;
  prizeId: string; // 关联奖项
  attendeeName: string; // 锁定人员姓名（用于匹配 Attendee）
  company: string; // 公司（辅助显示）
  effectStartTime: string; // 生效开始时间（ISO 8601，空=不限）
  effectEndTime: string; // 生效结束时间（ISO 8601，空=不限）
  createdAt: string;
  updatedAt: string;
}

// 抽奖记录（每位中奖者一条，便于弃奖/补位与卡牌展示）
export interface DrawRecord {
  id: string;
  eventId: string;
  prizeId: string;
  prizeName: string;
  prizeLevel: number;
  attendeeId: string;
  attendeeName: string;
  attendeeCompany: string;
  attendeeTableNumber: string;
  drawTime: string; // 抽奖时间（ISO 8601）
  isAbandoned: boolean; // 是否弃奖
  replacedBy: string; // 补位人员 ID
  replacedByName: string; // 补位人员姓名
  replacedTime: string; // 补位时间
  isLocked: boolean; // 是否通过锁定机制中奖
  createdAt: string;
  updatedAt: string;
}

// 活动信息（每个 eventId 一条，主键即 eventId）
export interface EventInfo {
  id: string; // = eventId
  eventName: string;
  theme: LotteryTheme;
  organizer: string;
  logo: string;
  footerText: string;
  createdAt: string;
  updatedAt: string;
}

// 抽奖结果
export interface DrawResult {
  prize: Prize;
  winners: Attendee[];
  lockedNames: string[]; // 本次通过锁定机制中奖的姓名
  drawTime: string;
}
