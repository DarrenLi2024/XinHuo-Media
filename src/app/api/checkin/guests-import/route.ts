import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const rows = body.data || body.rows || [];

  const res = await fetch(`${request.nextUrl.origin}/api/roster?type=attendees_batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_id: body.event_id || 'demo', rows }),
  });
  return NextResponse.json(await res.json());
}
