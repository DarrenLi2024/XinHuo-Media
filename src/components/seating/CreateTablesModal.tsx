import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface CreateTablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (count: number, capacity: number, prefix: string) => void;
}

export const CreateTablesModal: React.FC<CreateTablesModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [count, setCount] = useState(10);
  const [capacity, setCapacity] = useState(10);
  const [prefix, setPrefix] = useState('A');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (count > 0 && capacity > 0 && prefix.trim()) {
      onCreate(count, capacity, prefix.trim());
      onClose();
    }
  };

  // 生成预览
  const preview = [];
  for (let i = 1; i <= Math.min(count, 5); i++) {
    preview.push(`${prefix}${i}`);
  }
  if (count > 5) {
    preview.push('...');
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">批量创建桌位</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              桌位数量
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              min="1"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              每桌座位数
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              min="1"
              max="30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              桌位前缀
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="例如: A、B、VIP-"
              maxLength={10}
            />
          </div>

          {/* Preview */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-2">预览：</p>
            <div className="flex flex-wrap gap-2">
              {preview.map((name, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm"
                >
                  {name}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              将创建 {count} 个桌位，共 {count * capacity} 个座位
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={count <= 0 || capacity <= 0 || !prefix.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            创建桌位
          </button>
        </div>
      </div>
    </div>
  );
};
