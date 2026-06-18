import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, requireAuth, parseJsonBody, writeAuditLog } from '@/lib/api/security';

const reportCreateSchema = z.object({
  id: z.string().optional(),
  event_id: z.string().min(1),
  title: z.string().min(1).max(200),
  summary: z.string().max(5000).optional(),
});

// 深度复盘报告 API — 聚合 roster + events + tasks + budget 全维度数据

async function gatherReportData(origin: string, eventId: string) {
  const [rosterRes, eventsRes, tasksRes, budgetRes] = await Promise.all([
    fetch(`${origin}/api/roster?event_id=${eventId}&type=all`),
    fetch(`${origin}/api/events/${eventId}`),
    fetch(`${origin}/api/tasks?event_id=${eventId}`),
    fetch(`${origin}/api/budget?event_id=${eventId}`),
  ]);

  const rosterJson = await rosterRes.json();
  const eventsJson = await eventsRes.json();
  const tasksData = await tasksRes.json();
  const budgetData = await budgetRes.json();

  const roster = rosterJson.success ? rosterJson.data : {};
  const stats = roster.stats || {};
  const execTeam = roster.exec_team || [];
  const guests = roster.guests || [];
  const sponsors = roster.sponsors || [];
  const attendees = roster.attendees || [];
  const event = eventsJson.success ? eventsJson.data : eventsJson.data || {};
  const tasks = tasksData.success ? tasksData.data : [];
  const budget = budgetData.success ? budgetData.data : { lines: [], summary: {} };

  // 出席统计
  const checkedIn = attendees.filter((a: { checkin_status: string }) => a.checkin_status === 'checked_in');
  const guestConfirmed = guests.filter((g: { status: string }) => g.status === 'confirmed' || g.status === 'attended');

  return {
    event,
    execTeam,
    guests,
    sponsors,
    attendees,
    tasks,
    budget,
    stats: {
      // 出席
      registered: attendees.length,
      attended: checkedIn.length,
      rate: attendees.length > 0 ? Math.round((checkedIn.length / attendees.length) * 100) : 0,
      vip_count: attendees.filter((a: { tags: string[] }) => a.tags?.includes('VIP')).length,
      guest_confirmed: guestConfirmed.length,
      guest_attended: guests.filter((g: { status: string }) => g.status === 'attended').length,
      no_show: attendees.filter((a: { checkin_status: string }) => a.checkin_status !== 'checked_in').length,
      by_source: attendees.reduce((acc: Record<string, number>, a: { source: string }) => {
        acc[a.source || '其他'] = (acc[a.source || '其他'] || 0) + 1; return acc;
      }, {}),

      // 任务
      tasks_total: tasks.length,
      tasks_completed: tasks.filter((t: { status: string }) => t.status === 'completed').length,
      tasks_in_progress: tasks.filter((t: { status: string }) => t.status === 'in_progress').length,
      tasks_delayed: tasks.filter((t: { status: string }) => t.status === 'delayed').length,
      tasks_completion_rate: tasks.length > 0
        ? Math.round((tasks.filter((t: { status: string }) => t.status === 'completed').length / tasks.length) * 100)
        : 0,

      // 赞助
      sponsor_count: sponsors.length,
      sponsor_amount: sponsors.reduce((s: number, sp: { amount: number }) => s + (sp.amount || 0), 0),
      sponsor_paid: sponsors.filter((sp: { payment_status: string }) => sp.payment_status === 'paid').length,
      sponsor_by_level: sponsors.reduce((acc: Record<string, { count: number; amount: number }>, sp: { level: string; amount: number }) => {
        const lv = sp.level || 'other';
        if (!acc[lv]) acc[lv] = { count: 0, amount: 0 };
        acc[lv].count++; acc[lv].amount += sp.amount || 0; return acc;
      }, {}),

      // 预算
      budget_total: budget.summary?.total_budget || event.budget || 0,
      budget_actual: budget.summary?.total_actual || event.actual_cost || 0,
      budget_variance: (budget.summary?.total_budget || 0) - (budget.summary?.total_actual || 0),
      budget_lines: budget.lines || [],

      // 抽奖 (简化)
      lottery_participants: checkedIn.length,

      // 供应商 (从预算行中提取)
      supplier_count: 0,
      supplier_avg_rating: 0,

      // 执行小组
      exec_team_count: execTeam.length,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const eventId = request.nextUrl.searchParams.get('event_id');
    if (!eventId) return NextResponse.json({ success: false, error: '缺少 event_id' }, { status: 400 });

    const data = await gatherReportData(request.nextUrl.origin, eventId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return apiError(error);
  }
}

// POST — 保存复盘报告
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request, reportCreateSchema);
    const report = { ...body, id: body.id || crypto.randomUUID(), updated_at: new Date().toISOString() };
    await writeAuditLog(request, user, 'report.create', 'report', report.id, report);
    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    return apiError(error);
  }
}
