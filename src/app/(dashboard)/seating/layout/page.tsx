'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Grid3X3, 
  Magnet, 
  Trash2, 
  Download, 
  Settings,
  Presentation,
  DoorOpen,
  Columns,
  Square,
  LayoutGrid,
  Users,
  Eye
} from 'lucide-react';
import { useActivityStore } from '@/store/seating-activity-store';
import { useLayoutStore } from '@/store/seating-layout-store';
import { 
  VenueElement, 
  TableLayoutPosition, 
  VENUE_ELEMENT_DEFAULTS,
  VenueElementType,
  AlignMode 
} from '@/types/seating-layout';
import { 
  drawLayout, 
  exportLayoutAsImage 
} from '@/lib/seating/canvas-renderer';

const LayoutPage: React.FC = () => {
  const { activity } = useActivityStore();
  const {
    layout,
    addVenueElement,
    updateVenueElement,
    removeVenueElement,
    addTableToLayout,
    updateTablePosition,
    removeTableFromLayout,
    updateConfig,
    clearLayout,
    autoArrangeTables,
  } = useLayoutStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [draggingElement, setDraggingElement] = useState<{
    type: 'venue' | 'table';
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // 计算已入座人数
  const getSeatedCount = useCallback((tableId: string) => {
    const table = activity.tables.find(t => t.id === tableId);
    return table ? table.persons.length : 0;
  }, [activity.tables]);

  // 获取已布局的桌位ID
  const positionedTableIds = new Set(layout.tablePositions.map(p => p.tableId));
  
  // 获取未布局的桌位
  const unpositionedTables = activity.tables.filter(t => !positionedTableIds.has(t.id));

  // 绘制画布
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 计算所需画布尺寸
    let maxWidth = container.clientWidth;
    let maxHeight = 800;
    
    layout.tablePositions.forEach(p => {
      const tableRadius = Math.max(40, Math.min(80, 20 + p.capacity * 3));
      maxWidth = Math.max(maxWidth, p.x + tableRadius + 100);
      maxHeight = Math.max(maxHeight, p.y + tableRadius + 100);
    });
    
    layout.venueElements.forEach(el => {
      maxWidth = Math.max(maxWidth, el.x + el.width + 100);
      maxHeight = Math.max(maxHeight, el.y + el.height + 100);
    });

    // 设置画布尺寸 - 根据内容动态调整
    canvas.width = Math.max(container.clientWidth, maxWidth);
    canvas.height = Math.max(container.clientHeight, maxHeight);

    // 计算入座人数
    const seatedCounts: Record<string, number> = {};
    layout.tablePositions.forEach(p => {
      seatedCounts[p.tableId] = getSeatedCount(p.tableId);
    });

    // 绘制
    drawLayout(
      ctx,
      canvas.width,
      canvas.height,
      layout.venueElements,
      layout.tablePositions,
      layout.config,
      selectedElementId,
      selectedTableId,
      seatedCounts
    );
  }, [layout, selectedElementId, selectedTableId, getSeatedCount]);

  // 处理画布点击
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = canvas.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    const x = e.clientX - rect.left + scrollLeft;
    const y = e.clientY - rect.top + scrollTop;

    // 检查是否点击了桌位
    for (const position of layout.tablePositions) {
      const tableRadius = Math.max(40, Math.min(80, 20 + position.capacity * 3));
      const distance = Math.sqrt(Math.pow(x - position.x, 2) + Math.pow(y - position.y, 2));
      if (distance < tableRadius + 30) {
        setSelectedTableId(position.tableId);
        setSelectedElementId(null);
        return;
      }
    }

    // 检查是否点击了场地构件
    for (const element of layout.venueElements) {
      if (
        x >= element.x && x <= element.x + element.width &&
        y >= element.y && y <= element.y + element.height
      ) {
        setSelectedElementId(element.id);
        setSelectedTableId(null);
        return;
      }
    }

    // 取消选中
    setSelectedElementId(null);
    setSelectedTableId(null);
  };

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = canvas.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    const x = e.clientX - rect.left + scrollLeft;
    const y = e.clientY - rect.top + scrollTop;

    // 检查桌位
    for (const position of layout.tablePositions) {
      const tableRadius = Math.max(40, Math.min(80, 20 + position.capacity * 3));
      const distance = Math.sqrt(Math.pow(x - position.x, 2) + Math.pow(y - position.y, 2));
      if (distance < tableRadius + 30) {
        setDraggingElement({
          type: 'table',
          id: position.tableId,
          offsetX: x - position.x,
          offsetY: y - position.y,
        });
        setSelectedTableId(position.tableId);
        setSelectedElementId(null);
        return;
      }
    }

    // 检查场地构件
    for (const element of layout.venueElements) {
      if (
        x >= element.x && x <= element.x + element.width &&
        y >= element.y && y <= element.y + element.height
      ) {
        setDraggingElement({
          type: 'venue',
          id: element.id,
          offsetX: x - element.x,
          offsetY: y - element.y,
        });
        setSelectedElementId(element.id);
        setSelectedTableId(null);
        return;
      }
    }
  };

  // 处理拖拽移动
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingElement) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = canvas.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    let x = e.clientX - rect.left + scrollLeft - draggingElement.offsetX;
    let y = e.clientY - rect.top + scrollTop - draggingElement.offsetY;

    // 网格对齐
    if (layout.config.snapToGrid) {
      x = Math.round(x / layout.config.gridSize) * layout.config.gridSize;
      y = Math.round(y / layout.config.gridSize) * layout.config.gridSize;
    }

    // 对齐模式
    if (layout.config.alignMode === 'horizontal') {
      // 横向对齐 - 保持同一行
      const positions = layout.tablePositions.filter(p => p.tableId !== draggingElement.id);
      if (positions.length > 0) {
        const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
        y = avgY;
      }
    } else if (layout.config.alignMode === 'vertical') {
      // 纵向对齐 - 保持同一列
      const positions = layout.tablePositions.filter(p => p.tableId !== draggingElement.id);
      if (positions.length > 0) {
        const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
        x = avgX;
      }
    }

    if (draggingElement.type === 'table') {
      updateTablePosition(draggingElement.id, { x, y });
    } else {
      updateVenueElement(draggingElement.id, { x, y });
    }
  };

  // 处理拖拽结束
  const handleMouseUp = () => {
    setDraggingElement(null);
  };

  // 添加场地构件
  const handleAddVenueElement = (type: VenueElementType) => {
    const defaults = VENUE_ELEMENT_DEFAULTS[type];
    addVenueElement({
      type,
      x: 100,
      y: 50,
      width: defaults.width,
      height: defaults.height,
    });
  };

  // 添加桌位到布局
  const handleAddTableToLayout = (tableId: string) => {
    const table = activity.tables.find(t => t.id === tableId);
    if (!table) return;

    // 找到空闲位置
    const existingPositions = layout.tablePositions;
    let x = 100;
    let y = 100;

    if (existingPositions.length > 0) {
      const lastPosition = existingPositions[existingPositions.length - 1];
      x = lastPosition.x + 200;
      y = lastPosition.y;
      
      // 检查是否超出画布
      if (x > 1000) {
        x = 100;
        y += 200;
      }
    }

    addTableToLayout(table, x, y);
  };

  // 删除选中元素
  const handleDeleteSelected = () => {
    if (selectedElementId) {
      removeVenueElement(selectedElementId);
      setSelectedElementId(null);
    } else if (selectedTableId) {
      removeTableFromLayout(selectedTableId);
      setSelectedTableId(null);
    }
  };

  // 导出布局图
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    exportLayoutAsImage(canvas, `venue-layout-${layout.name}.png`);
  };

  // 自动排列
  const handleAutoArrange = () => {
    autoArrangeTables(activity.tables);
  };

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, selectedTableId]);

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/seating"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>返回排座</span>
          </Link>
          <div className="w-px h-6 bg-slate-700" />
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutGrid size={24} />
            场地布局
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => updateConfig({ showGrid: !layout.config.showGrid })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              layout.config.showGrid ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            <Grid3X3 size={16} />
            网格
          </button>

          <button
            onClick={() => updateConfig({ snapToGrid: !layout.config.snapToGrid })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              layout.config.snapToGrid ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            <Magnet size={16} />
            吸附
          </button>

          <select
            value={layout.config.alignMode}
            onChange={(e) => updateConfig({ alignMode: e.target.value as AlignMode })}
            className="px-3 py-1.5 bg-slate-700 text-white rounded-lg border border-slate-600"
          >
            <option value="free">自由布局</option>
            <option value="horizontal">横向对齐</option>
            <option value="vertical">纵向对齐</option>
            <option value="grid">网格对齐</option>
          </select>

          <div className="w-px h-6 bg-slate-700 mx-2" />

          <button
            onClick={handleAutoArrange}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Users size={16} />
            自动排列
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={!selectedElementId && !selectedTableId}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} />
            删除
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Download size={16} />
            导出图片
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
          {/* Venue Elements */}
          <div className="p-3 border-b border-slate-700">
            <h3 className="text-sm font-medium text-slate-400 mb-2">场地构件</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAddVenueElement('stage')}
                className="flex flex-col items-center gap-1 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Presentation size={20} className="text-purple-400" />
                <span className="text-xs text-slate-300">舞台</span>
              </button>
              <button
                onClick={() => handleAddVenueElement('aisle')}
                className="flex flex-col items-center gap-1 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Columns size={20} className="text-slate-400" />
                <span className="text-xs text-slate-300">过道</span>
              </button>
              <button
                onClick={() => handleAddVenueElement('pillar')}
                className="flex flex-col items-center gap-1 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Square size={20} className="text-slate-500" />
                <span className="text-xs text-slate-300">柱子</span>
              </button>
              <button
                onClick={() => handleAddVenueElement('entrance')}
                className="flex flex-col items-center gap-1 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <DoorOpen size={20} className="text-green-400" />
                <span className="text-xs text-slate-300">入口</span>
              </button>
            </div>
          </div>

          {/* Tables to Layout */}
          <div className="flex-1 overflow-y-auto p-3">
            <h3 className="text-sm font-medium text-slate-400 mb-2">
              待布局桌位 ({unpositionedTables.length})
            </h3>
            {unpositionedTables.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">
                所有桌位已布局完成
              </p>
            ) : (
              <div className="space-y-2">
                {unpositionedTables.map(table => (
                  <div
                    key={table.id}
                    className="flex items-center justify-between p-2 bg-slate-700 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <span className="text-amber-300 text-xs font-bold">{table.name}</span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{table.name}</p>
                        <p className="text-slate-400 text-xs">
                          {table.persons.length}/{table.capacity} 人
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddTableToLayout(table.id)}
                      className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clear Button */}
          <div className="p-3 border-t border-slate-700">
            <button
              onClick={clearLayout}
              className="w-full py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
            >
              清空布局
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div ref={containerRef} className="flex-1 relative overflow-auto bg-slate-100">
          <canvas
            ref={canvasRef}
            className="cursor-grab active:cursor-grabbing"
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="w-64 bg-slate-800 border-l border-slate-700 p-4">
            <h3 className="text-sm font-medium text-white mb-4">布局设置</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">每排桌位数</label>
                <input
                  type="number"
                  value={layout.config.tablesPerRow}
                  onChange={(e) => updateConfig({ tablesPerRow: parseInt(e.target.value) || 4 })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  min="1"
                  max="10"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">排间距 (px)</label>
                <input
                  type="number"
                  value={layout.config.rowSpacing}
                  onChange={(e) => updateConfig({ rowSpacing: parseInt(e.target.value) || 200 })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  min="100"
                  step="20"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">桌间距 (px)</label>
                <input
                  type="number"
                  value={layout.config.tableSpacing}
                  onChange={(e) => updateConfig({ tableSpacing: parseInt(e.target.value) || 180 })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  min="100"
                  step="20"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">网格大小 (px)</label>
                <input
                  type="number"
                  value={layout.config.gridSize}
                  onChange={(e) => updateConfig({ gridSize: parseInt(e.target.value) || 20 })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  min="10"
                  max="50"
                  step="5"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default LayoutPage;
