import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function RootPage() {
  // 如果有 token，直接进 dashboard；否则跳转登录
  const hasToken = cookies().get('xh_access_token')?.value;
  if (hasToken) {
    redirect('/dashboard');
  }
  redirect('/login');
}
