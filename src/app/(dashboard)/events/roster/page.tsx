'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserCog, Star, UserCheck, Building2, ArrowRight, ListOrdered } from 'lucide-react';

type EventOption = { id: string; name: string; status: string };
type RosterOverview = { event_id: string; exec_team: number; guests: number; sponsors: number; attendees: number; total: number };

export default function RosterOverviewPage() {
  const [events, setEvents] = useState<(EventOption & { roster: RosterOverview })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const er = await fetch('/api/events?limit=100');
      const ej = await er.json();
      const list: EventOption[] = ej.data || [];
      const enriched = await Promise.all(list.map(async (ev) => {
        const rr = await fetch(`/api/roster?event_id=${ev.id}&type=stats`);
        const rj = await rr.json();
        return { ...ev, roster: rj.success ? rj.data : { event_id: ev.id, exec_team: 0, guests: 0, sponsors: 0, attendees: 0, total: 0 } };
      }));
      setEvents(enriched);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground">加载中...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ListOrdered className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">名单管理</h1>
          <p className="text-muted-foreground">管理所有活动的执行小组、嘉宾、赞助商和参会人名单</p>
        </div>
      </div>

      {events.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">暂无活动，请先创建活动。</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {events.map((ev) => (
            <Card key={ev.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold">{ev.name}</h3>
                      <Badge variant="outline">{ev.status}</Badge>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">总计</span>
                        <span className="font-bold tabular-nums">{ev.roster.total}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <UserCog className="h-4 w-4 text-green-500" />
                        <span className="text-muted-foreground">执行小组</span>
                        <span className="font-bold tabular-nums">{ev.roster.exec_team}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-purple-500" />
                        <span className="text-muted-foreground">嘉宾</span>
                        <span className="font-bold tabular-nums">{ev.roster.guests}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-amber-500" />
                        <span className="text-muted-foreground">赞助商</span>
                        <span className="font-bold tabular-nums">{ev.roster.sponsors}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <UserCheck className="h-4 w-4 text-sky-500" />
                        <span className="text-muted-foreground">参会人</span>
                        <span className="font-bold tabular-nums">{ev.roster.attendees}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/events/${ev.id}/roster`}>
                    <Button variant="outline" size="sm">
                      管理名单 <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
