import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { apiError, requireAuth } from '@/lib/api/security';

// Demo 通知数据（无 Supabase 时使用）
const demoNotifications = [
  {
    id: 'n1',
    title: '活动筹备提醒',
    message: '"2026 芯火会务演示活动" 筹备进度已达 60%，请及时跟进',
    type: 'warning',
    link: '/events',
    is_read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n2',
    title: '新嘉宾注册',
    message: '有 3 位新嘉宾通过报名表单注册',
    type: 'info',
    link: '/events/roster',
    is_read: false,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'n3',
    title: '任务即将到期',
    message: '"导入嘉宾名单" 任务将于 6月24日 截止',
    type: 'warning',
    link: '/events/tasks',
    is_read: false,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data: data || [] });
    }

    return NextResponse.json({ success: true, data: demoNotifications });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { id, is_read } = body;

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();
      const { error } = await supabase
        .from('notifications')
        .update({ is_read })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
