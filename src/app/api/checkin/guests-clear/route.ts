import { NextRequest, NextResponse } from 'next/server';
import { clearAllData } from '@/lib/checkin/db';
import { requireAuth, requireMinimumRole, apiError } from '@/lib/api/security';

// DELETE /api/checkin/guests-clear - 清空所有嘉宾
export async function DELETE(request: NextRequest) {
try {
    const user = await requireAuth(request);
    requireMinimumRole(user, 'event_manager');
    await clearAllData();
    return NextResponse.json({ success: true, message: '所有数据已清空' });
  } catch (error) {
    return apiError(error);
  }
}
