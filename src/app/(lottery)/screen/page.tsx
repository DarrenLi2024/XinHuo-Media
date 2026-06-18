'use client';

// 大屏抽奖系统 - 大屏展示页（核心）
//
// 完全离线运行：数据来自浏览器 IndexedDB（按平台活动 eventId 隔离）。
// 状态机 waiting → rolling → winner，集成 3D 粒子地球仪、滚动名单、
// 中奖卡牌（碎裂特效）、烟花、音效。跨标签页与后台实时同步。

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Crown, Gift, Settings, Trophy, Users } from 'lucide-react';
import ParticleSphere from '@/components/lottery/ParticleSphere';
import PrizeSidebar from '@/components/lottery/PrizeSidebar';
import { ShatterCard } from '@/components/lottery/ShatterCard';
import { DrawEngine } from '@/lib/lottery/draw-engine';
import { performDraw } from '@/lib/lottery/actions';
import {
  getAllAttendees,
  getAllPrizes,
  getAllLockedWinners,
  getAllDrawRecords,
  getEventInfo,
} from '@/lib/lottery/db';
import { getThemeConfig, levelName } from '@/lib/lottery/theme';
import { subscribeLotteryChange } from '@/lib/lottery/sync';
import { audioManager } from '@/lib/lottery/audio';
import { launchFireworks, destroyFireworks } from '@/lib/lottery/fireworks';
import type { Attendee, Prize, LockedWinner, DrawRecord, EventInfo } from '@/lib/lottery/db/types';

type ScreenState = 'waiting' | 'rolling' | 'winner';

