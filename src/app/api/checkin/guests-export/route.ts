import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const res = await fetch(`${request.nextUrl.origin}/api/roster?event_id=demo&type=attendees`);
  return NextResponse.json(await res.json());
}
