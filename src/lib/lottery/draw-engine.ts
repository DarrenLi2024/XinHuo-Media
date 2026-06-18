// 大屏抽奖系统 - 抽奖引擎
//
// 忠实复刻 docs/bonnors/SPEC.md 与 ARCHITECTURE.md 的核心算法：
//   1. 围栏保护：锁定名单人员无论是否在生效时间，都从常规抽奖池排除；
//   2. 生效锁定：仅在生效时间窗口内，锁定人员才通过锁定机制中奖；
//   3. 黑名单排除：黑名单人员永远不中任何奖项，也不参与滚动展示；
//   4. 已中奖排除：不允许重复中奖时，已中奖人员从池中排除；
//   5. Fisher-Yates 洗牌保证公平；
//   6. 锁定人员随机插入最终名单（避免恒定首位）。

import type { Attendee, Prize, LockedWinner, DrawRecord, DrawResult } from './db/types';

export class DrawEngine {
  // Fisher-Yates 洗牌算法
  static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // 锁定生效时间判断：start <= now <= end（空值表示不限）
  static isLockedWinnerEffectTimeValid(lw: LockedWinner, now: Date = new Date()): boolean {
    const t = now.getTime();
    if (lw.effectStartTime) {
      const start = new Date(lw.effectStartTime).getTime();
      if (!Number.isNaN(start) && t < start) return false;
    }
    if (lw.effectEndTime) {
      const end = new Date(lw.effectEndTime).getTime();
      if (!Number.isNaN(end) && t > end) return false;
    }
    return true;
  }

  // 围栏保护人员：所有锁定名单人员姓名（无论是否生效）
  static getFencedNames(lockedWinners: LockedWinner[]): Set<string> {
    return new Set(lockedWinners.map((lw) => lw.attendeeName));
  }

  // 黑名单人员姓名
  static getBlacklistedNames(attendees: Attendee[]): Set<string> {
    return new Set(attendees.filter((a) => a.isBlacklisted).map((a) => a.name));
  }

  // 已中奖人员姓名（不含弃奖记录）
  static getWonNames(records: DrawRecord[]): Set<string> {
    return new Set(records.filter((r) => !r.isAbandoned).map((r) => r.attendeeName));
  }

  // 某奖项已中奖人员姓名（不含弃奖记录）
  static getWonNamesForPrize(prizeId: string, records: DrawRecord[]): Set<string> {
    return new Set(
      records.filter((r) => r.prizeId === prizeId && !r.isAbandoned).map((r) => r.attendeeName),
    );
  }

  // 某奖项剩余名额 = 总量 - 有效中奖数
  static getRemaining(prize: Prize, records: DrawRecord[]): number {
    const won = records.filter((r) => r.prizeId === prize.id && !r.isAbandoned).length;
    return Math.max(0, prize.quantity - won);
  }

  // 构建常规抽奖池（排除围栏、黑名单、已中奖、已中本奖项）
  private static buildRegularPool(
    prize: Prize,
    attendees: Attendee[],
    lockedWinners: LockedWinner[],
    records: DrawRecord[],
  ): Attendee[] {
    const fenced = this.getFencedNames(lockedWinners);
    const blacklisted = this.getBlacklistedNames(attendees);
    const wonAny = this.getWonNames(records);
    const wonThisPrize = this.getWonNamesForPrize(prize.id, records);

    return attendees.filter((a) => {
      if (a.isBlacklisted) return false;
      if (fenced.has(a.name)) return false;
      if (blacklisted.has(a.name)) return false;
      if (wonThisPrize.has(a.name)) return false;
      if (!prize.allowRepeat && wonAny.has(a.name)) return false;
      return true;
    });
  }

  // 滚动展示池（排除围栏、黑名单、已中奖）
  static getRollingAttendees(
    attendees: Attendee[],
    lockedWinners: LockedWinner[],
    records: DrawRecord[],
    count: number,
  ): Attendee[] {
    const fenced = this.getFencedNames(lockedWinners);
    const blacklisted = this.getBlacklistedNames(attendees);
    const won = this.getWonNames(records);

    const pool = attendees.filter(
      (a) => !a.isBlacklisted && !fenced.has(a.name) && !blacklisted.has(a.name) && !won.has(a.name),
    );
    if (pool.length === 0) return [];
    if (count >= pool.length) return this.shuffle(pool);
    return this.shuffle(pool).slice(0, count);
  }

  // 当前生效、且匹配到参会人员、且未中本奖项的锁定中奖人员
  private static getEffectiveLockedAttendees(
    prize: Prize,
    attendees: Attendee[],
    lockedWinners: LockedWinner[],
    records: DrawRecord[],
    now: Date,
  ): Attendee[] {
    const wonThisPrize = this.getWonNamesForPrize(prize.id, records);
    const byName = new Map(attendees.map((a) => [a.name, a]));
    const result: Attendee[] = [];
    const seen = new Set<string>();

    for (const lw of lockedWinners) {
      if (lw.prizeId !== prize.id) continue;
      if (!this.isLockedWinnerEffectTimeValid(lw, now)) continue;
      if (wonThisPrize.has(lw.attendeeName)) continue;
      if (seen.has(lw.attendeeName)) continue;
      const attendee = byName.get(lw.attendeeName);
      if (!attendee || attendee.isBlacklisted) continue;
      seen.add(lw.attendeeName);
      result.push(attendee);
    }
    return result;
  }

  // 是否可继续抽奖（仍有剩余名额且有可抽人员）
  static canContinueDraw(
    prize: Prize,
    attendees: Attendee[],
    lockedWinners: LockedWinner[],
    records: DrawRecord[],
    now: Date = new Date(),
  ): boolean {
    if (this.getRemaining(prize, records) <= 0) return false;
    const regular = this.buildRegularPool(prize, attendees, lockedWinners, records);
    const locked = this.getEffectiveLockedAttendees(prize, attendees, lockedWinners, records, now);
    return regular.length + locked.length > 0;
  }

  // 执行抽奖
  static draw(
    prize: Prize,
    attendees: Attendee[],
    lockedWinners: LockedWinner[],
    records: DrawRecord[],
    now: Date = new Date(),
  ): DrawResult {
    const remaining = this.getRemaining(prize, records);
    const slots = Math.min(prize.drawCount, remaining);

    const effectiveLocked = this.getEffectiveLockedAttendees(prize, attendees, lockedWinners, records, now);
    const lockedTaken = Math.min(effectiveLocked.length, slots);
    const lockedWinnersList = effectiveLocked.slice(0, lockedTaken);

    const regularPool = this.buildRegularPool(prize, attendees, lockedWinners, records);
    const regularNeeded = slots - lockedTaken;
    const regularWinners =
      regularNeeded > 0 ? this.shuffle(regularPool).slice(0, regularNeeded) : [];

    // 锁定人员随机插入常规中奖名单（避免恒定首位）
    const winners = [...regularWinners];
    for (const locked of lockedWinnersList) {
      const insertAt = winners.length === 0 ? 0 : 1 + Math.floor(Math.random() * winners.length);
      winners.splice(insertAt, 0, locked);
    }

    return {
      prize,
      winners,
      lockedNames: lockedWinnersList.map((a) => a.name),
      drawTime: now.toISOString(),
    };
  }
}
