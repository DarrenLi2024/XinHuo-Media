import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('xh_access_token');
  response.cookies.delete('xh_refresh_token');
  return response;
}
