import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase';
import { createDemoEvent, getDemoCustomer, linkDemoEventCustomer, listDemoEvents } from '@/lib/demo-store';
import {
  apiError,
  requireAuth,
  requireRole,
  parseJsonBody,
  safeSearch,
  writeAuditLog,
} from '@/lib/api/security';

const eventCreateSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['annual_meeting', 'product_launch', 'seminar', 'appreciation', 'training', 'other']),
  description: z.string().max(5000).optional(),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  location: z.string().min(1).max(255),
  address: z.string().max(1000).optional(),
  expected_guests: z.coerce.number().int().min(0).max(100000).optional(),
  primary_customer_id: z.string().uuid(),
  budget: z.coerce.number().min(0).max(999999999).optional(),
  settings: z.record(z.string(), z.boolean()).optional(),
});

const toPositiveInteger = (value: string | null, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

// GET /api/events - 获取活动列表
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = safeSearch(searchParams.get('search'));
    const page = toPositiveInteger(searchParams.get('page'), 1);
    const limit = Math.min(toPositiveInteger(searchParams.get('limit'), 10), 100);
    const offset = (page - 1) * limit;

    if (!isSupabaseConfigured()) {
      const data = listDemoEvents({ search, status }).slice(offset, offset + limit);
      const total = listDemoEvents({ search, status }).length;
      return NextResponse.json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    let query = createServerClient()
      .from('events')
      .select('*, event_tasks(count), guests(count)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,location.ilike.%${search}%`);
    }

    if (user.role !== 'super_admin') {
      const { data: memberships } = await createServerClient()
        .from('event_members')
        .select('event_id')
        .eq('user_id', user.id);
      const eventIds = memberships?.map((membership) => membership.event_id) || [];

      if (eventIds.length > 0) {
        query = query.or(`owner_id.eq.${user.id},id.in.(${eventIds.join(',')})`);
      } else {
        query = query.eq('owner_id', user.id);
      }
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/events - 创建新活动
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireRole(user, ['super_admin', 'event_manager']);
    const body = await parseJsonBody(request, eventCreateSchema);
    const startTime = new Date(body.start_time);
    const endTime = new Date(body.end_time);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime()) || endTime <= startTime) {
      return NextResponse.json({ error: '活动时间不合法' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      if (!getDemoCustomer(body.primary_customer_id)) {
        return NextResponse.json({ error: '主客户不存在，请先在客户管理中创建客户档案' }, { status: 400 });
      }
      const data = createDemoEvent({
        name: body.name,
        type: body.type,
        description: body.description || '',
        start_time: body.start_time,
        end_time: body.end_time,
        location: body.location,
        address: body.address || '',
        expected_guests: body.expected_guests || 0,
        primary_customer_id: body.primary_customer_id,
        budget: body.budget || 0,
        settings: {
          require_check_in: body.settings?.require_check_in ?? true,
          enable_seating: body.settings?.enable_seating ?? true,
          enable_script: body.settings?.enable_script ?? true,
          allow_lottery: body.settings?.allow_lottery ?? true,
          enable_report: body.settings?.enable_report ?? true,
        },
        status: 'draft',
      });
      linkDemoEventCustomer({
        event_id: data.id,
        customer_id: body.primary_customer_id,
        role: 'client',
        is_primary: true,
        notes: '活动创建时绑定的主客户。',
      });

      return NextResponse.json({ data }, { status: 201 });
    }

    const { data: primaryCustomer } = await createServerClient()
      .from('customers')
      .select('id')
      .eq('id', body.primary_customer_id)
      .single();

    if (!primaryCustomer) {
      return NextResponse.json({ error: '主客户不存在，请先在客户管理中创建客户档案' }, { status: 400 });
    }
    
    const { data, error } = await createServerClient()
      .from('events')
      .insert({
        name: body.name,
        type: body.type,
        description: body.description,
        start_time: body.start_time,
        end_time: body.end_time,
        location: body.location,
        address: body.address,
        expected_guests: body.expected_guests || 0,
        primary_customer_id: body.primary_customer_id,
        budget: body.budget || 0,
        settings: body.settings,
        owner_id: user.id,
        created_by: user.id,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await createServerClient().from('event_members').upsert({
      event_id: data.id,
      user_id: user.id,
      role: 'owner',
    });
    const { error: eventCustomerError } = await createServerClient().from('event_customers').upsert({
      event_id: data.id,
      customer_id: body.primary_customer_id,
      role: 'client',
      is_primary: true,
      notes: '活动创建时绑定的主客户。',
    });
    if (eventCustomerError) {
      await createServerClient().from('events').delete().eq('id', data.id);
      return NextResponse.json({ error: eventCustomerError.message }, { status: 500 });
    }
    await writeAuditLog(request, user, 'event.create', 'event', data.id, data);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
