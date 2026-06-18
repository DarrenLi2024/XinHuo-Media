import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase';
import { deleteDemoCustomerContact, updateDemoCustomerContact } from '@/lib/demo-store';
import {
  apiError,
  parseJsonBody,
  requireAuth,
  requireMinimumRole,
  writeAuditLog,
} from '@/lib/api/security';

const updateContactSchema = z.object({
  name: z.string().min(1).max(100).optional(),
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  try {
    const { id, contactId } = await params;
    const user = await requireAuth(request);
    requireMinimumRole(user, 'event_manager');
    const body = await parseJsonBody(request, updateContactSchema);

    if (!isSupabaseConfigured()) {
      const data = updateDemoCustomerContact(id, contactId, { ...body, email: body.email || undefined });
      if (!data) return NextResponse.json({ error: '联系人不存在' }, { status: 404 });
      await writeAuditLog(request, user, 'customer-contact.update', 'customer_contact', contactId, body);
      return NextResponse.json({ data });
    }

    if (body.is_primary) {
      await createServerClient().from('customer_contacts').update({ is_primary: false }).eq('customer_id', id);
    }
    const { data, error } = await createServerClient()
      .from('customer_contacts')
      .update({ ...body, email: body.email || null, updated_at: new Date().toISOString() })
      .eq('customer_id', id)
      .eq('id', contactId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAuditLog(request, user, 'customer-contact.update', 'customer_contact', contactId, body);
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  try {
    const { id, contactId } = await params;
    const user = await requireAuth(request);
    requireMinimumRole(user, 'event_manager');

    if (!isSupabaseConfigured()) {
      const result = deleteDemoCustomerContact(id, contactId);
      if (!result.deleted) return NextResponse.json({ error: result.reason || '联系人删除失败' }, { status: 409 });
      await writeAuditLog(request, user, 'customer-contact.delete', 'customer_contact', contactId);
      return NextResponse.json({ success: true });
    }

    const { error } = await createServerClient()
      .from('customer_contacts')
      .delete()
      .eq('customer_id', id)
      .eq('id', contactId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAuditLog(request, user, 'customer-contact.delete', 'customer_contact', contactId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
