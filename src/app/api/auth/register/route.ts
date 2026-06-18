import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase';
import { apiError, assertRateLimit, parseJsonBody } from '@/lib/api/security';

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
});

export async function POST(request: NextRequest) {
  try {
    assertRateLimit(request, 'auth-register', 10, 60_000);
    const body = await parseJsonBody(request, registerSchema);
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

    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });
    const role = count === 0 ? 'super_admin' : 'staff';

    const { error: profileError } = await supabase.from('users').upsert({
      id: data.user.id,
      email: body.email,
      phone: body.phone,
      name: body.name,
      role,
      status: 'active',
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        user: {
          id: data.user.id,
          email: body.email,
          name: body.name,
          role,
        },
        session: data.session,
      },
    }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
