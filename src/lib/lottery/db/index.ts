// 大屏抽奖系统 - IndexedDB 离线存储封装
//
// 忠实复刻 docs/bonnors 的「完全离线运行」：所有抽奖数据存储在浏览器 IndexedDB，
// 无需外部数据库。通过 eventId 索引与平台活动打通，按活动隔离数据。
//
// Schema 版本管理：DB_VERSION 随表结构变化递增，迁移逻辑写在 upgrade() 中。

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import type {
  Attendee,
  Prize,
  LockedWinner,
  DrawRecord,
  EventInfo,
} from './types';

const DB_NAME = 'XinHuoLotteryDB';
const DB_VERSION = 1;

interface LotteryDBSchema extends DBSchema {
  attendees: {
    key: string;
    value: Attendee;
    indexes: { eventId: string; name: string };
  };
  prizes: {
    key: string;
    value: Prize;
    indexes: { eventId: string; order: number };
  };
  lockedWinners: {
    key: string;
    value: LockedWinner;
    indexes: { eventId: string; prizeId: string };
  };
  drawRecords: {
    key: string;
    value: DrawRecord;
    indexes: { eventId: string; prizeId: string; drawTime: string };
  };
  eventInfo: {
    key: string;
    value: EventInfo;
  };
}

let dbPromise: Promise<IDBPDatabase<LotteryDBSchema>> | null = null;

