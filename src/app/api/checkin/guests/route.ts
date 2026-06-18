import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAuth } from '@/lib/api/security';

const ROSTER_BASE = (req: NextRequest) => `${req.nextUrl.origin}/api/roster`;

// 将 roster AttendeeEntry → 签到系统 Guest 格式
function mapToGuest(a: Record<string, unknown>) {
  return {
    id: String(a.id),
    name: String(a.name || ''),
    phone: String(a.phone || ''),
    organization: String(a.company || ''),
    guestType: Array.isArray(a.tags) && a.tags.length > 0 ? String(a.tags[0]) : (a.is_member ? '会员' : '参会嘉宾'),
    tableNumber: String(a.table_id || a.seat_number || ''),
    qrCode: String(a.id),
    checkInStatus: a.checkin_status === 'checked_in' ? 1 : 0,
    checkInTime: String(a.checkin_time || ''),
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const qrCode = searchParams.get('qrCode');
    const keyword = searchParams.get('keyword');
    const eventId = searchParams.get('event_id');

    const eid = eventId || 'demo';
    const url = `${ROSTER_BASE(request)}?event_id=${eid}&type=attendees`;

    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) return NextResponse.json({ success: false, error: '加载失败' });

    const list: Record<string, unknown>[] = json.data || [];

    if (qrCode) {
      const found = list.find((a) => String(a.id) === qrCode || String(a.phone) === qrCode);
      return NextResponse.json({ success: true, data: found ? mapToGuest(found) : null });
    }

    let filtered = list;
    if (keyword) {
      const kw = keyword.toLowerCase();
      filtered = list.filter((a) => {
        const name = String(a.name || '').toLowerCase();
        const phone = String(a.phone || '').toLowerCase();
        const company = String(a.company || '').toLowerCase();
        return name.includes(kw) || phone.includes(kw) || company.includes(kw);
      });
    }

    return NextResponse.json({ success: true, data: filtered.map(mapToGuest) });
  } catch (error) {
    return apiError(error);
  }
}


export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const eventId = request.nextUrl.searchParams.get('event_id') || '11111111-1111-4111-8111-111111111111';

    if (Array.isArray(body?.guests)) {
      const rows = body.guests.map((g: Record<string, string>) => ({
        姓名: g.name || '', 手机号: g.phone || '', 公司: g.organization || g.company || '',
        职位: g.position || '',
      }));
      const importRes = await fetch(`${request.nextUrl.origin}/api/roster?type=attendees_batch`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, rows }),
      });
      return NextResponse.json(await importRes.json());
    }

    const createRes = await fetch(`${request.nextUrl.origin}/api/roster?type=attendees`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId, name: body.name, phone: body.phone,
        company: body.organization || body.company, position: body.position,
      }),
    });
    return NextResponse.json(await createRes.json());
  } catch (error) {
    return apiError(error);
  }
}
