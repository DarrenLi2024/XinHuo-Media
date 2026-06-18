import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase';
import { createDemoGuest } from '@/lib/demo-store';
import {
  apiError,
  parseJsonBody,
  requireAuth,
  requireEventAccess,
  writeAuditLog,
} from '@/lib/api/security';

const guestRowSchema = z.object({
  name: z.string().min(1).max(100),
  company: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(255).optional().or(z.literal('')),
  level: z.enum(['vip', 'important', 'normal']).optional(),
  invite_status: z.enum(['draft', 'invited', 'confirmed', 'declined', 'waitlist']).optional(),
  guest_role: z.enum(['speaker', 'award_guest', 'host', 'attendee', 'vip', 'staff', 'other']).optional(),
});

const batchGuestSchema = z.object({
  event_id: z.string().uuid(),
  guests: z.array(guestRowSchema).min(1).max(5000),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request, batchGuestSchema);
    await requireEventAccess(user, body.event_id, 'executor');

    if (!isSupabaseConfigured()) {
      const data = body.guests.map((guest) => createDemoGuest({
        ...guest,
        event_id: body.event_id,
        email: guest.email || undefined,
        source: 'import',
        profile_snapshot: { imported_at: new Date().toISOString() },
      }));
      await writeAuditLog(request, user, 'guest.batch-import', 'guest', undefined, { event_id: body.event_id, count: data.length });
      return NextResponse.json({ data, count: data.length }, { status: 201 });
    }

    const rows = body.guests.map((guest) => ({
      event_id: body.event_id,
      name: guest.name,
      company: guest.company,
      position: guest.position,
      phone: guest.phone,
      email: guest.email || null,
      level: guest.level || 'normal',
      source: 'import',
      invite_status: guest.invite_status || 'draft',
      guest_role: guest.guest_role || 'attendee',
      profile_snapshot: { imported_at: new Date().toISOString() },
      check_in_status: 'pending',
    }));

    const { data, error } = await createServerClient()
      .from('guests')
      .insert(rows)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(request, user, 'guest.batch-import', 'guest', undefined, { event_id: body.event_id, count: data?.length || 0 });

    return NextResponse.json({ data: data || [], count: data?.length || 0 }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
