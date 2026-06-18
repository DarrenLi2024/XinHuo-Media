import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAuth } from '@/lib/api/security';

// POST /api/checkin/checkin-action — 通过 roster API 执行签到
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { guestId, qrCode, terminalId, operator } = body;

    let attendeeId = guestId;

    // 通过二维码查找
    if (!attendeeId && qrCode) {
      const res = await fetch(`${request.nextUrl.origin}/api/roster?event_id=demo&type=attendees`);
      const json = await res.json();
      if (json.success) {
        const found = json.data.find((a: { id: string; phone?: string }) => a.id === qrCode || a.phone === qrCode);
        if (found) attendeeId = found.id;
      }
      if (!attendeeId) {
        return NextResponse.json({ success: false, error: '未找到该嘉宾' }, { status: 404 });
      }
    }

    if (!attendeeId) {
      return NextResponse.json({ success: false, error: '请提供嘉宾ID或二维码' }, { status: 400 });
    }

    // 检查是否已签到
    const checkRes = await fetch(`${request.nextUrl.origin}/api/roster?event_id=demo&type=attendees`);
    const checkJson = await checkRes.json();
    if (checkJson.success) {
      const attendee = checkJson.data.find((a: { id: string }) => a.id === attendeeId);
      if (!attendee) {
        return NextResponse.json({ success: false, error: '嘉宾不存在' }, { status: 404 });
      }
      if (attendee.checkin_status === 'checked_in') {
        return NextResponse.json({ success: false, error: `${attendee.name} 已签到，请勿重复签到` }, { status: 409 });
      }
    }

    // 执行签到
    const putRes = await fetch(`${request.nextUrl.origin}/api/roster?type=attendees`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: attendeeId,
        checkin_status: 'checked_in',
        checkin_time: new Date().toISOString(),
      }),
    });
    const putJson = await putRes.json();

    if (putJson.success) {
      return NextResponse.json({
        success: true,
        data: putJson.data,
        message: `${putJson.data.name} 签到成功！`,
      });
    }

    return NextResponse.json({ success: false, error: putJson.error || '签到失败' }, { status: 500 });
  } catch (error) {
    return apiError(error);
  }
}
