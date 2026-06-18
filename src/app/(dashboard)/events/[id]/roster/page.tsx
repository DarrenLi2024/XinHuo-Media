'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, UserCog, Star, UserCheck, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RosterStats } from '@/types/roster';
import ExecTeamPanel from './exec-team-panel';
import GuestsPanel from './guests-panel';
import SponsorsRosterPanel from './sponsors-roster-panel';
import AttendeesPanel from './attendees-panel';

export default function RosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const router = useRouter();
  const [stats, setStats] = useState<RosterStats | null>(null);
  const [activeTab, setActiveTab] = useState('exec');

  useEffect(() => {
    fetch(`/api/roster?event_id=${eventId}&type=stats`).then((r) => r.json()).then((json) => {
      if (json.success) setStats(json.data);
    });
  }, [eventId]);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/events/${eventId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">名单管理</h1>
          <p className="text-sm text-muted-foreground">管理活动相关的全部人员名单</p>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-5 gap-3">
          <Card className="bg-blue-50 border-0"><CardContent className="py-3 px-4 flex items-center gap-3"><Users className="h-5 w-5 text-blue-500" /><div><p className="text-xl font-bold tabular-nums">{stats.total}</p><p className="text-xs text-muted-foreground">总人数</p></div></CardContent></Card>
          <Card className="bg-green-50 border-0"><CardContent className="py-3 px-4 flex items-center gap-3"><UserCog className="h-5 w-5 text-green-500" /><div><p className="text-xl font-bold tabular-nums">{stats.exec_team}</p><p className="text-xs text-muted-foreground">执行小组</p></div></CardContent></Card>
          <Card className="bg-purple-50 border-0"><CardContent className="py-3 px-4 flex items-center gap-3"><Star className="h-5 w-5 text-purple-500" /><div><p className="text-xl font-bold tabular-nums">{stats.guests}</p><p className="text-xs text-muted-foreground">嘉宾</p><p className="text-[10px] text-muted-foreground">{stats.guest_confirmed}已确认</p></div></CardContent></Card>
          <Card className="bg-amber-50 border-0"><CardContent className="py-3 px-4 flex items-center gap-3"><Building2 className="h-5 w-5 text-amber-500" /><div><p className="text-xl font-bold tabular-nums">{stats.sponsors}</p><p className="text-xs text-muted-foreground">赞助商</p><p className="text-[10px] text-muted-foreground">¥{(stats.sponsor_total_amount || 0).toLocaleString()}</p></div></CardContent></Card>
          <Card className="bg-sky-50 border-0"><CardContent className="py-3 px-4 flex items-center gap-3"><UserCheck className="h-5 w-5 text-sky-500" /><div><p className="text-xl font-bold tabular-nums">{stats.attendees}</p><p className="text-xs text-muted-foreground">参会人</p><p className="text-[10px] text-muted-foreground">{stats.attendee_checked_in}已签到</p></div></CardContent></Card>
        </div>
      )}

      <Card>
        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="exec" className="flex-1"><UserCog className="mr-2 h-4 w-4" />执行小组 {stats ? <Badge variant="secondary" className="ml-1 text-[10px]">{stats.exec_team}</Badge> : null}</TabsTrigger>
              <TabsTrigger value="guests" className="flex-1"><Star className="mr-2 h-4 w-4" />嘉宾名单 {stats ? <Badge variant="secondary" className="ml-1 text-[10px]">{stats.guests}</Badge> : null}</TabsTrigger>
              <TabsTrigger value="sponsors" className="flex-1"><Building2 className="mr-2 h-4 w-4" />赞助商名单 {stats ? <Badge variant="secondary" className="ml-1 text-[10px]">{stats.sponsors}</Badge> : null}</TabsTrigger>
              <TabsTrigger value="attendees" className="flex-1"><Users className="mr-2 h-4 w-4" />参会名单 {stats ? <Badge variant="secondary" className="ml-1 text-[10px]">{stats.attendees}</Badge> : null}</TabsTrigger>
            </TabsList>
            <TabsContent value="exec" className="pt-4"><ExecTeamPanel eventId={eventId} /></TabsContent>
            <TabsContent value="guests" className="pt-4"><GuestsPanel eventId={eventId} /></TabsContent>
            <TabsContent value="sponsors" className="pt-4"><SponsorsRosterPanel eventId={eventId} /></TabsContent>
            <TabsContent value="attendees" className="pt-4"><AttendeesPanel eventId={eventId} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
