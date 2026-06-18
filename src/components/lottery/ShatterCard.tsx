'use client';

// 大屏抽奖系统 - 中奖卡牌（含碎裂特效）
//
// 复刻 docs/bonnors/DESIGN.md 的中奖卡牌：渐变玻璃质感、主题色边框、
// 新中奖发光脉冲、补位金色持续发光、弃奖碎裂为粒子散开。

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { ThemeConfig } from '@/lib/lottery/theme';

export interface ShatterWinner {
  name: string;
  company?: string;
  tableNumber?: string;
}

interface ShatterCardProps {
  winner: ShatterWinner;
  theme: ThemeConfig;
  isLatest?: boolean; // 最新中奖：发光脉冲
  isReplaced?: boolean; // 补位中奖：金色持续发光
  shattering?: boolean; // 触发碎裂动画
  onShatterComplete?: () => void;
}

interface Fragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  alpha: number;
  color: string;
}

export function ShatterCard({
  winner,
  theme,
  isLatest = false,
  isReplaced = false,
  shattering = false,
  onShatterComplete,
}: ShatterCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!shattering) return;
    const canvas = canvasRef.current;
    if (!canvas) {
      setHidden(true);
      onShatterComplete?.();
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setHidden(true);
      onShatterComplete?.();
      return;
    }

    const width = (canvas.width = canvas.offsetWidth);
    const height = (canvas.height = canvas.offsetHeight);
    const colors = [theme.primary, theme.accent, theme.secondary, '#FFFFFF'];
    const fragments: Fragment[] = [];
    const cols = 8;
    const rows = 10;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        fragments.push({
          x: (width / cols) * (i + 0.5),
          y: (height / rows) * (j + 0.5),
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8 - 2,
          size: width / cols,
          rotation: Math.random() * Math.PI,
          rotationSpeed: (Math.random() - 0.5) * 0.4,
          alpha: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    setHidden(true);
    let raf = 0;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      let alive = false;
      for (const f of fragments) {
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.35; // 重力
        f.rotation += f.rotationSpeed;
        f.alpha -= 0.02;
        if (f.alpha <= 0) continue;
        alive = true;
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rotation);
        ctx.globalAlpha = Math.max(0, f.alpha);
        ctx.fillStyle = f.color;
        ctx.fillRect(-f.size / 2, -f.size / 2, f.size, f.size);
        ctx.restore();
      }
      if (alive) {
        raf = requestAnimationFrame(animate);
      } else {
        onShatterComplete?.();
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [shattering, theme, onShatterComplete]);

  if (shattering) {
    return <canvas ref={canvasRef} className="h-[200px] w-[150px]" />;
  }

  if (hidden) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, rotateY: 180 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className="relative flex h-[200px] w-[150px] flex-col items-center justify-center rounded-2xl border-2 p-3 text-center backdrop-blur-md"
      style={{
        borderColor: isReplaced ? '#FCD34D' : theme.accent,
        background: 'rgba(15, 23, 42, 0.55)',
        boxShadow: isReplaced
          ? '0 0 30px rgba(252, 211, 77, 0.8)'
          : isLatest
            ? `0 0 25px ${theme.glow}`
            : `0 4px 12px rgba(0,0,0,0.4)`,
        animation: isLatest && !isReplaced ? 'lottery-pulse 1.2s ease-in-out infinite' : undefined,
      }}
    >
      {isReplaced && (
        <span className="absolute -top-2 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-black">
          补位
        </span>
      )}
      <div
        className="bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent"
        style={{ backgroundImage: `linear-gradient(to right, ${theme.accent}, ${theme.primary})` }}
      >
        {winner.name}
      </div>
      {winner.company && <div className="mt-2 line-clamp-2 text-xs text-white/70">{winner.company}</div>}
      {winner.tableNumber && <div className="mt-1 text-xs text-white/50">{winner.tableNumber} 桌</div>}
    </motion.div>
  );
}

export default ShatterCard;
