'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, Phone, Mail, Tag, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { SponsorRosterEntry } from '@/types/roster';
import { SPONSOR_LEVEL_LABELS, SPONSOR_BENEFIT_LABELS } from '@/types/sponsor';
import type { SponsorLevel, SponsorBenefit } from '@/types/sponsor';

const CONTRACT_COLORS: Record<string, string> = { draft: 'bg-gray-100', signed: 'bg-green-100 text-green-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', pending: 'bg-yellow-100 text-yellow-700' };
const PAYMENT_COLORS: Record<string, string> = { unpaid: 'bg-red-100 text-red-700', partial: 'bg-yellow-100 text-yellow-700', paid: 'bg-green-100 text-green-700', waived: 'bg-gray-100' };

export default function SponsorsRosterPanel({ eventId }: { eventId: string }) {
  const [sponsors, setSponsors] = useState<SponsorRosterEntry[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/roster?event_id=${eventId}&type=sponsors`).then((r) => r.json()).then((json) => {
      if (json.success) setSponsors(json.data);
    });
  }, [eventId]);

  const totalAmount = sponsors.reduce((s, sp) => s + sp.amount, 0);
  const totalGuestSlots = sponsors.reduce((s, sp) => s + sp.guest_slots, 0);
  const paidCount = sponsors.filter((sp) => sp.payment_status === 'paid').length;

  if (sponsors.length === 0) {
    return (
      <div className="space-y-4">
        <Card><CardContent className="py-8 text-center text-muted-foreground">暂无赞助商数据。请在活动详情页中关联赞助商。</CardContent></Card>
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={() => router.push(`/events/${eventId}/sponsors`)}>
            <ExternalLink className="mr-1 h-4 w-4" />前往赞助商管理
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-amber-50 border-0"><CardContent className="py-3 px-4"><p className="text-sm text-muted-foreground">赞助总额</p><p className="text-xl font-bold tabular-nums">¥{totalAmount.toLocaleString()}</p></CardContent></Card>
        <Card className="bg-blue-50 border-0"><CardContent className="py-3 px-4"><p className="text-sm text-muted-foreground">赞助商数</p><p className="text-xl font-bold">{sponsors.length}</p></CardContent></Card>
        <Card className="bg-green-50 border-0"><CardContent className="py-3 px-4"><p className="text-sm text-muted-foreground">嘉宾名额</p><p className="text-xl font-bold">{totalGuestSlots}</p></CardContent></Card>
        <Card className="bg-purple-50 border-0"><CardContent className="py-3 px-4"><p className="text-sm text-muted-foreground">已付款</p><p className="text-xl font-bold">{paidCount}/{sponsors.length}</p></CardContent></Card>
      </div>

      {/* Sponsor cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sponsors.map((sp) => (
          <Card key={sp.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={sp.logo_url || undefined} />
                  <AvatarFallback className="bg-amber-100 text-amber-700"><Building2 className="h-5 w-5" /></AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{sp.name}</span>
                    <Badge variant="outline" className="text-[10px]">{sp.level_label}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>¥{sp.amount.toLocaleString()}</span>
                    <span>·</span>
                    <Badge className={`text-[10px] ${CONTRACT_COLORS[sp.contract_status] || ''}`}>{sp.contract_status}</Badge>
                    <Badge className={`text-[10px] ${PAYMENT_COLORS[sp.payment_status] || ''}`}>{sp.payment_status}</Badge>
                  </div>
                  {sp.contact_name && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{sp.contact_name}</span>
                      {sp.contact_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{sp.contact_phone}</span>}
                    </div>
                  )}
                  {sp.benefits.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {sp.benefits.map((b) => (
                        <Badge key={b} variant="secondary" className="text-[10px]">{SPONSOR_BENEFIT_LABELS[b as SponsorBenefit] || b}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span>{sp.guest_slots}嘉宾名额</span>
                    <span>{sp.vip_seats}VIP座</span>
                    {sp.booth_number && <span>展位: {sp.booth_number}</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button variant="outline" size="sm" onClick={() => router.push(`/events/${eventId}/sponsors`)}>
          <ExternalLink className="mr-1 h-4 w-4" />管理赞助商
        </Button>
      </div>
    </div>
  );
}
