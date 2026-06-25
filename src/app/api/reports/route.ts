import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { deepseek } from '@/lib/ai/deepseek';
import { getDemoRosterStats, listDemoAttendeeEntries, getDemoReportPayload } from '@/lib/demo-store';
import { apiError, requireAuth, parseJsonBody, writeAuditLog } from '@/lib/api/security';

const createSchema = z.object({
  event_id: z.string().min(1),
  title: z.string().min(1).max(200),
  summary: z.string().optional(),
});

const SYSTEM_PROMPT = `你是芯火会务管理系统的 AI 复盘分析师，专门为芯片行业活动生成深度复盘报告。
请基于提供的活动数据，生成结构化的复盘报告，包含以下部分：
1. 活动概况（签到率、嘉宾规模、执行质量）
2. 数据亮点（签到、预算、赞助商、任务完成率）
3. 问题分析（流程瓶颈、异常情况）
4. 改进建议（具体可执行的优化措施）
使用专业正式的中文表达，Markdown 格式。`;

async function gatherSupabaseData(eventId: string) {
  const supabase = createServerClient();

  const [guestsRes, eventsRes, tasksRes, budgetRes] = await Promise.all([
    supabase.from('guests').select('*', { count: 'exact', head: false }).eq('event_id', eventId),
    supabase.from('events').select('*').eq('id', eventId).single(),
    supabase.from('event_tasks').select('*').eq('event_id', eventId),
    supabase.from('budget_lines').select('*').eq('event_id', eventId),
  ]);

  const guests = guestsRes.data || [];
  const totalGuests = guests.length;
  const checkedIn = guests.filter((g) => g.check_in_status === 'checked_in').length;
  const checkInRate = totalGuests > 0 ? Math.round((checkedIn / totalGuests) * 100) : 0;

  const tasks = tasksRes.data || [];
  const tasksCompleted = tasks.filter((t) => t.status === 'completed').length;
  const taskRate = tasks.length > 0 ? Math.round((tasksCompleted / tasks.length) * 100) : 0;

  const budgetLines = budgetRes.data || [];
  const budgetPlanned = budgetLines.reduce((s, l) => s + (Number(l.planned_amount) || 0), 0);
  const budgetActual = budgetLines.reduce((s, l) => s + (Number(l.actual_amount) || 0), 0);

  return {
    eventName: (eventsRes.data as Record<string, unknown> | null)?.name || '未知活动',
    totalGuests,
    checkedIn,
    checkInRate,
    tasksCompleted,
    tasksTotal: tasks.length,
    taskRate,
    budgetPlanned,
    budgetActual,
    budgetRate: budgetPlanned > 0 ? Math.round((budgetActual / budgetPlanned) * 100) : 0,
  };
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await parseJsonBody(req, createSchema);

    let dataSummary: string;
    let eventName = '未知活动';

    if (isSupabaseConfigured()) {
      const data = await gatherSupabaseData(body.event_id);
      eventName = data.eventName as string;
      dataSummary = JSON.stringify(data, null, 2);
    } else {
      const payload = getDemoReportPayload(body.event_id);
      if ('exists' in payload && payload.exists) {
        type DemoPayloadWithReport = { exists: true; report: { title: string; statistics: Record<string, unknown> } };
        const demoPayload = payload as DemoPayloadWithReport;
        eventName = demoPayload.report.title;
        dataSummary = JSON.stringify(demoPayload.report.statistics, null, 2);
      } else {
        eventName = (payload as { event?: { name?: string } }).event?.name || '未知活动';
        dataSummary = JSON.stringify((payload as { statistics?: unknown }).statistics || {}, null, 2);
      }
    }

    // 用 DeepSeek Pro 生成报告
    let content: string;
    if (deepseek.isConfigured()) {
      try {
        const result = await deepseek.pro(
          `活动：${eventName}\n数据：${dataSummary}\n\n请生成完整的活动复盘报告。`,
          SYSTEM_PROMPT,
        );
        content = result.content;
      } catch {
        content = `## ${body.title || eventName + ' 复盘报告'}\n\n> AI 生成失败，使用基础模板。\n\n${dataSummary}`;
      }
    } else {
      content = `## ${body.title || eventName + ' 复盘报告'}\n\n> ⚠️ DeepSeek API Key 未配置，使用数据摘要。\n\n${dataSummary}`;
    }

    const reportData = {
      title: body.title || `${eventName} 复盘报告`,
      summary: body.summary || content.slice(0, 500),
      highlights: [],
      issues: [],
      recommendations: [],
    };

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data, error } = await supabase.from('event_reports').insert({
        event_id: body.event_id,
        title: reportData.title,
        summary: reportData.summary,
        statistics: { content, generated_by: deepseek.isConfigured() ? 'deepseek-reasoner' : 'template' },
        status: 'published',
      }).select().single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await writeAuditLog(req, user, 'report.create', 'report', data.id);
      return NextResponse.json({ success: true, data: { ...data, full_content: content } }, { status: 201 });
    }

    return NextResponse.json({
      success: true,
      data: { ...reportData, full_content: content, statistics: { content } },
    }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

// GET /api/reports?event_id=...
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id');

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      let query = supabase.from('event_reports').select('*').order('created_at', { ascending: false });
      if (eventId) query = query.eq('event_id', eventId);
      const { data, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data: data || [] });
    }

    // Demo fallback
    if (eventId) {
      const payload = getDemoReportPayload(eventId);
      if ('exists' in payload && payload.exists) {
        const demoPayload = payload as { exists: true; report: Record<string, unknown> };
        return NextResponse.json({ success: true, data: [demoPayload.report] });
      }
    }
    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    return apiError(error);
  }
}
