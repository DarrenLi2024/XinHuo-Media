import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDemoForm, submitDemoForm, listDemoFormSubmissions, updateDemoSubmissionStatus, publishDemoForm } from '@/lib/demo-store';
import { apiError, requireAuth, parseJsonBody, writeAuditLog } from '@/lib/api/security';

const submitSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});

const statusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  submission_id: z.string(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(req);
    const { id: formId } = await params;
    const form = getDemoForm(formId);
    if (!form) return NextResponse.json({ success: false, error: '表单不存在' }, { status: 404 });
    const submissions = listDemoFormSubmissions(formId);
    return NextResponse.json({ success: true, data: { form, submissions } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: formId } = await params;
  const form = getDemoForm(formId);
  if (!form) return NextResponse.json({ success: false, error: '表单不存在' }, { status: 404 });
  if (form.status !== 'published') return NextResponse.json({ success: false, error: '表单未开放' }, { status: 400 });
  const parsed = await parseJsonBody(req, submitSchema);
  const submission = submitDemoForm(formId, parsed.data);
  return NextResponse.json({ success: true, data: submission }, { status: 201 });
}

const publishSchema = z.object({
  form_id: z.string().optional(),
  status: z.enum(['published', 'closed']).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);
    const { id: formId } = await params;
    const body = await req.json();

    const publishParsed = publishSchema.safeParse(body);
    if (publishParsed.success && publishParsed.data.status) {
      const result = publishParsed.data.status === 'published'
        ? publishDemoForm(formId)
        : (await import('@/lib/demo-store')).closeDemoForm(formId);
      if (!result) return NextResponse.json({ success: false, error: '操作失败' }, { status: 404 });
      await writeAuditLog(req, user, 'form.publish', 'form', formId);
      return NextResponse.json({ success: true, data: result });
    }

    const reviewParsed = statusSchema.safeParse(body);
    if (!reviewParsed.success) return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    const result = updateDemoSubmissionStatus(reviewParsed.data.submission_id, reviewParsed.data.status);
    if (!result) return NextResponse.json({ success: false, error: '审核失败' }, { status: 404 });
    await writeAuditLog(req, user, 'form.review', 'submission', reviewParsed.data.submission_id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return apiError(error);
  }
}
