// Database schema types
export interface GuestRecord {
  id: string;
  name: string;
  phone: string | null;
  organization: string | null;
  guest_type: string;
  table_number: string | null;
  qr_code: string;
  check_in_status: number;
  check_in_time: string | null;
}

// 签到嘉宾行（camelCase，与 db.ts 中 toGuest 的输出保持一致）
export interface GuestRow {
  id: string;
  name: string;
  phone: string | null;
  organization: string | null;
  guestType: string;
  tableNumber: string | null;
  qrCode: string;
  checkInStatus: number;
  checkInTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInLogRow {
  id: string;
  guestId: string;
  guestName: string;
  organization: string | null;
  guestType: string;
  tableNumber: string | null;
  checkInTime: string;
  terminalId: string;
  operator: string;
}

// 原始签到日志（持久化形态，不含冗余的嘉宾信息）
export interface RawCheckInLog {
  id: string;
  guestId: string;
  checkInTime: string;
  terminalId: string | null;
  operator: string | null;
  syncStatus: number;
}

// 新建嘉宾入参
export interface GuestInput {
  name: string;
  phone?: string;
  organization?: string;
  guestType?: string;
  tableNumber?: string;
  qrCode?: string;
}

// 更新嘉宾入参
export interface GuestUpdate {
  name?: string;
  phone?: string;
  organization?: string;
  guestType?: string;
  tableNumber?: string;
  qrCode?: string;
}

// 完整备份数据结构
export interface CheckinBackup {
  version: string;
  exportedAt: string;
  eventName?: string;
  eventDate?: string;
  stats?: unknown;
  guests: GuestRow[];
  checkInLogs: RawCheckInLog[];
}

// 兼容 Drizzle 风格 `typeof table.$inferSelect / $inferInsert` 的最小类型桩，
// 实际数据访问通过 Supabase 客户端完成（见 db.ts）。
type TableStub<TSelect, TInsert = TSelect> = {
  $inferSelect: TSelect;
  $inferInsert: TInsert;
};

export const guests = {} as TableStub<GuestRow, Omit<GuestRow, 'id' | 'createdAt' | 'updatedAt'>>;
export const checkInLogs = {} as TableStub<CheckInLogRow, Omit<CheckInLogRow, 'id'>>;
