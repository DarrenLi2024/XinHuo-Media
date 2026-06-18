import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { deepseek } from '@/lib/ai/deepseek';
import { getDemoReportPayload } from '@/lib/demo-store';
import { apiError, requireAuth, parseJsonBody } from '@/lib/api/security';

const requestSchema = z.object({
  event_id: z.string().min(1),
  type: z.enum(['summary', 'press_release', 'sponsor_return', 'client_delivery', 'internal_review']),
});

const TYPE_PROMPTS: Record<string, string> = {
  summary: '生成一份活动总结报告，包含：签到数据、活动亮点、改进建议。',
  press_release: '生成一份新闻通稿，用于对外发布。包含：活动主题、嘉宾规模、核心亮点、行业意义。',
  sponsor_return: '生成一份赞助商回报报告，列出：Logo露出情况、口播次数、展位流量、媒体报道覆盖。',
  client_delivery: '生成一份客户交付报告，包含：执行质量评分、签到率、费用决算、建议事项。',
  internal_review: '生成一份内部复盘报告，包含：流程回顾、问题分析、改进措施、下次优化建议。',
};

const AI_SYSTEM_PROMPT = `你是芯火会务管理系统的 AI 助手，专门为芯片行业活动生成专业报告。
要求：使用专业正式的中文表达、Markdown 格式、数据引用准确、逻辑清晰、针对芯片/半导体行业用语。`;

async function gatherSupabaseData(eventId: string) {
  const supabase = createServerClient();
  const [guestsRes, eventsRes, tasksRes, budgetRes] = await Promise.all([
    supabase.from('guests').select('*', { count: 'exact' }).eq('event_id', eventId),
    supabase.from('events').select('*').eq('id', eventId).single(),
    supabase.from('event_tasks').select('*').eq('event_id', eventId),
    supabase.from('budget_lines').select('*').eq('event_id', eventId),
  ]);

  const guests = guestsRes.data || [];
  const checkedIn = guests.filter((g) => g.check_in_status === 'checked_in').length;
  const tasks = tasksRes.data || [];
  const tasksCompleted = tasks.filter((t) => t.status === 'completed').length;

  return {
    eventName: (eventsRes.data as Record<string, unknown> | null)?.name || '未知活动',
    totalGuests: guests.length,
    checkedIn,
    checkInRate: guests.length > 0 ? Math.round((checkedIn / guests.length) * 100) : 0,
    tasksCompleted,
    tasksTotal: tasks.length,
    taskRate: tasks.length > 0 ? Math.round((tasksCompleted / tasks.length) * 100) : 0,
    budgetLines: budgetRes.data?.length || 0,
  };
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const parsed = await parseJsonBody(req, requestSchema);
    const { event_id, type } = parsed;

    let dataSummary: Record<string, unknown>;

    if (isSupabaseConfigured()) {
      dataSummary = await gatherSupabaseData(event_id);
    } else {
      const payload = getDemoReportPayload(event_id);
      if ('exists' in payload && payload.exists) {
        dataSummary = (payload.report as Record<string, unknown>).statistics as Record<string, unknown> || {};
      } else {
        dataSummary = ((payload as { statistics?: Record<string, unknown> }).statistics || {});
      }
    }

    const dataStr = JSON.stringify(dataSummary, null, 2);

    // 用 DeepSeek Pro 生成
    if (deepseek.isConfigured()) {
      try {
        const result = await deepseek.pro(
          `活动数据：\n${dataStr}\n\n${TYPE_PROMPTS[type]}`,
          AI_SYSTEM_PROMPT,
        );
        return NextResponse.json({
          success: true,
          data: { type, content: result.content, tokens: result.tokens, model: 'deepseek-reasoner' },
        });
      } catch (aiError) {
        console.error('DeepSeek API error:', aiError);
        return NextResponse.json({
          success: true,
          data: { type, content: `## 报告生成失败\n\nAI 服务暂时不可用，请稍后重试。\n\nerror: ${aiError instanceof Error ? aiError.message : 'unknown'}`, model: 'error' },
        });
      }
    }

    // 无 AI Key：返回数据摘要
    const templates: Record<string, string> = {
      summary: `## 活动总结\n\n> ⚠️ DeepSeek API Key 未配置，以下为数据摘要。\n\n\`\`\`json\n${dataStr}\n\`\`\``,
      press_release: `【新闻通稿】\n\n> ⚠️ DeepSeek API Key 未配置。\n\n活动数据：\`\`\`json\n${dataStr}\n\`\`\``,
      sponsor_return: `## 赞助商回报\n\n> ⚠️ DeepSeek API Key 未配置。\n\n\`\`\`json\n${dataStr}\n\`\`\``,
      client_delivery: `## 客户交付报告\n\n> ⚠️ DeepSeek API Key 未配置。\n\n\`\`\`json\n${dataStr}\n\`\`\``,
      internal_review: `## 内部复盘\n\n> ⚠️ DeepSeek API Key 未配置。\n\n\`\`\`json\n${dataStr}\n\`\`\``,
    };

    return NextResponse.json({
      success: true,
      data: { type, content: templates[type] || '', model: 'template' },
    });
  } catch (error) {
    return apiError(error);
  }
}
