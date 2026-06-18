import type { EventChapter, ExportTemplateConfig, Role, SkinConfig } from '@/types/script-event';

export const CHAPTER_COLORS = [
  '#ef4444',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#64748b',
];

export const DEFAULT_ROLES: Role[] = [
  { key: 'host', label: '主持人', color: '#ef4444', isDefault: true },
  { key: 'speaker', label: '致辞嘉宾', color: '#f59e0b', isDefault: true },
  { key: 'presenter', label: '演讲嘉宾', color: '#10b981', isDefault: true },
  { key: 'awarder', label: '颁奖嘉宾', color: '#3b82f6', isDefault: true },
  { key: 'performer', label: '演出嘉宾', color: '#8b5cf6', isDefault: true },
  { key: 'musician', label: '演奏嘉宾', color: '#ec4899', isDefault: true },
  { key: 'guest', label: '参会嘉宾', color: '#6b7280', isDefault: true },
];

export const DEFAULT_CHAPTERS: Omit<EventChapter, 'eventId'>[] = [
  { id: 'chapter-opening', name: '开场', color: '#ef4444', order: 1 },
  { id: 'chapter-main', name: '正式环节', color: '#3b82f6', order: 2 },
  { id: 'chapter-closing', name: '闭幕', color: '#10b981', order: 3 },
];

export const SKIN_CONFIGS: Record<string, SkinConfig> = {
  qianli: {
    name: '千里江山图',
    description: '青绿山水，典雅大气',
    background: 'linear-gradient(135deg, #1a3a52 0%, #2d5a7b 50%, #1a3a52 100%)',
    primaryColor: '#d4af37',
    accentColor: '#9cc7bd',
    textColor: '#fff8dc',
    mutedColor: 'rgba(255, 248, 220, 0.72)',
    panelColor: 'rgba(8, 28, 42, 0.72)',
  },
  qingming: {
    name: '清明上河图',
    description: '淡雅水墨，古朴风韵',
    background: 'linear-gradient(135deg, #f5e6d3 0%, #ede0c8 50%, #f5e6d3 100%)',
    primaryColor: '#8b4513',
    accentColor: '#b06b36',
    textColor: '#2f241c',
    mutedColor: 'rgba(47, 36, 28, 0.68)',
    panelColor: 'rgba(255, 252, 245, 0.76)',
  },
  golden: {
    name: '辉煌盛世金',
    description: '金碧辉煌，尊贵典雅',
    background: 'linear-gradient(135deg, #3d2914 0%, #5c3d1f 50%, #3d2914 100%)',
    primaryColor: '#ffd700',
    accentColor: '#f4b860',
    textColor: '#fff4c2',
    mutedColor: 'rgba(255, 244, 194, 0.7)',
    panelColor: 'rgba(39, 24, 10, 0.78)',
  },
  qinghua: {
    name: '雅致青花紫',
    description: '青花瓷韵，古雅清秀',
    background: 'linear-gradient(135deg, #1f1f3d 0%, #2d2d5a 50%, #1f1f3d 100%)',
    primaryColor: '#9370db',
    accentColor: '#c4b5fd',
    textColor: '#f5f3ff',
    mutedColor: 'rgba(245, 243, 255, 0.7)',
    panelColor: 'rgba(20, 20, 48, 0.78)',
  },
};

export const EXPORT_CONFIG = {
  dpi: 300,
  scale: 300 / 96,
  baseWidth: 1206,
  previewScale: 2.8,
  get previewWidth() {
    return Math.round(this.baseWidth / this.previewScale);
  },
};

export const DEFAULT_EXPORT_CONFIG: ExportTemplateConfig = {
  skin: 'qianli',
  eventName: '',
  eventTheme: '',
  organizer: '',
  footerLine1: '芯火传媒 · 活动执行手册',
  footerLine2: 'EventSync Pro',
  selectedChapters: [],
  selectedSegments: [],
  hiddenFields: [],
  showSteps: true,
};