function getDB(): Promise<IDBPDatabase<LotteryDBSchema>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB 仅在浏览器环境可用'));
  }
  if (!dbPromise) {
    dbPromise = openDB<LotteryDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const attendees = db.createObjectStore('attendees', { keyPath: 'id' });
          attendees.createIndex('eventId', 'eventId');
          attendees.createIndex('name', 'name');

          const prizes = db.createObjectStore('prizes', { keyPath: 'id' });
          prizes.createIndex('eventId', 'eventId');
          prizes.createIndex('order', 'order');

          const lockedWinners = db.createObjectStore('lockedWinners', { keyPath: 'id' });
          lockedWinners.createIndex('eventId', 'eventId');
          lockedWinners.createIndex('prizeId', 'prizeId');

          const drawRecords = db.createObjectStore('drawRecords', { keyPath: 'id' });
          drawRecords.createIndex('eventId', 'eventId');
          drawRecords.createIndex('prizeId', 'prizeId');
          drawRecords.createIndex('drawTime', 'drawTime');

          db.createObjectStore('eventInfo', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

const now = (): string => new Date().toISOString();

// ==================== 参会人员 ====================

export async function getAllAttendees(eventId: string): Promise<Attendee[]> {
  const db = await getDB();
  const list = await db.getAllFromIndex('attendees', 'eventId', eventId);
  return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getAttendee(id: string): Promise<Attendee | undefined> {
  const db = await getDB();
  return db.get('attendees', id);
}

export type AttendeeInput = Partial<Omit<Attendee, 'id' | 'eventId' | 'createdAt' | 'updatedAt'>> & {
  name: string;
};

function buildAttendee(eventId: string, input: AttendeeInput): Attendee {
  const ts = now();
  return {
    id: uuidv4(),
    eventId,
    name: input.name.trim(),
    company: input.company ?? '',
    role: input.role ?? '',
    tableNumber: input.tableNumber ?? '',
    seatNumber: input.seatNumber ?? '',
    phone: input.phone ?? '',
    email: input.email ?? '',
    isBlacklisted: input.isBlacklisted ?? false,
    hasWon: input.hasWon ?? false,
    prizeName: input.prizeName ?? '',
    createdAt: ts,
    updatedAt: ts,
  };
}

export async function createAttendee(eventId: string, input: AttendeeInput): Promise<Attendee> {
  const db = await getDB();
  const attendee = buildAttendee(eventId, input);
  await db.put('attendees', attendee);
  return attendee;
}

export async function importAttendees(eventId: string, inputs: AttendeeInput[]): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('attendees', 'readwrite');
  let count = 0;
  for (const input of inputs) {
    if (!input.name?.trim()) continue;
    await tx.store.put(buildAttendee(eventId, input));
    count += 1;
  }
  await tx.done;
  return count;
}

export async function updateAttendee(id: string, patch: Partial<Attendee>): Promise<Attendee | null> {
  const db = await getDB();
  const existing = await db.get('attendees', id);
  if (!existing) return null;
  const updated: Attendee = { ...existing, ...patch, id: existing.id, eventId: existing.eventId, updatedAt: now() };
  await db.put('attendees', updated);
  return updated;
}

export async function deleteAttendee(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('attendees', id);
}

export async function deleteAllAttendees(eventId: string): Promise<void> {
  const db = await getDB();
  const keys = await db.getAllKeysFromIndex('attendees', 'eventId', eventId);
  const tx = db.transaction('attendees', 'readwrite');
  await Promise.all(keys.map((k) => tx.store.delete(k)));
  await tx.done;
}

// ==================== 奖项 ====================

export async function getAllPrizes(eventId: string): Promise<Prize[]> {
  const db = await getDB();
  const list = await db.getAllFromIndex('prizes', 'eventId', eventId);
  return list.sort((a, b) => a.order - b.order || a.level - b.level);
}

export async function getPrize(id: string): Promise<Prize | undefined> {
  const db = await getDB();
  return db.get('prizes', id);
}

export type PrizeInput = Partial<Omit<Prize, 'id' | 'eventId' | 'createdAt' | 'updatedAt'>> & {
  name: string;
};

export async function createPrize(eventId: string, input: PrizeInput): Promise<Prize> {
  const db = await getDB();
  const existing = await db.getAllFromIndex('prizes', 'eventId', eventId);
  const ts = now();
  const prize: Prize = {
    id: uuidv4(),
    eventId,
    name: input.name.trim(),
    level: input.level ?? existing.length + 1,
    order: input.order ?? existing.length + 1,
    quantity: input.quantity ?? 1,
    drawCount: input.drawCount ?? 1,
    allowRepeat: input.allowRepeat ?? false,
    prizeName: input.prizeName ?? '',
    sponsor: input.sponsor ?? '',
    value: input.value ?? '',
    image: input.image ?? '',
    description: input.description ?? '',
    createdAt: ts,
    updatedAt: ts,
  };
  await db.put('prizes', prize);
  return prize;
}

export async function updatePrize(id: string, patch: Partial<Prize>): Promise<Prize | null> {
  const db = await getDB();
  const existing = await db.get('prizes', id);
  if (!existing) return null;
  const updated: Prize = { ...existing, ...patch, id: existing.id, eventId: existing.eventId, updatedAt: now() };
  await db.put('prizes', updated);
  return updated;
}

export async function deletePrize(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('prizes', id);
}

// ==================== 锁定中奖 ====================

export async function getAllLockedWinners(eventId: string): Promise<LockedWinner[]> {
  const db = await getDB();
  return db.getAllFromIndex('lockedWinners', 'eventId', eventId);
}

export type LockedWinnerInput = Partial<Omit<LockedWinner, 'id' | 'eventId' | 'createdAt' | 'updatedAt'>> & {
  prizeId: string;
  attendeeName: string;
};

export async function createLockedWinner(eventId: string, input: LockedWinnerInput): Promise<LockedWinner> {
  const db = await getDB();
  const ts = now();
  const locked: LockedWinner = {
    id: uuidv4(),
    eventId,
    prizeId: input.prizeId,
    attendeeName: input.attendeeName.trim(),
    company: input.company ?? '',
    effectStartTime: input.effectStartTime ?? '',
    effectEndTime: input.effectEndTime ?? '',
    createdAt: ts,
    updatedAt: ts,
  };
  await db.put('lockedWinners', locked);
  return locked;
}

export async function deleteLockedWinner(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('lockedWinners', id);
}

// ==================== 抽奖记录 ====================

export async function getAllDrawRecords(eventId: string): Promise<DrawRecord[]> {
  const db = await getDB();
  const list = await db.getAllFromIndex('drawRecords', 'eventId', eventId);
  return list.sort((a, b) => b.drawTime.localeCompare(a.drawTime));
}

export async function getDrawRecordsByPrize(prizeId: string): Promise<DrawRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex('drawRecords', 'prizeId', prizeId);
}

export async function createDrawRecords(records: DrawRecord[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('drawRecords', 'readwrite');
  await Promise.all(records.map((r) => tx.store.put(r)));
  await tx.done;
}

export async function updateDrawRecord(id: string, patch: Partial<DrawRecord>): Promise<DrawRecord | null> {
  const db = await getDB();
  const existing = await db.get('drawRecords', id);
  if (!existing) return null;
  const updated: DrawRecord = { ...existing, ...patch, id: existing.id, updatedAt: now() };
  await db.put('drawRecords', updated);
  return updated;
}

export async function deleteDrawRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('drawRecords', id);
}

// ==================== 活动信息 ====================

export async function getEventInfo(eventId: string): Promise<EventInfo | undefined> {
  const db = await getDB();
  return db.get('eventInfo', eventId);
}

export async function saveEventInfo(info: EventInfo): Promise<EventInfo> {
  const db = await getDB();
  const saved: EventInfo = { ...info, updatedAt: now() };
  await db.put('eventInfo', saved);
  return saved;
}

// ==================== 批量 / 维护 ====================

// 清空某活动的全部抽奖数据（参会人员、奖项、锁定、记录、活动信息）
export async function clearEventData(eventId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['attendees', 'prizes', 'lockedWinners', 'drawRecords', 'eventInfo'], 'readwrite');
  const stores = ['attendees', 'prizes', 'lockedWinners', 'drawRecords'] as const;
  for (const store of stores) {
    const keys = await tx.objectStore(store).index('eventId').getAllKeys(eventId);
    await Promise.all(keys.map((k) => tx.objectStore(store).delete(k)));
  }
  await tx.objectStore('eventInfo').delete(eventId);
  await tx.done;
}

