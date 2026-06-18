import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Supabase 客户端配置
// 环境变量需要在 .env.local 或部署环境中配置

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserClient: SupabaseClient | null = null;

type SupabaseConfig = {
  url: string | undefined;
  key: string | undefined;
};

function assertSupabaseConfig(config: SupabaseConfig): asserts config is { url: string; key: string } {
  const { url, key } = config;

  if (!url || !key) {
    throw new Error(
      'Supabase 环境变量未配置，请设置 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY。',
    );
  }
}

export const isSupabaseConfigured = (): boolean => {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key);
};

// 懒加载客户端，避免开发环境缺少环境变量时在模块导入阶段直接崩溃。
export const getSupabaseClient = (): SupabaseClient => {
  const config = {
    url: supabaseUrl,
    key: supabaseAnonKey,
  };

  assertSupabaseConfig(config);
  browserClient ??= createClient(config.url, config.key);
  return browserClient;
};

// 兼容既有 API 写法：supabase.from(...). 缺少配置时会在使用时抛出清晰错误。
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseClient(), prop, receiver);
  },
});

// 服务端 Supabase 客户端（用于 API Routes）
export const createServerClient = () => {
  const config = {
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  assertSupabaseConfig(config);

  return createClient(config.url, config.key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// 数据库表名常量
export const TABLES = {
  USERS: 'users',
  USER_SESSIONS: 'user_sessions',
  AUDIT_LOGS: 'audit_logs',
  EVENTS: 'events',
  EVENT_MEMBERS: 'event_members',
  TASKS: 'tasks',
  TASK_COMMENTS: 'task_comments',
  GUESTS: 'guests',
  VENUES: 'venues',
  SEATS: 'seats',
  SCRIPTS: 'scripts',
  SCRIPT_SEGMENTS: 'script_segments',
  CHECK_INS: 'check_ins',
  PRIZES: 'prizes',
  LOTTERY_RECORDS: 'lottery_records',
  REPORTS: 'reports',
  SUPPLIERS: 'suppliers',
  MATERIAL_ORDERS: 'material_orders',
} as const;

// 辅助函数：生成唯一ID
export const generateId = (): string => {
  return crypto.randomUUID();
};

// 辅助函数：格式化日期
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// 辅助函数：格式化时间
export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 辅助函数：格式化日期时间
export const formatDateTime = (date: string | Date): string => {
  return `${formatDate(date)} ${formatTime(date)}`;
};
