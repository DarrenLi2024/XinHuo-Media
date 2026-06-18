import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  listDemoForms,
  createDemoForm,
  createDemoFormFromTemplate,
  deleteDemoForm,
} from '@/lib/demo-store';
import { apiError, requireAuth, parseJsonBody, writeAuditLog } from '@/lib/api/security';

const createSchema = z.object({
  event_id: z.string().min(1, 'event_id 必填'),
  type: z.enum(['registration', 'sponsor']),
  title: z.string().min(1, '标题必填'),
  description: z.string().optional(),
  fields: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(['text', 'tel', 'email', 'select', 'textarea', 'number', 'checkbox']),
    required: z.boolean(),
    placeholder: z.string().optional(),
    options: z.array(z.string()).optional(),
    order: z.number(),
  })).optional(),
  auto_approve: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id') || '';
    const forms = listDemoForms(eventId);
    return NextResponse.json({ success: true, data: forms });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const parsed = await parseJsonBody(req, createSchema);
    const { event_id, type, title, description, fields, auto_approve } = parsed;
    const form = fields && fields.length > 0
      ? createDemoForm({ event_id, type, title, description, fields, auto_approve })
      : createDemoFormFromTemplate(event_id, type, title);
    await writeAuditLog(req, user, 'form.create', 'form', form.id, form);
    return NextResponse.json({ success: true, data: form }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get('id') || '';
    const deleted = deleteDemoForm(formId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: '表单不存在' }, { status: 404 });
    }
    await writeAuditLog(req, user, 'form.delete', 'form', formId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
