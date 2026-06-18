import { NextRequest, NextResponse } from 'next/server';
import {
  encodeBadge,
  sendToNetworkPrinter,
  type BadgeData,
  type PrintConfig,
} from '@/lib/checkin/escpos-printer';
import { requireAuth, apiError } from '@/lib/api/security';

// POST /api/checkin/print-escpos
// 服务端通过 TCP(默认 9100) 直连网络热敏打印机打印胸牌。
// 既可传入已编码的 printData(base64)，也可传入胸牌字段由服务端编码。
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();

    const host: string | undefined = body.printerAddress || body.host;
    const port: number = Number(body.printerPort || body.port || 9100);

    if (!host) {
      return NextResponse.json(
        { success: false, error: '缺少打印机地址 printerAddress' },
        { status: 400 },
      );
    }

    let payload: Uint8Array;
    if (typeof body.printData === 'string' && body.printData) {
      payload = Uint8Array.from(Buffer.from(body.printData, 'base64'));
    } else if (body.name && body.qrCode) {
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
      payload = encodeBadge(badge, config);
    } else {
      return NextResponse.json(
        { success: false, error: '缺少打印内容：printData 或 name/qrCode' },
        { status: 400 },
      );
    }

    await sendToNetworkPrinter(host, port, payload);

    return NextResponse.json({ success: true, message: '已发送至打印机' });
  } catch (error) {
    // 网络打印机连接失败属于业务可预期错误，返回 200 让前端回退到系统打印
    if (error instanceof Error && /超时|ECONN|EHOST|ENET|connect/i.test(error.message)) {
      return NextResponse.json({ success: false, error: `打印机连接失败：${error.message}` });
    }
    return apiError(error);
  }
}
