'use client';

import dynamic from 'next/dynamic';

// 懒加载 3D 粒子球组件（framer-motion 较大）
export const ParticleSphereLazy = dynamic(
  () => import('@/components/lottery/ParticleSphere'),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-32 w-32 animate-pulse rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
      </div>
    ),
  }
);

// 懒加载奖项侧边栏（framer-motion）
export const PrizeSidebarLazy = dynamic(
  () => import('@/components/lottery/PrizeSidebar'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed left-0 top-0 h-full w-64 bg-black/30 backdrop-blur-sm" />
    ),
  }
);

// 懒加载中奖卡牌组件（framer-motion）- 使用 default 导出
export const ShatterCardLazy = dynamic(
  () => import('@/components/lottery/ShatterCard'),
  {
    ssr: false,
    loading: () => (
      <div className="h-24 w-48 animate-pulse rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20" />
    ),
  }
);