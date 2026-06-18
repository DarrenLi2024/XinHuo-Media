import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { AttendeeSource, GuestType, GuestStatus, ExecRole } from '@/types/roster';
import {
  listDemoExecTeam, createDemoExecMember, updateDemoExecMember, deleteDemoExecMember,
  listDemoGuestEntries, createDemoGuestEntry, updateDemoGuestEntry, deleteDemoGuestEntry,
  listDemoSponsorRoster,
  listDemoAttendeeEntries, createDemoAttendeeEntry, updateDemoAttendeeEntry, deleteDemoAttendeeEntry,
  batchImportDemoAttendees, getDemoRosterStats,
} from '@/lib/demo-store';

// ====== Schemas ======

const execSchema = z.object({
  event_id: z.string().min(1),
  role: z.string().min(1),
  role_label: z.string().optional(),
  name: z.string().min(1),
  phone: z.string().optional(),
  wechat_id: z.string().optional(),
  email: z.string().optional(),
  responsibility: z.string(),
  notes: z.string().optional(),
  order: z.number().optional(),
});

const guestSchema = z.object({
  event_id: z.string().min(1),
  name: z.string().min(1),
  guest_type: z.string().min(1),
  guest_type_label: z.string().optional(),
  title: z.string(),
  company: z.string(),
  avatar_url: z.string().optional(),
  bio: z.string(),
  speech_topic: z.string().optional(),
  segment: z.string().optional(),
  need_reception: z.boolean().optional(),
  need_seat: z.boolean().optional(),
  seat_info: z.string().optional(),
  need_dinner: z.boolean().optional(),
  status: z.string().optional(),
  phone: z.string().optional(),
  wechat_id: z.string().optional(),
  email: z.string().optional(),
  notes: z.string().optional(),
  order: z.number().optional(),
});

const attendeeSchema = z.object({
  event_id: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().optional(),
  wechat_id: z.string().optional(),
  email: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  industry: z.string().optional(),
  city: z.string().optional(),
  source: z.string().optional(),
  is_member: z.boolean().optional(),
  need_invoice: z.boolean().optional(),
  attend_dinner: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const attendeeImportSchema = z.object({
  event_id: z.string().min(1),
  rows: z.array(z.record(z.string(), z.string())),
});

// ====== GET: 统一获取名单数据 ======

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('event_id');
  const type = searchParams.get('type') || 'all';
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  if (!eventId) return NextResponse.json({ success: false, error: '缺少 event_id' }, { status: 400 });

  if (type === 'all' || type === 'stats') {
    const stats = getDemoRosterStats(eventId);
    if (type === 'stats') return NextResponse.json({ success: true, data: stats });
    return NextResponse.json({
      success: true,
      data: {
        stats,
        exec_team: listDemoExecTeam(eventId),
        guests: listDemoGuestEntries(eventId, { search, status }),
        sponsors: listDemoSponsorRoster(eventId),
        attendees: listDemoAttendeeEntries(eventId, { search, status }),
      },
    });
  }

  switch (type) {
    case 'exec': return NextResponse.json({ success: true, data: listDemoExecTeam(eventId) });
    case 'guests': return NextResponse.json({ success: true, data: listDemoGuestEntries(eventId, { search, status }) });
    case 'sponsors': return NextResponse.json({ success: true, data: listDemoSponsorRoster(eventId) });
    case 'attendees': return NextResponse.json({ success: true, data: listDemoAttendeeEntries(eventId, { search, status }) });
    default: return NextResponse.json({ success: false, error: '未知名单类型' }, { status: 400 });
  }
}

// ====== POST: 通用创建 ======

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'attendees';
  const body = await req.json();

  try {
    switch (type) {
      case 'exec': {
        const parsed = execSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
        const member = createDemoExecMember({
      event_id: parsed.data.event_id,
      role: parsed.data.role as ExecRole,
      name: parsed.data.name,
      responsibility: parsed.data.responsibility,
      role_label: parsed.data.role_label,
      phone: parsed.data.phone,
      wechat_id: parsed.data.wechat_id,
      email: parsed.data.email,
      notes: parsed.data.notes,
      order: parsed.data.order ?? 0,
    });
        return NextResponse.json({ success: true, data: member }, { status: 201 });
      }
      case 'guests': {
        const parsed = guestSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
        const guest = createDemoGuestEntry({
      event_id: parsed.data.event_id,
      name: parsed.data.name,
      guest_type: parsed.data.guest_type as GuestType,
      title: parsed.data.title,
      company: parsed.data.company,
      bio: parsed.data.bio,
      guest_type_label: parsed.data.guest_type_label,
      avatar_url: parsed.data.avatar_url,
      speech_topic: parsed.data.speech_topic,
      segment: parsed.data.segment,
      need_reception: parsed.data.need_reception ?? false,
      need_seat: parsed.data.need_seat ?? true,
      seat_info: parsed.data.seat_info,
      need_dinner: parsed.data.need_dinner ?? true,
      status: (parsed.data.status as GuestStatus) || 'pending',
      phone: parsed.data.phone,
      wechat_id: parsed.data.wechat_id,
      email: parsed.data.email,
      notes: parsed.data.notes,
      order: parsed.data.order ?? 0,
    });
        return NextResponse.json({ success: true, data: guest }, { status: 201 });
      }
      case 'attendees': {
        const parsed = attendeeSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
        const attendee = createDemoAttendeeEntry({
      event_id: parsed.data.event_id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      wechat_id: parsed.data.wechat_id,
      email: parsed.data.email,
      company: parsed.data.company,
      position: parsed.data.position,
      industry: parsed.data.industry,
      city: parsed.data.city,
      source: (parsed.data.source as AttendeeSource) || 'manual',
      review_status: 'pending',
      is_member: parsed.data.is_member ?? false,
      need_invoice: parsed.data.need_invoice ?? false,
      attend_dinner: parsed.data.attend_dinner ?? true,
      tags: parsed.data.tags || [],
      notes: parsed.data.notes,
    });
        return NextResponse.json({ success: true, data: attendee }, { status: 201 });
      }
      case 'attendees_batch': {
        const parsed = attendeeImportSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
        const result = batchImportDemoAttendees(parsed.data.event_id, parsed.data.rows as Record<string, string>[]);
        return NextResponse.json({ success: true, data: result }, { status: 201 });
      }
      default:
        return NextResponse.json({ success: false, error: '未知操作类型' }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// ====== PUT: 单条编辑 ======

export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'attendees';
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ success: false, error: '缺少 id' }, { status: 400 });

  let result = null;
  switch (type) {
    case 'exec': result = updateDemoExecMember(id, updates); break;
    case 'guests': result = updateDemoGuestEntry(id, updates); break;
    case 'attendees': result = updateDemoAttendeeEntry(id, updates); break;
    default: return NextResponse.json({ success: false, error: '未知类型' }, { status: 400 });
  }

  if (!result) return NextResponse.json({ success: false, error: '记录不存在' }, { status: 404 });
  return NextResponse.json({ success: true, data: result });
}

// ====== DELETE ======

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'attendees';
  const id = searchParams.get('id') || '';

  let ok = false;
  switch (type) {
    case 'exec': ok = deleteDemoExecMember(id); break;
    case 'guests': ok = deleteDemoGuestEntry(id); break;
    case 'attendees': ok = deleteDemoAttendeeEntry(id); break;
    default: return NextResponse.json({ success: false, error: '未知类型' }, { status: 400 });
  }

  if (!ok) return NextResponse.json({ success: false, error: '记录不存在' }, { status: 404 });
  return NextResponse.json({ success: true });
}
