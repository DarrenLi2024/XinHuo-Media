// 布局相关类型定义

// 场地构件类型
export type VenueElementType = 'stage' | 'aisle' | 'pillar' | 'wall' | 'entrance';

// 场地构件
export interface VenueElement {
  id: string;
  type: VenueElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  label?: string;
}

// 桌位布局位置
export interface TableLayoutPosition {
  tableId: string;
  tableName: string;
  capacity: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

// 对齐模式
export type AlignMode = 'free' | 'horizontal' | 'vertical' | 'grid';

// 布局配置
export interface LayoutConfig {
  gridSize: number; // 网格大小
  alignMode: AlignMode;
  showGrid: boolean;
  snapToGrid: boolean;
  tablesPerRow: number; // 每排桌位数
  rowSpacing: number; // 排间距
  tableSpacing: number; // 桌间距
}

// 布局状态
export interface Layout {
  id: string;
  name: string;
  venueElements: VenueElement[];
  tablePositions: TableLayoutPosition[];
  config: LayoutConfig;
  canvasWidth: number;
  canvasHeight: number;
}

// 默认布局配置
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  gridSize: 20,
  alignMode: 'free',
  showGrid: true,
  snapToGrid: true,
  tablesPerRow: 5,
  rowSpacing: 250,
  tableSpacing: 220,
};

// 场地构件默认尺寸
export const VENUE_ELEMENT_DEFAULTS: Record<VenueElementType, { width: number; height: number; label: string; color: string }> = {
  stage: { width: 400, height: 80, label: '舞台', color: '#8b5cf6' },
  aisle: { width: 60, height: 200, label: '过道', color: '#94a3b8' },
  pillar: { width: 40, height: 40, label: '柱子', color: '#64748b' },
  wall: { width: 200, height: 20, label: '墙体', color: '#475569' },
  entrance: { width: 80, height: 40, label: '入口', color: '#22c55e' },
};
