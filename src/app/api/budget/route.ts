import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import {
  listDemoBudgetLines,
  createDemoBudgetLine,
  updateDemoBudgetLine,
  deleteDemoBudgetLine,
} from '@/lib/demo-store';
import { apiError, requireAuth, parseJsonBody, writeAuditLog } from '@/lib/api/security';

const createSchema = z.object({
  event_id: z.string().min(1),
  category: z.string().min(1),
  item: z.string().min(1),
  planned_amount: z.number().min(0),
  actual_amount: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// GET /api/budget?event_id=...
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) return NextResponse.json({ error: '缺少 event_id' }, { status: 400 });

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data, error } = await supabase.from('budget_lines')
        .select('*').eq('event_id', eventId).order('created_at', { ascending: true });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const lines = data || [];
      const planned = lines.reduce((s: number, l: Record<string, unknown>) => s + (Number(l.budget_amount) || 0), 0);
      const actual = lines.reduce((s: number, l: Record<string, unknown>) => s + (Number(l.actual_amount) || 0), 0);
      return NextResponse.json({ success: true, data: { lines, planned, actual } });
    }

    const lines = listDemoBudgetLines(eventId);
    const planned = lines.reduce((s, l) => s + l.budget_amount, 0);
    const actual = lines.reduce((s, l) => s + (l.actual_amount || 0), 0);
    return NextResponse.json({ success: true, data: { lines, planned, actual } });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/budget
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await parseJsonBody(req, createSchema);

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data, error } = await supabase.from('budget_lines').insert({
        event_id: body.event_id,
        category: body.category,
        item: body.item,
        planned_amount: body.planned_amount,
        actual_amount: body.actual_amount || 0,
        notes: body.notes,
      }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await writeAuditLog(req, user, 'budget.create', 'budget_line', data.id, body);
      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    const line = createDemoBudgetLine({
      event_id: body.event_id,
      category: body.category as 'venue' | 'construction' | 'catering' | 'materials' | 'gifts' | 'personnel' | 'transport' | 'other',
      description: body.item,
      budget_amount: body.planned_amount,
      actual_amount: body.actual_amount,
      notes: body.notes,
    });
    return NextResponse.json({ success: true, data: line }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/budget?id=...
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

    const body = await req.json();

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data, error } = await supabase.from('budget_lines').update({
        ...body,
        updated_at: new Date().toISOString(),
      }).eq('id', id).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await writeAuditLog(req, user, 'budget.update', 'budget_line', id, body);
      return NextResponse.json({ success: true, data });
    }

    const line = updateDemoBudgetLine(id, body);
    if (!line) return NextResponse.json({ error: '记录不存在' }, { status: 404 });
    return NextResponse.json({ success: true, data: line });
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/budget?id=...
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { error } = await supabase.from('budget_lines').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await writeAuditLog(req, user, 'budget.delete', 'budget_line', id);
      return NextResponse.json({ success: true });
    }

    const ok = deleteDemoBudgetLine(id);
    if (!ok) return NextResponse.json({ error: '记录不存在' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
