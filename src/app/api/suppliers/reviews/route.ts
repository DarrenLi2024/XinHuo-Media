import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { listDemoSupplierReviews, createDemoSupplierReview } from '@/lib/demo-store';
import { apiError, requireAuth, parseJsonBody, writeAuditLog } from '@/lib/api/security';

const createSchema = z.object({
  supplier_id: z.string().min(1),
  event_id: z.string().optional(),
  rating: z.number().min(0).max(5),
  content: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get('supplier_id');

    if (isSupabaseConfigured() && supplierId) {
      const supabase = createServerClient();
      const { data } = await supabase.from('supplier_reviews')
        .select('*').eq('supplier_id', supplierId).order('created_at', { ascending: false });
      return NextResponse.json({ success: true, data: data || [] });
    }

    return NextResponse.json({ success: true, data: listDemoSupplierReviews(supplierId || '') });
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
      const { data, error } = await supabase.from('supplier_reviews').insert({
        supplier_id: body.supplier_id,
        event_id: body.event_id,
        rating: body.rating,
        content: body.content,
        created_by: user.id,
      }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await writeAuditLog(req, user, 'review.create', 'supplier_review', data.id, body);
      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    const review = createDemoSupplierReview(body);
    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
