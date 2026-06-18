import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase';
import {
  apiError,
  parseJsonBody,
  requireAuth,
  requireRole,
  safeSearch,
  writeAuditLog,
} from '@/lib/api/security';

const userUpdateSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['super_admin', 'event_manager', 'executor', 'staff', 'supplier', 'guest']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
}).refine((data) => data.role !== undefined || data.status !== undefined, {
  message: '至少提供一个更新字段',
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireRole(user, ['super_admin']);
    const searchParams = request.nextUrl.searchParams;
    const search = safeSearch(searchParams.get('search'));
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    let query = createServerClient()
      .from('users')
      .select('id, email, phone, name, avatar_url, role, status, last_login_at, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (role) {
      query = query.eq('role', role);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireRole(user, ['super_admin']);
    const body = await parseJsonBody(request, userUpdateSchema);

    if (body.id === user.id && body.status && body.status !== 'active') {
      return NextResponse.json({ error: '不能禁用当前登录用户' }, { status: 400 });
    }

    const updateData: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };
    if (body.role) {
      updateData.role = body.role;
    }
    if (body.status) {
      updateData.status = body.status;
    }

    const { data, error } = await createServerClient()
      .from('users')
      .update(updateData)
      .eq('id', body.id)
      .select('id, email, name, role, status, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(request, user, 'user.update', 'user', body.id, body);
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}
