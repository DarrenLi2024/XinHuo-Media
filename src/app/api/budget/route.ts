import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { listDemoBudgetLines, createDemoBudgetLine, updateDemoBudgetLine, deleteDemoBudgetLine } from '@/lib/demo-store';
import { apiError, requireAuth, parseJsonBody, writeAuditLog } from '@/lib/api/security';

const createSchema = z.object({
  event_id: z.string().min(1),
  category: z.enum(['venue', 'construction', 'catering', 'materials', 'gifts', 'personnel', 'transport', 'other']),
  description: z.string().min(1),
  budget_amount: z.number(),
  actual_amount: z.number().optional(),
  supplier_id: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id') || '';
    const lines = listDemoBudgetLines(eventId);
    const summary = {
      total_budget: lines.reduce((s, l) => s + l.budget_amount, 0),
      total_actual: lines.reduce((s, l) => s + (l.actual_amount || 0), 0),
      count: lines.length,
    };
    return NextResponse.json({ success: true, data: { lines, summary } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const parsed = await parseJsonBody(req, createSchema);
    const line = createDemoBudgetLine(parsed);
    await writeAuditLog(req, user, 'budget.create', 'budget', line.id, line);
    return NextResponse.json({ success: true, data: line }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, error: '缺少id' }, { status: 400 });
    const line = updateDemoBudgetLine(id, updates);
    if (!line) return NextResponse.json({ success: false, error: '费用项不存在' }, { status: 404 });
    await writeAuditLog(req, user, 'budget.update', 'budget', id, updates);
    return NextResponse.json({ success: true, data: line });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || '';
    const deleted = deleteDemoBudgetLine(id);
    if (!deleted) return NextResponse.json({ success: false, error: '费用项不存在' }, { status: 404 });
    await writeAuditLog(req, user, 'budget.delete', 'budget', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
