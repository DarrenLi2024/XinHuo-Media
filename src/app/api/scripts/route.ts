import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase';
import {
  applyDemoScriptTemplate,
  createDemoScriptChapter,
  createDemoScriptSegment,
  createDemoScriptStep,
  listDemoScriptChapters,
  listDemoScriptSegments,
  syncDemoScript,
  updateDemoScriptSegment,
  updateDemoScriptStep,
} from '@/lib/demo-store';
import {
  apiError,
  parseJsonBody,
  requireAuth,
  requireEventAccess,
  writeAuditLog,
} from '@/lib/api/security';

const scriptCreateSchema = z.object({
  event_id: z.string().uuid(),
  order: z.number().int().min(0).max(10000),
  chapter_id: z.string().optional(),
  type: z.enum(['speech', 'performance', 'video', 'award', 'lottery', 'break', 'interactive', 'other']),
  name: z.string().min(1).max(200),
  duration: z.number().int().min(0).max(1440),
  speaker: z.string().max(100).optional(),
  content: z.string().max(10000).optional(),
  notes: z.string().max(5000).optional(),
  start_time: z.string().optional(),
  responsibilities: z.array(z.string()).optional(),
});

const scriptPostSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('segment'),
    event_id: z.string().uuid(),
    order: z.number().int().min(0).max(10000),
    chapter_id: z.string().optional(),
    type: z.enum(['speech', 'performance', 'video', 'award', 'lottery', 'break', 'interactive', 'other']),
    name: z.string().min(1).max(200),
    duration: z.number().int().min(0).max(1440),
    speaker: z.string().max(100).optional(),
    content: z.string().max(10000).optional(),
    notes: z.string().max(5000).optional(),
    start_time: z.string().optional(),
    responsibilities: z.array(z.string()).optional(),
  }),
  z.object({ action: z.literal('chapter'), event_id: z.string().uuid(), name: z.string().min(1).max(100), description: z.string().optional() }),
  z.object({ action: z.literal('step'), event_id: z.string().uuid(), segment_id: z.string().uuid(), title: z.string().min(1).max(200), owner: z.string().optional(), duration: z.number().int().min(0).max(1440).optional() }),
  z.object({ action: z.literal('template'), event_id: z.string().uuid(), template: z.enum(['annual_meeting', 'launch']) }),
  z.object({
    action: z.literal('sync'),
    event_id: z.string().uuid(),
    chapters: z.array(z.object({
      id: z.string(),
      event_id: z.string().optional(),
      order: z.number().int().min(0).max(10000),
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      color: z.string().optional(),
    })),
    segments: z.array(z.object({
      id: z.string(),
      event_id: z.string().optional(),
      chapter_id: z.string().optional(),
      order: z.number().int().min(0).max(10000),
      type: z.enum(['speech', 'performance', 'video', 'award', 'lottery', 'break', 'interactive', 'other']),
      name: z.string().min(1).max(200),
      duration: z.number().int().min(0).max(1440),
      speaker: z.string().max(100).optional(),
      content: z.string().max(10000).optional(),
      notes: z.string().max(5000).optional(),
      start_time: z.string().optional(),
      end_time: z.string().optional(),
      is_next_day: z.boolean().optional(),
      responsibilities: z.array(z.string()).optional(),
      steps: z.array(z.object({
        id: z.string(),
        title: z.string().min(1).max(200),
        owner: z.string().optional(),
        duration: z.number().int().min(0).max(1440).optional(),
        status: z.enum(['pending', 'done']),
      })).optional(),
      status: z.enum(['pending', 'ready', 'ongoing', 'completed', 'skipped']),
    })),
  }),
]);

const scriptUpdateSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('segment'),
    segment_id: z.string().uuid(),
    order: z.number().int().min(0).max(10000).optional(),
    chapter_id: z.string().optional(),
    responsibilities: z.array(z.string()).optional(),
    status: z.enum(['pending', 'ready', 'ongoing', 'completed', 'skipped']).optional(),
  }),
  z.object({ action: z.literal('step'), segment_id: z.string().uuid(), step_id: z.string().uuid(), status: z.enum(['pending', 'done']) }),
]);

