import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase';
import { createDemoGuest, listDemoGuests } from '@/lib/demo-store';
import {
  apiError,
  parseJsonBody,
  requireAuth,
  requireEventAccess,
  safeSearch,
  writeAuditLog,
} from '@/lib/api/security';

const guestCreateSchema = z.object({
  event_id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  company: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(255).optional().or(z.literal('')),
  level: z.enum(['vip', 'important', 'normal']).optional(),
  source: z.enum(['manual', 'import', 'customer_contact', 'registration', 'legacy']).optional(),
  invite_status: z.enum(['draft', 'invited', 'confirmed', 'declined', 'waitlist']).optional(),
  guest_role: z.enum(['speaker', 'award_guest', 'host', 'attendee', 'vip', 'staff', 'other']).optional(),
  profile_snapshot: z.record(z.string(), z.unknown()).optional(),
  seat_zone_id: z.string().uuid().optional(),
  seat_number: z.string().max(50).optional(),
});

// GET /api/guests - 获取嘉宾列表
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('event_id');
    const level = searchParams.get('level');
    const search = safeSearch(searchParams.get('search'));

    if (!eventId) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 });
    }
    await requireEventAccess(user, eventId, 'viewer');

    if (!isSupabaseConfigured()) {
      const data = listDemoGuests({ eventId })
        .filter((guest) => !level || guest.level === level)
        .filter((guest) => !search || `${guest.name}${guest.company}`.toLowerCase().includes(search.toLowerCase()));
      return NextResponse.json({ data });
    }

    let query = createServerClient()
      .from('guests')
      .select('id, event_id, customer_id, contact_id, name, company, position, phone, email, level, source, invite_status, guest_role, profile_snapshot, seat_zone_id, seat_number, check_in_status, check_in_time, created_at, updated_at, customers(*), customer_contacts(*)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (level) {
      query = query.eq('level', level);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/guests - 创建嘉宾
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await parseJsonBody(request, guestCreateSchema);
    await requireEventAccess(user, body.event_id, 'executor');

    if (!isSupabaseConfigured()) {
      const data = createDemoGuest({ ...body, email: body.email || undefined });
      await writeAuditLog(request, user, 'guest.create', 'guest', data.id, data);
      return NextResponse.json({ data }, { status: 201 });
    }

    const { data, error } = await createServerClient()
      .from('guests')
      .insert({
        event_id: body.event_id,
        customer_id: body.customer_id,
        contact_id: body.contact_id,
        name: body.name,
        company: body.company,
        position: body.position,
        phone: body.phone,
        email: body.email || null,
        level: body.level || 'normal',
        source: body.source || (body.contact_id ? 'customer_contact' : 'manual'),
        invite_status: body.invite_status || 'draft',
        guest_role: body.guest_role || 'attendee',
        profile_snapshot: body.profile_snapshot || {},
        seat_zone_id: body.seat_zone_id,
        seat_number: body.seat_number,
        check_in_status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(request, user, 'guest.create', 'guest', data.id, data);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
