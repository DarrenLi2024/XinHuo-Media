import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  // 如果有 token，直接进 dashboard；否则跳转登录
  const cookieStore = await cookies();
  const hasToken = cookieStore.get('xh_access_token')?.value;
  if (hasToken) {
    redirect('/dashboard');
  }
  redirect('/login');
}
