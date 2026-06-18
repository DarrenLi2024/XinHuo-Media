'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserStore } from '@/store';
import type { User } from '@/types';

type LoginResponse = {
  data?: {
    user?: User;
  };
  error?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useUserStore();

  // 如果已登录则自动跳转
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const result: { data?: { user?: unknown } } = await response.json();
          if (result.data?.user) {
            setUser(result.data.user as User);
            const next = new URLSearchParams(window.location.search).get('next');
            router.replace(next && next.startsWith('/') ? next : '/');
          }
        }
      } catch {
        // 未登录，继续显示登录页面
      }
    };
    void checkSession();
  }, [router, setUser]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const result: LoginResponse = await response.json();

      if (!response.ok || !result.data?.user) {
        throw new Error(result.error || '登录失败');
      }

      setUser(result.data.user);
      const next = new URLSearchParams(window.location.search).get('next');
      router.replace(next && next.startsWith('/') ? next : '/');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>登录芯火会务</CardTitle>
          <CardDescription>使用已开通的会务管理账号继续</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
