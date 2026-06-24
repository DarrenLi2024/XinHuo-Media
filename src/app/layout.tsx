import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '芯火会务管理系统',
    template: '%s | 芯火会务',
  },
  description:
    '芯火会务管理系统 - 面向芯片行业中小微企业的 AI Native 全栈会务管理平台，让会务管理更智能、更高效。',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  keywords: [
    '芯火会务',
    '会务管理',
    '活动策划',
    '智能排座',
    '签到系统',
    '抽奖系统',
    '芯片行业',
    'AI会务',
  ],
  authors: [{ name: '芯火传媒' }],
  openGraph: {
    title: '芯火会务管理系统',
    description:
      '面向芯片行业中小微企业的 AI Native 全栈会务管理平台，让会务管理更智能、更高效。',
    siteName: '芯火会务',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
