import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAuth } from '@/lib/api/security';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const res = await fetch(`${request.nextUrl.origin}/api/roster?event_id=demo&type=attendees`);
    const json = await res.json();
    if (!json.success) return NextResponse.json({ success: false, error: '加载失败' });

    const list = json.data || [];
    const total = list.length;
    const checkedIn = list.filter((a: { checkin_status: string }) => a.checkin_status === 'checked_in').length;
    const byType: Record<string, number> = {};
    const byTypeChecked: Record<string, number> = {};
    list.forEach((a: { industry?: string; checkin_status: string }) => {
      const t = a.industry || '其他';
      byType[t] = (byType[t] || 0) + 1;
      if (a.checkin_status === 'checked_in') byTypeChecked[t] = (byTypeChecked[t] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        total, checkedIn, notCheckedIn: total - checkedIn,
        checkInRate: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
        byType, byTypeChecked,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
