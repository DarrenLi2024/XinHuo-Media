import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { listDemoCustomerEvents } from '@/lib/demo-store';
import { apiError, requireAuth } from '@/lib/api/security';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(_req);
    const { id: customerId } = await params;

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data } = await supabase.from('event_customers')
        .select('*, events:events(*)').eq('customer_id', customerId);
      return NextResponse.json({ success: true, data: data || [] });
    }

    return NextResponse.json({ success: true, data: listDemoCustomerEvents(customerId) });
  } catch (error) {
    return apiError(error);
  }
}