export default function LotteryScreenPage() {
  const [eventId, setEventId] = useState('');
  const [prizeId, setPrizeId] = useState('');
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [lockedWinners, setLockedWinners] = useState<LockedWinner[]>([]);
  const [records, setRecords] = useState<DrawRecord[]>([]);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [ready, setReady] = useState(false);

  const [state, setState] = useState<ScreenState>('waiting');
  const [rollingName, setRollingName] = useState('');
  const [winners, setWinners] = useState<Attendee[]>([]);
  const [lockedNames, setLockedNames] = useState<string[]>([]);
  const [showPrizeList, setShowPrizeList] = useState(false);

  const rollTimerRef = useRef<number | null>(null);

  // 读取 URL 中的活动与奖项
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEventId(params.get('event') || '');
    setPrizeId(params.get('prize') || '');
  }, []);

  const loadData = useCallback(async () => {
    if (!eventId) return;
    const [p, a, l, r, info] = await Promise.all([
      getAllPrizes(eventId),
      getAllAttendees(eventId),
      getAllLockedWinners(eventId),
      getAllDrawRecords(eventId),
      getEventInfo(eventId),
    ]);
    setPrizes(p);
    setAttendees(a);
    setLockedWinners(l);
    setRecords(r);
    setEventInfo(info ?? null);
    setPrizeId((prev) => prev || p[0]?.id || '');
    setReady(true);
  }, [eventId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // 跨标签页同步 + 回到前台刷新
  useEffect(() => {
    if (!eventId) return undefined;
    const unsub = subscribeLotteryChange((e) => {
      if (e.eventId === eventId && state !== 'rolling') void loadData();
    });
    const onFocus = () => {
      if (state !== 'rolling') void loadData();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      unsub();
      window.removeEventListener('focus', onFocus);
    };
  }, [eventId, loadData, state]);

  const theme = useMemo(() => getThemeConfig(eventInfo?.theme), [eventInfo?.theme]);

  const currentPrize = useMemo(
    () => prizes.find((p) => p.id === prizeId) || prizes[0],
    [prizes, prizeId],
  );

  const remaining = useMemo(
    () => (currentPrize ? DrawEngine.getRemaining(currentPrize, records) : 0),
    [currentPrize, records],
  );

  const eligibleNames = useMemo(
    () => DrawEngine.getRollingAttendees(attendees, lockedWinners, records, attendees.length).map((a) => a.name),
    [attendees, lockedWinners, records],
  );

  const currentPrizeWinners = useMemo(
    () => records.filter((r) => r.prizeId === currentPrize?.id && !r.isAbandoned),
    [records, currentPrize],
  );

  const canDraw = Boolean(currentPrize) && remaining > 0 && eligibleNames.length > 0;

  // 滚动名字动画
  useEffect(() => {
    if (state !== 'rolling') {
      if (rollTimerRef.current) window.clearInterval(rollTimerRef.current);
      return undefined;
    }
    const pool = eligibleNames.length > 0 ? eligibleNames : ['抽奖中'];
    rollTimerRef.current = window.setInterval(() => {
      setRollingName(pool[Math.floor(Math.random() * pool.length)]);
    }, 70);
    return () => {
      if (rollTimerRef.current) window.clearInterval(rollTimerRef.current);
    };
  }, [state, eligibleNames]);

  const startDraw = useCallback(() => {
    if (!canDraw || state === 'rolling') return;
    void audioManager.warmup();
    setWinners([]);
    setLockedNames([]);
    setState('rolling');
    audioManager.playStartDrawSound();
  }, [canDraw, state]);

  const stopDraw = useCallback(async () => {
    if (state !== 'rolling' || !currentPrize) return;
    audioManager.stopRollSound();
    const result = await performDraw(eventId, currentPrize.id);
    if (!result || result.winners.length === 0) {
      setState('waiting');
      await loadData();
      return;
    }
    setWinners(result.winners);
    setLockedNames(result.lockedNames);
    setState('winner');
    audioManager.playWinSound();
    audioManager.playCheerSound();
    // 烟花
    const burst = () => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          launchFireworks(
            window.innerWidth * (0.25 + Math.random() * 0.5),
            window.innerHeight * (0.2 + Math.random() * 0.3),
            theme.particleColors,
          );
        }, i * 250);
      }
    };
    burst();
    audioManager.playFireworkSound();
    await loadData();
  }, [state, currentPrize, eventId, loadData, theme.particleColors]);

  const continueDraw = useCallback(() => {
    setState('waiting');
    setWinners([]);
    window.setTimeout(() => startDraw(), 80);
  }, [startDraw]);

  useEffect(() => () => destroyFireworks(), []);

  // 空格键控制
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (state === 'rolling') void stopDraw();
      else if (state === 'winner') continueDraw();
      else startDraw();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, stopDraw, startDraw, continueDraw]);

  if (!eventId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 text-white">
        <p className="text-xl">未指定活动</p>
        <a href="/lottery" className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 hover:bg-white/20">
          前往抽奖后台
        </a>
      </div>
    );
  }

  if (ready && prizes.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 text-white">
        <Gift className="h-16 w-16 text-white/40" />
        <p className="text-xl">该活动暂无奖项数据</p>
        <p className="text-sm text-white/50">请先在后台「奖项管理」中创建奖项，并导入参会人员</p>
        <a
          href={`/lottery/prizes?event=${eventId}`}
          className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 hover:bg-white/20"
        >
          前往配置
        </a>
      </div>
    );
  }

  if (!currentPrize) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-xl text-white">
        正在加载抽奖大屏...
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden" style={{ background: theme.background }}>
      {/* 3D 粒子地球仪背景 */}
      <div className="absolute inset-0">
        <ParticleSphere names={eligibleNames} isActive showEffects={state === 'rolling'} />
      </div>

      {/* 奖项侧边栏 */}
      <PrizeSidebar prize={currentPrize} remaining={remaining} />

      {/* 顶部活动信息 */}
      <header className="relative z-10 px-6 pb-4 pt-8 text-center">
        {eventInfo?.eventName && (
          <p className="mb-2 text-lg tracking-widest text-white/70">{eventInfo.eventName}</p>
        )}
        <div className="mb-3 inline-flex items-center gap-4">
          <Crown className="h-10 w-10 animate-pulse" style={{ color: theme.accent }} />
          <h1 className="text-5xl font-bold tracking-wider text-white drop-shadow-lg">{currentPrize.name}</h1>
          <Crown className="h-10 w-10 animate-pulse" style={{ color: theme.accent }} />
        </div>
        <div className="flex items-center justify-center gap-3 text-xl text-white/90">
          <Gift className="h-6 w-6" />
          <span>{currentPrize.prizeName || levelName(currentPrize.level)}</span>
          <span className="ml-2 rounded-full border border-white/30 bg-white/15 px-4 py-1 text-lg">
            剩余 {remaining} 名
          </span>
        </div>
      </header>

      {/* 主舞台 */}
      <main className="relative z-10 flex flex-1 items-center justify-center">
        <div className="w-full max-w-5xl px-4 text-center">
          {state === 'waiting' && winners.length === 0 && (
            <div className="text-center">
              <Users className="mx-auto mb-4 h-16 w-16 animate-pulse text-white/50" />
              <p className="text-3xl text-white/70">等待开始抽奖</p>
              <p className="mt-3 text-lg text-white/40">可参与人数：{eligibleNames.length} 人</p>
              <p className="mt-6 text-sm text-white/30">按空格键开始 / 停止抽奖</p>
            </div>
          )}

          {state === 'rolling' && (
            <div className="text-center">
              <div
                className="bg-gradient-to-r bg-clip-text text-8xl font-black text-transparent transition-all duration-75"
                style={{ backgroundImage: `linear-gradient(to right, ${theme.accent}, ${theme.primary})` }}
              >
                {rollingName || '···'}
              </div>
              <p className="mt-6 animate-pulse text-xl text-white/60">抽奖进行中...</p>
            </div>
          )}

          {state === 'winner' && winners.length > 0 && (
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-3 text-3xl font-bold" style={{ color: theme.accent }}>
                <Trophy className="h-9 w-9" />
                <span>恭喜中奖</span>
                <Trophy className="h-9 w-9" />
              </div>
              <div className="flex max-w-5xl flex-wrap justify-center gap-5">
                {winners.map((w) => (
                  <ShatterCard
                    key={w.id}
                    winner={{ name: w.name, company: w.company, tableNumber: w.tableNumber }}
                    theme={theme}
                    isLatest
                    isReplaced={lockedNames.includes(w.name)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 控制按钮 */}
      <div className="relative z-10 mb-4 flex justify-center gap-4">
        {state === 'waiting' && (
          <button
            onClick={startDraw}
            disabled={!canDraw}
            className="h-16 rounded-full bg-gradient-to-r px-12 text-2xl font-bold text-white shadow-lg transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})` }}
          >
            开始抽奖
          </button>
        )}
        {state === 'rolling' && (
          <button
            onClick={() => void stopDraw()}
            className="h-16 rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-12 text-2xl font-bold text-white shadow-lg transition-transform hover:scale-105"
          >
            停止
          </button>
        )}
        {state === 'winner' && (
          <button
            onClick={continueDraw}
            disabled={remaining <= 0 || eligibleNames.length === 0}
            className="h-16 rounded-full bg-gradient-to-r px-12 text-2xl font-bold text-white shadow-lg transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})` }}
          >
            继续抽奖
          </button>
        )}
      </div>

      {/* 奖项切换 */}
      <button
        onClick={() => setShowPrizeList((v) => !v)}
        className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-xl border border-white/20 bg-white/10 px-2 py-6 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        {showPrizeList ? '▶' : '◀'}
      </button>
      {showPrizeList && (
        <div className="fixed right-0 top-0 z-30 h-full w-72 overflow-y-auto border-l border-white/20 bg-black/60 p-6 backdrop-blur-xl">
          <h3 className="mb-4 text-lg font-bold text-white">奖项列表</h3>
          <div className="space-y-3">
            {prizes.map((prize) => {
              const left = DrawEngine.getRemaining(prize, records);
              return (
                <button
                  key={prize.id}
                  onClick={() => {
                    setPrizeId(prize.id);
                    setShowPrizeList(false);
                    setState('waiting');
                    setWinners([]);
                  }}
                  disabled={state === 'rolling'}
                  className={`w-full rounded-xl border p-3 text-left transition-all disabled:opacity-40 ${
                    prize.id === prizeId ? 'border-yellow-400/50 bg-yellow-400/10' : 'border-white/10 hover:bg-white/5'
                  } ${left <= 0 ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{prize.name}</span>
                    <span className="rounded border border-white/20 px-2 text-sm text-white/70">
                      {left}/{prize.quantity}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/50">{levelName(prize.level)}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 底部：本奖项中奖名单 + 返回 */}
      <footer className="relative z-10 pb-6 pt-2">
        <div className="mx-auto max-w-5xl px-4">
          {currentPrizeWinners.length > 0 && state !== 'winner' && (
            <div className="mb-4">
              <div className="mb-3 flex items-center justify-center gap-2 text-white/80">
                <Trophy className="h-5 w-5" />
                <span className="text-lg">本奖项中奖名单（{currentPrizeWinners.length}）</span>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {currentPrizeWinners.map((w) => (
                  <span
                    key={w.id}
                    className="rounded-full bg-gradient-to-r px-5 py-2 font-bold text-white shadow"
                    style={{ backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})` }}
                  >
                    {w.attendeeName}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-center gap-3">
            <a
              href={`/lottery?event=${eventId}`}
              className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white hover:bg-white/20"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              返回管理后台
            </a>
            <a
              href={`/lottery/settings?event=${eventId}`}
              className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white hover:bg-white/20"
            >
              <Settings className="mr-2 h-4 w-4" />
              设置
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
