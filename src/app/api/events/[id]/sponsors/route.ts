import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Sponsor } from '@/types/sponsor';
import { listDemoSponsors, createDemoSponsor, updateDemoSponsor, deleteDemoSponsor } from '@/lib/demo-store';
import { apiError, requireAuth, parseJsonBody, writeAuditLog } from '@/lib/api/security';

const createSchema = z.object({
  name: z.string().min(1),
  level: z.string().min(1),
  level_name: z.string().optional(),
  amount: z.number().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_wechat: z.string().optional(),
  contact_email: z.string().optional(),
  logo_url: z.string().optional(),
  company_intro: z.string().optional(),
  booth_needed: z.boolean().optional(),
  benefits: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const updateSchema = createSchema.partial();

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(_req);
    const { id: eventId } = await params;
    const sponsors = listDemoSponsors(eventId);
    return NextResponse.json({ success: true, data: sponsors });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);
    const { id: eventId } = await params;
    const parsed = await parseJsonBody(req, createSchema);
    const sponsor = createDemoSponsor({ ...parsed, event_id: eventId, level: parsed.level as Parameters<typeof createDemoSponsor>[0]['level'] });
    await writeAuditLog(req, user, 'sponsor.create', 'sponsor', sponsor.id, sponsor);
    return NextResponse.json({ success: true, data: sponsor }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);
    const { id: eventId } = await params;
    const body = await req.json();
    const { sponsor_id, ...updates } = body;
    if (!sponsor_id) return NextResponse.json({ success: false, error: '缺少sponsor_id' }, { status: 400 });
    const parsed = updateSchema.safeParse(updates);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
    const sponsor = updateDemoSponsor(sponsor_id, parsed.data as Partial<Sponsor>);
    if (!sponsor) return NextResponse.json({ success: false, error: '赞助商不存在' }, { status: 404 });
    await writeAuditLog(req, user, 'sponsor.update', 'sponsor', sponsor_id, updates);
    return NextResponse.json({ success: true, data: sponsor });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const sponsorId = searchParams.get('sponsor_id') || '';
    const deleted = deleteDemoSponsor(sponsorId);
    if (!deleted) return NextResponse.json({ success: false, error: '赞助商不存在' }, { status: 404 });
    await writeAuditLog(req, user, 'sponsor.delete', 'sponsor', sponsorId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
