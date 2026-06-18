// 大屏抽奖系统 - 主题配置
//
// 复刻 docs/bonnors/DESIGN.md 的三套主题：科技蓝 / 辉煌金 / 红金。
// 提供大屏背景渐变、主色、强调色、卡牌渐变等，供 /screen 与卡牌组件使用。

import type { LotteryTheme } from './db/types';

export interface ThemeConfig {
  key: LotteryTheme;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string; // CSS 渐变
  cardGradient: string; // tailwind from-... to-...
  glow: string; // 发光色
  particleColors: string[];
}

export const THEMES: Record<LotteryTheme, ThemeConfig> = {
  'tech-blue': {
    key: 'tech-blue',
    name: '科技蓝',
    primary: '#3B82F6',
    secondary: '#1E40AF',
    accent: '#60A5FA',
    background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)',
    cardGradient: 'from-blue-400 to-indigo-500',
    glow: 'rgba(96, 165, 250, 0.6)',
    particleColors: ['#3B82F6', '#60A5FA', '#93C5FD', '#1E40AF'],
  },
  golden: {
    key: 'golden',
    name: '辉煌金',
    primary: '#F59E0B',
    secondary: '#D97706',
    accent: '#FCD34D',
    background: 'linear-gradient(135deg, #1C1917 0%, #3F3A36 50%, #1C1917 100%)',
    cardGradient: 'from-yellow-400 to-orange-500',
    glow: 'rgba(252, 211, 77, 0.6)',
    particleColors: ['#F59E0B', '#FCD34D', '#FBBF24', '#D97706'],
  },
  'red-gold': {
    key: 'red-gold',
    name: '红金',
    primary: '#DC2626',
    secondary: '#F59E0B',
    accent: '#FCA5A5',
    background: 'linear-gradient(135deg, #1F2937 0%, #374151 50%, #1F2937 100%)',
    cardGradient: 'from-red-500 to-yellow-500',
    glow: 'rgba(252, 165, 165, 0.6)',
    particleColors: ['#DC2626', '#F59E0B', '#FCA5A5', '#FCD34D'],
  },
};

export function getThemeConfig(theme: string | undefined): ThemeConfig {
  if (theme && theme in THEMES) return THEMES[theme as LotteryTheme];
  return THEMES['tech-blue'];
}

export const LEVEL_NAMES: Record<number, string> = {
  1: '特等奖',
  2: '一等奖',
  3: '二等奖',
  4: '三等奖',
  5: '四等奖',
  6: '五等奖',
  7: '参与奖',
};

export function levelName(level: number): string {
  return LEVEL_NAMES[level] || `${level}等奖`;
}
