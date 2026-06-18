import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

// GET /api/checkin/qrcode - 生成二维码图片
export async function GET(request: NextRequest) {
try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    const size = parseInt(searchParams.get('size') || '200');
    
    if (!text) {
      return NextResponse.json({ success: false, error: '请提供二维码内容' }, { status: 400 });
    }
    
    const qrDataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    
    // 转换为Buffer
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '二维码生成失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
