import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDemoReportPayload } from '@/lib/demo-store';
import { apiError, requireAuth, parseJsonBody } from '@/lib/api/security';

const requestSchema = z.object({
  event_id: z.string().min(1),
  type: z.enum(['summary', 'press_release', 'sponsor_return', 'client_delivery', 'internal_review']),
});

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const parsed = await parseJsonBody(req, requestSchema);
    const { event_id, type } = parsed;
    const payload = getDemoReportPayload(event_id);

    let data: Record<string, unknown> = {};
    if ('exists' in payload && payload.exists) {
      const report = (payload as { exists: true; report: { title: string; statistics: Record<string, unknown> } }).report;
      data = { title: report.title, ...report.statistics };
    } else {
      data = { title: payload.event?.name || '未命名活动', ...(payload.statistics || {}) };
    }

    const templates: Record<string, string> = {
      summary: `## 活动总结\n\n本次活动圆满成功！核心数据：报名${data.total_guests || '—'}人，实到${data.checked_in_guests || '—'}人，签到率${data.check_in_rate || '—'}%。\n\n**亮点**：智能排座优化现场体验，大屏抽奖气氛热烈。`,
      press_release: `【新闻通稿】\n\n**标题**：${data.title || '芯火会务活动圆满落幕'}\n\n近日由芯火传媒主办的活动在深圳举行，吸引芯片行业嘉宾齐聚。智能排座+大屏抽奖将气氛推向高潮。芯火传媒将持续 AI 赋能会务管理。`,
      sponsor_return: `## 赞助商回报报告\n\nLogo展示✅ 口播✅ 展位✅ 公众号✅\n\n赞助商数量：${data.total_guests || '—'}家`,
      client_delivery: `## 客户交付报告\n\n活动：${data.title}\n签到率：${data.check_in_rate || '—'}%\n执行质量：优\n建议：可增加自助签到终端`,
      internal_review: `## 内部复盘\n\n签到率：${data.check_in_rate || '—'}%\n改进：优化签到流程\n建议：下次增加自助终端`,
    };

    return NextResponse.json({ success: true, data: { type, content: templates[type] || '' } });
  } catch (error) {
    return apiError(error);
  }
}
