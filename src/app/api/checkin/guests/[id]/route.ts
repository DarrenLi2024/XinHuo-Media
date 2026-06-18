import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAuth } from '@/lib/api/security';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(request);
    const { id } = await params;
    const body = await request.json();

    const res = await fetch(`${request.nextUrl.origin}/api/roster?type=attendees`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...body }),
    });
    return NextResponse.json(await res.json());
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(request);
    const { id } = await params;
    const res = await fetch(`${request.nextUrl.origin}/api/roster?type=attendees&id=${id}`, { method: 'DELETE' });
    return NextResponse.json(await res.json());
  } catch (error) {
    return apiError(error);
  }
}
