import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase';
import { deleteDemoEvent, getDemoEvent, updateDemoEvent } from '@/lib/demo-store';
import {
  apiError,
  parseJsonBody,
  requireAuth,
  requireEventAccess,
  writeAuditLog,
} from '@/lib/api/security';

const eventUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(['annual_meeting', 'product_launch', 'seminar', 'appreciation', 'training', 'other']).optional(),
  description: z.string().max(5000).optional(),
  start_time: z.string().min(1).optional(),
  end_time: z.string().min(1).optional(),
  location: z.string().max(255).optional(),
  expected_guests: z.coerce.number().int().min(0).max(100000).optional(),
  primary_customer_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'pending', 'preparing', 'ongoing', 'completed', 'archived']).optional(),
});

// GET /api/events/[id] - 获取单个活动详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    await requireEventAccess(user, id, 'viewer');

    if (!isSupabaseConfigured()) {
      const event = getDemoEvent(id);
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }

      return NextResponse.json({ data: event });
    }

    const { data: event, error: eventError } = await createServerClient()
      .from('events')
      .select('id, name, type, status, description, start_time, end_time, location, address, expected_guests, actual_guests, cover_image_url, owner_id, primary_customer_id, budget, actual_cost, settings, tags, created_at, updated_at')
      .eq('id', id)
      .single();

    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // 获取关联数据
    const { data: tasks } = await createServerClient()
      .from('event_tasks')
      .select('id, event_id, title, description, status, progress, priority, due_date, assignee_id, created_at, updated_at')
      .eq('event_id', id)
      .order('created_at', { ascending: true });

    const { data: guests } = await createServerClient()
      .from('guests')
      .select('id, event_id, customer_id, contact_id, name, company, position, phone, email, level, source, invite_status, guest_role, profile_snapshot, seat_zone_id, seat_number, check_in_status, check_in_time, created_at, updated_at')
      .eq('event_id', id)
      .order('created_at', { ascending: true });

    const { data: eventCustomers } = await createServerClient()
      .from('event_customers')
      .select('*, customers(*, customer_contacts(*)), customer_contacts(*)')
      .eq('event_id', id)
      .order('is_primary', { ascending: false });

    const { data: seatingZones } = await createServerClient()
      .from('seating_zones')
      .select('*, seats(*)')
      .eq('event_id', id);

    const { data: scriptSegments } = await createServerClient()
      .from('script_segments')
      .select('id, event_id, order, type, name, duration, speaker, content, notes, start_time, status')
      .eq('event_id', id)
      .order('order', { ascending: true });

    const { data: supplierEventLinks } = await createServerClient()
      .from('supplier_event_links')
      .select('*, suppliers(*), supplier_contacts(*)')
      .eq('event_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      data: {
        ...event,
        tasks: tasks || [],
        guests: guests || [],
        event_customers: eventCustomers || [],
        supplier_event_links: supplierEventLinks || [],
        seating_zones: seatingZones || [],
        script_segments: scriptSegments || [],
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/events/[id] - 更新活动
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    await requireEventAccess(user, id, 'manager');
    const body = await parseJsonBody(request, eventUpdateSchema);

    if (!isSupabaseConfigured()) {
      const data = updateDemoEvent(id, body);
      if (!data) {
        return NextResponse.json({ error: '活动不存在' }, { status: 404 });
      }

      return NextResponse.json({ data });
    }

    const { data, error } = await createServerClient()
      .from('events')
      .update({
        name: body.name,
        type: body.type,
        description: body.description,
        start_time: body.start_time,
        end_time: body.end_time,
        location: body.location,
        expected_guests: body.expected_guests,
        primary_customer_id: body.primary_customer_id,
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(request, user, 'event.update', 'event', id, body);

    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/events/[id] - 删除活动
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    await requireEventAccess(user, id, 'owner');

    if (!isSupabaseConfigured()) {
      const deleted = deleteDemoEvent(id);
      if (!deleted) {
        return NextResponse.json({ error: '活动不存在' }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    }

    const { error } = await createServerClient()
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(request, user, 'event.delete', 'event', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
