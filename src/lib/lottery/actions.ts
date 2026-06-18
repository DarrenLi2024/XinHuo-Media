// 大屏抽奖系统 - 高层抽奖操作
//
// 将 IndexedDB 数据层与抽奖引擎组合为可直接调用的业务动作：
// 执行抽奖、弃奖、补位。供大屏与后台共用，保证逻辑一致。

import { v4 as uuidv4 } from 'uuid';
import { DrawEngine } from './draw-engine';
import {
  getAllAttendees,
  getAllPrizes,
  getAllLockedWinners,
  getAllDrawRecords,
  getPrize,
  getAttendee,
  createDrawRecords,
  updateDrawRecord,
  updateAttendee,
} from './db';
import { broadcastLotteryChange } from './sync';
import type { Attendee, Prize, DrawRecord } from './db/types';

const now = (): string => new Date().toISOString();

function recordFromWinner(
  eventId: string,
  prize: Prize,
  attendee: Attendee,
  isLocked: boolean,
  drawTime: string,
): DrawRecord {
  const ts = now();
  return {
    id: uuidv4(),
    eventId,
    prizeId: prize.id,
    prizeName: prize.name,
    prizeLevel: prize.level,
    attendeeId: attendee.id,
    attendeeName: attendee.name,
    attendeeCompany: attendee.company,
    attendeeTableNumber: attendee.tableNumber,
    drawTime,
    isAbandoned: false,
    replacedBy: '',
    replacedByName: '',
    replacedTime: '',
    isLocked,
    createdAt: ts,
    updatedAt: ts,
  };
}

export interface PerformDrawResult {
  prize: Prize;
  winners: Attendee[];
  records: DrawRecord[];
  lockedNames: string[];
}

// 执行一次抽奖：计算中奖者 → 写入记录 → 标记参会人员中奖状态
export async function performDraw(eventId: string, prizeId: string): Promise<PerformDrawResult | null> {
  const [prize, attendees, lockedWinners, records] = await Promise.all([
    getPrize(prizeId),
    getAllAttendees(eventId),
    getAllLockedWinners(eventId),
    getAllDrawRecords(eventId),
  ]);
  if (!prize) return null;
  if (DrawEngine.getRemaining(prize, records) <= 0) return null;

  const result = DrawEngine.draw(prize, attendees, lockedWinners, records);
  if (result.winners.length === 0) return null;

  const lockedNameSet = new Set(result.lockedNames);
  const newRecords = result.winners.map((w) =>
    recordFromWinner(eventId, prize, w, lockedNameSet.has(w.name), result.drawTime),
  );
  await createDrawRecords(newRecords);

  await Promise.all(
    result.winners.map((w) => updateAttendee(w.id, { hasWon: true, prizeName: prize.name })),
  );

  broadcastLotteryChange(eventId, 'records');
  return { prize, winners: result.winners, records: newRecords, lockedNames: result.lockedNames };
}

// 弃奖：标记记录弃奖，恢复该参会人员中奖状态
export async function abandonWinner(eventId: string, recordId: string): Promise<boolean> {
  const records = await getAllDrawRecords(eventId);
  const record = records.find((r) => r.id === recordId);
  if (!record || record.isAbandoned) return false;

  await updateDrawRecord(recordId, { isAbandoned: true });
  if (record.attendeeId) {
    const attendee = await getAttendee(record.attendeeId);
    if (attendee) {
      await updateAttendee(attendee.id, { hasWon: false, prizeName: '' });
    }
  }
  broadcastLotteryChange(eventId, 'records');
  return true;
}

// 补位：从常规池随机抽取一名补位者，记录到原弃奖记录上，并新增其中奖记录
export async function replaceWinner(eventId: string, recordId: string): Promise<Attendee | null> {
  const [attendees, lockedWinners, records, prizes] = await Promise.all([
    getAllAttendees(eventId),
    getAllLockedWinners(eventId),
    getAllDrawRecords(eventId),
    getAllPrizes(eventId),
  ]);
  const record = records.find((r) => r.id === recordId);
  if (!record) return null;
  const prize = prizes.find((p) => p.id === record.prizeId);
  if (!prize) return null;

  // 先确保原记录为弃奖状态
  const workingRecords = records.map((r) =>
    r.id === recordId ? { ...r, isAbandoned: true } : r,
  );

  const candidates = DrawEngine.getRollingAttendees(attendees, lockedWinners, workingRecords, attendees.length);
  if (candidates.length === 0) return null;
  const replacement = candidates[Math.floor(Math.random() * candidates.length)];
  const ts = now();

  if (!record.isAbandoned) {
    await updateDrawRecord(recordId, { isAbandoned: true });
    if (record.attendeeId) {
      const original = await getAttendee(record.attendeeId);
      if (original) await updateAttendee(original.id, { hasWon: false, prizeName: '' });
    }
  }

  await updateDrawRecord(recordId, { replacedBy: replacement.id, replacedByName: replacement.name, replacedTime: ts });

  const newRecord = recordFromWinner(eventId, prize, replacement, false, ts);
  await createDrawRecords([newRecord]);
  await updateAttendee(replacement.id, { hasWon: true, prizeName: prize.name });

  broadcastLotteryChange(eventId, 'records');
  return replacement;
}
