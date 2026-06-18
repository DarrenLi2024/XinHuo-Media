'use client';

// 大屏抽奖系统 - 后台子页统一外壳
//
// 提供「当前活动」选择器（与平台活动打通）、子页导航、打开大屏入口。
// 各后台子页（参会人员/奖项/锁定/记录/活动信息/设置）共用此外壳。

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Monitor } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LotteryEventOption } from '@/hooks/use-lottery-event';

const NAV = [
  { href: '/lottery', label: '总览' },
  { href: '/lottery/attendees', label: '参会人员' },
  { href: '/lottery/prizes', label: '奖项管理' },
  { href: '/lottery/locked-winners', label: '锁定中奖' },
  { href: '/lottery/draw-records', label: '抽奖记录' },
  { href: '/lottery/event-info', label: '活动信息' },
  { href: '/lottery/settings', label: '系统设置' },
];

interface AdminShellProps {
  title: string;
  description?: string;
  events: LotteryEventOption[];
  eventId: string;
  onEventChange: (id: string) => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function LotteryAdminShell({
  title,
  description,
  events,
  eventId,
  onEventChange,
  actions,
  children,
}: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Select value={eventId} onValueChange={onEventChange}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="选择活动" />
            </SelectTrigger>
            <SelectContent>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" asChild disabled={!eventId}>
            <Link href={`/screen?event=${eventId}`} target="_blank">
              <Monitor className="mr-2 h-4 w-4" />
              打开大屏
            </Link>
          </Button>
          {actions}
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={`${item.href}${eventId ? `?event=${eventId}` : ''}`}
              className={cn(
                '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {!eventId ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          请先选择一个活动
        </div>
      ) : (
        children
      )}
    </div>
  );
}
