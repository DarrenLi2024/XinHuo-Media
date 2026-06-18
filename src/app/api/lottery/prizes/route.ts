import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { apiError, requireAuth, parseJsonBody, writeAuditLog } from '@/lib/api/security';

const createSchema = z.object({
  event_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().int().min(1),
  level: z.number().int().min(1),
  draw_count: z.number().int().min(1).optional(),
  allow_repeat: z.boolean().optional(),
  order: z.number().int().optional(),
});

// 内存数组（demo 回退 + Supabase 无数据时的缓存）
let memoryPrizes: Array<Record<string, unknown>> = [];

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id');

    if (isSupabaseConfigured() && eventId) {
      const supabase = createServerClient();
      const { data } = await supabase.from('lottery_prizes').select('*').eq('event_id', eventId).order('order', { ascending: true });
      memoryPrizes = data || [];
      return NextResponse.json({ success: true, data: memoryPrizes });
    }

    return NextResponse.json({ success: true, data: memoryPrizes });
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
      const { data, error } = await supabase.from('lottery_prizes').insert({
        event_id: body.event_id,
        name: body.name,
        description: body.description,
        quantity: body.quantity,
        level: body.level,
        remaining: body.quantity,
        draw_count: body.draw_count || 1,
        allow_repeat: body.allow_repeat || false,
        order: body.order || 0,
      }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await writeAuditLog(req, user, 'prize.create', 'lottery_prize', data.id, body);
      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    const prize = {
      id: crypto.randomUUID(),
      ...body,
      remaining: body.quantity,
    };
    memoryPrizes.push(prize);
    return NextResponse.json({ success: true, data: prize }, { status: 201 });
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
      const { data, error } = await supabase.from('lottery_prizes').update({
        ...updates,
        updated_at: new Date().toISOString(),
      }).eq('id', id).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }

    const idx = memoryPrizes.findIndex((p) => p.id === id);
    if (idx === -1) return NextResponse.json({ error: '奖品不存在' }, { status: 404 });
    memoryPrizes[idx] = { ...memoryPrizes[idx], ...updates };
    return NextResponse.json({ success: true, data: memoryPrizes[idx] });
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
      const { error } = await supabase.from('lottery_prizes').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await writeAuditLog(req, user, 'prize.delete', 'lottery_prize', id);
      return NextResponse.json({ success: true });
    }

    memoryPrizes = memoryPrizes.filter((p) => p.id !== id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
