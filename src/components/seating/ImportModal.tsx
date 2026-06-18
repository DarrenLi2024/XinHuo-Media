import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { X, Upload, FileText, Clipboard, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import type { Person } from '@/types/seating';
import { parseExcel, parseCSV, parseTXT, parseJSON, parseTextPaste, deduplicatePersons, DeduplicateResult } from '@/lib/seating/helpers';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (persons: Person[]) => void;
  existingPersons?: Person[];  // 已有人员名单（用于去重）
}

type ImportMode = 'file' | 'paste';

export const ImportModal: React.FC<ImportModalProps> = ({ 
  isOpen, 
  onClose, 
  onImport, 
  existingPersons = [] 
}) => {
  const [mode, setMode] = useState<ImportMode>('file');
  const [pasteText, setPasteText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [rawPersons, setRawPersons] = useState<Person[]>([]);  // 解析出的原始人员
  const [error, setError] = useState('');
  const [dedupeResult, setDedupeResult] = useState<DeduplicateResult>({
    unique: [],
    duplicates: [],
    conflicts: [],
    existing: [],
    stats: { total: 0, uniqueCount: 0, duplicateCount: 0, conflictCount: 0, existingCount: 0 }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 稳定化 existingPersons，避免每次渲染创建新数组导致 useEffect 重复触发
  const existingPersonsKey = useMemo(() => {
    return existingPersons.map(p => `${p.name}|${p.phone}`).sort().join(',');
  }, [existingPersons]);

  // 当 rawPersons 或 existingPersons 变化时执行去重
  useEffect(() => {
    if (rawPersons.length === 0) {
      setDedupeResult({
        unique: [],
        duplicates: [],
        conflicts: [],
        existing: [],
        stats: { total: 0, uniqueCount: 0, duplicateCount: 0, conflictCount: 0, existingCount: 0 }
      });
      return;
    }
    
    // 执行去重，传入现有人员名单
    const result = deduplicatePersons(rawPersons, existingPersons);
    setDedupeResult(result);
  }, [rawPersons, existingPersonsKey]);  // 使用稳定化的 key

  // 预览显示的是去重后的唯一人员
  const preview = dedupeResult.unique;

  if (!isOpen) return null;

  const handleFileSelect = async (file: File) => {
    setError('');
    setRawPersons([]);
    
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let result;
      
      switch (extension) {
        case 'xlsx':
        case 'xls':
          result = await parseExcel(file);
          break;
        case 'csv':
          result = await parseCSV(file);
          break;
        case 'txt':
          result = await parseTXT(file);
          break;
        case 'json':
          result = await parseJSON(file);
          break;
        default:
          setError('不支持的文件格式，请上传 .xlsx, .csv, .txt 或 .json 文件');
          return;
      }
      
      if (result.success && result.persons.length > 0) {
        setRawPersons(result.persons);
      } else if (result.errors.length > 0) {
        setError(result.errors.join('\n'));
      } else {
        setError('未能解析出任何人员数据');
      }
    } catch (err) {
      setError('文件解析失败，请检查文件格式');
    }
  };

  const handlePasteSubmit = () => {
    setError('');
    setRawPersons([]);
    
    if (!pasteText.trim()) {
      setError('请输入要导入的数据');
      return;
    }
    
    const result = parseTextPaste(pasteText);
    
    if (result.success && result.persons.length > 0) {
      setRawPersons(result.persons);
    } else if (result.errors.length > 0) {
      setError(result.errors.join('\n'));
    } else {
      setError('未能解析出任何人员数据');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (preview.length > 0) {
      onImport(preview);
      handleClose();
    }
  };

  const handleClose = () => {
    setRawPersons([]);
    setPasteText('');
    setError('');
    setMode('file');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">导入人员名单</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Mode Selector */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('file')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                mode === 'file'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Upload size={18} />
              文件上传
            </button>
            <button
              onClick={() => setMode('paste')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                mode === 'paste'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Clipboard size={18} />
              文本粘贴
            </button>
          </div>

          {/* File Upload Mode */}
          {mode === 'file' && (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-600 hover:border-slate-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileText className="mx-auto mb-4 text-slate-400" size={48} />
              <p className="text-slate-300 mb-2">拖拽文件到此处，或点击选择文件</p>
              <p className="text-slate-500 text-sm mb-4">
                支持 Excel (.xlsx, .xls)、CSV、TXT、JSON 格式
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv,.txt,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                选择文件
              </button>
            </div>
          )}

          {/* Paste Mode */}
          {mode === 'paste' && (
            <div>
              <p className="text-slate-400 text-sm mb-2">
                每行一条数据，支持以下格式：
              </p>
              <ul className="text-slate-500 text-sm mb-4 list-disc list-inside">
                <li>姓名 公司 职位 电话（空格分隔）</li>
                <li>姓名,公司,职位,电话（逗号分隔）</li>
                <li>姓名	TAB	公司	职位	电话（制表符分隔）</li>
              </ul>
              <p className="text-slate-400 text-sm mb-2">
                支持自动标签：@VIP、#理事、【嘉宾】
              </p>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="张三 @VIP 科技公司 CEO 13800138000&#10;李四 #理事 投资公司 董事长 13900139000&#10;王五 【嘉宾】咨询公司 顾问 13700137000"
                className="w-full h-48 bg-slate-700 border border-slate-600 rounded-lg p-4 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handlePasteSubmit}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                解析数据
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Deduplication Stats */}
          {rawPersons.length > 0 && (
            <div className="mt-6 space-y-3">
              {/* Stats Summary */}
              <div className="grid grid-cols-5 gap-3">
                <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{dedupeResult.stats.total}</div>
                  <div className="text-xs text-slate-400">解析总数</div>
                </div>
                <div className="bg-green-500/20 rounded-lg p-3 text-center border border-green-500/30">
                  <div className="text-2xl font-bold text-green-400">{dedupeResult.stats.uniqueCount}</div>
                  <div className="text-xs text-green-300">可导入</div>
                </div>
                <div className="bg-red-500/20 rounded-lg p-3 text-center border border-red-500/30">
                  <div className="text-2xl font-bold text-red-400">{dedupeResult.stats.duplicateCount}</div>
                  <div className="text-xs text-red-300">完全重复</div>
                </div>
                <div className="bg-yellow-500/20 rounded-lg p-3 text-center border border-yellow-500/30">
                  <div className="text-2xl font-bold text-yellow-400">{dedupeResult.stats.conflictCount}</div>
                  <div className="text-xs text-yellow-300">同名冲突</div>
                </div>
                <div className="bg-blue-500/20 rounded-lg p-3 text-center border border-blue-500/30">
                  <div className="text-2xl font-bold text-blue-400">{dedupeResult.stats.existingCount}</div>
                  <div className="text-xs text-blue-300">已存在</div>
                </div>
              </div>

              {/* Detailed Messages */}
              {dedupeResult.stats.duplicateCount > 0 && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-300">
                    <span className="font-medium">完全重复 {dedupeResult.stats.duplicateCount} 人：</span>
                    <span className="text-red-400 ml-1">
                      {dedupeResult.duplicates.slice(0, 3).map(p => p.name).join('、')}
                      {dedupeResult.duplicates.length > 3 && ` 等${dedupeResult.duplicates.length}人`}
                    </span>
                  </div>
                </div>
              )}

              {dedupeResult.stats.conflictCount > 0 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <Users size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-300">
                    <span className="font-medium">同名冲突 {dedupeResult.stats.conflictCount} 人：</span>
                    <span className="text-yellow-400 ml-1">
                      {dedupeResult.conflicts.slice(0, 3).map(p => p.name).join('、')}
                      {dedupeResult.conflicts.length > 3 && ` 等${dedupeResult.conflicts.length}人`}
                    </span>
                    <span className="text-yellow-200 ml-1">（已保留，同名不同人）</span>
                  </div>
                </div>
              )}

              {dedupeResult.stats.existingCount > 0 && (
                <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <CheckCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-300">
                    <span className="font-medium">已存在于名单 {dedupeResult.stats.existingCount} 人：</span>
                    <span className="text-blue-400 ml-1">
                      {dedupeResult.existing.slice(0, 3).map(p => p.name).join('、')}
                      {dedupeResult.existing.length > 3 && ` 等${dedupeResult.existing.length}人`}
                    </span>
                    <span className="text-blue-200 ml-1">（已跳过）</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview Table */}
          {preview.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                预览（去重后 {preview.length} 人）
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-700/50">
                      <th className="px-4 py-2 text-left text-slate-300 font-medium">姓名</th>
                      <th className="px-4 py-2 text-left text-slate-300 font-medium">公司</th>
                      <th className="px-4 py-2 text-left text-slate-300 font-medium">职位</th>
                      <th className="px-4 py-2 text-left text-slate-300 font-medium">电话</th>
                      <th className="px-4 py-2 text-left text-slate-300 font-medium">标签</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((person, index) => (
                      <tr key={person.id} className={index % 2 === 0 ? 'bg-slate-800/50' : ''}>
                        <td className="px-4 py-2 text-white">{person.name}</td>
                        <td className="px-4 py-2 text-slate-300">{person.company}</td>
                        <td className="px-4 py-2 text-slate-300">{person.title}</td>
                        <td className="px-4 py-2 text-slate-300">{person.phone}</td>
                        <td className="px-4 py-2">
                          {person.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-0.5 bg-blue-500/30 text-blue-300 rounded text-xs mr-1"
                            >
                              {tag}
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <p className="text-slate-500 text-sm mt-2">
                    还有 {preview.length - 10} 人未显示...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={preview.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认导入
          </button>
        </div>
      </div>
    </div>
  );
};
