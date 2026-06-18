import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase';
import {
  abandonDemoLotteryWinner,
  claimDemoLotteryWinner,
  createDemoLockedWinner,
  deleteDemoLockedWinner,
  drawDemoLottery,
  drawDemoLotteryServer,
  getDemoLottery,
  redrawDemoLotteryWinner,
} from '@/lib/demo-store';
import {
  apiError,
  parseJsonBody,
  requireAuth,
  requireEventAccess,
  writeAuditLog,
} from '@/lib/api/security';

const lotteryDrawSchema = z.object({
  event_id: z.string().uuid(),
  prize_id: z.string().uuid(),
  guest_ids: z.array(z.string().uuid()).min(1).max(100).optional(),
  action: z.enum(['draw', 'abandon', 'redraw', 'claim', 'locked-winner', 'delete-locked-winner']).optional(),
  winner_id: z.string().uuid().optional(),
  locked_winner_id: z.string().uuid().optional(),
  draw_count: z.number().int().min(1).max(100).optional(),
  claimed: z.boolean().optional(),
  guest_id: z.string().uuid().optional(),
  name: z.string().min(1).optional(),
  company: z.string().optional(),
  prize_ids: z.array(z.string().uuid()).optional(),
  is_blacklist: z.boolean().optional(),
  effect_time_start: z.string().optional(),
  effect_time_end: z.string().optional(),
});

