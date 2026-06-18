import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAuth } from '@/lib/api/security';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const eventId = request.nextUrl.searchParams.get('event_id') || '11111111-1111-4111-8111-111111111111';
    const res = await fetch(`${request.nextUrl.origin}/api/roster?event_id=${eventId}&type=attendees`);
    const json = await res.json();
    if (!json.success) return NextResponse.json({ success: false, error: '加载失败' });

    const list = json.data || [];
    const total = list.length;
    const checkedIn = list.filter((a: { checkin_status: string }) => a.checkin_status === 'checked_in');
    const notCheckedIn = list.filter((a: { checkin_status: string }) => a.checkin_status !== 'checked_in');

    const byType: Record<string, { total: number; checkedIn: number }> = {};
    list.forEach((a: { industry?: string; checkin_status: string }) => {
      const t = a.industry || '其他';
      if (!byType[t]) byType[t] = { total: 0, checkedIn: 0 };
      byType[t].total++;
      if (a.checkin_status === 'checked_in') byType[t].checkedIn++;
    });

    return NextResponse.json({
      success: true,
      data: { total, checkedIn: checkedIn.length, notCheckedIn: notCheckedIn.length,
        checkInRate: total > 0 ? Math.round((checkedIn.length / total) * 100) : 0, byType },
    });
  } catch (error) {
    return apiError(error);
  }
}
