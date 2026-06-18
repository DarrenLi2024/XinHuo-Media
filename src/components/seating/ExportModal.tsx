import React, { useRef } from 'react';
import { X, Download, FileJson, FileText, FileSpreadsheet, Image } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { Activity } from '@/types/seating';
import { exportToJSON, exportToTXT, exportToExcel } from '@/lib/seating/helpers';
import { saveAs } from 'file-saver';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity;
  onImportData: (data: unknown) => boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  activity,
  onImportData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const json = exportToJSON(activity);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, `排座数据_${activity.name}.json`);
  };

  const handleExportTXT = () => {
    const txt = exportToTXT(activity);
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `排座表_${activity.name}.txt`);
  };

  const handleExportExcel = async () => {
    await exportToExcel(activity);
  };

  const handleExportImage = async () => {
    // 创建一个临时的包含所有桌位信息的元素
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 40px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-width: 800px;
    `;

    let html = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #fff; font-size: 28px; margin: 0 0 10px 0;">${activity.name}</h1>
        <p style="color: #64748b; font-size: 14px; margin: 0;">生成时间：${new Date().toLocaleString()}</p>
      </div>
    `;

    activity.tables.forEach(table => {
      html += `
        <div style="background: rgba(30, 41, 59, 0.8); border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <h3 style="color: #fff; font-size: 18px; margin: 0;">${table.name}</h3>
            <span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 4px 12px; border-radius: 6px; font-size: 14px;">
              ${table.persons.length}/${table.capacity} 人
            </span>
          </div>
          ${table.persons.length > 0 ? `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
              ${table.persons.map((person, index) => `
                <div style="background: rgba(15, 23, 42, 0.6); padding: 10px; border-radius: 8px; border: 1px solid #1e293b;">
                  <span style="color: #94a3b8; font-size: 12px;">${index + 1}.</span>
                  <span style="color: #fff; font-size: 14px; margin-left: 8px;">${person.name}</span>
                  ${person.company ? `<span style="color: #64748b; font-size: 12px; margin-left: 8px;">${person.company}</span>` : ''}
                </div>
              `).join('')}
            </div>
          ` : '<p style="color: #64748b; text-align: center; margin: 0;">暂无人员</p>'}
        </div>
      `;
    });

    if (activity.persons.length > 0) {
      html += `
        <div style="background: rgba(30, 41, 59, 0.8); border: 1px solid #334155; border-radius: 12px; padding: 20px;">
          <h3 style="color: #fff; font-size: 18px; margin: 0 0 16px 0;">未分配人员 (${activity.persons.length}人)</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${activity.persons.map(person => `
              <span style="background: rgba(15, 23, 42, 0.6); color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 14px; border: 1px solid #1e293b;">
                ${person.name}
              </span>
            `).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#0f172a',
      });

      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `排座图_${activity.name}.png`);
        }
      });
    } finally {
      document.body.removeChild(container);
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const result = onImportData(data);
        if (result === true) {
          onClose();
        } else {
          alert('导入失败，请检查文件格式');
        }
      } catch {
        alert('JSON 解析失败');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">导入/导出数据</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          {/* Export Options */}
          <div className="mb-6">
            <p className="text-sm text-slate-400 mb-3">导出格式</p>
            
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                <FileJson className="text-blue-400" size={20} />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">JSON 格式</p>
                <p className="text-slate-500 text-sm">导出完整排座数据，可重新导入</p>
              </div>
            </button>

            <button
              onClick={handleExportTXT}
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors group mt-2"
            >
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                <FileText className="text-green-400" size={20} />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">TXT 文本</p>
                <p className="text-slate-500 text-sm">导出为文本排座表</p>
              </div>
            </button>

            <button
              onClick={handleExportExcel}
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors group mt-2"
            >
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                <FileSpreadsheet className="text-emerald-400" size={20} />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Excel 表格</p>
                <p className="text-slate-500 text-sm">导出为 Excel 文件</p>
              </div>
            </button>

            <button
              onClick={handleExportImage}
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors group mt-2"
            >
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                <Image className="text-purple-400" size={20} />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">PNG 图片</p>
                <p className="text-slate-500 text-sm">导出为图片排座表</p>
              </div>
            </button>
          </div>

          {/* Import */}
          <div className="border-t border-slate-700 pt-4">
            <p className="text-sm text-slate-400 mb-3">导入数据</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-lg transition-colors"
            >
              <Download className="text-blue-400" size={20} />
              <div className="text-left">
                <p className="text-white font-medium">导入 JSON 排座数据</p>
                <p className="text-slate-500 text-sm">从之前导出的 JSON 恢复排座</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
