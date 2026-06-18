import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EventPro 抽奖系统',
  description: '大型活动现场智能抽奖管理平台',
};

export default function LotteryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}