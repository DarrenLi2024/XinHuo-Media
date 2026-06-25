'use client';

// 抽奖系统 - 参会人员（数据来自名单管理 roster，刷新即同步）
import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, RefreshCw, Search } from 'lucide-react';
import { LotteryAdminShell } from '@/components/lottery/admin-shell';
import { useLotteryEvent } from '@/hooks/use-lottery-event';
/* XLSX loaded dynamically on export */

type RosterAttendee = {
  id: string; name: string; phone?: string; company?: string; position?: string;
  checkin_status: string; checkin_time?: string; lottery_eligible: boolean;
  is_member: boolean; attend_dinner: boolean; tags: string[];
  table_id?: string; seat_number?: string;
};

type DisplayAttendee = RosterAttendee & { isBlacklisted: boolean; hasWon: boolean; prizeName: string };

export default function AttendeesPage() {
  const { events, eventId, setEventId } = useLotteryEvent();
  const [attendees, setAttendees] = useState<DisplayAttendee[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 黑名单 + 中奖状态 存储在本地（抽奖系统专有逻辑）
  const [blacklist, setBlacklist] = useState<Set<string>>(new Set());
  const [wonMap, setWonMap] = useState<Record<string, string>>({});

  const loadFromRoster = useCallback(async () => {
    if (!eventId) return;
    setLoading(true); setMessage('');
    try {
      const res = await fetch(`/api/roster?event_id=${eventId}&type=attendees`);
      const json = await res.json();
      if (json.success) {
        const data = (json.data || []).map((a: RosterAttendee) => ({
          ...a,
          isBlacklisted: blacklist.has(a.id),
          hasWon: Boolean(wonMap[a.id]),
          prizeName: wonMap[a.id] || '',
        }));
        setAttendees(data);
        setMessage(`已同步 ${data.length} 人 · 已签到 ${data.filter((a: DisplayAttendee) => a.checkin_status === 'checked_in').length}`);
      }
    } catch { setMessage('同步失败'); }
    setLoading(false);
  }, [eventId, blacklist, wonMap]);

  useEffect(() => { loadFromRoster(); }, [loadFromRoster]);

  const toggleBlacklist = (id: string) => {
    setBlacklist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const data = attendees.map((a) => ({
      姓名: a.name, 公司: a.company || '', 手机: a.phone || '',
      签到状态: a.checkin_status === 'checked_in' ? '已签到' : '未签到',
      黑名单: a.isBlacklisted ? '是' : '否', 中奖: a.hasWon ? a.prizeName : '',
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, '参会人员');
    XLSX.writeFile(wb, `参会人员_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filtered = attendees.filter((a) =>
    !keyword || a.name.includes(keyword) || (a.company && a.company.includes(keyword)),
  );

  return (
    <LotteryAdminShell
      title="参会人员"
      description={`名单管理同步 · ${attendees.length} 人`}
      events={events}
      eventId={eventId}
      onEventChange={setEventId}
      actions={
        <Button variant="outline" onClick={loadFromRoster} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新名单
        </Button>
      }
    >
      {message && <Card className="border-primary/30"><CardContent className="py-3 text-sm">{message}</CardContent></Card>}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>抽奖名单（{attendees.length}）</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索姓名/公司" className="w-56 pl-8" />
              </div>
              <Button variant="outline" size="sm" onClick={exportExcel} disabled={attendees.length === 0}>
                <Download className="mr-2 h-4 w-4" />导出
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>公司</TableHead>
                <TableHead>签到</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>黑名单</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id} className={a.isBlacklisted ? 'opacity-60' : ''}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.company || '-'}</TableCell>
                  <TableCell>
                    {a.checkin_status === 'checked_in'
                      ? <Badge className="bg-green-500">{new Date(a.checkin_time || '').toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) || '已签到'}</Badge>
                      : <Badge variant="secondary">未签到</Badge>}
                  </TableCell>
                  <TableCell>
                    {a.hasWon ? <Badge className="bg-amber-500">中奖: {a.prizeName}</Badge> : <Badge variant="outline">候选</Badge>}
                  </TableCell>
                  <TableCell><Switch checked={a.isBlacklisted} onCheckedChange={() => toggleBlacklist(a.id)} /></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">暂无数据，请点击「刷新名单」从名单管理同步</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </LotteryAdminShell>
  );
}
