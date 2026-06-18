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

const checkinSchema = z.object({
  guest_id: z.string().uuid(),
  event_id: z.string().uuid(),
  method: z.enum(['qr', 'qr_code', 'face', 'manual', 'nfc']).optional(),
});

// GET /api/checkin - 获取签到统计
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
    }
    await requireEventAccess(user, eventId, 'viewer');

    // 获取签到统计
    const { data: guests, error: guestsError } = await createServerClient()
      .from('guests')
      .select('id, level, check_in_status')
      .eq('event_id', eventId);

    if (guestsError) {
      return NextResponse.json({ error: guestsError.message }, { status: 500 });
    }

    const totalGuests = guests?.length || 0;
    const checkedInGuests = guests?.filter((g) => g.check_in_status === 'checked_in').length || 0;
    const vipGuests = guests?.filter((g) => g.level === 'vip') || [];
    const vipCheckedIn = vipGuests.filter((g) => g.check_in_status === 'checked_in').length;

    // 获取最近签到记录
    const { data: recentCheckins, error: recentError } = await createServerClient()
      .from('check_in_records')
      .select('*, guests(name, company, level)')
      .eq('event_id', eventId)
      .order('check_in_time', { ascending: false })
      .limit(10);

    if (recentError) {
      return NextResponse.json({ error: recentError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        statistics: {
          total_guests: totalGuests,
          checked_in_guests: checkedInGuests,
          check_in_rate: totalGuests > 0 ? (checkedInGuests / totalGuests) * 100 : 0,
          vip_total: vipGuests.length,
          vip_checked_in: vipCheckedIn,
          pending: totalGuests - checkedInGuests,
        },
        recent_checkins: recentCheckins || [],
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/checkin - 嘉宾签到
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request, checkinSchema);
    const { guest_id, event_id, method } = body;
    await requireEventAccess(user, event_id, 'executor');

    const { data: existingGuest, error: existingGuestError } = await createServerClient()
      .from('guests')
      .select('id, event_id, check_in_status')
      .eq('id', guest_id)
      .eq('event_id', event_id)
      .single();

    if (existingGuestError || !existingGuest) {
      return NextResponse.json({ error: '嘉宾不存在' }, { status: 404 });
    }

    if (existingGuest.check_in_status === 'checked_in') {
      return NextResponse.json({ error: '该嘉宾已经签到' }, { status: 409 });
    }

    // 更新嘉宾签到状态
    const { data: guest, error: guestError } = await createServerClient()
      .from('guests')
      .update({
        check_in_status: 'checked_in',
        check_in_time: new Date().toISOString(),
      })
      .eq('id', guest_id)
      .eq('event_id', event_id)
      .select()
      .single();

    if (guestError) {
      return NextResponse.json({ error: guestError.message }, { status: 500 });
    }

    // 创建签到记录
    const { data: record, error: recordError } = await createServerClient()
      .from('check_in_records')
      .insert({
        event_id,
        guest_id,
        check_in_time: new Date().toISOString(),
        method: method || 'qr',
      })
      .select()
      .single();

    if (recordError) {
      return NextResponse.json({ error: recordError.message }, { status: 500 });
    }

    await writeAuditLog(request, user, 'checkin.create', 'guest', guest_id, { event_id, method });

    return NextResponse.json({
      data: {
        guest,
        record,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
