// 签到系统统一数据访问层（门面）。
//
// 后端选择策略：
//   - 配置了 COZE_SUPABASE_URL + COZE_SUPABASE_ANON_KEY ⇒ 使用 Supabase（云端、多终端并发）
//   - 否则 ⇒ 使用本地 JSON 文件持久化，免配置开箱即用
//
// 两个后端实现完全相同的函数签名（见 docs/checkin/DATABASE.md）。

import * as localStore from './local-store';
import * as supabaseStore from './supabase-store';
import type {
  GuestRow,
  CheckInLogRow,
  RawCheckInLog,
  GuestInput,
  GuestUpdate,
  CheckinBackup,
} from './schema';

// 对外类型别名，保持与既有调用方一致
export type Guest = GuestRow;
export type InsertGuest = GuestInput;
export type CheckInLog = CheckInLogRow;

type Backend = typeof localStore;

function isSupabaseEnabled(): boolean {
  return Boolean(process.env.COZE_SUPABASE_URL && process.env.COZE_SUPABASE_ANON_KEY);
}

function backend(): Backend {
  return isSupabaseEnabled() ? (supabaseStore as unknown as Backend) : localStore;
}

// ==================== 嘉宾操作 ====================
export function getAllGuests(): Promise<Guest[]> {
  return backend().getAllGuests();
}
export function getGuestByQrCode(qrCode: string): Promise<Guest | null> {
  return backend().getGuestByQrCode(qrCode);
}
export function getGuestById(id: string): Promise<Guest | null> {
  return backend().getGuestById(id);
}
export function searchGuests(keyword: string): Promise<Guest[]> {
  return backend().searchGuests(keyword);
}
export function createGuest(guest: GuestInput): Promise<Guest> {
  return backend().createGuest(guest);
}
export function createGuestsBatch(guests: GuestInput[]): Promise<Guest[]> {
  return backend().createGuestsBatch(guests);
}
export function updateGuest(id: string, guest: GuestUpdate): Promise<Guest | null> {
  return backend().updateGuest(id, guest);
}
export function batchUpdateGuests(
  ids: string[],
  data: { guestType?: string; tableNumber?: string },
): Promise<number> {
  return backend().batchUpdateGuests(ids, data);
}
export function deleteGuest(id: string): Promise<void> {
  return backend().deleteGuest(id);
}

// ==================== 签到操作 ====================
export function checkIn(guestId: string, terminalId?: string, operator?: string): Promise<Guest> {
  return backend().checkIn(guestId, terminalId, operator);
}
export function clearAllCheckIns(): Promise<{ cleared: number; logsDeleted: number }> {
  return backend().clearAllCheckIns();
}
export function clearAllData(): Promise<void> {
  return backend().clearAllData();
}

// ==================== 统计 / 日志 ====================
export function getStats(): Promise<{
  total: number;
  checkedIn: number;
  notCheckedIn: number;
  checkInRate: number;
  byType: Record<string, number>;
  byTypeChecked: Record<string, number>;
}> {
  return backend().getStats();
}
export function getCheckInLogs(limit?: number): Promise<CheckInLog[]> {
  return backend().getCheckInLogs(limit);
}
export function getAllCheckInLogs(): Promise<CheckInLog[]> {
  return backend().getAllCheckInLogs();
}

// ==================== 备份 / 恢复 ====================
export function getRawCheckInLogs(): Promise<RawCheckInLog[]> {
  return backend().getRawCheckInLogs();
}
export function restoreData(
  backupData: Pick<CheckinBackup, 'guests' | 'checkInLogs'>,
  mode: 'merge' | 'replace',
): Promise<{ guestsImported: number; guestsSkipped: number; logsImported: number; logsSkipped: number }> {
  return backend().restoreData(backupData, mode);
}

export function isLockedWinnerEffectTimeValid(lockedWinner: {
  effect_time_start?: string;
  effect_time_end?: string;
}): boolean {
  const now = Date.now();
  const start = lockedWinner.effect_time_start ? new Date(lockedWinner.effect_time_start).getTime() : 0;
  const end = lockedWinner.effect_time_end ? new Date(lockedWinner.effect_time_end).getTime() : Infinity;
  return now >= start && now <= end;
}
