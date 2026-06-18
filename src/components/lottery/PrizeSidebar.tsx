'use client';

// 大屏抽奖系统 - 奖项侧边栏
//
// 复刻 docs/bonnors/DESIGN.md：展示当前奖项的图片、等级、价值、赞助商、
// 总数/剩余、抽取规则。基于离线 Prize 类型。

import { motion } from 'framer-motion';
import { Gift, Package, Award, User } from 'lucide-react';
import type { Prize } from '@/lib/lottery/db/types';
import { levelName } from '@/lib/lottery/theme';

interface PrizeSidebarProps {
  prize: Prize;
  remaining: number;
}

export default function PrizeSidebar({ prize, remaining }: PrizeSidebarProps) {
  if (!prize) return null;

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="fixed left-0 top-0 z-20 h-full w-64 overflow-y-auto border-r border-slate-700/50 bg-slate-900/75 p-4 backdrop-blur-lg md:w-72 md:p-6 lg:w-80"
    >
      {prize.image && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="mb-6 aspect-square w-full overflow-hidden rounded-2xl border-4 border-yellow-500/50 shadow-2xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={prize.image} alt={prize.name} className="h-full w-full object-cover" />
        </motion.div>
      )}

      <div className="mb-6 space-y-2">
        <div className="flex items-center gap-2 text-yellow-400">
          <Award className="h-5 w-5" />
          <span className="text-sm font-medium">{levelName(prize.level)}</span>
        </div>
        <h2 className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-3xl font-bold text-transparent">
          {prize.name}
        </h2>
        {prize.prizeName && <p className="text-lg text-slate-200">{prize.prizeName}</p>}
        {prize.description && <p className="text-sm text-slate-400">{prize.description}</p>}
      </div>

      {prize.value && (
        <div className="mb-4 rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-4">
          <div className="mb-1 flex items-center gap-2 text-yellow-400">
            <Package className="h-4 w-4" />
            <span className="text-sm font-medium">奖品价值</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{prize.value}</p>
        </div>
      )}

      {prize.sponsor && (
        <div className="mb-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
          <div className="mb-1 flex items-center gap-2 text-blue-400">
            <Award className="h-4 w-4" />
            <span className="text-sm font-medium">赞助商</span>
          </div>
          <p className="text-lg text-blue-300">{prize.sponsor}</p>
        </div>
      )}

      <div className="mb-6 space-y-3">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Gift className="h-4 w-4" />
              <span className="text-sm">奖品总数</span>
            </div>
            <span className="text-xl font-bold text-white">{prize.quantity}</span>
          </div>
        </div>
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-400">
              <User className="h-4 w-4" />
              <span className="text-sm">剩余数量</span>
            </div>
            <span className="text-2xl font-bold text-green-400">{remaining}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
        <h3 className="mb-3 text-sm font-medium text-slate-400">抽取规则</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">单次抽取</span>
            <span className="font-medium text-white">{prize.drawCount} 人</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">允许重复</span>
            <span className={prize.allowRepeat ? 'font-medium text-green-400' : 'font-medium text-slate-400'}>
              {prize.allowRepeat ? '是' : '否'}
            </span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
