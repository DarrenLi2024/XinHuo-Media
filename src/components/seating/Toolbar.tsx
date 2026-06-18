import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  Download,
  Shuffle,
  Trash2,
  CreditCard,
  Plus,
  Edit3,
  Check,
  UserX,
  LayoutGrid,
  Unlock,
  Lock,
  ChevronDown,
} from 'lucide-react';

interface EventOption {
  id: string;
  name: string;
}

interface ToolbarProps {
  selectedEventId: string;
  events: EventOption[];
  onEventChange: (id: string) => void;
  onSyncClick: () => void;
  onExportClick: () => void;
  onAutoSeat: () => void;
  onClearSeating: () => void;
  onClearTables: () => void;
  onClearPersons: () => void;
  onGenerateCards: () => void;
  onCreateTables: () => void;
  onToggleAllSeatLocks?: () => void;
  isAllSeatLocked?: boolean;
  totalPersons: number;
  seatedPersons: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  selectedEventId,
  events,
  onEventChange,
  onSyncClick,
  onExportClick,
  onAutoSeat,
  onClearSeating,
  onClearTables,
  onClearPersons,
  onGenerateCards,
  onCreateTables,
  onToggleAllSeatLocks,
  isAllSeatLocked = false,
  totalPersons,
  seatedPersons,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const currentEvent = events.find((e) => e.id === selectedEventId);

  return (
    <header className="bg-slate-900/80 backdrop-blur-lg border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Activity Selector */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-xl font-bold text-white hover:text-blue-400 transition-colors"
            >
              {currentEvent?.name || '选择活动'}
              <ChevronDown size={18} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-2 w-72 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
                  {events.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => { onEventChange(ev.id); setDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 transition-colors ${
                        ev.id === selectedEventId ? 'bg-blue-600/20 text-blue-300' : 'text-slate-300'
                      }`}
                    >
                      {ev.name}
                    </button>
                  ))}
                  {events.length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-500">暂无活动</div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 ml-6 pl-6 border-l border-slate-700">
            <div className="text-sm">
              <span className="text-slate-400">总人数：</span>
              <span className="text-white font-medium ml-1">{totalPersons}</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-400">已入座：</span>
              <span className="text-green-400 font-medium ml-1">{seatedPersons}</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-400">未入座：</span>
              <span className="text-yellow-400 font-medium ml-1">{totalPersons - seatedPersons}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSyncClick}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <RefreshCw size={18} />
            <span>同步名单</span>
          </button>

          <button
            onClick={onCreateTables}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            <Plus size={18} />
            <span>创建桌位</span>
          </button>

          <div className="w-px h-8 bg-slate-700 mx-2" />

          <button
            onClick={onAutoSeat}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="自动排座（跳过锁定的桌位）"
          >
            <Shuffle size={18} />
            <span>自动排座</span>
          </button>

          {onToggleAllSeatLocks && (
            <button
              onClick={onToggleAllSeatLocks}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isAllSeatLocked
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-slate-700 text-white hover:bg-amber-600'
              }`}
            >
              {isAllSeatLocked ? <Unlock size={18} /> : <Lock size={18} />}
              <span>{isAllSeatLocked ? '解锁全部' : '锁定全部'}</span>
            </button>
          )}

          <button
            onClick={onClearSeating}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Trash2 size={18} />
            <span>清空排座</span>
          </button>

          <button
            onClick={onClearTables}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Trash2 size={18} />
            <span>清除桌位</span>
          </button>

          <button
            onClick={onClearPersons}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <UserX size={18} />
            <span>清空名单</span>
          </button>

          <button
            onClick={onGenerateCards}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <CreditCard size={18} />
            <span>生成桌位牌</span>
          </button>

          <Link
            href="/seating/layout"
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <LayoutGrid size={18} />
            <span>场地布局</span>
          </Link>

          <button
            onClick={onExportClick}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={18} />
            <span>导出</span>
          </button>
        </div>
      </div>
    </header>
  );
};
