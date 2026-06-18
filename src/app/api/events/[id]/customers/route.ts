import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { listDemoEventCustomers } from '@/lib/demo-store';
import { apiError, requireAuth } from '@/lib/api/security';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(_req);
    const { id: eventId } = await params;

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data } = await supabase.from('event_customers')
        .select('*, customers:customers(*)').eq('event_id', eventId);
      return NextResponse.json({ success: true, data: data || [] });
    }

    return NextResponse.json({ success: true, data: listDemoEventCustomers(eventId) });
  } catch (error) {
    return apiError(error);
  }
}
