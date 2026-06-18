import { NextRequest, NextResponse } from 'next/server';
import { getCheckInLogs, clearAllCheckIns } from '@/lib/checkin/db';
import { apiError, requireAuth, requireMinimumRole } from '@/lib/api/security';

// GET /api/checkin/history?limit=20 - 最近签到记录
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const logs = await getCheckInLogs(Number.isFinite(limit) ? limit : 50);

    return NextResponse.json({ success: true, data: logs, total: logs.length });
  } catch (error) {
    return apiError(error);
  }
}

// DELETE /api/checkin/history - 清空签到记录（重置签到状态）
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireMinimumRole(user, 'event_manager');
    const result = await clearAllCheckIns();

    return NextResponse.json({
      success: true,
      message: `已清除 ${result.cleared} 条签到状态，删除 ${result.logsDeleted} 条记录`,
    });
  } catch (error) {
    return apiError(error);
  }
}