// GET /api/lottery - 获取抽奖配置和统计
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
    }
    await requireEventAccess(user, eventId, 'viewer');

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ data: getDemoLottery(eventId) });
    }

    const { data: prizes, error: prizesError } = await createServerClient()
      .from('lottery_prizes')
      .select('id, event_id, name, description, quantity, level, remaining, created_at, updated_at')
      .eq('event_id', eventId)
      .order('level', { ascending: true });

    if (prizesError) {
      return NextResponse.json({ error: prizesError.message }, { status: 500 });
    }

    const { data: winners, error: winnersError } = await createServerClient()
      .from('lottery_winners')
      .select('*, guests(name, company), prizes(name, level)')
      .eq('event_id', eventId)
      .order('win_time', { ascending: false });

    if (winnersError) {
      return NextResponse.json({ error: winnersError.message }, { status: 500 });
    }

    // 获取可参与抽奖的嘉宾（已签到且未中奖）
    const { data: eligibleGuests, error: eligibleError } = await createServerClient()
      .from('guests')
      .select('id, name, company, level')
      .eq('event_id', eventId)
      .eq('check_in_status', 'checked_in');

    if (eligibleError) {
      return NextResponse.json({ error: eligibleError.message }, { status: 500 });
    }

    // 排除已中奖的嘉宾
    const winnerIds = winners?.map((w) => w.guest_id) || [];
    const availableGuests = eligibleGuests?.filter((g) => !winnerIds.includes(g.id)) || [];

    return NextResponse.json({
      data: {
        prizes: prizes || [],
        winners: winners || [],
        eligible_guests: eligibleGuests?.length || 0,
        available_guests: availableGuests.length,
        available_guests_list: availableGuests,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/lottery - 执行抽奖
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request, lotteryDrawSchema);
    const { event_id, prize_id, guest_ids } = body;
    await requireEventAccess(user, event_id, 'manager');

    if (!isSupabaseConfigured()) {
      const action = body.action || 'draw';
      if (action === 'locked-winner') {
        const data = createDemoLockedWinner({
          event_id,
          guest_id: body.guest_id,
          name: body.name || '',
          company: body.company,
          prize_ids: body.prize_ids,
          is_blacklist: body.is_blacklist,
          effect_time_start: body.effect_time_start,
          effect_time_end: body.effect_time_end,
        });
        return NextResponse.json({ data });
      }
      if (action === 'delete-locked-winner') {
        if (!body.locked_winner_id) return NextResponse.json({ error: 'locked_winner_id is required' }, { status: 400 });
        const data = deleteDemoLockedWinner(event_id, body.locked_winner_id);
        return NextResponse.json({ data });
      }
      if (action === 'abandon') {
        if (!body.winner_id) return NextResponse.json({ error: 'winner_id is required' }, { status: 400 });
        const data = abandonDemoLotteryWinner({ event_id, winner_id: body.winner_id });
        if (!data) return NextResponse.json({ error: '中奖记录不存在' }, { status: 404 });
        return NextResponse.json({ data });
      }
      if (action === 'redraw') {
        if (!body.winner_id) return NextResponse.json({ error: 'winner_id is required' }, { status: 400 });
        const data = redrawDemoLotteryWinner({ event_id, winner_id: body.winner_id });
        if (!data) return NextResponse.json({ error: '补抽失败，可能没有可抽嘉宾' }, { status: 400 });
        return NextResponse.json({ data });
      }
      if (action === 'claim') {
        if (!body.winner_id) return NextResponse.json({ error: 'winner_id is required' }, { status: 400 });
        const data = claimDemoLotteryWinner({ event_id, winner_id: body.winner_id, claimed: Boolean(body.claimed) });
        if (!data) return NextResponse.json({ error: '中奖记录不存在' }, { status: 404 });
        return NextResponse.json({ data });
      }
      const data = guest_ids
        ? drawDemoLottery({ event_id, prize_id, guest_ids })
        : drawDemoLotteryServer({ event_id, prize_id, draw_count: body.draw_count, operator: user.id });
      if (!data) {
        return NextResponse.json({ error: '奖品不存在、剩余数量不足或没有可抽嘉宾' }, { status: 400 });
      }
      return NextResponse.json({ data });
    }

    if (!guest_ids) {
      return NextResponse.json({ error: 'Supabase 模式暂需传入 guest_ids' }, { status: 400 });
    }

    // 获取奖品信息
    const { data: prize, error: prizeError } = await createServerClient()
      .from('lottery_prizes')
      .select('id, event_id, name, description, quantity, level, remaining')
      .eq('id', prize_id)
      .eq('event_id', event_id)
      .single();

    if (prizeError || !prize) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404 });
    }

    if (prize.remaining <= 0 || guest_ids.length > prize.remaining) {
      return NextResponse.json({ error: 'No prizes remaining' }, { status: 400 });
    }

    const { data: guests, error: guestsError } = await createServerClient()
      .from('guests')
      .select('id, event_id, check_in_status')
      .eq('event_id', event_id)
      .in('id', guest_ids);

    if (guestsError) {
      return NextResponse.json({ error: guestsError.message }, { status: 500 });
    }

    if (!guests || guests.length !== guest_ids.length || guests.some((guest) => guest.check_in_status !== 'checked_in')) {
      return NextResponse.json({ error: '中奖嘉宾必须属于当前活动且已签到' }, { status: 400 });
    }

    const { data: existingWinners, error: existingWinnersError } = await createServerClient()
      .from('lottery_winners')
      .select('guest_id')
      .eq('event_id', event_id)
      .in('guest_id', guest_ids);

    if (existingWinnersError) {
      return NextResponse.json({ error: existingWinnersError.message }, { status: 500 });
    }

    if ((existingWinners?.length || 0) > 0) {
      return NextResponse.json({ error: '存在已中奖嘉宾' }, { status: 409 });
    }

    // 创建中奖记录
    const winnerRecords = guest_ids.map((guestId: string) => ({
      event_id,
      prize_id,
      guest_id: guestId,
      win_time: new Date().toISOString(),
      claimed: false,
    }));

    const { data: winners, error: winnersError } = await createServerClient()
      .from('lottery_winners')
      .insert(winnerRecords)
      .select('*, guests(name, company, level)');

    if (winnersError) {
      return NextResponse.json({ error: winnersError.message }, { status: 500 });
    }

    // 更新奖品剩余数量
    const { error: updateError } = await createServerClient()
      .from('lottery_prizes')
      .update({
        remaining: prize.remaining - guest_ids.length,
      })
      .eq('id', prize_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await writeAuditLog(request, user, 'lottery.draw', 'lottery_prize', prize_id, { event_id, guest_ids });

    return NextResponse.json({
      data: {
        winners,
        prize,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