// GET /api/scripts - 获取流程台本
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
    }
    await requireEventAccess(user, eventId, 'viewer');

    if (!isSupabaseConfigured()) {
      const segments = listDemoScriptSegments(eventId);
      const chapters = listDemoScriptChapters(eventId);
      return NextResponse.json({
        data: {
          chapters,
          segments,
          total_duration: segments.reduce((sum, segment) => sum + segment.duration, 0),
          total_segments: segments.length,
        },
      });
    }

    const { data: segments, error: segmentsError } = await createServerClient()
      .from('script_segments')
      .select('id, event_id, chapter_id, order, type, name, duration, speaker, content, notes, start_time, status')
      .eq('event_id', eventId)
      .order('order', { ascending: true });

    if (segmentsError) {
      return NextResponse.json({ error: segmentsError.message }, { status: 500 });
    }

    // 计算总时长
    const totalDuration = segments?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;

    return NextResponse.json({
      data: {
        segments: segments || [],
        total_duration: totalDuration,
        total_segments: segments?.length || 0,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/scripts - 创建流程环节/章节/步骤或套用模板
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const rawBody = await request.json();
    const body = parseLegacyScriptCreate(rawBody);
    await requireEventAccess(user, body.event_id, 'executor');

    if (!isSupabaseConfigured()) {
      if (body.action === 'chapter') {
        const data = createDemoScriptChapter(body);
        return NextResponse.json({ data }, { status: 201 });
      }
      if (body.action === 'step') {
        const data = createDemoScriptStep(body);
        if (!data) return NextResponse.json({ error: '流程环节不存在' }, { status: 404 });
        return NextResponse.json({ data }, { status: 201 });
      }
      if (body.action === 'template') {
        const data = applyDemoScriptTemplate(body.event_id, body.template);
        return NextResponse.json({ data }, { status: 201 });
      }
      if (body.action === 'sync') {
        const data = syncDemoScript(body.event_id, {
          chapters: body.chapters.map((chapter) => ({ ...chapter, event_id: body.event_id })),
          segments: body.segments.map((segment) => ({
            ...segment,
            event_id: body.event_id,
            responsibilities: segment.responsibilities || [],
            steps: segment.steps || [],
          })),
        });
        return NextResponse.json({ data });
      }
      const data = createDemoScriptSegment(body);
      return NextResponse.json({ data }, { status: 201 });
    }

    if (body.action === 'sync') {
      const { error: deleteError } = await createServerClient()
        .from('script_segments')
        .delete()
        .eq('event_id', body.event_id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      const inserts = body.segments.map((segment) => ({
        id: segment.id,
        event_id: body.event_id,
        order: segment.order,
        type: segment.type,
        name: segment.name,
        duration: segment.duration,
        speaker: segment.speaker,
        content: segment.content,
        notes: segment.notes,
        start_time: segment.start_time,
        status: segment.status,
      }));

      if (inserts.length > 0) {
        const { error: insertError } = await createServerClient().from('script_segments').insert(inserts);
        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
      }

      await writeAuditLog(request, user, 'script.sync', 'script_segment', body.event_id, {
        chapters: body.chapters.length,
        segments: body.segments.length,
      });

      return NextResponse.json({
        data: {
          chapters: [],
          segments: body.segments.map((segment) => ({ ...segment, event_id: body.event_id })),
          total_duration: body.segments.reduce((sum, segment) => sum + segment.duration, 0),
          total_segments: body.segments.length,
        },
      });
    }

    if (body.action !== 'segment') {
      return NextResponse.json({ error: 'Supabase 模式暂未启用章节、步骤和模板动作' }, { status: 400 });
    }

    const { data, error } = await createServerClient()
      .from('script_segments')
      .insert({
        event_id: body.event_id,
        order: body.order,
        type: body.type,
        name: body.name,
        duration: body.duration,
        speaker: body.speaker,
        content: body.content,
        notes: body.notes,
        start_time: body.start_time,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(request, user, 'script.create', 'script_segment', data.id, data);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/scripts - 更新流程环节顺序/状态
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request, scriptUpdateSchema);
    const { segment_id } = body;

    if (!isSupabaseConfigured()) {
      const data = body.action === 'step'
        ? updateDemoScriptStep({ segment_id, step_id: body.step_id, status: body.status })
        : updateDemoScriptSegment(segment_id, { order: body.order, status: body.status, chapter_id: body.chapter_id, responsibilities: body.responsibilities });
      if (!data) {
        return NextResponse.json({ error: '流程环节不存在' }, { status: 404 });
      }
      return NextResponse.json({ data });
    }

    const { data: segment, error: segmentError } = await createServerClient()
      .from('script_segments')
      .select('id, event_id')
      .eq('id', segment_id)
      .single();

    if (segmentError || !segment) {
      return NextResponse.json({ error: '流程环节不存在' }, { status: 404 });
    }

    await requireEventAccess(user, segment.event_id, 'executor');

    const updateData: Record<string, unknown> = {};
    if (body.action !== 'segment') {
      return NextResponse.json({ error: 'Supabase 模式暂未启用步骤动作' }, { status: 400 });
    }
    if (body.order !== undefined) updateData.order = body.order;
    if (body.status) updateData.status = body.status;

    const { data, error } = await createServerClient()
      .from('script_segments')
      .update(updateData)
      .eq('id', segment_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(request, user, 'script.update', 'script_segment', segment_id, body);

    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}

function parseLegacyScriptCreate(rawBody: unknown): z.infer<typeof scriptPostSchema> {
  const maybeAction = rawBody && typeof rawBody === 'object' && 'action' in rawBody;
  if (maybeAction) return scriptPostSchema.parse(rawBody);
  const legacy = scriptCreateSchema.parse(rawBody);
  return { ...legacy, action: 'segment' };
}
