'use client';

import dynamic from 'next/dynamic';

// 懒加载导出弹窗（html2canvas + jspdf 较大）
export const ExportModalLazy = dynamic(
  () => import('@/components/seating/ExportModal').then((mod) => ({ default: mod.ExportModal })),
  {
    ssr: false,
    loading: () => null, // 弹窗不需要 loading 状态
  }
);

// 懒加载桌卡生成器（html2canvas 较大）
export const TableCardGeneratorLazy = dynamic(
  () => import('@/components/seating/TableCardGenerator').then((mod) => ({ default: mod.TableCardGenerator })),
  {
    ssr: false,
    loading: () => null, // 弹窗不需要 loading 状态
  }
);