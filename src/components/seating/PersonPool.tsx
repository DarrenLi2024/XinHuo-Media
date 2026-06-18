import React, { useState, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { User, Trash2, Search, Tag, UserX } from 'lucide-react';
import type { Person } from '@/types/seating';

interface PersonCardProps {
  person: Person;
  onRemove?: () => void;
  draggable?: boolean;
}

export const PersonCard: React.FC<PersonCardProps> = ({ person, onRemove, draggable = true }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: person.id,
    disabled: !draggable,
    data: {
      type: 'person',
      person,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group bg-slate-700/50 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all border border-slate-600/50 hover:border-slate-500 ${
        isDragging ? 'opacity-50 shadow-lg scale-105' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <User className="text-blue-400 flex-shrink-0 mt-0.5" size={16} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-medium truncate">{person.name}</p>
              {person.tableNumber && (
                <span className="px-1.5 py-0.5 bg-green-500/20 text-green-300 rounded text-xs flex-shrink-0">
                  {person.tableNumber}
                </span>
              )}
            </div>
            {person.company && (
              <p className="text-slate-400 text-sm truncate">{person.company}</p>
            )}
            {person.title && (
              <p className="text-slate-500 text-xs truncate">{person.title}</p>
            )}
          </div>
        </div>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all p-1"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      {person.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {person.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs"
            >
              <Tag size={10} className="mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

interface PersonPoolProps {
  persons: Person[];
  onRemovePerson: (personId: string) => void;
  onClearPersons?: () => void;
}

export const PersonPool: React.FC<PersonPoolProps> = ({ persons, onRemovePerson, onClearPersons }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 设置为可放置区域
  const { setNodeRef, isOver } = useDroppable({
    id: 'person-pool',
    data: {
      type: 'person-pool',
    },
  });

  // 提取所有标签
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    persons.forEach((person) => {
      person.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [persons]);

  // 过滤人员
  const filteredPersons = useMemo(() => {
    return persons.filter((person) => {
      const matchesSearch =
        searchTerm === '' ||
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTag =
        selectedTag === null || person.tags.includes(selectedTag);

      return matchesSearch && matchesTag;
    });
  }, [persons, searchTerm, selectedTag]);

  const handleClearAll = () => {
    if (persons.length === 0) return;
    if (confirm(`确定要清空全部 ${persons.length} 位未分配人员吗？`)) {
      onClearPersons?.();
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`h-full flex flex-col bg-slate-800/50 rounded-xl border transition-colors ${
        isOver ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="text-blue-400" size={20} />
            未分配人员
          </h3>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm">
              {persons.length} 人
            </span>
            {onClearPersons && persons.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                title="清空未分配人员"
              >
                <UserX size={12} />
                清空
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索姓名、公司、职位..."
            className="w-full pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                selectedTag === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              全部
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  selectedTag === tag
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Person List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredPersons.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            {persons.length === 0 ? (
              <p>暂无人员，请先导入名单</p>
            ) : (
              <p>未找到匹配的人员</p>
            )}
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredPersons.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                onRemove={() => onRemovePerson(person.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
