import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { listDemoSponsors, createDemoSponsor, updateDemoSponsor, deleteDemoSponsor } from '@/lib/demo-store';
import { apiError, requireAuth, parseJsonBody, writeAuditLog } from '@/lib/api/security';

const createSchema = z.object({
  name: z.string().min(1),
  level: z.string().min(1),
  level_name: z.string().optional(),
  amount: z.number().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_wechat: z.string().optional(),
  contact_email: z.string().optional(),
  logo_url: z.string().optional(),
  company_intro: z.string().optional(),
  booth_needed: z.boolean().optional(),
  benefits: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(_req);
    const { id: eventId } = await params;

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data, error } = await supabase.from('sponsors').select('*').eq('event_id', eventId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data: data || [] });
    }

    return NextResponse.json({ success: true, data: listDemoSponsors(eventId) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);
    const { id: eventId } = await params;
    const body = await parseJsonBody(req, createSchema);

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data, error } = await supabase.from('sponsors').insert({
        event_id: eventId,
        ...body,
      }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await writeAuditLog(req, user, 'sponsor.create', 'sponsor', data.id, body);
      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    const sponsor = createDemoSponsor(eventId, body);
    return NextResponse.json({ success: true, data: sponsor }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data, error } = await supabase.from('sponsors').update({
        ...updates,
        updated_at: new Date().toISOString(),
      }).eq('id', id).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }

    const sponsor = updateDemoSponsor(id, updates);
    if (!sponsor) return NextResponse.json({ error: '赞助商不存在' }, { status: 404 });
    return NextResponse.json({ success: true, data: sponsor });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || '';
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { error } = await supabase.from('sponsors').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await writeAuditLog(req, user, 'sponsor.delete', 'sponsor', id);
      return NextResponse.json({ success: true });
    }

    if (!deleteDemoSponsor(id)) return NextResponse.json({ error: '赞助商不存在' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
