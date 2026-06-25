import useSWR, { SWRConfiguration } from 'swr';

// 默认 fetcher
const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    const error: Error & { status?: number } = new Error('请求失败');
    error.status = response.status;
    throw error;
  }
  return response.json();
};

// 默认 SWR 配置
const defaultSWRConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
};

// 通用数据请求 hook
export function useFetch<T>(key: string | null, config?: SWRConfiguration) {
  return useSWR<T>(key, fetcher, { ...defaultSWRConfig, ...config });
}

// 带自动刷新的数据请求 hook（用于实时数据）
export function useFetchWithRefresh<T>(key: string | null, interval: number = 30000) {
  return useSWR<T>(key, fetcher, {
    ...defaultSWRConfig,
    refreshInterval: interval,
  });
}

// ==================== 活动数据 ====================

type EventRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  start_time: string;
  location: string;
  expected_guests: number;
  actual_guests?: number;
  event_tasks?: Array<{ count: number }>;
  guests?: Array<{ count: number }>;
};

type EventsResponse = {
  data?: EventRow[];
  error?: string;
};

export function useEvents(search?: string, status?: string, limit?: number) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status && status !== 'all') params.set('status', status);
  if (limit) params.set('limit', String(limit));
  
  const key = `/api/events?${params.toString()}`;
  return useFetch<EventsResponse>(key);
}

// ==================== 名单统计 ====================

type RosterStats = {
  total?: number;
  total_guests?: number;
  checkedIn?: number;
  attendee_checked_in?: number;
  checkInRate?: number;
  check_in_rate?: number;
};

type RosterStatsResponse = {
  data?: RosterStats;
};

export function useRosterStats(eventId?: string) {
  const key = eventId ? `/api/roster?event_id=${eventId}&type=stats` : '/api/roster?event_id=all&type=stats';
  return useFetch<RosterStatsResponse>(key);
}

// ==================== 任务数据 ====================

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  progress: number;
  event_name?: string;
  end_date: string;
};

type TasksResponse = {
  data?: TaskRow[];
  error?: string;
};

export function useTasks(status?: string, eventId?: string, limit?: number) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (eventId) params.set('event_id', eventId);
  if (limit) params.set('limit', String(limit));
  
  const key = `/api/tasks?${params.toString()}`;
  return useFetch<TasksResponse>(key);
}

// ==================== 签到统计（实时刷新） ====================

type CheckinStats = {
  total: number;
  checkedIn: number;
  checkInRate: number;
};

type CheckinStatsResponse = {
  data?: CheckinStats;
};

export function useCheckinStats(eventId: string, refreshInterval: number = 10000) {
  const key = eventId ? `/api/checkin/stats?event_id=${eventId}` : null;
  return useFetchWithRefresh<CheckinStatsResponse>(key, refreshInterval);
}

// ==================== 报告数据 ====================

type ReportRow = {
  id: string;
  title: string;
  event_id: string;
  created_at: string;
  status: string;
};

type ReportsResponse = {
  data?: ReportRow[];
  error?: string;
};

export function useReports(eventId?: string) {
  const key = eventId ? `/api/reports?event_id=${eventId}` : '/api/reports';
  return useFetch<ReportsResponse>(key);
}

// ==================== 抽奖数据 ====================

type LotteryParticipantsResponse = {
  data?: { available_guests_list?: Array<{ id: string; name: string; company?: string }> };
  error?: string;
};

export function useLotteryParticipants(eventId: string | null) {
  const key = eventId ? `/api/lottery?event_id=${eventId}` : null;
  return useFetch<LotteryParticipantsResponse>(key);
}

export { fetcher };