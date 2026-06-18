'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarDays,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  LayoutGrid,
  ArrowRight,
  Plus,
  TicketCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

type DashboardStats = {
  totalEvents: number;
  activeEvents: number;
  totalGuests: number;
  checkedInGuests: number;
  checkInRate: number;
  pendingTasks: number;
  totalTasks: number;
};

type RecentEvent = {
  id: string;
  name: string;
  type: string;
  status: string;
  start_time: string;
  expected_guests: number;
  actual_guests: number;
};

type PendingTask = {
  id: string;
  title: string;
  event_name?: string;
  end_date: string;
  priority: string;
  status: string;
  progress: number;
};

const eventTypeMap: Record<string, string> = {
  annual_meeting: '年会',
  product_launch: '发布会',
  seminar: '研讨会',
  appreciation: '答谢会',
  training: '培训',
  other: '其他',
};

const eventStatusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: '草稿', variant: 'secondary' },
  pending: { label: '待筹备', variant: 'outline' },
  preparing: { label: '筹备中', variant: 'default' },
  ongoing: { label: '进行中', variant: 'default' },
  completed: { label: '已完成', variant: 'secondary' },
  archived: { label: '已归档', variant: 'outline' },
};

const priorityMap: Record<string, { label: string; className: string }> = {
  high: { label: '高', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  medium: { label: '中', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  low: { label: '低', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
};

const defaultStats: DashboardStats = {
  totalEvents: 0,
  activeEvents: 0,
  totalGuests: 0,
  checkedInGuests: 0,
  checkInRate: 0,
  pendingTasks: 0,
  totalTasks: 0,
};

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [eventsRes, rosterRes, tasksRes] = await Promise.all([
          fetch('/api/events?limit=5').then((r) => r.json()),
          fetch('/api/roster?event_id=all&type=stats').then((r) => r.json()),
          fetch('/api/tasks?status=pending,in_progress&limit=10').then((r) => r.json()),
        ]);

        // 统计
        const eventsList = eventsRes.data || eventsRes.success ? (eventsRes.data || []) : [];
        const rosterStats = rosterRes.data || {};
        const tasksList = tasksRes.data || [];

        setStats({
          totalEvents: eventsList.length,
          activeEvents: eventsList.filter((e: RecentEvent) =>
            ['preparing', 'ongoing'].includes(e.status),
          ).length,
          totalGuests: rosterStats.total || rosterStats.total_guests || 0,
          checkedInGuests: rosterStats.checkedIn || rosterStats.attendee_checked_in || 0,
          checkInRate: rosterStats.checkInRate || rosterStats.check_in_rate || 0,
          pendingTasks: tasksList.filter(
            (t: PendingTask) => ['pending', 'in_progress'].includes(t.status),
          ).length,
          totalTasks: tasksList.length,
        });

        // 近期活动
        setRecentEvents(eventsList.slice(0, 5));

        // 待办任务
        setPendingTasks(
          tasksList
            .filter((t: PendingTask) => ['pending', 'in_progress'].includes(t.status))
            .sort((a: PendingTask, b: PendingTask) => {
              const pOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
              return (pOrder[a.priority] ?? 1) - (pOrder[b.priority] ?? 1);
            })
            .slice(0, 6),
        );
      } catch (err) {
        setError('数据加载失败，请稍后重试');
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  // 快捷入口配置
  const quickLinks = [
    {
      title: '活动管理',
      icon: CalendarDays,
      href: '/events',
      desc: '创建和管理活动',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: '名单管理',
      icon: Users,
      href: '/events/roster',
      desc: '嘉宾与参会人管理',
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: '智能排座',
      icon: LayoutGrid,
      href: '/seating',
      desc: 'AI 辅助排座',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: '签到系统',
      icon: TicketCheck,
      href: '/checkin',
      desc: '现场扫码签到',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      title: '台本管理',
      icon: FileText,
      href: '/scripts',
      desc: '活动流程台本',
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
    {
      title: '复盘报告',
      icon: Sparkles,
      href: '/reports',
      desc: 'AI 智能生成报告',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">首页概览</h1>
          <p className="text-muted-foreground">芯火会务管理系统 — 让会务管理更智能</p>
        </div>
        <Button asChild>
          <Link href="/events/new">
            <Plus className="mr-2 h-4 w-4" />
            创建活动
          </Link>
        </Button>
      </div>

      {/* 统计卡片 — 真实数据 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">进行中活动</CardTitle>
                <div className="rounded-lg p-2 bg-blue-500/10">
                  <CalendarDays className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeEvents}</div>
                <p className="text-xs text-muted-foreground">共 {stats.totalEvents} 个活动</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">嘉宾总数</CardTitle>
                <div className="rounded-lg p-2 bg-green-500/10">
                  <Users className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalGuests}</div>
                <p className="text-xs text-muted-foreground">已签到 {stats.checkedInGuests} 人</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">签到率</CardTitle>
                <div className="rounded-lg p-2 bg-purple-500/10">
                  <CheckCircle2 className="h-4 w-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalGuests > 0 ? stats.checkInRate : 0}%</div>
                <div className="mt-2">
                  <Progress value={stats.totalGuests > 0 ? stats.checkInRate : 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">待办任务</CardTitle>
                <div className="rounded-lg p-2 bg-orange-500/10">
                  <Clock className="h-4 w-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingTasks}</div>
                <p className="text-xs text-muted-foreground">共 {stats.totalTasks} 个任务</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* 快捷入口 — 6大核心模块 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">功能模块</CardTitle>
          <CardDescription>芯火会务核心功能，覆盖活动全流程</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 transition-all hover:border-primary/50 hover:bg-muted/50 hover:shadow-sm"
              >
                <div className={`rounded-lg p-2.5 ${item.bg}`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <span className="text-sm font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground text-center leading-tight">{item.desc}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 近期活动 + 待办任务 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 近期活动 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">近期活动</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/events">查看全部 <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : recentEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">暂无活动</p>
                <Button variant="link" size="sm" asChild className="mt-1">
                  <Link href="/events/new">创建第一个活动</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{event.name}</span>
                        <Badge variant={eventStatusMap[event.status]?.variant || 'secondary'}>
                          {eventStatusMap[event.status]?.label || event.status}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{eventTypeMap[event.type] || event.type}</span>
                        <span>{event.start_time ? new Date(event.start_time).toLocaleDateString('zh-CN') : '—'}</span>
                        <span>{event.expected_guests || 0} 位嘉宾</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 待办任务 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">待办任务</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/events/tasks">查看全部 <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">暂无待办任务</p>
                <Button variant="link" size="sm" asChild className="mt-1">
                  <Link href="/events/tasks">前往任务管理</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{task.title}</span>
                          <Badge className={priorityMap[task.priority]?.className || ''}>
                            {priorityMap[task.priority]?.label || task.priority}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {task.event_name && <span>{task.event_name} · </span>}
                          截止: {task.end_date ? new Date(task.end_date).toLocaleDateString('zh-CN') : '—'}
                        </div>
                        {typeof task.progress === 'number' && (
                          <div className="mt-2 flex items-center gap-2">
                            <Progress value={task.progress} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground">{task.progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 错误提示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
