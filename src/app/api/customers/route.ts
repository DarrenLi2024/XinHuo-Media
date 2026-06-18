import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase';
import { createDemoCustomer, listDemoCustomers } from '@/lib/demo-store';
import {
  apiError,
  parseJsonBody,
  requireAuth,
  requireMinimumRole,
  safeSearch,
  writeAuditLog,
} from '@/lib/api/security';

const customerSchema = z.object({
  organization_name: z.string().min(1).max(200),
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

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireMinimumRole(user, 'staff');
    const searchParams = request.nextUrl.searchParams;
    const search = safeSearch(searchParams.get('search'));
    const industry = searchParams.get('industry');
    const cooperationIntent = searchParams.get('cooperation_intent');
    const status = searchParams.get('status');

    if (!isSupabaseConfigured()) {
      const data = listDemoCustomers({ search, industry, cooperation_intent: cooperationIntent, status });
      return NextResponse.json({
        data,
        stats: {
          total: data.length,
          strong_intent: data.filter((customer) => customer.intent_level === 'strong').length,
          active: data.filter((customer) => customer.status === 'active').length,
          cooperation_count: data.reduce((sum, customer) => sum + customer.cooperation_count, 0),
        },
      });
    }

    let query = createServerClient()
      .from('customers')
      .select('*, customer_contacts(*)')
      .order('updated_at', { ascending: false });

    if (search) {
      query = query.or(`organization_name.ilike.%${search}%,company_name.ilike.%${search}%`);
    }
    if (industry) query = query.eq('industry_category', industry);
    if (cooperationIntent) query = query.eq('cooperation_intent', cooperationIntent);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const customers = data || [];
    return NextResponse.json({
      data: customers,
      stats: {
        total: customers.length,
        strong_intent: customers.filter((customer) => customer.intent_level === 'strong').length,
        active: customers.filter((customer) => customer.status === 'active').length,
        cooperation_count: customers.reduce((sum, customer) => sum + Number(customer.cooperation_count || 0), 0),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireMinimumRole(user, 'event_manager');
    const body = await parseJsonBody(request, customerSchema);

    if (!isSupabaseConfigured()) {
      const data = createDemoCustomer({ ...body, owner_id: body.owner_id || user.id, created_by: user.id });
      await writeAuditLog(request, user, 'customer.create', 'customer', data.id, data);
      return NextResponse.json({ data }, { status: 201 });
    }

    const { data, error } = await createServerClient()
      .from('customers')
      .insert({
        ...body,
        company_name: body.company_name || body.organization_name,
        cooperation_intent: body.cooperation_intent || 'medium',
        intent_level: body.intent_level || 'medium',
        status: body.status || 'prospect',
        cooperation_count: 0,
        tags: body.tags || [],
        custom_fields: body.custom_fields || {},
        owner_id: body.owner_id || user.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAuditLog(request, user, 'customer.create', 'customer', data.id, data);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
