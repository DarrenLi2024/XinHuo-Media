import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { listDemoCustomerEvents } from '@/lib/demo-store';
import { apiError, requireAuth, requireMinimumRole } from '@/lib/api/security';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    requireMinimumRole(user, 'staff');

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ data: listDemoCustomerEvents(id) });
    }

    const { data, error } = await supabase
      .from('event_customers')
      .select('*, events(*), customer_contacts(*)')
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return apiError(error);
  }
}
