// ESC/POS 热敏打印编码封装（自包含实现，无第三方依赖）。
//
// 说明：docs/checkin 描述使用 escpos-encoder 库 + 蓝牙/USB/网络打印机。
// 浏览器侧的蓝牙(Web Bluetooth)/USB(WebUSB) 需真实硬件，无法在本地自动验证；
// 这里实现：
//   1. encodeBadge() —— 将胸牌内容编码为 ESC/POS 字节流（base64 返回给前端，
//      由前端通过 Web Bluetooth / WebUSB 发送给打印机）。
//   2. sendToNetworkPrinter() —— 服务端通过 TCP(9100) 直接推送给网络热敏打印机。
// 浏览器系统打印（window.print 弹窗）作为最终兜底，已在 entry 页实现。

import net from 'net';

export interface BadgeData {
  name: string;
  guestType: string;
  tableNumber?: string | null;
  organization?: string | null;
  qrCode: string;
  eventName?: string;
}

export interface PrintConfig {
  paperWidth?: number; // 50 / 58 / 80 (mm)
  printDensity?: number; // 1-10
  labelType?: 'badge' | 'simple' | 'card';
}

// ESC/POS 控制指令
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

class EscPosBuilder {
  private chunks: number[] = [];

  raw(...bytes: number[]): this {
    this.chunks.push(...bytes);
    return this;
  }

  initialize(): this {
    return this.raw(ESC, 0x40); // ESC @
  }

  align(mode: 'left' | 'center' | 'right'): this {
    const map = { left: 0, center: 1, right: 2 } as const;
    return this.raw(ESC, 0x61, map[mode]); // ESC a n
  }

  // 字号放大：宽高倍数 0-7
  size(width: number, height: number): this {
    const n = ((Math.min(width, 7) & 0x07) << 4) | (Math.min(height, 7) & 0x07);
    return this.raw(GS, 0x21, n); // GS ! n
  }

  bold(on: boolean): this {
    return this.raw(ESC, 0x45, on ? 1 : 0); // ESC E n
  }

  text(value: string): this {
    const encoded = Buffer.from(value, 'utf-8');
    this.chunks.push(...encoded);
    return this;
  }

  line(value = ''): this {
    return this.text(value).raw(LF);
  }

  feed(lines = 1): this {
    for (let i = 0; i < lines; i += 1) this.raw(LF);
    return this;
  }

  // 以 CODE128 打印条码（多数热敏机内置支持）
  barcode(value: string): this {
    const data = Buffer.from(value, 'ascii');
    this.raw(GS, 0x68, 80); // 条码高度
    this.raw(GS, 0x77, 2); // 条码宽度
    this.raw(GS, 0x6b, 73, data.length); // GS k m n（CODE128）
    this.chunks.push(...data);
    return this;
  }

  cut(): this {
    return this.raw(GS, 0x56, 0x42, 0x00); // GS V B 0 全切
  }

  build(): Uint8Array {
    return Uint8Array.from(this.chunks);
  }
}

// 将胸牌内容编码为 ESC/POS 字节流
export function encodeBadge(data: BadgeData, config: PrintConfig = {}): Uint8Array {
  const builder = new EscPosBuilder();

  builder.initialize().align('center');

  if (data.eventName) {
    builder.bold(true).size(1, 1).line(data.eventName).bold(false);
    builder.feed(1);
  }

  // 姓名（放大）
  builder.size(2, 2).bold(true).line(data.name).bold(false).size(0, 0);

  // 身份
  builder.line(data.guestType);

  if (data.tableNumber) {
    builder.line(`桌号: ${data.tableNumber}`);
  }
  if (config.labelType !== 'simple' && data.organization) {
    builder.line(data.organization);
  }

  builder.feed(1);
  builder.barcode(data.qrCode);
  builder.feed(2).cut();

  return builder.build();
}

// 通过 TCP 发送到网络热敏打印机（IP + 端口，默认 9100）
export function sendToNetworkPrinter(
  host: string,
  port: number,
  payload: Uint8Array,
  timeoutMs = 8000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const done = (err?: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (err) reject(err);
      else resolve();
    };

    socket.setTimeout(timeoutMs);
    socket.once('error', (err) => done(err));
    socket.once('timeout', () => done(new Error('打印机连接超时')));
    socket.connect(port, host, () => {
      socket.write(Buffer.from(payload), (err) => {
        if (err) done(err);
        else done();
      });
    });
  });
}
