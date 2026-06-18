import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  apiError,
  parseJsonBody,
  requireAuth,
  requireMinimumRole,
  writeAuditLog,
} from '@/lib/api/security';

// 中奖历史存储 (与 draw 共用，这里提供查询功能)
let winnersHistory: WinnerHistory[] = [];

interface WinnerHistory {
  id: string;
  name: string;
  prizeId: string;
  prizeName: string;
  prizeLevel: string;
  time: string;
  eventId?: string;
}

const winnerHistorySchema = z.object({
  name: z.string().min(1).max(100),
  prizeId: z.string().min(1),
  prizeName: z.string().min(1).max(100),
  prizeLevel: z.string().max(50).optional(),
  time: z.string().optional(),
  eventId: z.string().optional(),
});

const historyCreateSchema = z.object({
  winners: z.array(winnerHistorySchema).max(1000),
});

// GET - 获取中奖历史
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const prizeId = searchParams.get('prizeId');
    const eventId = searchParams.get('eventId');

    let filteredHistory = winnersHistory;

    if (prizeId) {
      filteredHistory = filteredHistory.filter(w => w.prizeId === prizeId);
    }

    if (eventId) {
      filteredHistory = filteredHistory.filter(w => w.eventId === eventId);
    }

    return NextResponse.json({
      success: true,
      data: filteredHistory,
      total: filteredHistory.length,
    });
  } catch (error) {
    return apiError(error);
  }
}

// POST - 添加中奖记录
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireMinimumRole(user, 'event_manager');
    const body = await parseJsonBody(request, historyCreateSchema);
    const { winners } = body;

    const newRecords: WinnerHistory[] = winners.map((w, index) => ({
      id: Date.now().toString() + index,
      name: w.name || '',
      prizeId: w.prizeId || '',
      prizeName: w.prizeName || '',
      prizeLevel: w.prizeLevel || 'third',
      time: w.time || new Date().toLocaleString('zh-CN'),
      eventId: w.eventId,
    }));

    winnersHistory = [...winnersHistory, ...newRecords];
    await writeAuditLog(request, user, 'lottery-history.import', 'lottery_history', undefined, { count: newRecords.length });

    return NextResponse.json({
      success: true,
      data: newRecords,
      total: winnersHistory.length,
    });
  } catch (error) {
    return apiError(error);
  }
}

// DELETE - 清空历史记录
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    requireMinimumRole(user, 'event_manager');
    winnersHistory = [];
    await writeAuditLog(request, user, 'lottery-history.clear', 'lottery_history');
    return NextResponse.json({
      success: true,
      message: '历史记录已清空',
    });
  } catch (error) {
    return apiError(error);
  }
}
