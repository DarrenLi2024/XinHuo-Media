import React, { useState, useEffect } from 'react';
import { X, User, Building, Phone, Briefcase, Tag, Save, UserX } from 'lucide-react';
import type { Person } from '@/types/seating';

interface PersonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  tableName?: string;
  seatNumber?: number;
  isLeader?: boolean;
  onSave: (personId: string, updates: Partial<Person>) => void;
  onRemove?: () => void;
  isSeatLocked?: boolean;
}

export const PersonDetailModal: React.FC<PersonDetailModalProps> = ({
  isOpen,
  onClose,
  person,
  tableName,
  seatNumber,
  isLeader = false,
  onSave,
  onRemove,
  isSeatLocked = false,
}) => {
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (person) {
      setEditName(person.name);
      setEditCompany(person.company);
      setEditPhone(person.phone);
      setEditTitle(person.title);
      setEditTags(person.tags.join(', '));
      setIsEditing(false);
    }
  }, [person]);

  if (!isOpen || !person) return null;

  const handleSave = () => {
    if (!editName.trim()) {
      alert('姓名不能为空');
      return;
    }
    
    const tags = editTags
      .split(/[,，]/)
      .map(t => t.trim())
      .filter(t => t.length > 0);
    
    onSave(person.id, {
      name: editName.trim(),
      company: editCompany.trim(),
      phone: editPhone.trim(),
      title: editTitle.trim(),
      tags,
    });
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(person.name);
    setEditCompany(person.company);
    setEditPhone(person.phone);
    setEditTitle(person.title);
    setEditTags(person.tags.join(', '));
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <User className="text-blue-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {isEditing ? '编辑嘉宾信息' : '嘉宾详情'}
              </h3>
              {tableName && (
                <p className="text-sm text-slate-400">
                  {tableName}
                  {seatNumber && ` · 座位 ${seatNumber}`}
                  {isLeader && (
                    <span className="ml-2 px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs">
                      桌长
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* 姓名 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <User size={14} className="text-blue-400" />
              姓名 <span className="text-red-400">*</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="请输入姓名"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-700/50 rounded-lg text-white">
                {person.name || '-'}
              </p>
            )}
          </div>

          {/* 公司全称 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Building size={14} className="text-green-400" />
              公司全称
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editCompany}
                onChange={(e) => setEditCompany(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="请输入公司全称"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-700/50 rounded-lg text-white">
                {person.company || '-'}
              </p>
            )}
          </div>

          {/* 手机号 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Phone size={14} className="text-purple-400" />
              手机号
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="请输入手机号"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-700/50 rounded-lg text-white">
                {person.phone || '-'}
              </p>
            )}
          </div>

          {/* 嘉宾身份 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Briefcase size={14} className="text-amber-400" />
              嘉宾身份
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="请输入嘉宾身份（如：CEO、总监等）"
              />
            ) : (
              <p className="px-3 py-2 bg-slate-700/50 rounded-lg text-white">
                {person.title || '-'}
              </p>
            )}
          </div>

          {/* 标签 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Tag size={14} className="text-cyan-400" />
              标签
            </label>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="多个标签用逗号分隔"
                />
                <p className="text-xs text-slate-500 mt-1">多个标签用逗号分隔</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {person.tags.length > 0 ? (
                  person.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </div>
            )}
          </div>

          {/* 锁定状态提示 */}
          {isSeatLocked && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-300">
                该桌位已锁定，部分操作受限
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700 bg-slate-800/80">
          <div>
            {onRemove && !isSeatLocked && (
              <button
                onClick={() => {
                  if (confirm('确定要移除该嘉宾吗？')) {
                    onRemove();
                    onClose();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <UserX size={16} />
                移除嘉宾
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save size={16} />
                  保存
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                编辑信息
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
