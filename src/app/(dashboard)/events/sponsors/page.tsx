'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Handshake, ArrowRight } from 'lucide-react';

type EventOption = { id: string; name: string; status: string };
type SponsorSummary = { event_id: string; count: number; total_amount: number; sponsors: { name: string; level_label: string; amount: number }[] };

export default function SponsorOverviewPage() {
  const [events, setEvents] = useState<(EventOption & { sponsorInfo: SponsorSummary })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const er = await fetch('/api/events?limit=100');
      const ej = await er.json();
      const list: EventOption[] = ej.data || [];
      const enriched = await Promise.all(list.map(async (ev) => {
        const sr = await fetch(`/api/roster?event_id=${ev.id}&type=sponsors`);
        const sj = await sr.json();
        const sponsors = sj.success ? sj.data : [];
        return {
          ...ev,
          sponsorInfo: {
            event_id: ev.id,
            count: sponsors.length,
            total_amount: sponsors.reduce((s: number, sp: { amount: number }) => s + (sp.amount || 0), 0),
            sponsors,
          },
        };
      }));
      setEvents(enriched);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground">加载中...</div>;

  const grandTotal = events.reduce((s, ev) => s + ev.sponsorInfo.total_amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Handshake className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">赞助商管理</h1>
          <p className="text-muted-foreground">赞助总额 ¥{grandTotal.toLocaleString()} · {events.reduce((s, ev) => s + ev.sponsorInfo.count, 0)} 家赞助商</p>
        </div>
      </div>

      {events.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">暂无活动。</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {events.map((ev) => (
            <Card key={ev.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{ev.name}</h3>
                      <Badge variant="outline">{ev.status}</Badge>
                      {ev.sponsorInfo.count > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {ev.sponsorInfo.count} 家赞助商 · 总额 ¥{ev.sponsorInfo.total_amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {ev.sponsorInfo.sponsors.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {ev.sponsorInfo.sponsors.map((sp, idx) => (
                          <Badge key={idx} variant="secondary">
                            {sp.name} ({sp.level_label}) ¥{sp.amount.toLocaleString()}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">暂无赞助商</p>
                    )}
                  </div>
                  <Link href={`/events/${ev.id}/sponsors`}>
                    <Button variant="outline" size="sm">
                      管理赞助商 <ArrowRight className="ml-1 h-4 w-4" />
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
