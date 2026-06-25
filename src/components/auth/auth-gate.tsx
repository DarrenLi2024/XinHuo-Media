'use client';

import { useEffect, useRef, useState } from 'react';
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

// 缩短超时时间，提升用户体验
const AUTH_TIMEOUT = 3000;
// 后台验证间隔（毫秒）
const BACKGROUND_VERIFY_INTERVAL = 5 * 60 * 1000;

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, setUser, setLoading } = useUserStore();
  const loadedRef = useRef(false);
  const verifyingRef = useRef(false);
  // 使用本地状态跟踪是否已完成初始验证
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // 只在首次加载或从登录页跳转时执行
    if (loadedRef.current && pathname !== '/login') return;
    loadedRef.current = true;

    // 如果已有用户信息，先使用缓存渲染，后台验证
    if (user && !verifyingRef.current) {
      setInitialized(true);
      setLoading(false);
      
      // 后台静默验证 token 是否有效
      verifyingRef.current = true;
      void verifyTokenSilently();
      return;
    }

    // 无缓存用户信息，需要请求
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
          setInitialized(true);
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
  }, [pathname, router, setUser, setLoading, user]);

  // 后台静默验证
  async function verifyTokenSilently() {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (!response.ok) {
        // Token 失效，重定向到登录
        setUser(null);
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      const result: MeResponse = await response.json();
      setUser(result.data?.user ?? null);
    } catch {
      // 验证失败，静默处理，不立即重定向
      // 用户可以继续使用，下次操作时会重新验证
    } finally {
      verifyingRef.current = false;
    }
  }

  // 定期后台验证
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      if (!verifyingRef.current) {
        verifyingRef.current = true;
        void verifyTokenSilently();
      }
    }, BACKGROUND_VERIFY_INTERVAL);

    return () => clearInterval(intervalId);
  }, [user]);

  // 初始加载状态：无缓存用户时显示 loading
  if (isLoading && !initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  // 有缓存用户或已完成初始化
  if (!user && !initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!user) {
    // 用户已验证为未登录，重定向已在 effect 中处理
    return null;
  }

  return children;
}
