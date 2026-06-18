// Canvas 绘制工具函数

import { VenueElement, TableLayoutPosition, VENUE_ELEMENT_DEFAULTS } from '@/types/seating-layout';

// 绘制网格
export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridSize: number
) => {
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 0.5;

  // 垂直线
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // 水平线
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
};

// 绘制场地构件
export const drawVenueElement = (
  ctx: CanvasRenderingContext2D,
  element: VenueElement,
  isSelected: boolean = false
) => {
  const defaults = VENUE_ELEMENT_DEFAULTS[element.type];
  
  ctx.save();
  ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
  ctx.rotate((element.rotation || 0) * Math.PI / 180);

  // 背景
  ctx.fillStyle = defaults.color;
  ctx.globalAlpha = 0.8;

  switch (element.type) {
    case 'stage':
      // 舞台 - 圆角矩形
      drawRoundRect(ctx, -element.width / 2, -element.height / 2, element.width, element.height, 8);
      ctx.fill();
      // 舞台纹理
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1;
      drawRoundRect(ctx, -element.width / 2, -element.height / 2, element.width, element.height, 8);
      ctx.stroke();
      break;

    case 'aisle':
      // 过道 - 虚线边框
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(-element.width / 2, -element.height / 2, element.width, element.height);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.strokeRect(-element.width / 2, -element.height / 2, element.width, element.height);
      ctx.setLineDash([]);
      break;

    case 'pillar':
      // 柱子 - 圆形
      ctx.beginPath();
      ctx.arc(0, 0, element.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1;
      ctx.stroke();
      break;

    case 'wall':
      // 墙体 - 双线
      ctx.fillRect(-element.width / 2, -element.height / 2, element.width, element.height);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1;
      ctx.strokeRect(-element.width / 2, -element.height / 2, element.width, element.height);
      break;

    case 'entrance':
      // 入口 - 带箭头
      ctx.fillStyle = '#dcfce7';
      ctx.fillRect(-element.width / 2, -element.height / 2, element.width, element.height);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1;
      ctx.strokeRect(-element.width / 2, -element.height / 2, element.width, element.height);
      // 绘制箭头
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(0, -element.height / 4);
      ctx.lineTo(-element.width / 4, element.height / 4);
      ctx.lineTo(element.width / 4, element.height / 4);
      ctx.closePath();
      ctx.fill();
      break;
  }

  // 标签
  ctx.globalAlpha = 1;
  ctx.fillStyle = element.type === 'aisle' ? '#64748b' : '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(defaults.label, 0, 0);

  // 选中边框
  if (isSelected) {
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(-element.width / 2 - 4, -element.height / 2 - 4, element.width + 8, element.height + 8);
    ctx.setLineDash([]);
  }

  ctx.restore();
};

// 绘制圆角矩形
const drawRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
};

// 绘制圆桌和座位
export const drawRoundTable = (
  ctx: CanvasRenderingContext2D,
  position: TableLayoutPosition,
  isSelected: boolean = false,
  seatedCount: number = 0
) => {
  const { x, y, tableName, capacity, scale } = position;
  
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // 计算尺寸
  const tableRadius = Math.max(40, Math.min(80, 20 + capacity * 3)); // 根据座位数调整桌子大小
  const chairRadius = 10;
  const chairDistance = tableRadius + chairRadius + 5;

  // 绘制椅子（座位）
  for (let i = 0; i < capacity; i++) {
    const angle = (i * 2 * Math.PI / capacity) - Math.PI / 2; // 从顶部开始
    const chairX = Math.cos(angle) * chairDistance;
    const chairY = Math.sin(angle) * chairDistance;

    // 椅子背景
    ctx.beginPath();
    ctx.arc(chairX, chairY, chairRadius, 0, Math.PI * 2);
    
    // 根据是否有入座人员显示不同颜色
    if (i < seatedCount) {
      ctx.fillStyle = '#22c55e'; // 已入座 - 绿色
    } else {
      ctx.fillStyle = '#e2e8f0'; // 未入座 - 灰色
    }
    ctx.fill();
    
    // 椅子边框
    ctx.strokeStyle = i < seatedCount ? '#16a34a' : '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 座位号
    ctx.fillStyle = i < seatedCount ? '#ffffff' : '#64748b';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((i + 1).toString(), chairX, chairY);
  }

  // 绘制桌面
  ctx.beginPath();
  ctx.arc(0, 0, tableRadius, 0, Math.PI * 2);
  
  // 渐变填充
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, tableRadius);
  gradient.addColorStop(0, '#fef3c7');
  gradient.addColorStop(1, '#fde68a');
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // 桌子边框
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 桌面内圈
  ctx.beginPath();
  ctx.arc(0, 0, tableRadius - 8, 0, Math.PI * 2);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 桌位号
  ctx.fillStyle = '#92400e';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tableName, 0, 0);

  // 入座人数
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#b45309';
  ctx.fillText(`${seatedCount}/${capacity}`, 0, 14);

  // 选中效果
  if (isSelected) {
    ctx.beginPath();
    ctx.arc(0, 0, chairDistance + chairRadius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
};

// 绘制所有元素
export const drawLayout = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  venueElements: VenueElement[],
  tablePositions: TableLayoutPosition[],
  config: { showGrid: boolean; gridSize: number },
  selectedElementId: string | null,
  selectedTableId: string | null,
  seatedCounts: Record<string, number> = {}
) => {
  // 清空画布
  ctx.clearRect(0, 0, width, height);

  // 背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 网格
  if (config.showGrid) {
    drawGrid(ctx, width, height, config.gridSize);
  }

  // 绘制场地构件
  venueElements.forEach(element => {
    drawVenueElement(ctx, element, element.id === selectedElementId);
  });

  // 绘制桌位
  tablePositions.forEach(position => {
    drawRoundTable(
      ctx, 
      position, 
      position.tableId === selectedTableId,
      seatedCounts[position.tableId] || 0
    );
  });
};

// 导出为图片
export const exportLayoutAsImage = (
  canvas: HTMLCanvasElement,
  filename: string = 'venue-layout.png'
): void => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
