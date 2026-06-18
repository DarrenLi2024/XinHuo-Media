import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAuth } from '@/lib/api/security';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return NextResponse.json({ data: { user } });
  } catch (error) {
    return apiError(error);
  }
}
