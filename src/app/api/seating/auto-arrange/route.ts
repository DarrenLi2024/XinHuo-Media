import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  apiError,
  parseJsonBody,
  requireAuth,
  requireEventAccess,
  writeAuditLog,
} from '@/lib/api/security';
import { autoArrangeDemoSeating } from '@/lib/demo-store';

const autoArrangeSchema = z.object({
  eventId: z.string().uuid(),
  strategy: z.enum(['balanced', 'vip-first', 'company-group', 'random']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request, autoArrangeSchema);
    await requireEventAccess(user, body.eventId, 'manager');

    const result = autoArrangeDemoSeating(body.eventId);
    await writeAuditLog(request, user, 'seating.auto-arrange', 'event', body.eventId, { strategy: body.strategy || 'balanced' });

    return NextResponse.json({
      success: true,
      data: result,
      message: `自动排座完成，已安排 ${result.arrangedCount} 人，剩余 ${result.unassignedCount} 人未分配`,
    });
  } catch (error) {
    return apiError(error);
  }
}
