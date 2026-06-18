'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CalendarDays,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Gift,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

// 模拟统计数据
const stats = [
  {
    title: '进行中的活动',
    value: '3',
    description: '本月新增 2 个活动',
    icon: CalendarDays,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    title: '待办任务',
    value: '12',
    description: '3 个任务即将到期',
    icon: Clock,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    title: '嘉宾总数',
    value: '156',
    description: '本周新增 23 人',
    icon: Users,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    title: '签到率',
    value: '89%',
    description: '较上次提升 5%',
    icon: CheckCircle2,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
];

// 模拟近期活动
const recentEvents = [
  {
    id: '1',
    name: '2025 芯片行业春茗盛典',
    type: 'annual_meeting',
    status: 'preparing',
    date: '2025-02-15',
    guests: 120,
    progress: 75,
  },
  {
    id: '2',
    name: '新产品发布会',
    type: 'product_launch',
    status: 'draft',
    date: '2025-03-20',
    guests: 80,
    progress: 30,
  },
  {
    id: '3',
    name: '技术研讨会',
    type: 'seminar',
    status: 'ongoing',
    date: '2025-01-18',
    guests: 50,
    progress: 100,
  },
];

// 模拟待办任务
const pendingTasks = [
  { id: '1', name: '确认场地预订', event: '春茗盛典', deadline: '2025-01-20', priority: 'high' },
  { id: '2', name: '设计邀请函', event: '春茗盛典', deadline: '2025-01-22', priority: 'high' },
  { id: '3', name: '联系供应商', event: '新产品发布会', deadline: '2025-01-25', priority: 'medium' },
];

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

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">首页概览</h1>
          <p className="text-muted-foreground">芯火会务管理系统 - 让会务管理更智能</p>
        </div>
        <Button asChild>
          <Link href="/events/new">
            创建活动
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 快捷入口 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">快捷入口</CardTitle>
          <CardDescription>快速访问常用功能模块</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { title: '活动管理', icon: CalendarDays, href: '/events', desc: '管理活动全流程' },
              { title: '智能排座', icon: LayoutGrid, href: '/seating', desc: 'AI辅助排座' },
              { title: '签到系统', icon: CheckCircle2, href: '/checkin', desc: '扫码签到管理' },
              { title: '抽奖系统', icon: Gift, href: '/lottery', desc: '大屏抽奖互动' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
              >
                <item.icon className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground">{item.desc}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 近期活动 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">近期活动</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/events">查看全部</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{event.name}</span>
                      <Badge variant={eventStatusMap[event.status].variant}>
                        {eventStatusMap[event.status].label}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{eventTypeMap[event.type]}</span>
                      <span>{event.date}</span>
                      <span>{event.guests} 位嘉宾</span>
                    </div>
                    {event.status === 'preparing' && (
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={event.progress} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground">{event.progress}%</span>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/events/${event.id}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 待办任务 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">待办任务</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/events/tasks">查看全部</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{task.name}</span>
                      <Badge className={priorityMap[task.priority].className}>
                        {priorityMap[task.priority].label}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {task.event} · 截止: {task.deadline}
                    </div>
                  </div>
                  <Button size="sm">完成</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据趋势 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            数据趋势
          </CardTitle>
          <CardDescription>近 6 个月活动数据统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            数据图表组件待接入
          </div>
        </CardContent>
      </Card>
    </div>
  );
}