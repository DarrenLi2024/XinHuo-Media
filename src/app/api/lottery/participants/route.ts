import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAuth } from '@/lib/api/security';

// 抽奖参与者 — 从 roster 已签到人员中读取
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id') || 'demo';

    const res = await fetch(`${request.nextUrl.origin}/api/roster?event_id=${eventId}&type=attendees&status=checked_in`);
    const json = await res.json();
    if (!json.success) return NextResponse.json({ success: false, error: '加载失败' });

    const attendees = (json.data || []).filter((a: { checkin_status: string }) => a.checkin_status === 'checked_in');
    return NextResponse.json({
      success: true,
      data: attendees.map((a: { id: string; name: string; phone?: string; company?: string }) => ({
        id: a.id,
        name: a.name,
        phone: a.phone,
        department: a.company,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
