import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase';
import { createDemoSupplier, listDemoSuppliers } from '@/lib/demo-store';
import {
  apiError,
  parseJsonBody,
  requireAuth,
  requireMinimumRole,
  safeSearch,
  writeAuditLog,
} from '@/lib/api/security';

const supplierCreateSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  contact: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(255).optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
});

// GET /api/suppliers - 获取供应商列表
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireMinimumRole(user, 'staff');
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = safeSearch(searchParams.get('search'));

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ data: listDemoSuppliers({ search, category, status }) });
    }

    let query = createServerClient()
      .from('suppliers')
      .select('id, name, category, contact, phone, email, address, description, rating, cooperation_count, status, created_at, updated_at')
      .order('rating', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,contact.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/suppliers - 创建供应商
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireMinimumRole(user, 'event_manager');
    const body = await parseJsonBody(request, supplierCreateSchema);

    if (!isSupabaseConfigured()) {
      const data = createDemoSupplier(body);
      return NextResponse.json({ data }, { status: 201 });
    }

    const { data, error } = await createServerClient()
      .from('suppliers')
      .insert({
        name: body.name,
        category: body.category,
        contact: body.contact,
        phone: body.phone,
        email: body.email,
        address: body.address,
        description: body.description,
        rating: 0,
        cooperation_count: 0,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(request, user, 'supplier.create', 'supplier', data.id, data);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
