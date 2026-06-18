// 签到系统 Supabase 后端。
// 当 COZE_SUPABASE_URL / COZE_SUPABASE_ANON_KEY 配置就绪时由 db.ts 启用。

import { getSupabaseClient } from '@/lib/checkin/supabase-client';
import type {
  GuestRow,
  CheckInLogRow,
  RawCheckInLog,
  GuestInput,
  GuestUpdate,
  CheckinBackup,
} from './schema';

function generateQRCode(): string {
  return `EVT${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

interface GuestDB {
  id: string;
  name: string;
  phone: string | null;
  organization: string | null;
  guest_type: string;
  table_number: string | null;
  qr_code: string;
  check_in_status: number;
  check_in_time: string | null;
  created_at: string;
  updated_at: string;
}

function toGuest(db: GuestDB): GuestRow {
  return {
    id: db.id,
    name: db.name,
    phone: db.phone,
    organization: db.organization,
    guestType: db.guest_type,
    tableNumber: db.table_number,
    qrCode: db.qr_code,
    checkInStatus: db.check_in_status,
    checkInTime: db.check_in_time,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// ==================== 嘉宾操作 ====================

export async function getAllGuests(): Promise<GuestRow[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('guests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as GuestDB[] || []).map(toGuest);
}

export async function getGuestByQrCode(qrCode: string): Promise<GuestRow | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('guests')
    .select('*')
    .eq('qr_code', qrCode)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data ? toGuest(data as GuestDB) : null;
}

export async function getGuestById(id: string): Promise<GuestRow | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('guests')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data ? toGuest(data as GuestDB) : null;
}

export async function searchGuests(keyword: string): Promise<GuestRow[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('guests')
    .select('*')
    .or(`name.ilike.%${keyword}%,phone.ilike.%${keyword}%,organization.ilike.%${keyword}%`)
    .limit(20);
  if (error) throw new Error(error.message);
  return (data as GuestDB[] || []).map(toGuest);
}

export async function createGuest(guest: GuestInput): Promise<GuestRow> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('guests')
    .insert({
      name: guest.name,
      phone: guest.phone || null,
      organization: guest.organization || null,
      guest_type: guest.guestType || '普通嘉宾',
      table_number: guest.tableNumber || null,
      qr_code: guest.qrCode || generateQRCode(),
      check_in_status: 0,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return toGuest(data as GuestDB);
}

export async function createGuestsBatch(guests: GuestInput[]): Promise<GuestRow[]> {
  if (guests.length === 0) return [];
  const client = getSupabaseClient();
  const payload = guests.map((g) => ({
    name: g.name,
    phone: g.phone || null,
    organization: g.organization || null,
    guest_type: g.guestType || '普通嘉宾',
    table_number: g.tableNumber || null,
    qr_code: g.qrCode || generateQRCode(),
    check_in_status: 0,
  }));
  const { data, error } = await client.from('guests').insert(payload).select();
  if (error) throw new Error(error.message);
  return (data as GuestDB[] || []).map(toGuest);
}

export async function updateGuest(id: string, guest: GuestUpdate): Promise<GuestRow | null> {
  const client = getSupabaseClient();
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (guest.name !== undefined) updateData.name = guest.name;
  if (guest.phone !== undefined) updateData.phone = guest.phone || null;
  if (guest.organization !== undefined) updateData.organization = guest.organization || null;
  if (guest.guestType !== undefined) updateData.guest_type = guest.guestType;
  if (guest.tableNumber !== undefined) updateData.table_number = guest.tableNumber || null;
  if (guest.qrCode !== undefined && guest.qrCode) updateData.qr_code = guest.qrCode;

  const { data, error } = await client
    .from('guests')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data ? toGuest(data as GuestDB) : null;
}

export async function batchUpdateGuests(
  ids: string[],
  data: { guestType?: string; tableNumber?: string },
): Promise<number> {
  const client = getSupabaseClient();
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.guestType) updateData.guest_type = data.guestType;
  if (data.tableNumber !== undefined) updateData.table_number = data.tableNumber || null;

  const { data: result, error } = await client
    .from('guests')
    .update(updateData)
    .in('id', ids)
    .select('id');
  if (error) throw new Error(error.message);
  return result?.length || 0;
}

export async function deleteGuest(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from('guests').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ==================== 签到操作 ====================

export async function checkIn(
  guestId: string,
  terminalId: string = 'default',
  operator: string = 'system',
): Promise<GuestRow> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();

  // 条件更新（原子防并发）：仅当 check_in_status = 0 时才更新成功。
  const { data, error } = await client
    .from('guests')
    .update({ check_in_status: 1, check_in_time: now, updated_at: now })
    .eq('id', guestId)
    .eq('check_in_status', 0)
    .select()
    .single();

  if (error || !data) {
    const existing = await getGuestById(guestId);
    if (!existing) throw new Error('嘉宾不存在');
    throw new Error('该嘉宾已签到');
  }

  await client.from('check_in_logs').insert({
    guest_id: guestId,
    check_in_time: now,
    terminal_id: terminalId,
    operator,
    sync_status: 1,
  });

  return toGuest(data as GuestDB);
}

export async function clearAllCheckIns(): Promise<{ cleared: number; logsDeleted: number }> {
  const client = getSupabaseClient();
  const { data: checkedGuests } = await client
    .from('guests')
    .select('id')
    .eq('check_in_status', 1);
  const cleared = checkedGuests?.length || 0;

  await client
    .from('guests')
    .update({ check_in_status: 0, check_in_time: null, updated_at: new Date().toISOString() })
    .eq('check_in_status', 1);

  const { data: deletedLogs } = await client.from('check_in_logs').delete().select('id');
  return { cleared, logsDeleted: deletedLogs?.length || 0 };
}

export async function clearAllData(): Promise<void> {
  const client = getSupabaseClient();
  await client.from('check_in_logs').delete().neq('id', '');
  await client.from('guests').delete().neq('id', '');
}

// ==================== 统计操作 ====================

export async function getStats(): Promise<{
  total: number;
  checkedIn: number;
  notCheckedIn: number;
  checkInRate: number;
  byType: Record<string, number>;
  byTypeChecked: Record<string, number>;
}> {
  const guests = await getAllGuests();
  const total = guests.length;
  const checkedIn = guests.filter((g) => g.checkInStatus === 1).length;
  const notCheckedIn = total - checkedIn;
  const checkInRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  const byType: Record<string, number> = {};
  const byTypeChecked: Record<string, number> = {};
  guests.forEach((g) => {
    byType[g.guestType] = (byType[g.guestType] || 0) + 1;
    if (g.checkInStatus === 1) {
      byTypeChecked[g.guestType] = (byTypeChecked[g.guestType] || 0) + 1;
    }
  });

  return { total, checkedIn, notCheckedIn, checkInRate, byType, byTypeChecked };
}

interface CheckInLogDB {
  id: string;
  guest_id: string;
  check_in_time: string;
  terminal_id: string | null;
  operator: string | null;
  sync_status: number;
}

async function joinLogs(logs: CheckInLogDB[]): Promise<CheckInLogRow[]> {
  if (!logs || logs.length === 0) return [];
  const client = getSupabaseClient();
  const guestIds = [...new Set(logs.map((l) => l.guest_id))];
  const { data: guestsData } = await client
    .from('guests')
    .select('id, name, organization, guest_type, table_number')
    .in('id', guestIds);
  const guestMap = new Map((guestsData || []).map((g) => [g.id, g]));
  return logs.map((log) => {
    const guest = guestMap.get(log.guest_id) as
      | { name: string; organization: string | null; guest_type: string; table_number: string | null }
      | undefined;
    return {
      id: log.id,
      guestId: log.guest_id,
      guestName: guest?.name || '未知',
      organization: guest?.organization ?? null,
      guestType: guest?.guest_type || '未知',
      tableNumber: guest?.table_number ?? null,
      checkInTime: log.check_in_time,
      terminalId: log.terminal_id || 'default',
      operator: log.operator || 'system',
    };
  });
}

export async function getCheckInLogs(limit: number = 50): Promise<CheckInLogRow[]> {
  const client = getSupabaseClient();
  const { data: logs, error } = await client
    .from('check_in_logs')
    .select('*')
    .order('check_in_time', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return joinLogs((logs as CheckInLogDB[]) || []);
}

export async function getAllCheckInLogs(): Promise<CheckInLogRow[]> {
  const client = getSupabaseClient();
  const { data: logs, error } = await client
    .from('check_in_logs')
    .select('*')
    .order('check_in_time', { ascending: false });
  if (error) throw new Error(error.message);
  return joinLogs((logs as CheckInLogDB[]) || []);
}

export async function getRawCheckInLogs(): Promise<RawCheckInLog[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('check_in_logs').select('*');
  if (error) throw new Error(error.message);
  return ((data as CheckInLogDB[]) || []).map((l) => ({
    id: l.id,
    guestId: l.guest_id,
    checkInTime: l.check_in_time,
    terminalId: l.terminal_id,
    operator: l.operator,
    syncStatus: l.sync_status,
  }));
}

export async function restoreData(
  backup: Pick<CheckinBackup, 'guests' | 'checkInLogs'>,
  mode: 'merge' | 'replace',
): Promise<{ guestsImported: number; guestsSkipped: number; logsImported: number; logsSkipped: number }> {
  const client = getSupabaseClient();
  if (mode === 'replace') {
    await clearAllData();
  }

  const existing = await getAllGuests();
  const existingQr = new Set(existing.map((g) => g.qrCode));

  const toInsert = (backup.guests || []).filter((g) => !existingQr.has(g.qrCode));
  const guestsSkipped = (backup.guests || []).length - toInsert.length;

  if (toInsert.length > 0) {
    await client.from('guests').insert(
      toInsert.map((g) => ({
        id: g.id,
        name: g.name,
        phone: g.phone,
        organization: g.organization,
        guest_type: g.guestType,
        table_number: g.tableNumber,
        qr_code: g.qrCode,
        check_in_status: g.checkInStatus,
        check_in_time: g.checkInTime,
      })),
    );
  }

  let logsImported = 0;
  if ((backup.checkInLogs || []).length > 0) {
    const { error } = await client.from('check_in_logs').insert(
      (backup.checkInLogs || []).map((l) => ({
        id: l.id,
        guest_id: l.guestId,
        check_in_time: l.checkInTime,
        terminal_id: l.terminalId,
        operator: l.operator,
        sync_status: l.syncStatus,
      })),
    );
    if (!error) logsImported = (backup.checkInLogs || []).length;
  }

  return {
    guestsImported: toInsert.length,
    guestsSkipped,
    logsImported,
    logsSkipped: (backup.checkInLogs || []).length - logsImported,
  };
}
