import { NextRequest, NextResponse } from 'next/server';
import { deepseek } from '@/lib/ai/deepseek';
import { apiError, requireAuth, requireMinimumRole } from '@/lib/api/security';

/**
 * GET  /api/settings/llm-key — 查询密钥状态（是否已配置，不泄露密钥内容）
 * POST /api/settings/llm-key — 验证并保存密钥提示（仅返回验证结果，实际密钥在 Vercel 环境变量）
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireMinimumRole(user, 'event_manager');

    const configured = deepseek.isConfigured();
    return NextResponse.json({
      configured,
      hint: configured
        ? 'DeepSeek API Key 已配置'
        : 'DeepSeek API Key 未配置，请在 Vercel 环境变量中设置 DEEPSEEK_API_KEY',
    });
  } catch (error) {
    return apiError(error);
  }
}

/**
 * POST — 不实际保存密钥到数据库（密钥只在 Vercel 环境变量）。
 * 仅用于前端验证：用户输入密钥后，验证是否有效。
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireMinimumRole(user, 'super_admin');

    const body = await request.json().catch(() => ({}));
    const key = (body as { key?: string }).key;

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: '请提供 API Key' }, { status: 400 });
    }

    const result = await deepseek.verifyKey(key);

    if (result.valid) {
      return NextResponse.json({
        valid: true,
        message: 'API Key 验证成功！请将此 Key 添加到 Vercel 环境变量 DEEPSEEK_API_KEY',
      });
    }

    return NextResponse.json({ valid: false, message: result.message }, { status: 400 });
  } catch (error) {
    return apiError(error);
  }
}
