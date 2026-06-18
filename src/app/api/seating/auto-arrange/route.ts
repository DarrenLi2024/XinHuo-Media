import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { autoArrangeDemoSeating } from '@/lib/demo-store';
import { apiError, parseJsonBody, requireAuth, requireEventAccess, writeAuditLog } from '@/lib/api/security';

const autoArrangeSchema = z.object({
  eventId: z.string().min(1),
  strategy: z.enum(['balanced', 'vip-first', 'company-group', 'random']).optional(),
});

async function supabaseAutoArrange(eventId: string, strategy: string) {
  const supabase = createServerClient();

  // 读取所有未入座的宾客
  const { data: guests } = await supabase.from('guests')
    .select('*').eq('event_id', eventId).is('seat_number', null)
    .order('level', { ascending: false });

  // 读取所有未满的桌
  const { data: zones } = await supabase.from('seating_zones')
    .select('*').eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (!guests || guests.length === 0) return { arrangedCount: 0, unassignedCount: 0 };
  if (!zones || zones.length === 0) return { arrangedCount: 0, unassignedCount: guests.length };

  let arranged = 0;

  // 根据策略排序宾客
  let sortedGuests = [...guests];
  if (strategy === 'vip-first') {
    const levelOrder: Record<string, number> = { vip: 0, important: 1, normal: 2 };
    sortedGuests.sort((a, b) => (levelOrder[a.level as string] ?? 2) - (levelOrder[b.level as string] ?? 2));
  } else if (strategy === 'random') {
    for (let i = sortedGuests.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sortedGuests[i], sortedGuests[j]] = [sortedGuests[j], sortedGuests[i]];
    }
  }
  // balanced / company-group: 默认按 level 降序

  for (const zone of zones) {
    const zoneGuests = (zone.guests as Array<Record<string, unknown>>) || [];
    const capacity = (zone.capacity as number) || 10;
    const remaining = capacity - zoneGuests.length;
    if (remaining <= 0) continue;

    const toAssign = sortedGuests.slice(arranged, arranged + remaining);
    if (toAssign.length === 0) break;

    const newGuests = toAssign.map((g, idx) => ({
      id: g.id,
      name: g.name,
      seatIndex: zoneGuests.length + idx,
    }));

    await supabase.from('seating_zones').update({
      guests: [...zoneGuests, ...newGuests],
      updated_at: new Date().toISOString(),
    }).eq('id', zone.id);

    for (const g of toAssign) {
      await supabase.from('guests').update({
        seat_number: `${zone.name}-${zoneGuests.length + 1}`,
        updated_at: new Date().toISOString(),
      }).eq('id', g.id);
    }

    arranged += toAssign.length;
  }

  return {
    arrangedCount: arranged,
    unassignedCount: guests.length - arranged,
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request, autoArrangeSchema);

    if (isSupabaseConfigured()) {
      await requireEventAccess(user, body.eventId, 'manager');
      const result = await supabaseAutoArrange(body.eventId, body.strategy || 'balanced');
      await writeAuditLog(request, user, 'seating.auto-arrange', 'event', body.eventId, { strategy: body.strategy });
      return NextResponse.json({
        success: true,
        data: result,
        message: `自动排座完成，已安排 ${result.arrangedCount} 人，剩余 ${result.unassignedCount} 人未分配`,
      });
    }

    const result = autoArrangeDemoSeating(body.eventId);
    return NextResponse.json({
      success: true,
      data: result,
      message: `自动排座完成，已安排 ${result.arrangedCount} 人，剩余 ${result.unassignedCount} 人未分配`,
    });
  } catch (error) {
    return apiError(error);
  }
}
