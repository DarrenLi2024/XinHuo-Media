'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { useUserStore } from '@/store';
import type { User } from '@/types';

type MeResponse = {
  data?: {
    user?: User;
  };
};

interface AuthGateProps {
  children: React.ReactNode;
}

const AUTH_TIMEOUT = 8000;

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, setUser, setLoading } = useUserStore();
  const loadedRef = useRef(false);

  useEffect(() => {
    // Only load once or when pathname changes to a non-login page
    if (loadedRef.current && pathname !== '/login') return;
    loadedRef.current = true;

    let cancelled = false;
    setLoading(true);

    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        setUser(null);
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    }, AUTH_TIMEOUT);

    async function loadUser() {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('unauthenticated');
        }

        const result: MeResponse = await response.json();
        if (!cancelled) {
          clearTimeout(timeoutId);
          setUser(result.data?.user ?? null);
        }
      } catch {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setUser(null);
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [pathname, router, setUser, setLoading]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return children;
}
