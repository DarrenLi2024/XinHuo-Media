import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
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

// ====== GET ======

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id') || undefined;
    const status = searchParams.get('status') || undefined;

    if (isSupabaseConfigured() && eventId) {
      const supabase = createServerClient();
      let query = supabase.from('event_tasks').select('*').eq('event_id', eventId);
      if (status) query = query.eq('status', status);
      query = query.order('created_at', { ascending: false });
      const { data } = await query;
      return NextResponse.json({ success: true, data: data || [] });
    }

    const data = listDemoTasks({ eventId, status });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return apiError(error);
  }
}

// ====== POST ======

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const parsed = await parseJsonBody(req, createSchema);

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data, error } = await supabase.from('event_tasks').insert({
        event_id: parsed.event_id,
        title: parsed.title,
        description: parsed.description,
        assignee: parsed.assignee,
        responsibility: parsed.responsibility,
        start_date: parsed.start_date,
        end_date: parsed.end_date,
        deliverables: parsed.deliverables,
        priority: parsed.priority || 'medium',
        status: 'pending',
        progress: 0,
      }).select().single();

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      await writeAuditLog(req, user, 'task.create', 'task', data.id, parsed);
      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    const task = createDemoTask(parsed);
    await writeAuditLog(req, user, 'task.create', 'task', task.id, task);
    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

// ====== PUT ======

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await parseJsonBody(req, z.object({}).passthrough());

    if (isSupabaseConfigured()) {
      if (body.taskIds && Array.isArray(body.taskIds)) {
        const supabase = createServerClient();
        const { error } = await supabase.from('event_tasks').update({
          status: body.status,
          progress: body.progress,
          updated_at: new Date().toISOString(),
        }).in('id', body.taskIds);
        if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, data: { updated: body.taskIds.length } });
      }

      const { task_id, ...updates } = body;
      const supabase = createServerClient();
      const { data, error } = await supabase.from('event_tasks').update({
        ...updates,
        updated_at: new Date().toISOString(),
      }).eq('id', task_id).select().single();
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }

    // Demo fallback
    if (body.taskIds && Array.isArray(body.taskIds)) {
      const parsed = batchUpdateSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
      const result = updateDemoTasks(parsed.data.taskIds, { status: parsed.data.status, progress: parsed.data.progress });
      return NextResponse.json({ success: true, data: result });
    }

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

// ====== DELETE ======

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('id') || '';

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { error } = await supabase.from('event_tasks').delete().eq('id', taskId);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      await writeAuditLog(req, user, 'task.delete', 'task', taskId);
      return NextResponse.json({ success: true });
    }

    const ok = deleteDemoTask(taskId);
    if (!ok) return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 });
    await writeAuditLog(req, user, 'task.delete', 'task', taskId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
