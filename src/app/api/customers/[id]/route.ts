import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase';
import { deleteDemoCustomer, getDemoCustomer, updateDemoCustomer } from '@/lib/demo-store';
import {
  apiError,
  parseJsonBody,
  requireAuth,
  requireMinimumRole,
  writeAuditLog,
} from '@/lib/api/security';

const updateCustomerSchema = z.object({
  organization_name: z.string().min(1).max(200).optional(),
  company_name: z.string().max(200).optional(),
  industry_category: z.string().max(100).optional(),
  cooperation_intent: z.enum(['high', 'medium', 'low', 'none']).optional(),
  intent_level: z.enum(['strong', 'medium', 'weak', 'none']).optional(),
  status: z.enum(['lead', 'prospect', 'active', 'inactive', 'archived']).optional(),
  source: z.string().max(100).optional(),
  address: z.string().max(1000).optional(),
  region: z.string().max(100).optional(),
  website: z.string().max(300).optional(),
  owner_id: z.string().uuid().optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  notes: z.string().max(5000).optional(),
  custom_fields: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    requireMinimumRole(user, 'staff');

    if (!isSupabaseConfigured()) {
      const data = getDemoCustomer(id);
      if (!data) return NextResponse.json({ error: '客户不存在' }, { status: 404 });
      return NextResponse.json({ data });
    }

    const { data, error } = await createServerClient()
      .from('customers')
      .select('*, customer_contacts(*), event_customers(*, events(*)), guests(*)')
      .eq('id', id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    requireMinimumRole(user, 'event_manager');
    const body = await parseJsonBody(request, updateCustomerSchema);

    if (!isSupabaseConfigured()) {
      const data = updateDemoCustomer(id, body);
      if (!data) return NextResponse.json({ error: '客户不存在' }, { status: 404 });
      await writeAuditLog(request, user, 'customer.update', 'customer', id, body);
      return NextResponse.json({ data });
    }

    const { data, error } = await createServerClient()
      .from('customers')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAuditLog(request, user, 'customer.update', 'customer', id, body);
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireAuth(request);
    requireMinimumRole(user, 'super_admin');

    if (!isSupabaseConfigured()) {
      const result = deleteDemoCustomer(id);
      if (!result.deleted) return NextResponse.json({ error: result.reason || '客户删除失败' }, { status: 409 });
      await writeAuditLog(request, user, 'customer.delete', 'customer', id);
      return NextResponse.json({ success: true });
    }

    const { error } = await createServerClient().from('customers').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAuditLog(request, user, 'customer.delete', 'customer', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
