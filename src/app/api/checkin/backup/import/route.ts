import { NextRequest, NextResponse } from 'next/server';
import { restoreData } from '@/lib/checkin/db';
import { requireAuth, requireMinimumRole, apiError } from '@/lib/api/security';
import type { CheckinBackup } from '@/lib/checkin/schema';

// POST /api/checkin/backup/import - 导入 JSON 备份（merge / replace）
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireMinimumRole(user, 'event_manager');

    const contentType = request.headers.get('content-type') || '';
    let backup: Partial<CheckinBackup> | null = null;
    let mode: 'merge' | 'replace' = 'merge';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const modeValue = formData.get('mode');
      if (modeValue === 'replace') mode = 'replace';
      if (!file) {
        return NextResponse.json({ success: false, error: '未提供备份文件' }, { status: 400 });
      }
      backup = JSON.parse(await file.text()) as Partial<CheckinBackup>;
    } else {
      const body = await request.json();
      if (body?.mode === 'replace') mode = 'replace';
      backup = (body?.data ?? body) as Partial<CheckinBackup>;
    }

    if (!backup || !Array.isArray(backup.guests)) {
      return NextResponse.json({ success: false, error: '备份文件格式无效' }, { status: 400 });
    }

    const result = await restoreData(
      { guests: backup.guests, checkInLogs: backup.checkInLogs || [] },
      mode,
    );

    return NextResponse.json({
      success: true,
      message: `导入完成：嘉宾 ${result.guestsImported} 条导入，${result.guestsSkipped} 条跳过`,
      data: result,
    });
  } catch (error) {
    return apiError(error);
  }
}
