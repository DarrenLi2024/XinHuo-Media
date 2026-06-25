'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Search, X, MapPin } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { useActivityStore } from '@/store/seating-activity-store';
import { Toolbar } from '@/components/seating/Toolbar';
import { PersonPool } from '@/components/seating/PersonPool';
import { TableCard } from '@/components/seating/TableCard';
import { CreateTablesModal } from '@/components/seating/CreateTablesModal';
// 懒加载大型组件（html2canvas + jspdf）
import { ExportModalLazy, TableCardGeneratorLazy } from '@/components/seating/lazy';
import type { Person } from '@/types/seating';

export default function SeatingPage() {
  const searchParams = useSearchParams();
  const [rosterEventId, setRosterEventId] = useState(searchParams.get('event') || '');

  // 如果没有 event 参数，自动取第一个活动
  useEffect(() => {
    if (!rosterEventId) {
      fetch('/api/events?limit=1').then(r => r.json()).then(json => {
        if (json.data?.[0]?.id) setRosterEventId(json.data[0].id);
      }).catch(() => setRosterEventId('11111111-1111-4111-8111-111111111111'));
    }
  }, []);

  const {
    activity,
    addPersons,
    removePerson,
    clearUnassignedPersons,
    clearPersons: clearAllPersons,
    updatePerson,
    createTables,
    removeTable,
    updateTable,
    movePersonToTable,
    movePersonToPool,
    reorderInTable,
    clearSeating,
    clearPersons,
    clearTables,
    performAutoSeat,
    importSeatingData,
    swapPersonsBetweenTables,
    toggleSeatLock,
    togglePositionLock,
    unlockAllSeatLocks,
    lockAllSeatLocks,
    isAllSeatLocked,
    reorderTables,
    movePersonUp,
    movePersonDown,
  } = useActivityStore();

  // 弹窗状态
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCreateTablesModal, setShowCreateTablesModal] = useState(false);
  const [showCardGenerator, setShowCardGenerator] = useState(false);


  // 手动同步名单（从 roster 拉取参会人员）
  const [syncing, setSyncing] = useState(false);
  const [eventOptions, setEventOptions] = useState<{ id: string; name: string }[]>([]);

  // 加载活动列表
  useEffect(() => {
    fetch('/api/events?limit=50').then(r => r.json()).then(json => {
      if (json.data) setEventOptions(json.data);
    }).catch(() => {});
  }, []);

  const handleEventChange = (id: string) => {
    setRosterEventId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('event', id);
    window.history.replaceState({}, '', url.toString());
  };

  const handleSyncRoster = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`/api/seating/guests?eventId=${rosterEventId}`);
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        if (activity?.persons?.length > 0) clearUnassignedPersons();
        const persons = json.data.map((p: Record<string, unknown>) => ({
          id: String(p.id),
          name: String(p.name || ''),
          company: String(p.company || ''),
          companyShort: String(p.company || '').slice(0, 8),
          title: String(p.position || p.title || ''),
          phone: String(p.phone || ''),
          tags: p.category ? [String(p.category)] : [],
          tableNumber: (p.tableId && p.tableId !== 'null') ? String(p.tableId) : undefined,
          locked: false,
        }));
        addPersons(persons);
      }
      const eventRes = await fetch(`/api/events/${rosterEventId}`);
      const eventJson = await eventRes.json();
    } catch { /* ignore */ }
    setSyncing(false);
  };

  // 搜索定位
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedPersonId, setHighlightedPersonId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 快速换位
  const [selectedPersonForSwap, setSelectedPersonForSwap] = useState<{
    personId: string;
    sourceTableId: string;
    personName: string;
  } | null>(null);

  // 拖拽传感器（设置激活距离，避免误触点击）
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // 统计
  const totalPersons = useMemo(() => {
    const seated = activity.tables.reduce((sum, t) => sum + t.persons.length, 0);
    return activity.persons.length + seated;
  }, [activity]);

  const seatedPersons = useMemo(
    () => activity.tables.reduce((sum, t) => sum + t.persons.length, 0),
    [activity.tables]
  );

  // 搜索结果（已入座人员）
  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    const results: { person: Person; tableId: string; tableName: string; seatNumber: number }[] = [];
    activity.tables.forEach((table) => {
      table.persons.forEach((person, index) => {
        if (
          person.name.toLowerCase().includes(term) ||
          (person.company || '').toLowerCase().includes(term) ||
          (person.companyShort || '').toLowerCase().includes(term)
        ) {
          results.push({ person, tableId: table.id, tableName: table.name, seatNumber: index + 1 });
        }
      });
    });
    return results;
  }, [searchTerm, activity.tables]);

  // 定位并高亮人员
  const handleLocatePerson = useCallback((personId: string, tableId: string) => {
    setHighlightedPersonId(personId);
    setTimeout(() => {
      const el = document.getElementById(`table-${tableId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightedPersonId(null), 3000);
  }, []);

  // 快速换位：选中/交换
  const handleSwapPerson = useCallback(
    (personId: string, tableId: string, personName: string) => {
      setSelectedPersonForSwap((prev) => {
        // 未选中 -> 选中当前
        if (!prev) {
          return { personId, sourceTableId: tableId, personName };
        }
        // 再次点击同一人 -> 取消选中
        if (prev.personId === personId) {
          return null;
        }
        // 选中不同人：将先前选中的人移动到当前人所在桌位
        swapPersonsBetweenTables(prev.personId, prev.sourceTableId, tableId);
        return null;
      });
    },
    [swapPersonsBetweenTables]
  );

  // 拖拽开始：清空换位选择
  const handleDragStart = useCallback((_event: DragStartEvent) => {
    setSelectedPersonForSwap(null);
  }, []);

  // 拖拽结束
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current as
        | { type?: string; tableId?: string }
        | undefined;
      const overData = over.data.current as
        | { type?: string; table?: { id: string }; tableId?: string }
        | undefined;
      if (!activeData) return;

      // 场景：整桌排序（拖拽桌位卡片）
      if (activeData.type === 'table-card') {
        if (overData?.type === 'table-card' && active.id !== over.id) {
          const fromIndex = activity.tables.findIndex((t) => t.id === active.id);
          const toIndex = activity.tables.findIndex((t) => t.id === over.id);
          if (fromIndex !== -1 && toIndex !== -1) {
            // 位置锁定的桌位不参与排序
            if (!activity.tables[fromIndex].positionLock) {
              reorderTables(fromIndex, toIndex);
            }
          }
        }
        return;
      }

      // 以下为人员拖拽
      const personId = active.id as string;
      const sourceTableId = activeData.tableId;

      // 场景1/2：拖到桌位空白区域（droppable）
      if (overData?.type === 'table' && overData.table) {
        const targetTableId = overData.table.id;
        if (sourceTableId === targetTableId) return;
        movePersonToTable(personId, targetTableId, sourceTableId);
        return;
      }

      // 场景3：拖回未分配池
      if (overData?.type === 'person-pool') {
        if (sourceTableId) {
          movePersonToPool(personId, sourceTableId);
        }
        return;
      }

      // 场景4：拖到某个人员卡片上
      if (overData?.type === 'table-person') {
        const targetTableId = overData.tableId;
        if (!targetTableId) return;
        if (sourceTableId === targetTableId) {
          // 同桌内重排
          const table = activity.tables.find((t) => t.id === sourceTableId);
          if (table) {
            const oldIndex = table.persons.findIndex((p) => p.id === personId);
            const newIndex = table.persons.findIndex((p) => p.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
              reorderInTable(sourceTableId!, oldIndex, newIndex);
            }
          }
        } else {
          // 跨桌移动到目标桌位
          movePersonToTable(personId, targetTableId, sourceTableId);
        }
        return;
      }

      // 拖到未分配池中的人员卡片上 -> 视为放回池
      if (overData?.type === 'person' && sourceTableId) {
        movePersonToPool(personId, sourceTableId);
      }
    },
    [activity.tables, reorderTables, movePersonToTable, movePersonToPool, reorderInTable]
  );

  // 自动排座
  const handleAutoSeat = useCallback(() => {
    if (activity.tables.length === 0) {
      alert('请先创建桌位');
      return;
    }
    performAutoSeat();
  }, [activity.tables.length, performAutoSeat]);

  // 清空排座（带确认）
  const handleClearSeating = useCallback(() => {
    if (seatedPersons === 0) return;
    if (confirm('确定要清空排座吗？已锁定的桌位将被跳过。')) {
      clearSeating();
    }
  }, [seatedPersons, clearSeating]);

  // 清除桌位（带确认）
  const handleClearTables = useCallback(() => {
    if (activity.tables.length === 0) return;
    if (confirm('确定要清除全部桌位吗？桌内人员将移回未分配池。')) {
      clearTables();
    }
  }, [activity.tables.length, clearTables]);

  // 清空名单（带确认）
  const handleClearPersons = useCallback(() => {
    if (totalPersons === 0) return;
    if (confirm('确定要清空全部名单吗？已锁定的桌位将被保留。')) {
      clearPersons();
    }
  }, [totalPersons, clearPersons]);

  // 一键锁定/解锁全部桌员
  const allSeatLocked = isAllSeatLocked();
  const handleToggleAllSeatLocks = useCallback(() => {
    if (allSeatLocked) {
      unlockAllSeatLocks();
    } else {
      lockAllSeatLocks();
    }
  }, [allSeatLocked, unlockAllSeatLocks, lockAllSeatLocks]);

  // 快速调序
  const handleQuickReorder = useCallback(
    (tableId: string, targetTableNumber: string) => {
      const target = targetTableNumber.trim().toLowerCase();
      const targetIndex = activity.tables.findIndex((t) => t.name.toLowerCase() === target);
      if (targetIndex === -1) {
        alert('未找到目标桌位');
        return;
      }
      const currentIndex = activity.tables.findIndex((t) => t.id === tableId);
      if (currentIndex === -1) return;
      if (currentIndex === targetIndex) return;
      reorderTables(currentIndex, targetIndex);
    },
    [activity.tables, reorderTables]
  );

  return (
    <div className="-m-6 flex flex-col min-h-[calc(100vh-4rem)] bg-slate-900 text-white">
      <Toolbar
        selectedEventId={rosterEventId}
        events={eventOptions}
        onEventChange={handleEventChange}
        onSyncClick={handleSyncRoster}
        onExportClick={() => setShowExportModal(true)}
        onAutoSeat={handleAutoSeat}
        onClearSeating={handleClearSeating}
        onClearTables={handleClearTables}
        onClearPersons={handleClearPersons}
        onGenerateCards={() => setShowCardGenerator(true)}
        onCreateTables={() => setShowCreateTablesModal(true)}
        onToggleAllSeatLocks={handleToggleAllSeatLocks}
        isAllSeatLocked={allSeatLocked}
        totalPersons={totalPersons}
        seatedPersons={seatedPersons}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4 p-4 overflow-hidden">
          {/* 左侧：未分配人员池 */}
          <div className="w-80 flex-shrink-0">
            <SortableContext items={activity.persons.map((p) => p.id)} strategy={rectSortingStrategy}>
              <PersonPool
                persons={activity.persons}
                onRemovePerson={removePerson}
                onClearPersons={clearUnassignedPersons}
              />
            </SortableContext>
          </div>

          {/* 右侧：桌位区域 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 搜索定位栏 */}
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索已入座人员（姓名 / 公司）进行定位..."
                  className="w-full pl-9 pr-9 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* 搜索结果 */}
              {searchTerm && (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/80">
                  {searchResults.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-slate-500">未找到匹配的已入座人员</p>
                  ) : (
                    searchResults.map((result) => (
                      <button
                        key={`${result.tableId}-${result.person.id}`}
                        onClick={() => handleLocatePerson(result.person.id, result.tableId)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-slate-700/60 transition-colors"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="text-white truncate">{result.person.name}</span>
                          {result.person.company && (
                            <span className="text-slate-500 truncate">{result.person.company}</span>
                          )}
                        </span>
                        <span className="flex items-center gap-1 text-blue-400 flex-shrink-0">
                          <MapPin size={12} />
                          {result.tableName} · 座位{result.seatNumber}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 快速换位提示 */}
            {selectedPersonForSwap && (
              <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-300">
                <span>
                  已选中 <strong>{selectedPersonForSwap.personName}</strong>，点击另一桌成员的换位按钮即可移动到对方桌位
                </span>
                <button
                  onClick={() => setSelectedPersonForSwap(null)}
                  className="text-green-300 hover:text-white"
                >
                  取消
                </button>
              </div>
            )}

            {/* 桌位网格 */}
            <div className="flex-1 overflow-y-auto">
              {activity.tables.length === 0 ? (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-slate-500">
                  <p className="text-lg mb-2">暂无桌位</p>
                  <p className="text-sm">点击顶部「创建桌位」批量生成桌位</p>
                </div>
              ) : (
                <SortableContext items={activity.tables.map((t) => t.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
                    {activity.tables.map((table, index) => (
                      <div key={table.id} id={`table-${table.id}`}>
                        <TableCard
                          table={table}
                          tableIndex={index}
                          totalTables={activity.tables.length}
                          onRemove={() => removeTable(table.id)}
                          onUpdate={(updates) => updateTable(table.id, updates)}
                          onRemovePerson={(personId) => removePerson(personId)}
                          onSwapPerson={handleSwapPerson}
                          onToggleSeatLock={() => toggleSeatLock(table.id)}
                          onTogglePositionLock={() => togglePositionLock(table.id)}
                          onMovePersonUp={(personIndex) => movePersonUp(table.id, personIndex)}
                          onMovePersonDown={(personIndex) => movePersonDown(table.id, personIndex)}
                          onUpdatePerson={updatePerson}
                          onQuickReorder={(targetTableNumber) =>
                            handleQuickReorder(table.id, targetTableNumber)
                          }
                          highlightedPersonId={highlightedPersonId}
                          highlightRef={highlightRef}
                          isTableHighlighted={table.persons.some(
                            (p) => p.id === highlightedPersonId
                          )}
                          selectedPersonForSwap={selectedPersonForSwap}
                        />
                      </div>
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>
          </div>
        </div>
      </DndContext>

      {/* 弹窗 */}
      {/* 名单从 roster 统一管理，导入功能已移至名单管理 */}
      <ExportModalLazy
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        activity={activity}
        onImportData={importSeatingData}
      />
      <CreateTablesModal
        isOpen={showCreateTablesModal}
        onClose={() => setShowCreateTablesModal(false)}
        onCreate={createTables}
      />
      <TableCardGeneratorLazy
        isOpen={showCardGenerator}
        onClose={() => setShowCardGenerator(false)}
        activityName={activity.name}
        tables={activity.tables}
      />
    </div>
  );
}
