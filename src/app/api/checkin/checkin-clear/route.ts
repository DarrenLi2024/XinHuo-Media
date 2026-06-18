import { NextRequest, NextResponse } from 'next/server';
import { clearAllCheckIns } from '@/lib/checkin/db';
import { requireAuth, requireMinimumRole, apiError } from '@/lib/api/security';

// POST /api/checkin/checkin-clear - 清除所有签到状态
export async function POST(request: NextRequest) {
try {
    const user = await requireAuth(request);
    requireMinimumRole(user, 'event_manager');
    const result = await clearAllCheckIns();
    return NextResponse.json({
      success: true,
      message: `已清除 ${result.cleared} 条签到状态，删除 ${result.logsDeleted} 条日志`,
    });
  } catch (error) {
    return apiError(error);
  }
}
