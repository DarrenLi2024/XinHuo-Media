import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { listDemoSeatingTables, createDemoSeatingTable, updateDemoSeatingTable, deleteDemoSeatingTable } from '@/lib/demo-store';
import { apiError, requireAuth, parseJsonBody, writeAuditLog } from '@/lib/api/security';

const createSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1),
  capacity: z.number().int().min(1).max(50),
  shape: z.enum(['round', 'square', 'long']).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id') || '';

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data, error } = await supabase.from('seating_zones')
        .select('*').eq('event_id', eventId).order('created_at', { ascending: true });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data: data || [] });
    }

    return NextResponse.json({ success: true, data: listDemoSeatingTables(eventId) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await parseJsonBody(req, createSchema);

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data, error } = await supabase.from('seating_zones').insert({
        event_id: body.eventId,
        name: body.name,
        capacity: body.capacity,
        shape: body.shape || 'round',
        guests: [],
      }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await writeAuditLog(req, user, 'table.create', 'seating_zone', data.id, body);
      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    const table = createDemoSeatingTable({ eventId: body.eventId, ...body });
    return NextResponse.json({ success: true, data: table }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data, error } = await supabase.from('seating_zones').update({
        ...updates,
        updated_at: new Date().toISOString(),
      }).eq('id', id).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }

    const table = updateDemoSeatingTable(id, updates);
    if (!table) return NextResponse.json({ error: '记录不存在' }, { status: 404 });
    return NextResponse.json({ success: true, data: table });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { error } = await supabase.from('seating_zones').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await writeAuditLog(req, user, 'table.delete', 'seating_zone', id);
      return NextResponse.json({ success: true });
    }

    if (!deleteDemoSeatingTable(id)) return NextResponse.json({ error: '记录不存在' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
