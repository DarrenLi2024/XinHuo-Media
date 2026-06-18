import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { deepseek } from '@/lib/ai/deepseek';
import { getDemoReportPayload } from '@/lib/demo-store';
import { apiError, requireAuth, parseJsonBody } from '@/lib/api/security';

const requestSchema = z.object({
  event_id: z.string().min(1),
  type: z.enum(['summary', 'press_release', 'sponsor_return', 'client_delivery', 'internal_review']),
});

const SYSTEM_PROMPT = `你是芯火会务管理系统的 AI 助手，专门为芯片行业活动生成报告。
要求：
- 使用专业、正式的中文表达
- 数据引用准确，逻辑清晰
- 报告结构分明，使用 Markdown 格式
- 针对芯片/半导体行业用语习惯`;

const TYPE_PROMPTS: Record<string, string> = {
  summary: '生成一份活动总结报告，包含：签到数据、活动亮点、改进建议。',
  press_release: '生成一份新闻通稿，用于对外发布。包含：活动主题、嘉宾规模、核心亮点、行业意义。',
  sponsor_return: '生成一份赞助商回报报告，列出：Logo露出情况、口播次数、展位流量、媒体报道覆盖。',
  client_delivery: '生成一份客户交付报告，包含：执行质量评分、签到率、费用决算、建议事项。',
  internal_review: '生成一份内部复盘报告，包含：流程回顾、问题分析、改进措施、下次优化建议。',
};

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const parsed = await parseJsonBody(req, requestSchema);
    const { event_id, type } = parsed;

    // 获取活动数据
    const payload = getDemoReportPayload(event_id);
    let eventData: Record<string, unknown> = {};

    if ('exists' in payload && payload.exists) {
      const report = (payload as { exists: true; report: { title: string; statistics: Record<string, unknown> } }).report;
      eventData = { title: report.title, ...report.statistics };
    } else {
      eventData = {
        title: (payload as { event?: { name?: string } }).event?.name || '未命名活动',
        ...((payload as { statistics?: Record<string, unknown> }).statistics || {}),
      };
    }

    const dataSummary = JSON.stringify(eventData, null, 2);

    // 尝试用 DeepSeek Pro 生成
    if (deepseek.isConfigured()) {
      try {
        const result = await deepseek.pro(
          `活动数据：\n${dataSummary}\n\n${TYPE_PROMPTS[type]}`,
          SYSTEM_PROMPT,
        );
        return NextResponse.json({
          success: true,
          data: { type, content: result.content, tokens: result.tokens, model: 'deepseek-reasoner' },
        });
      } catch (aiError) {
        console.error('DeepSeek API 调用失败，回退到模板生成:', aiError);
        // 回退到模板
      }
    }

    // 回退：使用模板生成
    const data = eventData as Record<string, string | number | undefined>;
    const templates: Record<string, string> = {
      summary: `## 活动总结\n\n> ⚠️ DeepSeek API Key 未配置，使用模板生成。请在 Vercel 设置 DEEPSEEK_API_KEY 后启用 AI 生成。\n\n本次活动圆满成功！核心数据：报名${data.total_guests || '—'}人，实到${data.checked_in_guests || '—'}人，签到率${data.check_in_rate || '—'}%。\n\n**亮点**：智能排座优化现场体验，大屏抽奖气氛热烈。`,
      press_release: `【新闻通稿】\n\n> ⚠️ AI 生成未启用。\n\n**标题**：${data.title || '芯火会务活动圆满落幕'}\n\n近日由芯火传媒主办的活动在深圳举行，吸引芯片行业嘉宾齐聚。智能排座+大屏抽奖将气氛推向高潮。芯火传媒将持续 AI 赋能会务管理。`,
      sponsor_return: `## 赞助商回报报告\n\n> ⚠️ AI 生成未启用。\n\nLogo展示✅ 口播✅ 展位✅ 公众号✅\n\n赞助商数量：${data.total_guests || '—'}家`,
      client_delivery: `## 客户交付报告\n\n> ⚠️ AI 生成未启用。\n\n活动：${data.title}\n签到率：${data.check_in_rate || '—'}%\n执行质量：优\n建议：可增加自助签到终端`,
      internal_review: `## 内部复盘\n\n> ⚠️ AI 生成未启用。\n\n签到率：${data.check_in_rate || '—'}%\n改进：优化签到流程\n建议：下次增加自助终端`,
    };

    return NextResponse.json({
      success: true,
      data: { type, content: templates[type] || '', model: 'template' },
    });
  } catch (error) {
    return apiError(error);
  }
}
