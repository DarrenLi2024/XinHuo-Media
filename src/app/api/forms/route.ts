import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { listDemoForms, createDemoForm } from '@/lib/demo-store';
import { apiError, requireAuth, parseJsonBody, writeAuditLog } from '@/lib/api/security';

const createSchema = z.object({
  event_id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(z.object({
    label: z.string(),
    type: z.string(),
    required: z.boolean().optional(),
  })).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id');

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      let query = supabase.from('forms').select('*').order('created_at', { ascending: false });
      if (eventId) query = query.eq('event_id', eventId);
      const { data } = await query;
      return NextResponse.json({ success: true, data: data || [] });
    }

    return NextResponse.json({ success: true, data: listDemoForms("") });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await parseJsonBody(req, createSchema);

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data, error } = await supabase.from('forms').insert({
        event_id: body.event_id,
        title: body.title,
        description: body.description,
        fields: body.fields || [],
      }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await writeAuditLog(req, user, 'form.create', 'form', data.id, body);
      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    const form = createDemoForm({
      event_id: body.event_id || '',
      type: 'registration',
      title: body.title,
      description: body.description,
      fields: (body.fields || []).map((f, i) => ({
        id: crypto.randomUUID(),
        label: f.label,
        type: f.type as 'text' | 'tel' | 'email' | 'select' | 'textarea' | 'number' | 'checkbox',
        required: f.required ?? false,
        order: i,
      })),
    });
    return NextResponse.json({ success: true, data: form }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
