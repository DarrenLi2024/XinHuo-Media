// 签到系统本地文件持久化后端。
// 未配置 Supabase 环境变量时默认启用，开箱即用：数据写入本地 JSON 文件，
// 服务重启后依然保留。所有写操作均在单个 Node 进程内同步完成，
// 因此「检查状态 + 更新」对单进程而言是原子的，可防止重复签到竞态。

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type {
  GuestRow,
  CheckInLogRow,
  RawCheckInLog,
  GuestInput,
  GuestUpdate,
  CheckinBackup,
} from './schema';

const DATA_DIR =
  process.env.CHECKIN_DATA_DIR || path.join(process.cwd(), '.checkin-data');
const DATA_FILE = path.join(DATA_DIR, 'checkin.json');

interface StoreData {
  guests: GuestRow[];
  logs: RawCheckInLog[];
}

let cache: StoreData | null = null;

function load(): StoreData {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    cache = {
      guests: Array.isArray(parsed.guests) ? parsed.guests : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    };
  } catch {
    cache = { guests: [], logs: [] };
  }
  return cache;
}

function persist(): void {
  const data = cache ?? { guests: [], logs: [] };
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('[checkin/local-store] 持久化失败:', error);
  }
}

function generateQRCode(): string {
  return `EVT${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function buildGuest(input: GuestInput): GuestRow {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    name: input.name,
    phone: input.phone || null,
    organization: input.organization || null,
    guestType: input.guestType || '普通嘉宾',
    tableNumber: input.tableNumber || null,
    qrCode: input.qrCode || generateQRCode(),
    checkInStatus: 0,
    checkInTime: null,
    createdAt: now,
    updatedAt: now,
  };
}

// ==================== 嘉宾操作 ====================

export async function getAllGuests(): Promise<GuestRow[]> {
  const { guests } = load();
  return [...guests].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getGuestByQrCode(qrCode: string): Promise<GuestRow | null> {
  const { guests } = load();
  return guests.find((g) => g.qrCode === qrCode) ?? null;
}

export async function getGuestById(id: string): Promise<GuestRow | null> {
  const { guests } = load();
  return guests.find((g) => g.id === id) ?? null;
}

export async function searchGuests(keyword: string): Promise<GuestRow[]> {
  const { guests } = load();
  const kw = keyword.trim().toLowerCase();
  if (!kw) return [];
  return guests
    .filter(
      (g) =>
        g.name.toLowerCase().includes(kw) ||
        (g.phone || '').toLowerCase().includes(kw) ||
        (g.organization || '').toLowerCase().includes(kw),
    )
    .slice(0, 20);
}

export async function createGuest(input: GuestInput): Promise<GuestRow> {
  const data = load();
  const guest = buildGuest(input);
  data.guests.push(guest);
  persist();
  return guest;
}

export async function createGuestsBatch(inputs: GuestInput[]): Promise<GuestRow[]> {
  if (inputs.length === 0) return [];
  const data = load();
  const created = inputs.map(buildGuest);
  data.guests.push(...created);
  persist();
  return created;
}

export async function updateGuest(
  id: string,
  patch: GuestUpdate,
): Promise<GuestRow | null> {
  const data = load();
  const guest = data.guests.find((g) => g.id === id);
  if (!guest) return null;

  if (patch.name !== undefined) guest.name = patch.name;
  if (patch.phone !== undefined) guest.phone = patch.phone || null;
  if (patch.organization !== undefined)
    guest.organization = patch.organization || null;
  if (patch.guestType !== undefined) guest.guestType = patch.guestType;
  if (patch.tableNumber !== undefined)
    guest.tableNumber = patch.tableNumber || null;
  if (patch.qrCode !== undefined && patch.qrCode) guest.qrCode = patch.qrCode;
  guest.updatedAt = new Date().toISOString();

  persist();
  return guest;
}

export async function batchUpdateGuests(
  ids: string[],
  patch: { guestType?: string; tableNumber?: string },
): Promise<number> {
  const data = load();
  const idSet = new Set(ids);
  let count = 0;
  const now = new Date().toISOString();
  for (const guest of data.guests) {
    if (!idSet.has(guest.id)) continue;
    if (patch.guestType) guest.guestType = patch.guestType;
    if (patch.tableNumber !== undefined)
      guest.tableNumber = patch.tableNumber || null;
    guest.updatedAt = now;
    count += 1;
  }
  persist();
  return count;
}

export async function deleteGuest(id: string): Promise<void> {
  const data = load();
  data.guests = data.guests.filter((g) => g.id !== id);
  data.logs = data.logs.filter((l) => l.guestId !== id);
  persist();
}

// ==================== 签到操作 ====================

export async function checkIn(
  guestId: string,
  terminalId: string = 'default',
  operator: string = 'system',
): Promise<GuestRow> {
  const data = load();
  const guest = data.guests.find((g) => g.id === guestId);
  if (!guest) {
    throw new Error('嘉宾不存在');
  }
  // 同步的「检查 + 更新」，单进程内原子，防止重复签到竞态。
  if (guest.checkInStatus === 1) {
    throw new Error('该嘉宾已签到');
  }
  const now = new Date().toISOString();
  guest.checkInStatus = 1;
  guest.checkInTime = now;
  guest.updatedAt = now;
  data.logs.push({
    id: uuidv4(),
    guestId,
    checkInTime: now,
    terminalId,
    operator,
    syncStatus: 1,
  });
  persist();
  return guest;
}

export async function clearAllCheckIns(): Promise<{
  cleared: number;
  logsDeleted: number;
}> {
  const data = load();
  let cleared = 0;
  const now = new Date().toISOString();
  for (const guest of data.guests) {
    if (guest.checkInStatus === 1) {
      guest.checkInStatus = 0;
      guest.checkInTime = null;
      guest.updatedAt = now;
      cleared += 1;
    }
  }
  const logsDeleted = data.logs.length;
  data.logs = [];
  persist();
  return { cleared, logsDeleted };
}

export async function clearAllData(): Promise<void> {
  cache = { guests: [], logs: [] };
  persist();
}

// ==================== 统计操作 ====================

export async function getStats(): Promise<{
  total: number;
  checkedIn: number;
  notCheckedIn: number;
  checkInRate: number;
  byType: Record<string, number>;
  byTypeChecked: Record<string, number>;
}> {
  const { guests } = load();
  const total = guests.length;
  const checkedIn = guests.filter((g) => g.checkInStatus === 1).length;
  const notCheckedIn = total - checkedIn;
  const checkInRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  const byType: Record<string, number> = {};
  const byTypeChecked: Record<string, number> = {};
  guests.forEach((g) => {
    byType[g.guestType] = (byType[g.guestType] || 0) + 1;
    if (g.checkInStatus === 1) {
      byTypeChecked[g.guestType] = (byTypeChecked[g.guestType] || 0) + 1;
    }
  });

  return { total, checkedIn, notCheckedIn, checkInRate, byType, byTypeChecked };
}

function joinLog(log: RawCheckInLog, guestMap: Map<string, GuestRow>): CheckInLogRow {
  const guest = guestMap.get(log.guestId);
  return {
    id: log.id,
    guestId: log.guestId,
    guestName: guest?.name || '未知',
    organization: guest?.organization ?? null,
    guestType: guest?.guestType || '未知',
    tableNumber: guest?.tableNumber ?? null,
    checkInTime: log.checkInTime,
    terminalId: log.terminalId || 'default',
    operator: log.operator || 'system',
  };
}

export async function getCheckInLogs(limit: number = 50): Promise<CheckInLogRow[]> {
  const { guests, logs } = load();
  const guestMap = new Map(guests.map((g) => [g.id, g]));
  return [...logs]
    .sort((a, b) => (a.checkInTime < b.checkInTime ? 1 : -1))
    .slice(0, limit)
    .map((log) => joinLog(log, guestMap));
}

export async function getAllCheckInLogs(): Promise<CheckInLogRow[]> {
  const { guests, logs } = load();
  const guestMap = new Map(guests.map((g) => [g.id, g]));
  return [...logs]
    .sort((a, b) => (a.checkInTime < b.checkInTime ? 1 : -1))
    .map((log) => joinLog(log, guestMap));
}

// ==================== 备份 / 恢复 ====================

export async function getRawCheckInLogs(): Promise<RawCheckInLog[]> {
  return [...load().logs];
}

export async function restoreData(
  backup: Pick<CheckinBackup, 'guests' | 'checkInLogs'>,
  mode: 'merge' | 'replace',
): Promise<{ guestsImported: number; guestsSkipped: number; logsImported: number; logsSkipped: number }> {
  const data = load();
  if (mode === 'replace') {
    data.guests = [];
    data.logs = [];
  }

  const existingQr = new Set(data.guests.map((g) => g.qrCode));
  const existingGuestIds = new Set(data.guests.map((g) => g.id));
  const existingLogIds = new Set(data.logs.map((l) => l.id));

  let guestsImported = 0;
  let guestsSkipped = 0;
  for (const g of backup.guests || []) {
    if (existingQr.has(g.qrCode) || existingGuestIds.has(g.id)) {
      guestsSkipped += 1;
      continue;
    }
    data.guests.push(g);
    existingQr.add(g.qrCode);
    existingGuestIds.add(g.id);
    guestsImported += 1;
  }

  let logsImported = 0;
  let logsSkipped = 0;
  for (const l of backup.checkInLogs || []) {
    if (existingLogIds.has(l.id) || !existingGuestIds.has(l.guestId)) {
      logsSkipped += 1;
      continue;
    }
    data.logs.push(l);
    existingLogIds.add(l.id);
    logsImported += 1;
  }

  persist();
  return { guestsImported, guestsSkipped, logsImported, logsSkipped };
}
