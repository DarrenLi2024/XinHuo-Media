import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { apiError, assertRateLimit, parseJsonBody } from '@/lib/api/security';
import { demoUser } from '@/lib/demo-store';

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, 'auth-login', 20, 60_000);
    const body = await parseJsonBody(request, loginSchema);

    if (!isSupabaseConfigured()) {
      const response = NextResponse.json({
        data: {
          user: demoUser,
          token: 'demo-session',
          refreshToken: 'demo-session',
          expiresIn: 60 * 60 * 24,
        },
      });

      response.cookies.set('xh_access_token', 'demo-session', {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: 60 * 60 * 24,
      });
      response.cookies.set('xh_refresh_token', 'demo-session', {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      return response;
    }

    const supabase = createServerClient();
    const { data, error } = await supabase.auth.signInWithPassword(body);

    if (error || !data.session || !data.user.email) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, name, role, status')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile || profile.status !== 'active') {
      return NextResponse.json({ error: '用户不存在或已被禁用' }, { status: 403 });
    }

    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id);

    const response = NextResponse.json({
      data: {
        user: profile,
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
      },
    });

    response.cookies.set('xh_access_token', data.session.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: data.session.expires_in,
    });
    response.cookies.set('xh_refresh_token', data.session.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    return apiError(error);
  }
}
