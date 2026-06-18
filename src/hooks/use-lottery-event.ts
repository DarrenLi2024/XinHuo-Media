'use client';

// 大屏抽奖系统 - 当前活动选择 Hook
//
// 抽奖与平台活动打通：所有后台子页共享「当前活动」。
// 优先级：URL ?event= > localStorage > 活动列表首个。
// 选中后写入 localStorage 与 URL，便于跨页面/跨标签保持一致。

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'xinhuo-lottery-current-event';

export interface LotteryEventOption {
  id: string;
  name: string;
}

export function useLotteryEvent() {
  const [events, setEvents] = useState<LotteryEventOption[]>([]);
  const [eventId, setEventIdState] = useState('');
  const [loading, setLoading] = useState(true);

  const setEventId = useCallback((id: string) => {
    setEventIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, id);
      const url = new URL(window.location.href);
      url.searchParams.set('event', id);
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch('/api/events?limit=100', { credentials: 'include' });
        const result: { data?: LotteryEventOption[] } = await response.json();
        const list = result.data || [];
        if (cancelled) return;
        setEvents(list);

        const fromUrl = new URLSearchParams(window.location.search).get('event');
        const fromStorage = localStorage.getItem(STORAGE_KEY);
        const initial =
          (fromUrl && list.some((e) => e.id === fromUrl) && fromUrl) ||
          (fromStorage && list.some((e) => e.id === fromStorage) && fromStorage) ||
          list[0]?.id ||
          '';
        if (initial) setEventId(initial);
      } catch {
        // 离线或接口异常时静默，由页面提示选择活动
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [setEventId]);

  return { events, eventId, setEventId, loading };
}
