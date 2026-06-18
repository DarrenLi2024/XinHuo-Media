import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { linkDemoEventCustomer, listDemoEventCustomers } from '@/lib/demo-store';
import {
  apiError,
  parseJsonBody,
  requireAuth,
  requireEventAccess,
  writeAuditLog,
} from '@/lib/api/security';

const eventCustomerSchema = z.object({
  customer_id: z.string().uuid(),
  contact_id: z.string().uuid().optional(),
  role: z.enum(['client', 'host', 'organizer', 'co_organizer', 'sponsor', 'invited_org']).optional(),
  is_primary: z.boolean().optional(),
  sponsor_level: z.enum(['title', 'strategic', 'platinum', 'gold', 'silver', 'bronze', 'supporting', 'custom']).optional(),
  sponsor_profile: z.object({
    level: z.enum(['title', 'strategic', 'platinum', 'gold', 'silver', 'bronze', 'supporting', 'custom']).optional(),
    level_name: z.string().max(100).optional(),
    sponsorship_type: z.enum(['cash', 'in_kind', 'service', 'media', 'mixed', 'other']).optional(),
    amount: z.coerce.number().min(0).max(999999999).optional(),
    currency: z.string().max(12).optional(),
    benefits: z.array(z.string().max(200)).max(50).optional(),
    deliverables: z.array(z.string().max(200)).max(50).optional(),
    logo_url: z.string().max(500).optional(),
    booth_number: z.string().max(100).optional(),
    booth_size: z.string().max(100).optional(),
    speaking_slot: z.string().max(200).optional(),
    ad_placements: z.array(z.string().max(200)).max(50).optional(),
    material_requirements: z.array(z.string().max(200)).max(50).optional(),
    contract_status: z.enum(['draft', 'sent', 'signed', 'paid', 'completed', 'cancelled']).optional(),
    payment_status: z.enum(['unpaid', 'partial', 'paid', 'waived']).optional(),
    invoice_title: z.string().max(200).optional(),
    invoice_tax_no: z.string().max(100).optional(),
    sponsor_contact_snapshot: z.record(z.string(), z.unknown()).optional(),
    notes: z.string().max(2000).optional(),
  }).optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    await requireEventAccess(user, id, 'viewer');

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ data: listDemoEventCustomers(id) });
    }

    const { data, error } = await supabase
      .from('event_customers')
      .select('*, customers(*, customer_contacts(*)), customer_contacts(*)')
      .eq('event_id', id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    await requireEventAccess(user, id, 'manager');
    const body = await parseJsonBody(request, eventCustomerSchema);

    if (!isSupabaseConfigured()) {
      const data = linkDemoEventCustomer({ ...body, event_id: id });
      if (!data) return NextResponse.json({ error: '活动或客户不存在' }, { status: 404 });
      await writeAuditLog(request, user, 'event-customer.link', 'event_customer', data.id, data);
      return NextResponse.json({ data }, { status: 201 });
    }

    if (body.is_primary) {
      await supabase.from('event_customers').update({ is_primary: false }).eq('event_id', id);
      await supabase.from('events').update({ primary_customer_id: body.customer_id }).eq('id', id);
    }
    const contactId = body.contact_id || await resolvePrimaryContactId(body.customer_id);
    const { data, error } = await supabase
      .from('event_customers')
      .upsert({
        event_id: id,
        customer_id: body.customer_id,
        contact_id: contactId,
        role: body.role || 'client',
        is_primary: body.is_primary ?? false,
        sponsor_level: body.role === 'sponsor' ? body.sponsor_level || body.sponsor_profile?.level || 'custom' : null,
        sponsor_profile: body.role === 'sponsor' ? body.sponsor_profile || {} : null,
        notes: body.notes,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAuditLog(request, user, 'event-customer.link', 'event_customer', data.id, data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

async function resolvePrimaryContactId(customerId: string) {
  const { data } = await supabase
    .from('customer_contacts')
    .select('id')
    .eq('customer_id', customerId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id;
}
