import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  listDemoTasks,
  createDemoTask,
  updateDemoTask,
  updateDemoTasks,
  deleteDemoTask,
} from '@/lib/demo-store';
import { apiError, requireAuth, parseJsonBody, writeAuditLog } from '@/lib/api/security';

const createSchema = z.object({
  event_id: z.string().min(1),
  title: z.string().min(1, '任务名称必填'),
  description: z.string().optional(),
  assignee: z.string().optional(),
  responsibility: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().min(1, '截止时间必填'),
  deliverables: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
});

const updateSchema = createSchema.partial().extend({
  task_id: z.string().min(1),
  status: z.enum(['pending', 'in_progress', 'completed', 'delayed', 'cancelled']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
});

const batchUpdateSchema = z.object({
  taskIds: z.array(z.string()).min(1).max(100),
  status: z.enum(['pending', 'in_progress', 'completed', 'delayed', 'cancelled']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id') || undefined;
    const status = searchParams.get('status') || undefined;
    const data = listDemoTasks({ eventId, status });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const parsed = await parseJsonBody(req, createSchema);
    const task = createDemoTask(parsed);
    await writeAuditLog(req, user, 'task.create', 'task', task.id, task);
    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

// PUT: single task edit
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await parseJsonBody(req, z.object({}).passthrough());

    // batch mode
    if (body.taskIds && Array.isArray(body.taskIds)) {
      const parsed = batchUpdateSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
      const result = updateDemoTasks(parsed.data.taskIds, { status: parsed.data.status, progress: parsed.data.progress });
      await writeAuditLog(req, user, 'task.batch_update', 'task', undefined, { count: parsed.data.taskIds.length });
      return NextResponse.json({ success: true, data: result });
    }

    // single edit mode
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
    const { task_id, ...updates } = parsed.data;
    const task = updateDemoTask(task_id, updates);
    if (!task) return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 });
    await writeAuditLog(req, user, 'task.update', 'task', task_id, updates);
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('id') || '';
    const ok = deleteDemoTask(taskId);
    if (!ok) return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 });
    await writeAuditLog(req, user, 'task.delete', 'task', taskId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
