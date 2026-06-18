import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { listDemoFormSubmissions } from '@/lib/demo-store';
import { apiError, requireAuth } from '@/lib/api/security';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(_req);
    const { id: formId } = await params;

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data } = await supabase.from('form_submissions').select('*').eq('form_id', formId).order('created_at', { ascending: false });
      return NextResponse.json({ success: true, data: data || [] });
    }

    return NextResponse.json({ success: true, data: listDemoFormSubmissions(formId) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: formId } = await params;
    const body = await req.json();

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data, error } = await supabase.from('form_submissions').insert({
        form_id: formId,
        data: body,
      }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    return NextResponse.json({ success: true, data: { id: crypto.randomUUID(), form_id: formId, data: body } }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
