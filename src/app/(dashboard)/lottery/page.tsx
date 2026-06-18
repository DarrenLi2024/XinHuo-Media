'use client';

// 大屏抽奖系统 - 后台总览
//
// 离线 IndexedDB 数据（按平台活动隔离），支持从平台活动一键导入参会人员。

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Users, Trophy, Shield, Download, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { LotteryAdminShell } from '@/components/lottery/admin-shell';
import { useLotteryEvent } from '@/hooks/use-lottery-event';
import {
  getAllAttendees,
  getAllPrizes,
  getAllLockedWinners,
  getAllDrawRecords,
  importAttendees,
} from '@/lib/lottery/db';
import { DrawEngine } from '@/lib/lottery/draw-engine';
import { levelName } from '@/lib/lottery/theme';
import { broadcastLotteryChange } from '@/lib/lottery/sync';
import type { Prize, DrawRecord } from '@/lib/lottery/db/types';

type PlatformGuest = { id: string; name: string; company?: string };

export default function LotteryOverviewPage() {
  const { events, eventId, setEventId } = useLotteryEvent();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [records, setRecords] = useState<DrawRecord[]>([]);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [blacklistCount, setBlacklistCount] = useState(0);
  const [lockedCount, setLockedCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!eventId) return;
    const [attendees, p, locked, r] = await Promise.all([
      getAllAttendees(eventId),
      getAllPrizes(eventId),
      getAllLockedWinners(eventId),
      getAllDrawRecords(eventId),
    ]);
    setAttendeeCount(attendees.length);
    setBlacklistCount(attendees.filter((a) => a.isBlacklisted).length);
    setPrizes(p);
    setLockedCount(locked.length);
    setRecords(r);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const importFromPlatform = useCallback(async () => {
    if (!eventId) return;
    setImporting(true);
    setMessage('');
    try {
      const response = await fetch(`/api/lottery?event_id=${eventId}`, { credentials: 'include' });
      const result: { data?: { available_guests_list?: PlatformGuest[] }; error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error || '加载平台嘉宾失败');
      const guests = result.data?.available_guests_list || [];
      if (guests.length === 0) {
        setMessage('平台该活动暂无可导入的已签到嘉宾');
        return;
      }
      const count = await importAttendees(
        eventId,
        guests.map((g) => ({ name: g.name, company: g.company ?? '' })),
      );
      broadcastLotteryChange(eventId, 'attendees');
      setMessage(`已从平台活动导入 ${count} 名参会人员`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '导入失败');
    } finally {
      setImporting(false);
    }
  }, [eventId, load]);

  const totalPrizes = prizes.reduce((sum, p) => sum + p.quantity, 0);
  const wonCount = records.filter((r) => !r.isAbandoned).length;
  const totalRemaining = prizes.reduce((sum, p) => sum + DrawEngine.getRemaining(p, records), 0);

  return (
    <LotteryAdminShell
      title="大屏抽奖"
      description="离线运行 · 锁定中奖 · 炫酷大屏 · 与平台活动打通"
      events={events}
      eventId={eventId}
      onEventChange={setEventId}
      actions={
        <Button onClick={() => void importFromPlatform()} disabled={importing}>
          <Download className="mr-2 h-4 w-4" />
          {importing ? '导入中...' : '从平台导入嘉宾'}
        </Button>
      }
    >
      {message && (
        <Card className="border-primary/30">
          <CardContent className="py-3 text-sm">{message}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Users className="h-7 w-7 text-green-500" />
            <div>
              <p className="text-3xl font-bold">{attendeeCount}</p>
              <p className="text-sm text-muted-foreground">参会人员</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Gift className="h-7 w-7 text-orange-500" />
            <div>
              <p className="text-3xl font-bold">{totalPrizes}</p>
              <p className="text-sm text-muted-foreground">奖品总数</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Trophy className="h-7 w-7 text-yellow-500" />
            <div>
              <p className="text-3xl font-bold">{wonCount}</p>
              <p className="text-sm text-muted-foreground">已中奖</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Shield className="h-7 w-7 text-purple-500" />
            <div>
              <p className="text-3xl font-bold">{blacklistCount + lockedCount}</p>
              <p className="text-sm text-muted-foreground">黑名单 / 锁定</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            奖项进度
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prizes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              暂无奖项，请前往
              <Link href={`/lottery/prizes?event=${eventId}`} className="mx-1 text-primary underline">
                奖项管理
              </Link>
              创建。
            </p>
          ) : (
            <div className="space-y-3">
              {prizes.map((p) => {
                const remaining = DrawEngine.getRemaining(p, records);
                const drawn = p.quantity - remaining;
                const pct = p.quantity > 0 ? Math.round((drawn / p.quantity) * 100) : 0;
                return (
                  <div key={p.id} className="flex items-center gap-4">
                    <Badge variant="outline" className="w-20 justify-center">{levelName(p.level)}</Badge>
                    <span className="w-40 truncate font-medium">{p.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-24 text-right text-sm text-muted-foreground">
                      {drawn}/{p.quantity}
                    </span>
                  </div>
                );
              })}
              <div className="pt-2 text-right text-sm text-muted-foreground">总剩余名额：{totalRemaining}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <QuickLink href={`/lottery/attendees?event=${eventId}`} icon={<Users className="h-5 w-5" />} title="参会人员" desc="导入、编辑、黑名单" />
        <QuickLink href={`/lottery/prizes?event=${eventId}`} icon={<Gift className="h-5 w-5" />} title="奖项管理" desc="创建、排序、配置" />
        <QuickLink href={`/lottery/locked-winners?event=${eventId}`} icon={<Shield className="h-5 w-5" />} title="锁定中奖" desc="预设中奖 + 生效时间" />
        <QuickLink href={`/lottery/draw-records?event=${eventId}`} icon={<Trophy className="h-5 w-5" />} title="抽奖记录" desc="弃奖、补位、导出" />
        <QuickLink href={`/lottery/event-info?event=${eventId}`} icon={<Sparkles className="h-5 w-5" />} title="活动信息" desc="名称、主题、LOGO" />
        <QuickLink href={`/lottery/settings?event=${eventId}`} icon={<SettingsIcon className="h-5 w-5" />} title="系统设置" desc="清空、备份、音效" />
      </div>
    </LotteryAdminShell>
  );
}

function QuickLink({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary/50 hover:bg-muted/30">
        <CardContent className="flex items-center gap-3 pt-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