// 仅清空抽奖结果（记录），并重置参会人员中奖状态
export async function resetDrawResults(eventId: string): Promise<void> {
  const db = await getDB();
  const recordKeys = await db.getAllKeysFromIndex('drawRecords', 'eventId', eventId);
  const recTx = db.transaction('drawRecords', 'readwrite');
  await Promise.all(recordKeys.map((k) => recTx.store.delete(k)));
  await recTx.done;

  const attendees = await db.getAllFromIndex('attendees', 'eventId', eventId);
  const attTx = db.transaction('attendees', 'readwrite');
  await Promise.all(
    attendees
      .filter((a) => a.hasWon)
      .map((a) => attTx.store.put({ ...a, hasWon: false, prizeName: '', updatedAt: now() })),
  );
  await attTx.done;

  const prizes = await db.getAllFromIndex('prizes', 'eventId', eventId);
  const prizeTx = db.transaction('prizes', 'readwrite');
  await Promise.all(prizes.map((p) => prizeTx.store.put({ ...p, updatedAt: now() })));
  await prizeTx.done;
}

// 完整备份结构
export interface LotteryBackup {
  version: string;
  exportedAt: string;
  eventId: string;
  eventInfo: EventInfo | null;
  attendees: Attendee[];
  prizes: Prize[];
  lockedWinners: LockedWinner[];
  drawRecords: DrawRecord[];
}

export async function exportEventBackup(eventId: string): Promise<LotteryBackup> {
  const [attendees, prizes, lockedWinners, drawRecords, eventInfo] = await Promise.all([
    getAllAttendees(eventId),
    getAllPrizes(eventId),
    getAllLockedWinners(eventId),
    getAllDrawRecords(eventId),
    getEventInfo(eventId),
  ]);
  return {
    version: '1.0',
    exportedAt: now(),
    eventId,
    eventInfo: eventInfo ?? null,
    attendees,
    prizes,
    lockedWinners,
    drawRecords,
  };
}

export async function importEventBackup(eventId: string, backup: LotteryBackup): Promise<void> {
  await clearEventData(eventId);
  const db = await getDB();
  const tx = db.transaction(['attendees', 'prizes', 'lockedWinners', 'drawRecords', 'eventInfo'], 'readwrite');
  await Promise.all([
    ...backup.attendees.map((a) => tx.objectStore('attendees').put({ ...a, eventId })),
    ...backup.prizes.map((p) => tx.objectStore('prizes').put({ ...p, eventId })),
    ...backup.lockedWinners.map((l) => tx.objectStore('lockedWinners').put({ ...l, eventId })),
    ...backup.drawRecords.map((r) => tx.objectStore('drawRecords').put({ ...r, eventId })),
  ]);
  if (backup.eventInfo) {
    await tx.objectStore('eventInfo').put({ ...backup.eventInfo, id: eventId });
  }
  await tx.done;
}
