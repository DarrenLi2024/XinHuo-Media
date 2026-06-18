import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { listDemoSupplierReviews, createDemoSupplierReview, deleteDemoSupplierReview } from '@/lib/demo-store';
import { apiError, requireAuth, parseJsonBody, writeAuditLog } from '@/lib/api/security';

const createSchema = z.object({
  supplier_id: z.string().min(1),
  event_id: z.string().optional(),
  rating: z.number().min(1).max(5),
  quality_score: z.number().min(1).max(5).optional(),
  delivery_score: z.number().min(1).max(5).optional(),
  communication_score: z.number().min(1).max(5).optional(),
  content: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get('supplier_id') || '';
    const reviews = listDemoSupplierReviews(supplierId);
    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const parsed = await parseJsonBody(req, createSchema);
    const review = createDemoSupplierReview(parsed);
    await writeAuditLog(req, user, 'supplier.review.create', 'review', review.id, review);
    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || '';
    const deleted = deleteDemoSupplierReview(id);
    if (!deleted) return NextResponse.json({ success: false, error: '评价不存在' }, { status: 404 });
    await writeAuditLog(req, user, 'supplier.review.delete', 'review', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
