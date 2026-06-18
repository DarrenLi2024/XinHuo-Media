import { NextRequest, NextResponse } from 'next/server';
import { getAllGuests, getRawCheckInLogs, getStats } from '@/lib/checkin/db';
import { requireAuth, apiError } from '@/lib/api/security';
import type { CheckinBackup } from '@/lib/checkin/schema';

// GET /api/checkin/backup/export - 导出完整 JSON 备份
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const eventName = searchParams.get('eventName') || '活动签到';
    const eventDate = searchParams.get('eventDate') || '';

    const [guests, checkInLogs, stats] = await Promise.all([
      getAllGuests(),
      getRawCheckInLogs(),
      getStats(),
    ]);

    const backup: CheckinBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      eventName,
      eventDate,
      stats,
      guests,
      checkInLogs,
    };

    const buffer = Buffer.from(JSON.stringify(backup, null, 2), 'utf-8');
    const filename = `checkin_backup_${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(buffer as BufferSource, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
