// 大屏抽奖系统 - 跨标签页轻量同步（完全离线，基于 BroadcastChannel）
//
// 后台管理页与大屏展示页通常在同一浏览器的不同标签页打开。
// 任一端修改 IndexedDB 数据后，通过 BroadcastChannel 广播，另一端即时刷新，
// 实现「实时同步」而无需任何服务端。

const CHANNEL_NAME = 'xinhuo-lottery-sync';

export type LotterySyncEvent = {
  eventId: string;
  scope: 'attendees' | 'prizes' | 'lockedWinners' | 'records' | 'eventInfo' | 'all';
  ts: number;
};

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

export function broadcastLotteryChange(eventId: string, scope: LotterySyncEvent['scope'] = 'all'): void {
  const ch = getChannel();
  ch?.postMessage({ eventId, scope, ts: Date.now() } satisfies LotterySyncEvent);
}

export function subscribeLotteryChange(handler: (event: LotterySyncEvent) => void): () => void {
  const ch = getChannel();
  if (!ch) return () => {};
  const listener = (e: MessageEvent<LotterySyncEvent>) => handler(e.data);
  ch.addEventListener('message', listener);
  return () => ch.removeEventListener('message', listener);
}
