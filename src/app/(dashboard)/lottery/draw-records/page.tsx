'use client';

// 大屏抽奖系统 - 抽奖记录
//
// 历史中奖记录查询、弃奖、补位、导出。

import { useCallback, useEffect, useState } from 'react';
/* XLSX loaded dynamically on export */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { History, Download, XCircle, RotateCcw } from 'lucide-react';
import { LotteryAdminShell } from '@/components/lottery/admin-shell';
import { useLotteryEvent } from '@/hooks/use-lottery-event';
import { getAllDrawRecords, getAllPrizes } from '@/lib/lottery/db';
import { abandonWinner, replaceWinner } from '@/lib/lottery/actions';
import { levelName } from '@/lib/lottery/theme';
import type { DrawRecord, Prize } from '@/lib/lottery/db/types';

export default function DrawRecordsPage() {
  const { events, eventId, setEventId } = useLotteryEvent();
  const [records, setRecords] = useState<DrawRecord[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [filterPrize, setFilterPrize] = useState('all');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!eventId) return;
    const [r, p] = await Promise.all([getAllDrawRecords(eventId), getAllPrizes(eventId)]);
    setRecords(r);
    setPrizes(p);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const abandon = async (id: string) => {
    if (!confirm('确认弃奖？该名额将释放，可重新抽取或补位。')) return;
    await abandonWinner(eventId, id);
    await load();
  };

  const replace = async (id: string) => {
    setMessage('');
    const result = await replaceWinner(eventId, id);
    setMessage(result ? `已补位：${result.name}` : '补位失败，没有可补位的候选人');
    await load();
  };

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const data = records.map((r) => ({
      奖项: r.prizeName,
      等级: levelName(r.prizeLevel),
      中奖人: r.attendeeName,
      公司: r.attendeeCompany,
      桌号: r.attendeeTableNumber,
      中奖时间: new Date(r.drawTime).toLocaleString('zh-CN'),
      状态: r.isAbandoned ? '已弃奖' : '有效',
      补位: r.replacedByName || '',
      锁定中奖: r.isLocked ? '是' : '否',
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, '中奖记录');
    XLSX.writeFile(workbook, `中奖记录_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filtered = records.filter((r) => filterPrize === 'all' || r.prizeId === filterPrize);
  const validCount = records.filter((r) => !r.isAbandoned).length;
  const abandonedCount = records.filter((r) => r.isAbandoned).length;

  return (
    <LotteryAdminShell
      title="抽奖记录"
      description="弃奖 · 补位 · 导出"
      events={events}
      eventId={eventId}
      onEventChange={setEventId}
      actions={
        <Button variant="outline" onClick={exportExcel} disabled={records.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          导出中奖名单
        </Button>
      }
    >
      {message && (
        <Card className="border-primary/30">
          <CardContent className="py-3 text-sm">{message}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-3xl font-bold">{records.length}</p><p className="text-sm text-muted-foreground">总记录</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-3xl font-bold text-green-500">{validCount}</p><p className="text-sm text-muted-foreground">有效中奖</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-3xl font-bold text-red-500">{abandonedCount}</p><p className="text-sm text-muted-foreground">已弃奖</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              中奖记录
            </CardTitle>
            <Select value={filterPrize} onValueChange={setFilterPrize}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部奖项</SelectItem>
                {prizes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>奖项</TableHead>
                <TableHead>中奖人</TableHead>
                <TableHead>公司</TableHead>
                <TableHead>桌号</TableHead>
                <TableHead>时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className={r.isAbandoned ? 'opacity-60' : ''}>
                  <TableCell>
                    <Badge variant="outline">{levelName(r.prizeLevel)}</Badge>
                    <span className="ml-2">{r.prizeName}</span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {r.attendeeName}
                    {r.isLocked && <Badge className="ml-2 bg-purple-500/80">锁定</Badge>}
                  </TableCell>
                  <TableCell>{r.attendeeCompany || '-'}</TableCell>
                  <TableCell>{r.attendeeTableNumber || '-'}</TableCell>
                  <TableCell className="text-sm">{new Date(r.drawTime).toLocaleString('zh-CN')}</TableCell>
                  <TableCell>
                    {r.isAbandoned ? (
                      <div>
                        <Badge variant="destructive">已弃奖</Badge>
                        {r.replacedByName && <p className="mt-1 text-xs text-muted-foreground">补位：{r.replacedByName}</p>}
                      </div>
                    ) : (
                      <Badge className="bg-green-500">有效</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!r.isAbandoned && (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => void abandon(r.id)}>
                          <XCircle className="mr-1 h-3 w-3" />
                          弃奖
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void replace(r.id)}>
                          <RotateCcw className="mr-1 h-3 w-3" />
                          补位
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    暂无中奖记录
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </LotteryAdminShell>
  );
}
