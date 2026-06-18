import { useState, useCallback, useEffect } from 'react';
import { 
  Layout, 
  VenueElement, 
  TableLayoutPosition, 
  LayoutConfig, 
  DEFAULT_LAYOUT_CONFIG 
} from '@/types/seating-layout';
import { generateId, saveToStorage, loadFromStorage } from '@/lib/seating/helpers';
import { Table } from '@/types/seating';

const STORAGE_KEY = 'smart-seating-layout';

const defaultLayout: Layout = {
  id: generateId(),
  name: '场地布局',
  venueElements: [],
  tablePositions: [],
  config: DEFAULT_LAYOUT_CONFIG,
  canvasWidth: 1200,
  canvasHeight: 800,
};

export const useLayoutStore = () => {
  const [layout, setLayout] = useState<Layout>(() => 
    loadFromStorage(STORAGE_KEY, defaultLayout)
  );

  // 自动保存
  useEffect(() => {
    saveToStorage(STORAGE_KEY, layout);
  }, [layout]);

  // 更新布局名称
  const updateLayoutName = useCallback((name: string) => {
    setLayout(prev => ({ ...prev, name }));
  }, []);

  // 添加场地构件
  const addVenueElement = useCallback((element: Omit<VenueElement, 'id'>) => {
    setLayout(prev => ({
      ...prev,
      venueElements: [...prev.venueElements, { ...element, id: generateId() }],
    }));
  }, []);

  // 更新场地构件
  const updateVenueElement = useCallback((id: string, updates: Partial<VenueElement>) => {
    setLayout(prev => ({
      ...prev,
      venueElements: prev.venueElements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  }, []);

  // 删除场地构件
  const removeVenueElement = useCallback((id: string) => {
    setLayout(prev => ({
      ...prev,
      venueElements: prev.venueElements.filter(el => el.id !== id),
    }));
  }, []);

  // 添加桌位到布局
  const addTableToLayout = useCallback((table: Table, x: number, y: number) => {
    setLayout(prev => {
      // 检查是否已存在
      const exists = prev.tablePositions.find(p => p.tableId === table.id);
      if (exists) return prev;

      const newPosition: TableLayoutPosition = {
        tableId: table.id,
        tableName: table.name,
        capacity: table.capacity,
        x,
        y,
        rotation: 0,
        scale: 1,
      };

      return {
        ...prev,
        tablePositions: [...prev.tablePositions, newPosition],
      };
    });
  }, []);

  // 更新桌位位置
  const updateTablePosition = useCallback((tableId: string, updates: Partial<TableLayoutPosition>) => {
    setLayout(prev => ({
      ...prev,
      tablePositions: prev.tablePositions.map(p => 
        p.tableId === tableId ? { ...p, ...updates } : p
      ),
    }));
  }, []);

  // 从布局移除桌位
  const removeTableFromLayout = useCallback((tableId: string) => {
    setLayout(prev => ({
      ...prev,
      tablePositions: prev.tablePositions.filter(p => p.tableId !== tableId),
    }));
  }, []);

  // 批量设置桌位位置（用于自动排列）
  const setTablePositions = useCallback((positions: TableLayoutPosition[]) => {
    setLayout(prev => ({
      ...prev,
      tablePositions: positions,
    }));
  }, []);

  // 更新配置
  const updateConfig = useCallback((updates: Partial<LayoutConfig>) => {
    setLayout(prev => ({
      ...prev,
      config: { ...prev.config, ...updates },
    }));
  }, []);

  // 更新画布尺寸
  const updateCanvasSize = useCallback((width: number, height: number) => {
    setLayout(prev => ({
      ...prev,
      canvasWidth: width,
      canvasHeight: height,
    }));
  }, []);

  // 清空布局
  const clearLayout = useCallback(() => {
    setLayout(prev => ({
      ...prev,
      venueElements: [],
      tablePositions: [],
    }));
  }, []);

  // 自动排列桌位
  const autoArrangeTables = useCallback((tables: Table[]) => {
    setLayout(prev => {
      const { config, venueElements } = prev;
      const positions: TableLayoutPosition[] = [];

      // 找到舞台位置，确定起始Y坐标
      const stage = venueElements.find(el => el.type === 'stage');
      const startY = stage ? stage.y + stage.height + config.rowSpacing : 120;

      // 计算起始X坐标（居中）
      const tableWidth = 120;
      const totalWidth = config.tablesPerRow * tableWidth + (config.tablesPerRow - 1) * (config.tableSpacing - tableWidth);
      const startX = Math.max(80, (1200 - totalWidth) / 2);

      // 分离VIP桌位和普通桌位
      const vipTables = tables.filter(t => t.name.toUpperCase().startsWith('VIP'));
      const normalTables = tables.filter(t => !t.name.toUpperCase().startsWith('VIP'));

      // VIP桌位排在第一排
      let currentX = startX;
      let currentY = startY;
      let rowIndex = 0;
      let colIndex = 0;

      // 先排列VIP桌位
      vipTables.forEach((table) => {
        positions.push({
          tableId: table.id,
          tableName: table.name,
          capacity: table.capacity,
          x: currentX,
          y: currentY,
          rotation: 0,
          scale: 1,
        });

        colIndex++;
        if (colIndex >= config.tablesPerRow) {
          colIndex = 0;
          rowIndex++;
          currentX = startX;
          currentY += config.rowSpacing;
        } else {
          currentX += config.tableSpacing;
        }
      });

      // 如果有VIP桌位且还有普通桌位，换行
      if (vipTables.length > 0 && normalTables.length > 0) {
        if (colIndex > 0) {
          rowIndex++;
          currentX = startX;
          currentY += config.rowSpacing;
        }
      }

      // 排列普通桌位（按名称分组，A1/B1/C1...）
      const groupedTables: Record<string, Table[]> = {};
      normalTables.forEach(table => {
        const prefix = table.name.replace(/\d+/g, '');
        if (!groupedTables[prefix]) groupedTables[prefix] = [];
        groupedTables[prefix].push(table);
      });

      // 按前缀排序
      const sortedPrefixes = Object.keys(groupedTables).sort();
      
      sortedPrefixes.forEach(prefix => {
        const groupTables = groupedTables[prefix].sort((a, b) => {
          const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
          return numA - numB;
        });

        groupTables.forEach((table) => {
          positions.push({
            tableId: table.id,
            tableName: table.name,
            capacity: table.capacity,
            x: currentX,
            y: currentY,
            rotation: 0,
            scale: 1,
          });

          colIndex++;
          if (colIndex >= config.tablesPerRow) {
            colIndex = 0;
            rowIndex++;
            currentX = startX;
            currentY += config.rowSpacing;
          } else {
            currentX += config.tableSpacing;
          }
        });

        // 每组结束后换行
        if (colIndex > 0) {
          colIndex = 0;
          rowIndex++;
          currentX = startX;
          currentY += config.rowSpacing;
        }
      });

      return {
        ...prev,
        tablePositions: positions,
        canvasHeight: Math.max(800, currentY + 200),
      };
    });
  }, []);

  return {
    layout,
    updateLayoutName,
    addVenueElement,
    updateVenueElement,
    removeVenueElement,
    addTableToLayout,
    updateTablePosition,
    removeTableFromLayout,
    setTablePositions,
    updateConfig,
    updateCanvasSize,
    clearLayout,
    autoArrangeTables,
  };
};
