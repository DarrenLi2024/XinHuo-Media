import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  apiError,
  parseJsonBody,
  requireAuth,
  requireEventAccess,
  writeAuditLog,
} from '@/lib/api/security';
import {
  createDemoSeatingTable,
  deleteDemoSeatingTable,
  listDemoSeatingTables,
  updateDemoSeatingTableLock,
  updateDemoSeatingTable,
} from '@/lib/demo-store';

const tableCreateSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1).max(100),
  capacity: z.coerce.number().int().min(1).max(1000),
  shape: z.enum(['round', 'square', 'long']).optional(),
});

const tableUpdateSchema = z.object({
  eventId: z.string().uuid(),
  tableId: z.string().min(1),
  guestId: z.string().min(1).optional(),
  targetTableId: z.string().min(1).optional(),
  locked: z.boolean().optional(),
  action: z.enum(['add', 'remove', 'lock', 'unlock', 'swap', 'lock-table', 'unlock-table']),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const eventId = request.nextUrl.searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ success: false, error: 'eventId is required' }, { status: 400 });
    }
    await requireEventAccess(user, eventId, 'viewer');

    const data = listDemoSeatingTables(eventId);
    return NextResponse.json({ success: true, data, total: data.length });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request, tableCreateSchema);
    await requireEventAccess(user, body.eventId, 'manager');

    const data = createDemoSeatingTable(body);
    await writeAuditLog(request, user, 'seating-table.create', 'seating_table', data.id, data);

    return NextResponse.json({ success: true, data, message: '桌位创建成功' });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request, tableUpdateSchema);
    await requireEventAccess(user, body.eventId, 'executor');

    let data = null;
    if (body.action === 'lock-table' || body.action === 'unlock-table') {
      data = updateDemoSeatingTableLock({ eventId: body.eventId, tableId: body.tableId, locked: body.action === 'lock-table' });
    } else if (body.guestId) {
      data = updateDemoSeatingTable({
        eventId: body.eventId,
        tableId: body.tableId,
        guestId: body.guestId,
        targetTableId: body.targetTableId,
        action: body.action,
      });
    }
    if (!data) {
      return NextResponse.json({ success: false, error: '桌位或嘉宾不存在、桌位已满，或目标被锁定' }, { status: 400 });
    }

    await writeAuditLog(request, user, 'seating-table.update', 'seating_table', body.tableId, body);
    const messages: Record<string, string> = {
      add: '嘉宾已入座',
      remove: '嘉宾已离座',
      lock: '嘉宾座位已锁定',
      unlock: '嘉宾座位已解锁',
      swap: '嘉宾已换桌',
      'lock-table': '桌位已锁定',
      'unlock-table': '桌位已解锁',
    };
    return NextResponse.json({ success: true, data, message: messages[body.action] || '桌位已更新' });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const tableId = request.nextUrl.searchParams.get('tableId');
    const eventId = request.nextUrl.searchParams.get('eventId');

    if (!eventId || !tableId) {
      return NextResponse.json({ success: false, error: 'eventId and tableId are required' }, { status: 400 });
    }
    await requireEventAccess(user, eventId, 'manager');

    const deleted = deleteDemoSeatingTable(eventId, tableId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: '桌位不存在或仍有嘉宾' }, { status: 400 });
    }

    await writeAuditLog(request, user, 'seating-table.delete', 'seating_table', tableId, { eventId });
    return NextResponse.json({ success: true, message: '桌位已删除' });
  } catch (error) {
    return apiError(error);
  }
}
