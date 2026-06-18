import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAuth } from '@/lib/api/security';

// 排座嘉宾列表 — 从 roster 读取待排座人员
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const eventId = request.nextUrl.searchParams.get('eventId');
    const seated = request.nextUrl.searchParams.get('seated');

    if (!eventId) {
      return NextResponse.json({ success: false, error: 'eventId is required' }, { status: 400 });
    }

    // 并行读取参会人和嘉宾
    const [attRes, guestRes] = await Promise.all([
      fetch(`${request.nextUrl.origin}/api/roster?event_id=${eventId}&type=attendees`),
      fetch(`${request.nextUrl.origin}/api/roster?event_id=${eventId}&type=guests`),
    ]);
    const attJson = await attRes.json();
    const guestJson = await guestRes.json();

    const attendees = (attJson.success ? attJson.data : []).map((a: Record<string, unknown>) => ({
      id: String(a.id),
      name: String(a.name || ''),
      company: String(a.company || ''),
      position: String(a.position || ''),
      title: String(a.position || ''),
      phone: String(a.phone || ''),
      category: a.is_member ? '会员' : (Array.isArray(a.tags) && a.tags.length > 0 ? String(a.tags[0]) : '普通'),
      tableId: (a.table_id && String(a.table_id) !== 'null') ? String(a.table_id) : null,
      seatIndex: a.seat_number ? 0 : null,
      locked: false,
    }));

    const guests = (guestJson.success ? guestJson.data : []).map((g: Record<string, unknown>) => ({
      id: `guest-${g.id}`,
      name: String(g.name || ''),
      company: String(g.company || ''),
      position: String(g.title || g.position || ''),
      title: String(g.title || ''),
      phone: String(g.phone || ''),
      category: '嘉宾',
      tableId: null,
      seatIndex: null,
      locked: false,
    }));

    let all = [...attendees, ...guests];

    if (seated === 'true') all = all.filter((p) => p.tableId);
    else if (seated === 'false') all = all.filter((p) => !p.tableId);

    return NextResponse.json({ success: true, data: all, total: all.length });
  } catch (error) {
    return apiError(error);
  }
}

// 排座写入 — 回写 roster
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const { guestId, tableId, seatNumber, type = 'attendees' } = body;

    if (!guestId) return NextResponse.json({ success: false, error: '缺少 guestId' });

    const res = await fetch(`${request.nextUrl.origin}/api/roster?type=${type}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: guestId,
        table_id: tableId || null,
        seat_number: seatNumber || null,
        seated: Boolean(tableId),
      }),
    });
    return NextResponse.json(await res.json());
  } catch (error) {
    return apiError(error);
  }
}
