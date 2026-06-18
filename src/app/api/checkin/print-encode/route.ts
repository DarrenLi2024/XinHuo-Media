import { NextRequest, NextResponse } from 'next/server';
import { encodeBadge, type BadgeData, type PrintConfig } from '@/lib/checkin/escpos-printer';
import { requireAuth, apiError } from '@/lib/api/security';

// POST /api/checkin/print-encode
// 将胸牌内容编码为 ESC/POS 字节流（base64），供前端经蓝牙/USB 发送给打印机。
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();

    if (!body?.name || !body?.qrCode) {
      return NextResponse.json(
        { success: false, error: '缺少必要字段：name / qrCode' },
        { status: 400 },
      );
    }

    const badge: BadgeData = {
      name: body.name,
      guestType: body.guestType || '普通嘉宾',
      tableNumber: body.tableNumber ?? null,
      organization: body.organization ?? null,
      qrCode: body.qrCode,
      eventName: body.eventName,
    };

    const config: PrintConfig = {
      paperWidth: body.paperWidth,
      printDensity: body.printDensity,
      labelType: body.labelType,
    };

    const payload = encodeBadge(badge, config);
    const base64 = Buffer.from(payload).toString('base64');

    return NextResponse.json({ success: true, data: base64 });
  } catch (error) {
    return apiError(error);
  }
}
