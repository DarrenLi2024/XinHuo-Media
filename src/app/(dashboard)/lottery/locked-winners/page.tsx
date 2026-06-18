'use client';

// 大屏抽奖系统 - 锁定中奖管理（仅超级管理员）
//
// 围栏保护：锁定人员不参与常规抽奖池，仅在生效时间窗口内通过锁定机制中奖。

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, Trash2, Lock, AlertTriangle } from 'lucide-react';
import { LotteryAdminShell } from '@/components/lottery/admin-shell';
import { useLotteryEvent } from '@/hooks/use-lottery-event';
import { useUserStore } from '@/store';
import {
  getAllPrizes,
  getAllAttendees,
  getAllLockedWinners,
  createLockedWinner,
  deleteLockedWinner,
} from '@/lib/lottery/db';
import { levelName } from '@/lib/lottery/theme';
import { broadcastLotteryChange } from '@/lib/lottery/sync';
import type { Prize, Attendee, LockedWinner } from '@/lib/lottery/db/types';

export default function LockedWinnersPage() {
  const { events, eventId, setEventId } = useLotteryEvent();
  const { user } = useUserStore();
  const isSuperAdmin = user?.role === 'super_admin';

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [locked, setLocked] = useState<LockedWinner[]>([]);
  const [prizeId, setPrizeId] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!eventId) return;
    const [p, a, l] = await Promise.all([
      getAllPrizes(eventId),
      getAllAttendees(eventId),
      getAllLockedWinners(eventId),
    ]);
    setPrizes(p);
    setAttendees(a);
    setLocked(l);
    setPrizeId((prev) => prev || p[0]?.id || '');
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const lockedCountByPrize = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of locked) map.set(l.prizeId, (map.get(l.prizeId) || 0) + 1);
    return map;
  }, [locked]);

  const create = async () => {
    setError('');
    if (!eventId || !prizeId || !name.trim()) {
      setError('请选择奖项并填写锁定人员姓名');
      return;
    }
    const prize = prizes.find((p) => p.id === prizeId);
    if (prize && (lockedCountByPrize.get(prizeId) || 0) >= prize.quantity) {
      setError(`该奖项锁定人数已达上限（${prize.quantity}）`);
      return;
    }
    if (start && end && new Date(start) > new Date(end)) {
      setError('生效开始时间不能晚于结束时间');
      return;
    }
    await createLockedWinner(eventId, {
      prizeId,
      attendeeName: name.trim(),
      company: company.trim(),
      effectStartTime: start ? new Date(start).toISOString() : '',
      effectEndTime: end ? new Date(end).toISOString() : '',
    });
    broadcastLotteryChange(eventId, 'lockedWinners');
    setName('');
    setCompany('');
    setStart('');
    setEnd('');
    await load();
  };

  const remove = async (id: string) => {
    await deleteLockedWinner(id);
    broadcastLotteryChange(eventId, 'lockedWinners');
    await load();
  };

  return (
    <LotteryAdminShell
      title="锁定中奖"
      description="预设必中人员 · 生效时间窗口 · 围栏保护"
      events={events}
      eventId={eventId}
      onEventChange={setEventId}
    >
      {!isSuperAdmin ? (
        <Card className="border-amber-500/40">
          <CardContent className="flex items-center gap-3 py-8 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <p className="font-medium">需要超级管理员权限</p>
              <p className="text-sm text-muted-foreground">锁定中奖名单仅超级管理员可见与管理，请联系系统管理员。</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                新增锁定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>奖项</Label>
                  <Select value={prizeId} onValueChange={setPrizeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择奖项" />
                    </SelectTrigger>
                    <SelectContent>
                      {prizes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {levelName(p.level)} · {p.name}（已锁 {lockedCountByPrize.get(p.id) || 0}/{p.quantity}）
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>锁定人员姓名</Label>
                  <Input
                    list="attendee-names"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      const match = attendees.find((a) => a.name === e.target.value);
                      if (match) setCompany(match.company);
                    }}
                    placeholder="输入或选择姓名"
                  />
                  <datalist id="attendee-names">
                    {attendees.map((a) => (
                      <option key={a.id} value={a.name}>
                        {a.company}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label>公司（辅助显示）</Label>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>生效开始</Label>
                    <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>生效结束</Label>
                    <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                提示：生效时间留空表示「不限」。锁定人员无论是否在生效时间，都不会出现在常规抽奖池中。
              </p>
              <Button onClick={() => void create()}>
                <Shield className="mr-2 h-4 w-4" />
                添加锁定
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>锁定名单（{locked.length}）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {locked.map((l) => {
                  const prize = prizes.find((p) => p.id === l.prizeId);
                  const matched = attendees.some((a) => a.name === l.attendeeName);
                  return (
                    <div key={l.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{l.attendeeName}</span>
                          {prize && <Badge>{levelName(prize.level)} · {prize.name}</Badge>}
                          {!matched && <Badge variant="destructive">名单中无此人</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{l.company || '-'}</p>
                        {(l.effectStartTime || l.effectEndTime) && (
                          <p className="text-xs text-muted-foreground">
                            {l.effectStartTime ? new Date(l.effectStartTime).toLocaleString('zh-CN') : '不限'} ~{' '}
                            {l.effectEndTime ? new Date(l.effectEndTime).toLocaleString('zh-CN') : '不限'}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => void remove(l.id)}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  );
                })}
                {locked.length === 0 && <p className="text-sm text-muted-foreground">暂无锁定名单</p>}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </LotteryAdminShell>
  );
}
