'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store';
import {
  CalendarDays,
  Users,
  LayoutGrid,
  FileText,
  QrCode,
  Gift,
  BarChart3,
  Truck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  Flame,
  ClipboardList,
  Handshake,
  ListOrdered,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navigationSections = [
  {
    title: '主数据',
    items: [
      {
        key: '客户管理',
        title: '客户管理',
        icon: Users,
        href: '/customers',
      },
      {
        key: '供应商管理',
        title: '供应商管理',
        icon: Truck,
        href: '/suppliers',
      },
    ],
  },
  {
    title: '活动执行',
    items: [
      {
        key: 'events',
        title: '活动管理',
        icon: CalendarDays,
        href: '/events',
      },
      {
        key: 'roster',
        title: '名单管理',
        icon: ListOrdered,
        href: '/events/roster',
      },
      {
        key: 'tasks',
        title: '任务分工',
        icon: Users,
        href: '/events/tasks',
      },
      {
        key: '智能排座',
        title: '智能排座',
        icon: LayoutGrid,
        href: '/seating',
      },
      {
        key: '流程台本',
        title: '流程台本',
        icon: FileText,
        href: '/scripts',
      },
      {
        key: '表单回收',
        title: '表单回收',
        icon: ClipboardList,
        href: '/forms',
      },
      {
        key: '签到系统',
        title: '签到系统',
        icon: QrCode,
        href: '/checkin',
      },
      {
        key: '抽奖系统',
        title: '抽奖系统',
        icon: Gift,
        href: '/lottery',
      },
    ],
  },
  {
    title: '经营复盘',
    items: [
      {
        key: 'sponsors',
        title: '赞助商管理',
        icon: Handshake,
        href: '/events/sponsors',
      },
      {
        key: '复盘报告',
        title: '复盘报告',
        icon: BarChart3,
        href: '/reports',
      },
    ],
  },
];

const bottomItems = [
  {
    title: '系统设置',
    icon: Settings,
    href: '/settings',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r border-border bg-background transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo 区域 */}
        <div className="flex h-16 items-center border-b border-border px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
              <Flame className="h-5 w-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-semibold text-foreground">芯火会务</span>
            )}
          </Link>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 space-y-1 p-2">
          {/* 首页 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname === '/dashboard'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Home className="h-5 w-5" />
                {!sidebarCollapsed && <span>首页概览</span>}
              </Link>
            </TooltipTrigger>
            {sidebarCollapsed && <TooltipContent side="right">首页概览</TooltipContent>}
          </Tooltip>

          <div className="my-2 h-px bg-border" />

          {/* 主要导航 */}
          {navigationSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 pt-3 text-xs font-medium text-muted-foreground">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => (
                <Tooltip key={item.key || item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        pathname.startsWith(item.href)
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {!sidebarCollapsed && <span>{item.title}</span>}
                    </Link>
                  </TooltipTrigger>
                  {sidebarCollapsed && <TooltipContent side="right">{section.title} / {item.title}</TooltipContent>}
                </Tooltip>
              ))}
            </div>
          ))}
        </nav>

        {/* 底部导航 */}
        <div className="border-t border-border p-2">
          {bottomItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {!sidebarCollapsed && <span>{item.title}</span>}
                </Link>
              </TooltipTrigger>
              {sidebarCollapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
            </Tooltip>
          ))}
        </div>

        {/* 折叠按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-1/2 h-6 w-6 rounded-full border border-border bg-background shadow-sm"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </aside>
    </TooltipProvider>
  );
}
