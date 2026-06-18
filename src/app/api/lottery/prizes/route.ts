import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  apiError,
  parseJsonBody,
  requireAuth,
  requireMinimumRole,
  writeAuditLog,
} from '@/lib/api/security';

// 奖品数据存储 (内存模拟)
let prizes: Prize[] = [
  { id: '1', name: '特等奖', description: 'iPhone 15 Pro', quantity: 1, level: 'special', remaining: 1 },
  { id: '2', name: '一等奖', description: 'MacBook Air', quantity: 3, level: 'first', remaining: 3 },
  { id: '3', name: '二等奖', description: 'iPad Air', quantity: 5, level: 'second', remaining: 5 },
  { id: '4', name: '三等奖', description: 'AirPods Pro', quantity: 10, level: 'third', remaining: 10 },
];

interface Prize {
  id: string;
  name: string;
  description: string;
  quantity: number;
  level: 'special' | 'first' | 'second' | 'third';
  remaining: number;
}

const prizeCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(255),
  quantity: z.coerce.number().int().min(1).max(10000).optional(),
  level: z.enum(['special', 'first', 'second', 'third']).optional(),
});

const prizeUpdateSchema = prizeCreateSchema.partial().extend({
  id: z.string().min(1),
  remaining: z.coerce.number().int().min(0).max(10000).optional(),
});

// GET - 获取奖品列表
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
  } catch (error) {
    return apiError(error);
  }

  return NextResponse.json({
    success: true,
    data: prizes,
  });
}

// POST - 创建新奖品
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireMinimumRole(user, 'event_manager');
    const body = await parseJsonBody(request, prizeCreateSchema);
    const { name, description, quantity, level } = body;

    const newPrize: Prize = {
      id: Date.now().toString(),
      name,
      description,
      quantity: quantity || 1,
      level: level || 'third',
      remaining: quantity || 1,
    };

    prizes.push(newPrize);
    await writeAuditLog(request, user, 'lottery-prize.create', 'lottery_prize', newPrize.id, newPrize);

    return NextResponse.json({
      success: true,
      data: newPrize,
    });
  } catch (error) {
    return apiError(error);
  }
}

// PUT - 更新奖品
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireMinimumRole(user, 'event_manager');
    const body = await parseJsonBody(request, prizeUpdateSchema);
    const { id, name, description, quantity, remaining } = body;

    const prizeIndex = prizes.findIndex(p => p.id === id);
    if (prizeIndex === -1) {
      return NextResponse.json({
        success: false,
        error: '奖品不存在',
      }, { status: 404 });
    }

    prizes[prizeIndex] = {
      ...prizes[prizeIndex],
      name: name || prizes[prizeIndex].name,
      description: description || prizes[prizeIndex].description,
      quantity: quantity || prizes[prizeIndex].quantity,
      remaining: remaining ?? prizes[prizeIndex].remaining,
    };
    await writeAuditLog(request, user, 'lottery-prize.update', 'lottery_prize', id, prizes[prizeIndex]);

    return NextResponse.json({
      success: true,
      data: prizes[prizeIndex],
    });
  } catch (error) {
    return apiError(error);
  }
}

// DELETE - 删除奖品
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireMinimumRole(user, 'event_manager');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少奖品ID',
      }, { status: 400 });
    }

    prizes = prizes.filter(p => p.id !== id);
    await writeAuditLog(request, user, 'lottery-prize.delete', 'lottery_prize', id);

    return NextResponse.json({
      success: true,
      message: '奖品已删除',
    });
  } catch (error) {
    return apiError(error);
  }
}
