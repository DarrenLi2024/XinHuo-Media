import { NextRequest, NextResponse } from 'next/server';
import { z, type ZodSchema } from 'zod';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { demoUser } from '@/lib/demo-store';

export type UserRole = 'super_admin' | 'event_manager' | 'executor' | 'staff' | 'supplier' | 'guest';
export type EventMemberRole = 'owner' | 'manager' | 'executor' | 'viewer';

export interface AuthContext {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const bearerPrefix = 'Bearer ';
const maxBodyBytes = 256 * 1024;
const roleRank: Record<UserRole, number> = {
  guest: 0,
  supplier: 1,
  staff: 2,
  executor: 3,
  event_manager: 4,
  super_admin: 5,
};
const memberRank: Record<EventMemberRole, number> = {
  viewer: 0,
  executor: 1,
  manager: 2,
  owner: 3,
};

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Periodically purge expired entries to prevent unbounded memory growth
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

function maybeCleanupRateLimitStore(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function apiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof z.ZodError) {
    const flattened = error.flatten();
    const fieldErrors = flattened.fieldErrors as Record<string, string[] | undefined>;
    const fieldMessages = Object.entries(fieldErrors)
      .flatMap(([field, messages]) => (messages || []).map((message) => `${field}: ${message}`));
    const formMessages = flattened.formErrors;
    const detailText = [...fieldMessages, ...formMessages].join('；');
    return NextResponse.json(
      {
        error: detailText ? `请求参数不合法：${detailText}` : '请求参数不合法',
        details: flattened,
      },
      { status: 400 },
    );
  }

  console.error('Unhandled API error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export function assertRateLimit(request: NextRequest, scope: string, limit = 120, windowMs = 60_000): void {
  maybeCleanupRateLimitStore();
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwardedFor || request.headers.get('x-real-ip') || 'unknown';
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new ApiError(429, '请求过于频繁，请稍后再试');
  }

  current.count += 1;
}

function getAccessToken(request: NextRequest): string {
  const authorization = request.headers.get('authorization');
  if (authorization?.startsWith(bearerPrefix)) {
    return authorization.slice(bearerPrefix.length).trim();
  }

  const sessionHeader = request.headers.get('x-session');
  if (sessionHeader) {
    return sessionHeader.trim();
  }

  const cookieToken = request.cookies.get('xh_access_token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  throw new ApiError(401, '请先登录');
}

export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  assertRateLimit(request, 'auth-context');

  const token = getAccessToken(request);

  if (!isSupabaseConfigured()) {
    if (token === 'demo-session') {
      return demoUser;
    }
    throw new ApiError(401, '请先登录');
  }

  const supabase = createServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authData.user?.id || !authData.user.email) {
    throw new ApiError(401, '登录已失效，请重新登录');
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, name, role, status')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    throw new ApiError(403, '用户资料不存在或无权访问');
  }

  if (profile.status !== 'active') {
    throw new ApiError(403, '用户已被禁用');
  }

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    status: profile.status,
  };
}

export function requireRole(user: AuthContext, roles: UserRole[]): void {
  if (!roles.includes(user.role)) {
    throw new ApiError(403, '无权执行该操作');
  }
}

export function requireMinimumRole(user: AuthContext, role: UserRole): void {
  if (roleRank[user.role] < roleRank[role]) {
    throw new ApiError(403, '无权执行该操作');
  }
}

export async function requireEventAccess(
  user: AuthContext,
  eventId: string,
  minimumRole: EventMemberRole = 'viewer',
): Promise<void> {
  if (!eventId) {
    throw new ApiError(400, 'event_id is required');
  }

  if (user.role === 'super_admin') {
    return;
  }

  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = createServerClient();
  const { data: event } = await supabase
    .from('events')
    .select('id, owner_id')
    .eq('id', eventId)
    .single();

  if (!event) {
    throw new ApiError(404, '活动不存在');
  }

  if (event.owner_id === user.id) {
    return;
  }

  const { data: member } = await supabase
    .from('event_members')
    .select('role')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single();

  if (!member || memberRank[member.role as EventMemberRole] < memberRank[minimumRole]) {
    throw new ApiError(403, '无权访问该活动');
  }
}

export async function parseJsonBody<T>(request: NextRequest, schema: ZodSchema<T>): Promise<T> {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > maxBodyBytes) {
    throw new ApiError(413, '请求体过大');
  }

  const body = await request.json();
  return schema.parse(body);
}

export function safeSearch(value: string | null, maxLength = 80): string | null {
  if (!value) {
    return null;
  }

  return value.trim().slice(0, maxLength).replaceAll('%', '\\%').replaceAll('_', '\\_').replaceAll(',', ' ');
}

export async function writeAuditLog(
  request: NextRequest,
  user: AuthContext,
  action: string,
  resourceType: string,
  resourceId?: string,
  newValue?: unknown,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = createServerClient();

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    new_value: newValue ?? null,
    ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip'),
    user_agent: request.headers.get('user-agent'),
  });
}
