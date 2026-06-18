import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { apiError, assertRateLimit, parseJsonBody } from '@/lib/api/security';

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  code: z.string().min(1).max(128).optional(),
});

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, 'auth-register', 10, 60_000);
    const body = await parseJsonBody(request, registerSchema);

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: '系统未配置数据库，请联系管理员' },
        { status: 503 },
      );
    }

    // 注册码校验：环境变量 REGISTRATION_CODE 若设置，则必须匹配
    const expectedCode = process.env.REGISTRATION_CODE;
    if (expectedCode && body.code !== expectedCode) {
      return NextResponse.json(
        { error: '注册码无效，请联系管理员获取' },
        { status: 403 },
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          name: body.name,
        },
      },
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || '注册失败' }, { status: 400 });
    }

    // 第一个注册的用户自动成为 super_admin（触发器已创建 staff，此处更新为 super_admin）
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });
    const role = (count ?? 0) <= 1 ? 'super_admin' : 'staff';

    const { error: profileError } = await supabase
      .from('users')
      .update({ role, status: 'active', updated_at: new Date().toISOString() })
      .eq('id', data.user.id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        data: {
          user: {
            id: data.user.id,
            email: body.email,
            name: body.name,
            role,
          },
          session: data.session,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
