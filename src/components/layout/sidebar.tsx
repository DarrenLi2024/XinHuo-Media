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
      { key: '客户管理', title: '客户管理', icon: Users, href: '/customers' },
      { key: '供应商管理', title: '供应商管理', icon: Truck, href: '/suppliers' },
    ],
  },
  {
    title: '活动执行',
    items: [
      { key: 'events', title: '活动管理', icon: CalendarDays, href: '/events' },
      { key: 'roster', title: '名单管理', icon: ListOrdered, href: '/events/roster' },
      { key: 'tasks', title: '任务分工', icon: ClipboardList, href: '/events/tasks' },
      { key: '智能排座', title: '智能排座', icon: LayoutGrid, href: '/seating' },
      { key: '流程台本', title: '流程台本', icon: FileText, href: '/scripts' },
      { key: '表单回收', title: '表单回收', icon: ClipboardList, href: '/forms' },
      { key: '签到系统', title: '签到系统', icon: QrCode, href: '/checkin' },
      { key: '抽奖系统', title: '抽奖系统', icon: Gift, href: '/lottery' },
    ],
  },
  {
    title: '经营复盘',
    items: [
      { key: 'sponsors', title: '赞助商管理', icon: Handshake, href: '/events/sponsors' },
      { key: '复盘报告', title: '复盘报告', icon: BarChart3, href: '/reports' },
    ],
  },
];

const bottomItems = [
  { title: '系统设置', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen',
          'bg-sidebar/80 backdrop-blur-xl backdrop-saturate-150',
          'border-r border-sidebar-border',
          'transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64',
        )}
        style={{
          background: 'linear-gradient(135deg, hsl(30 20% 97% / 0.78) 0%, hsl(24 50% 96% / 0.70) 50%, hsl(30 15% 94% / 0.75) 100%)',
        }}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-orange-400 shadow-sm">
              <Flame className="h-5 w-5 text-white drop-shadow-sm" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-base font-semibold text-sidebar-foreground">芯火会务</span>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {/* Dashboard Home */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  pathname === '/dashboard'
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-orange-500/20'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                )}
              >
                <Home className="h-5 w-5" />
                {!sidebarCollapsed && <span>首页概览</span>}
              </Link>
            </TooltipTrigger>
            {sidebarCollapsed && <TooltipContent side="right">首页概览</TooltipContent>}
          </Tooltip>

          <div className="my-2 h-px bg-gradient-to-r from-transparent via-sidebar-border to-transparent" />

          {/* Sections */}
          {navigationSections.map((section) => (
            <div key={section.title} className="space-y-0.5">
              {!sidebarCollapsed && (
                <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/35">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Tooltip key={item.key || item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-orange-500/20'
                            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {!sidebarCollapsed && <span>{item.title}</span>}
                      </Link>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right">
                        {section.title} · {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border p-2">
          {bottomItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    pathname === item.href
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-orange-500/20'
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
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

        {/* Collapse Toggle — glass style */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-1/2 h-6 w-6 rounded-full border border-sidebar-border bg-background/90 backdrop-blur shadow-sm hover:bg-sidebar-accent"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3 w-3 text-sidebar-foreground/50" />
          ) : (
            <ChevronLeft className="h-3 w-3 text-sidebar-foreground/50" />
          )}
        </Button>
      </aside>
    </TooltipProvider>
  );
}
