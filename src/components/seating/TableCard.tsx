import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Users, Trash2, Edit2, Check, X, User, Crown, ArrowRightLeft, Lock, Unlock, MapPin, ChevronUp, ChevronDown, GripVertical, ArrowLeftRight } from 'lucide-react';
import type { Table, Person } from '@/types/seating';
import { extractCompanyShortName } from '@/lib/seating/helpers';
import { PersonDetailModal } from './PersonDetailModal';

interface TablePersonCardProps {
  person: Person;
  personIndex: number;
  totalPersons: number;
  tableId: string;
  tableName: string;
  onRemove: () => void;
  onSwap?: (personId: string, tableId: string, personName: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onClick?: () => void;
  isHighlighted?: boolean;
  highlightRef?: React.RefObject<HTMLDivElement | null>;
  isSwapSelected?: boolean;
  isSeatLocked?: boolean;
}

const TablePersonCard: React.FC<TablePersonCardProps> = ({ 
  person, 
  personIndex,
  totalPersons,
  tableId,
  tableName,
  onRemove,
  onSwap,
  onMoveUp,
  onMoveDown,
  onClick,
  isHighlighted = false,
  highlightRef,
  isSwapSelected = false,
  isSeatLocked = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: person.id,
    data: {
      type: 'table-person',
      person,
      tableId,
    },
    disabled: isSeatLocked, // 桌员锁定时禁用拖拽
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (isHighlighted && highlightRef) {
          highlightRef.current = node;
        }
      }}
      style={style}
      {...attributes}
      {...(isSeatLocked ? {} : listeners)} // 桌员锁定时禁用拖拽
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`group rounded-lg p-2 transition-all border ${
        isSwapSelected
          ? 'bg-green-500/30 border-green-400 ring-2 ring-green-400/50' 
          : isHighlighted 
          ? 'bg-yellow-500/30 border-yellow-400 ring-2 ring-yellow-400/50' 
          : isSeatLocked
          ? 'bg-slate-700/50 border-amber-500/30' // 锁定状态样式
          : 'bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50'
      } ${isDragging ? 'opacity-50 shadow-lg scale-105' : ''} ${isSeatLocked ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <User className={`flex-shrink-0 ${isSeatLocked ? 'text-amber-400' : 'text-blue-400'}`} size={14} />
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{person.name}</p>
            {person.company && (
              <p className="text-slate-500 text-xs truncate">{person.company}</p>
            )}
          </div>
        </div>
        
        {/* 悬停显示的操作按钮 */}
        <div className={`flex items-center gap-0.5 transition-all ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {/* 上下移动按钮 */}
          {!isSeatLocked && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp?.();
                }}
                disabled={personIndex === 0}
                className={`p-1 rounded transition-colors ${
                  personIndex === 0
                    ? 'bg-slate-700 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-600 text-slate-300 hover:bg-blue-600 hover:text-white'
                }`}
                title="向上移动"
              >
                <ChevronUp size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown?.();
                }}
                disabled={personIndex === totalPersons - 1}
                className={`p-1 rounded transition-colors ${
                  personIndex === totalPersons - 1
                    ? 'bg-slate-700 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-600 text-slate-300 hover:bg-blue-600 hover:text-white'
                }`}
                title="向下移动"
              >
                <ChevronDown size={12} />
              </button>
            </>
          )}
          {/* 快速换位按钮 */}
          {onSwap && !isSeatLocked && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSwap(person.id, tableId, person.name);
              }}
              className={`p-1.5 rounded transition-colors ${
                isSwapSelected
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-600 text-slate-300 hover:bg-green-600 hover:text-white'
              }`}
              title="快速换位"
            >
              <ArrowRightLeft size={12} />
            </button>
          )}
          {/* 移除按钮 */}
          {!isSeatLocked && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1.5 bg-slate-600 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
              title="移除人员"
            >
              <X size={12} />
            </button>
          )}
          {/* 锁定指示器 */}
          {isSeatLocked && (
            <span title="已被锁定">
              <Lock size={12} className="text-amber-400 ml-1" />
            </span>
          )}
        </div>
      </div>
      {person.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5 ml-5">
          {person.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

interface TableCardProps {
  table: Table;
  tableIndex: number;
  totalTables: number;
  onRemove: () => void;
  onUpdate: (updates: Partial<Table>) => void;
  onRemovePerson: (personId: string) => void;
  onSwapPerson?: (personId: string, tableId: string, personName: string) => void;
  onToggleSeatLock?: () => void;
  onTogglePositionLock?: () => void;
  onMovePersonUp?: (personIndex: number) => void;
  onMovePersonDown?: (personIndex: number) => void;
  onUpdatePerson?: (personId: string, updates: Partial<Person>) => void;
  onQuickReorder?: (targetTableNumber: string) => void;
  highlightedPersonId?: string | null;
  highlightRef?: React.RefObject<HTMLDivElement | null>;
  isTableHighlighted?: boolean;
  selectedPersonForSwap?: { personId: string; sourceTableId: string } | null;
}

export const TableCard: React.FC<TableCardProps> = ({
  table,
  tableIndex,
  totalTables,
  onRemove,
  onUpdate,
  onRemovePerson,
  onSwapPerson,
  onToggleSeatLock,
  onTogglePositionLock,
  onMovePersonUp,
  onMovePersonDown,
  onUpdatePerson,
  onQuickReorder,
  highlightedPersonId,
  highlightRef,
  isTableHighlighted = false,
  selectedPersonForSwap,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(table.name);
  const [editCapacity, setEditCapacity] = useState(table.capacity.toString());
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showQuickReorder, setShowQuickReorder] = useState(false);
  const [targetTableNumber, setTargetTableNumber] = useState('');

  // 整桌拖拽排序
  const {
    attributes: tableAttributes,
    listeners: tableListeners,
    setNodeRef: setTableNodeRef,
    transform: tableTransform,
    transition: tableTransition,
    isDragging: isTableDragging,
  } = useSortable({
    id: table.id,
    data: {
      type: 'table-card',
      table,
      tableIndex,
    },
  });

  // 人员拖入桌位
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `droppable-${table.id}`,
    data: {
      type: 'table',
      table,
    },
    disabled: table.seatLock, // 桌员锁定时禁用拖入
  });

  const handleSaveEdit = () => {
    const capacity = parseInt(editCapacity);
    if (editName.trim() && capacity > 0) {
      onUpdate({ name: editName.trim(), capacity });
      setIsEditing(false);
    }
  };

  const handleQuickReorder = () => {
    if (!targetTableNumber.trim()) {
      alert('请输入目标桌号');
      return;
    }
    onQuickReorder?.(targetTableNumber.trim());
    setShowQuickReorder(false);
    setTargetTableNumber('');
  };

  const isFull = table.persons.length >= table.capacity;
  const occupancyRate = (table.persons.length / table.capacity) * 100;
  const isSeatLocked = table.seatLock || false;
  const isPositionLocked = table.positionLock || false;
  
  // 获取桌长（第一个入座的人）
  const tableLeader = table.persons.length > 0 ? table.persons[0] : null;

  const tableStyle = {
    transform: CSS.Transform.toString(tableTransform),
    transition: tableTransition,
    opacity: isTableDragging ? 0.5 : 1,
  };

  return (
    <>
      <div
        ref={(node) => {
          setTableNodeRef(node);
          setDroppableRef(node);
        }}
        style={tableStyle}
        {...tableAttributes}
        className={`bg-slate-800/50 rounded-xl border transition-all overflow-hidden ${
          isSeatLocked ? 'ring-2 ring-amber-500/50' : ''
        } ${
          isTableHighlighted
            ? 'border-green-500 shadow-lg shadow-green-500/30 ring-2 ring-green-400/50 animate-pulse'
            : isOver
            ? 'border-blue-500 shadow-lg shadow-blue-500/20'
            : isFull
            ? 'border-green-500/50'
            : 'border-slate-700'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700 bg-slate-800/80">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="桌位名称"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  placeholder="座位数"
                  min="1"
                />
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-slate-600 text-white rounded hover:bg-slate-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : showQuickReorder ? (
            /* 快速调序输入框 */
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="text-cyan-400" size={16} />
                <span className="text-sm text-white">将 <strong>{table.name}</strong> 移动到目标桌号前：</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={targetTableNumber}
                  onChange={(e) => setTargetTableNumber(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-cyan-500"
                  placeholder="输入目标桌号（如 A3）"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuickReorder();
                    if (e.key === 'Escape') {
                      setShowQuickReorder(false);
                      setTargetTableNumber('');
                    }
                  }}
                />
                <button
                  onClick={handleQuickReorder}
                  className="px-3 py-1.5 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => {
                    setShowQuickReorder(false);
                    setTargetTableNumber('');
                  }}
                  className="px-3 py-1.5 bg-slate-600 text-white rounded hover:bg-slate-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* 拖拽手柄 */}
                  <div
                    {...tableListeners}
                    className={`p-1 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing ${
                      isPositionLocked ? 'opacity-30 cursor-not-allowed' : ''
                    }`}
                    title={isPositionLocked ? '位置已锁定，无法拖拽排序' : '拖拽调整桌位顺序'}
                  >
                    <GripVertical size={16} />
                  </div>
                  {/* 快速调序按钮 */}
                  {!isPositionLocked && (
                    <button
                      onClick={() => setShowQuickReorder(true)}
                      className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                      title="快速调序"
                    >
                      <ArrowLeftRight size={16} />
                    </button>
                  )}
                  <Users className="text-blue-400" size={18} />
                  <h4 className="text-white font-semibold">{table.name}</h4>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      isFull
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {table.persons.length}/{table.capacity}
                  </span>
                  {tableLeader && (
                    <>
                      <Crown className="text-amber-400 ml-1" size={14} />
                      <span className="text-amber-300 font-medium text-sm">{tableLeader.name}</span>
                      {tableLeader.company && (
                        <span className="text-slate-400 text-xs">
                          · {tableLeader.companyShort || extractCompanyShortName(tableLeader.company)}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-1">
                  {/* 锁定按钮 */}
                  {onToggleSeatLock && (
                    <button
                      onClick={onToggleSeatLock}
                      className={`p-1.5 transition-colors ${
                        isSeatLocked
                          ? 'text-amber-400 hover:text-amber-300'
                          : 'text-slate-400 hover:text-amber-400'
                      }`}
                      title={isSeatLocked ? '解锁桌员' : '锁定桌员（禁止拖拽和自动排座）'}
                    >
                      {isSeatLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                  )}
                  {onTogglePositionLock && (
                    <button
                      onClick={onTogglePositionLock}
                      className={`p-1.5 transition-colors ${
                        isPositionLocked
                          ? 'text-purple-400 hover:text-purple-300'
                          : 'text-slate-400 hover:text-purple-400'
                      }`}
                      title={isPositionLocked ? '解锁位置' : '锁定位置（禁止桌位排序移动）'}
                    >
                      <MapPin size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditName(table.name);
                      setEditCapacity(table.capacity.toString());
                      setIsEditing(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white transition-colors"
                    title="编辑桌位"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={onRemove}
                    className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                    title="删除桌位"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Occupancy Bar */}
          {!isEditing && !showQuickReorder && (
            <div className="mt-3">
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isFull
                      ? 'bg-green-500'
                      : occupancyRate > 80
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Persons List */}
        <div className="p-3 min-h-[100px] max-h-[300px] overflow-y-auto">
          {table.persons.length === 0 ? (
            <div className="flex items-center justify-center h-[80px] text-slate-500 text-sm">
              {isSeatLocked ? '桌位已锁定' : '拖拽人员到此处入座'}
            </div>
          ) : (
            <SortableContext
              items={table.persons.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-2">
                {table.persons.map((person, index) => (
                  <TablePersonCard
                    key={person.id}
                    person={person}
                    tableId={table.id}
                    tableName={table.name}
                    personIndex={index}
                    totalPersons={table.persons.length}
                    onRemove={() => onRemovePerson(person.id)}
                    onSwap={onSwapPerson}
                    onMoveUp={onMovePersonUp ? () => onMovePersonUp(index) : undefined}
                    onMoveDown={onMovePersonDown ? () => onMovePersonDown(index) : undefined}
                    onClick={() => setSelectedPerson(person)}
                    isSeatLocked={isSeatLocked}
                    isHighlighted={highlightedPersonId === person.id}
                    highlightRef={highlightRef}
                    isSwapSelected={selectedPersonForSwap?.personId === person.id}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>

      {/* Person Detail Modal */}
      <PersonDetailModal
        isOpen={selectedPerson !== null}
        onClose={() => setSelectedPerson(null)}
        person={selectedPerson}
        tableName={table.name}
        seatNumber={selectedPerson ? table.persons.findIndex(p => p.id === selectedPerson.id) + 1 : undefined}
        isLeader={selectedPerson ? table.persons.findIndex(p => p.id === selectedPerson.id) === 0 : false}
        onSave={(personId, updates) => {
          onUpdatePerson?.(personId, updates);
          setSelectedPerson(null);
        }}
        onRemove={
          isSeatLocked
            ? undefined
            : () => {
                onRemovePerson(selectedPerson!.id);
                setSelectedPerson(null);
              }
        }
        isSeatLocked={isSeatLocked}
      />
    </>
  );
};
