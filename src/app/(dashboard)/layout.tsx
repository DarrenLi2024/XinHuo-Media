'use client';

import { Sidebar, Header } from '@/components/layout';
import { AuthGate } from '@/components/auth/auth-gate';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div
          className={cn(
            'transition-all duration-300',
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          )}
        >
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AuthGate>
  );
}
