import { NextRequest, NextResponse } from 'next/server';
import { batchUpdateGuests } from '@/lib/checkin/db';
import { requireAuth, requireMinimumRole } from '@/lib/api/security';

// PUT /api/checkin/guests-batch - 批量修改嘉宾
export async function PUT(request: NextRequest) {
try {
    const user = await requireAuth(request);
    requireMinimumRole(user, 'executor');
    const body = await request.json();
    const { ids, data } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: '请提供要修改的嘉宾ID' }, { status: 400 });
    }
    
    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: '请提供修改数据' }, { status: 400 });
    }
    
    const count = await batchUpdateGuests(ids, data);
    
    return NextResponse.json({
      success: true,
      message: `成功修改 ${count} 名嘉宾`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '操作失败' }, { status: 500 });
  }
}
