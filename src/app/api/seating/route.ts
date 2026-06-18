import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase';
import {
  apiError,
  parseJsonBody,
  requireAuth,
  requireEventAccess,
  writeAuditLog,
} from '@/lib/api/security';

const seatingZoneSchema = z.object({
  event_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.string().min(1).max(50),
  row_count: z.number().int().min(1).max(200),
  column_count: z.number().int().min(1).max(200),
  order: z.number().int().min(0).max(10000).optional(),
  is_vip: z.boolean().optional(),
});

// GET /api/seating - 获取座位布局
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
    }
    await requireEventAccess(user, eventId, 'viewer');

    const { data: zones, error: zonesError } = await createServerClient()
      .from('seating_zones')
      .select('id, event_id, name, type, row_count, column_count, order, is_vip, created_at, updated_at')
      .eq('event_id', eventId)
      .order('order', { ascending: true });

    if (zonesError) {
      return NextResponse.json({ error: zonesError.message }, { status: 500 });
    }

    const { data: seats, error: seatsError } = await createServerClient()
      .from('seats')
      .select('*, guests(id, name, company, level)')
      .in('zone_id', zones?.map((z) => z.id) || []);

    if (seatsError) {
      return NextResponse.json({ error: seatsError.message }, { status: 500 });
    }

    // 组装数据
    const seatingData = zones?.map((zone) => ({
      ...zone,
      seats: seats?.filter((s) => s.zone_id === zone.id) || [],
    }));

    return NextResponse.json({ data: seatingData });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/seating - 创建座位区域
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request, seatingZoneSchema);
    await requireEventAccess(user, body.event_id, 'manager');

    const { data, error } = await createServerClient()
      .from('seating_zones')
      .insert({
        event_id: body.event_id,
        name: body.name,
        type: body.type,
        row_count: body.row_count,
        column_count: body.column_count,
        order: body.order,
        is_vip: body.is_vip || false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 自动创建座位
    const seats = [];
    for (let row = 1; row <= body.row_count; row++) {
      for (let col = 1; col <= body.column_count; col++) {
        seats.push({
          zone_id: data.id,
          row_number: row,
          column_number: col,
          seat_number: `${row}-${col}`,
          status: 'available',
        });
      }
    }

    const { error: seatsError } = await createServerClient()
      .from('seats')
      .insert(seats);

    if (seatsError) {
      return NextResponse.json({ error: seatsError.message }, { status: 500 });
    }

    await writeAuditLog(request, user, 'seating-zone.create', 'seating_zone', data.id, data);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
