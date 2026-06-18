import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase';
import { createDemoCustomerContact, getDemoCustomer } from '@/lib/demo-store';
import {
  apiError,
  parseJsonBody,
  requireAuth,
  requireMinimumRole,
  writeAuditLog,
} from '@/lib/api/security';

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  company_name: z.string().max(200).optional(),
  position: z.string().max(100).optional(),
  native_place: z.string().max(100).optional(),
  gender: z.string().max(30).optional(),
  address: z.string().max(1000).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().email().max(200).optional().or(z.literal('')),
  wechat_qr_url: z.string().max(500).optional(),
  wechat_id: z.string().max(100).optional(),
  qq: z.string().max(50).optional(),
  avatar_url: z.string().max(500).optional(),
  motto: z.string().max(300).optional(),
  is_primary: z.boolean().optional(),
  relationship_role: z.string().max(100).optional(),
  custom_fields: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    requireMinimumRole(user, 'event_manager');
    const body = await parseJsonBody(request, contactSchema);

    if (!isSupabaseConfigured()) {
      const data = createDemoCustomerContact({ ...body, customer_id: id, email: body.email || undefined });
      if (!data) return NextResponse.json({ error: '客户不存在' }, { status: 404 });
      await writeAuditLog(request, user, 'customer-contact.create', 'customer_contact', data.id, data);
      return NextResponse.json({ data }, { status: 201 });
    }

    if (body.is_primary) {
      await createServerClient().from('customer_contacts').update({ is_primary: false }).eq('customer_id', id);
    }
    const { data, error } = await createServerClient()
      .from('customer_contacts')
      .insert({
        ...body,
        customer_id: id,
        email: body.email || null,
        is_primary: body.is_primary ?? false,
        custom_fields: body.custom_fields || {},
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAuditLog(request, user, 'customer-contact.create', 'customer_contact', data.id, data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    requireMinimumRole(user, 'staff');

    if (!isSupabaseConfigured()) {
      const customer = getDemoCustomer(id);
      if (!customer) return NextResponse.json({ error: '客户不存在' }, { status: 404 });
      return NextResponse.json({ data: customer.contacts });
    }

    const { data, error } = await createServerClient()
      .from('customer_contacts')
      .select('*')
      .eq('customer_id', id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return apiError(error);
  }
}
