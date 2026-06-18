'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Guest {
  id: string;
  name: string;
  phone: string | null;
  organization: string | null;
  guestType: string;
  tableNumber: string | null;
  qrCode: string;
  checkInStatus: number;
  checkInTime: string | null;
}

interface Stats {
  total: number;
  checkedIn: number;
  notCheckedIn: number;
  checkInRate: number;
  byType: Record<string, { total: number; checkedIn: number }>;
}

type TabType = 'guests' | 'templateDesign' | 'settings' | 'stats';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('guests');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 添加嘉宾表单
  const [newGuest, setNewGuest] = useState({
    name: '',
    phone: '',
    organization: '',
    tableNumber: '',
    guestType: '普通嘉宾',
  });
  const [guestTypes, setGuestTypes] = useState<string[]>(['嘉宾', '特邀嘉宾']);
  const [newType, setNewType] = useState('');
  

  // 批量修改
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchData, setBatchData] = useState({
    guestType: '',
    tableNumber: '',
  });
  
  // 桌号筛选
  const [filterTable, setFilterTable] = useState('all');
  
  // 统计穿透弹窗
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsFilter, setStatsFilter] = useState<'checkedIn' | 'notCheckedIn' | null>(null);
  
  // 提取所有桌号
  const tableNumbers = [...new Set(guests.map(g => g.tableNumber).filter(Boolean))].sort((a, b) => {
    const matchA = String(a).match(/^([A-Za-z]*)(\d+)/);
    const matchB = String(b).match(/^([A-Za-z]*)(\d+)/);
    if (matchA && matchB) {
      if (matchA[1] !== matchB[1]) return matchA[1].localeCompare(matchB[1]);
      return parseInt(matchA[2]) - parseInt(matchB[2]);
    }
    return String(a).localeCompare(String(b));
  }) as string[];

  const searchParams = useSearchParams();
  const eventId = searchParams.get('event') || '11111111-1111-4111-8111-111111111111';

  // 加载数据
  const loadData = async () => {
    try {
      // 数据已通过 roster 统一管理，刷新即可同步名单
      const [guestsRes, statsRes] = await Promise.all([
        fetch(`/api/checkin/guests?event_id=${eventId}`),
        fetch(`/api/checkin/stats-detailed?event_id=${eventId}`),
      ]);
      const guestsData = await guestsRes.json();
      const statsData = await statsRes.json();
      
      if (guestsData.success) {
        setGuests(guestsData.data);
        // 提取所有身份类型
        const types: string[] = [...new Set(guestsData.data.map((g: Guest) => g.guestType))] as string[];
        setGuestTypes(prev => [...new Set([...prev, ...types])]);
      }
      if (statsData.success) setStats(statsData.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 搜索和筛选（客户端过滤）
  const filteredGuests = guests.filter(g => {
    const matchSearch = !searchKeyword || 
      g.name.includes(searchKeyword) || 
      (g.phone && g.phone.includes(searchKeyword)) ||
      (g.organization && g.organization.includes(searchKeyword));
    const matchType = filterType === 'all' || g.guestType === filterType;
    const matchTable = filterTable === 'all' || g.tableNumber === filterTable;
    return matchSearch && matchType && matchTable;
  });

  // 添加嘉宾
  const handleAddGuest = async () => {
    if (!newGuest.name.trim()) {
      alert('请输入姓名');
      return;
    }
    
    try {
      const res = await fetch(`/api/checkin/guests?event_id=${eventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGuest),
      });
      const data = await res.json();
      
      if (data.success) {
        setNewGuest({ name: '', phone: '', organization: '', tableNumber: '', guestType: '普通嘉宾' });
        loadData();
      } else {
        alert('添加失败: ' + data.error);
      }
    } catch (error) {
      alert('添加失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // 添加新身份
  const handleAddType = () => {
    if (newType.trim() && !guestTypes.includes(newType.trim())) {
      setGuestTypes([...guestTypes, newType.trim()]);
      setNewType('');
    }
  };



  // 导出全部嘉宾
  const handleExportAll = async () => {
    try {
      const res = await fetch(`/api/checkin/guests-export?event_id=${eventId}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `嘉宾名单_${new Date().toLocaleDateString()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('导出失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // 导出签到数据
  const handleExportChecked = async () => {
    try {
      const res = await fetch(`/api/checkin/guests-export?event_id=${eventId}&checkedOnly=true`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `签到数据_${new Date().toLocaleDateString()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('导出失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // 批量修改
  const handleBatchUpdate = async () => {
    if (selectedIds.length === 0) {
      alert('请先选择要修改的嘉宾');
      return;
    }
    
    try {
      const res = await fetch(`/api/checkin/guests-batch?event_id=${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, data: batchData }),
      });
      const data = await res.json();
      
      if (data.success) {
        alert(data.message);
        setShowBatchModal(false);
        setSelectedIds([]);
        setBatchData({ guestType: '', tableNumber: '' });
        loadData();
      } else {
        alert('修改失败: ' + data.error);
      }
    } catch (error) {
      alert('修改失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // 生成嘉宾邀请码（为没有二维码的嘉宾生成）
  const handleGenerateQRCodes = async () => {
    const guestsWithoutQR = guests.filter(g => !g.qrCode);
    if (guestsWithoutQR.length === 0) {
      alert('所有嘉宾都已有邀请码');
      return;
    }
    
    if (!confirm(`将为 ${guestsWithoutQR.length} 位嘉宾生成邀请码，确定吗？`)) return;
    
    try {
      // 调用API为每个嘉宾生成二维码
      let successCount = 0;
      for (const guest of guestsWithoutQR) {
        const res = await fetch('/api/checkin/guests/' + guest.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrCode: `QR${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}` }),
        });
        if (res.ok) successCount++;
      }
      alert(`成功为 ${successCount} 位嘉宾生成邀请码`);
      loadData();
    } catch (error) {
      alert('生成失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // 下载单个邀请卡
  const downloadSingleInviteCard = async (guest: Guest) => {
    // 获取活动信息
    const saved = localStorage.getItem('eventSettings');
    const settings = saved ? JSON.parse(saved) : {};
    
    // 创建canvas绘制邀请卡
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 扑克牌尺寸
    const width = 372;
    const height = 520;
    canvas.width = width;
    canvas.height = height;
    
    // 背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // 边框
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, width - 4, height - 4);
    
    // 活动名称
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(settings.eventName || '活动签到', width / 2, 35);
    
    // 分割线
    ctx.strokeStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.moveTo(20, 50);
    ctx.lineTo(width - 20, 50);
    ctx.stroke();
    
    // 二维码
    const qrSize = 120;
    const qrX = (width - qrSize) / 2;
    const qrY = 65;
    
    const qrImg = new window.Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.src = `/api/checkin/qrcode?text=${encodeURIComponent(guest.qrCode)}&size=${qrSize}`;
    
    await new Promise<void>((resolve) => {
      qrImg.onload = () => {
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
        resolve();
      };
      qrImg.onerror = () => resolve();
    });
    
    // 姓名
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(guest.name, width / 2, qrY + qrSize + 45);
    
    // 身份
    const typeY = qrY + qrSize + 70;
    ctx.fillStyle = guest.guestType === '特邀嘉宾' ? '#dc2626' : '#3b82f6';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(guest.guestType, width / 2, typeY);
    
    // 桌号
    if (guest.tableNumber) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px sans-serif';
      ctx.fillText(`桌号: ${guest.tableNumber}`, width / 2, typeY + 25);
    }
    
    // 公司
    if (guest.organization) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px sans-serif';
      ctx.fillText(guest.organization, width / 2, typeY + (guest.tableNumber ? 45 : 25));
    }
    
    return canvas.toDataURL('image/png');
  };

  // 下载选中嘉宾的邀请卡
  const handleDownloadSelected = async () => {
    if (selectedIds.length === 0) {
      alert('请先选择要下载邀请卡的嘉宾');
      return;
    }
    
    const selectedGuests = guests.filter(g => selectedIds.includes(g.id));
    
    for (const guest of selectedGuests) {
      const dataUrl = await downloadSingleInviteCard(guest);
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `${guest.name}_邀请卡.png`;
        link.href = dataUrl;
        link.click();
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  // 按桌号打包下载
  const handleDownloadByTable = async (tableNumber?: string) => {
    const JSZipModule = await import('jszip'); const JSZip = JSZipModule.default || JSZipModule;
    const zip = new JSZip();
    
    let tablesToDownload: string[] = [];
    
    if (tableNumber) {
      tablesToDownload = [tableNumber];
    } else {
      tablesToDownload = [...new Set(guests.map(g => g.tableNumber).filter(Boolean))] as string[];
    }
    
    if (tablesToDownload.length === 0) {
      alert('没有可下载的桌位');
      return;
    }
    
    for (const table of tablesToDownload) {
      const tableGuests = guests.filter(g => g.tableNumber === table);
      const tableFolder = zip.folder(`${table}桌`);
      
      for (const guest of tableGuests) {
        const dataUrl = await downloadSingleInviteCard(guest);
        if (dataUrl && tableFolder) {
          const base64Data = dataUrl.split(',')[1];
          tableFolder.file(`${guest.name}_邀请卡.png`, base64Data, { base64: true });
        }
      }
    }
    
    // 生成并下载压缩包
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.download = tableNumber ? `${tableNumber}桌_邀请卡.zip` : '所有桌_邀请卡.zip';
    link.href = URL.createObjectURL(content);
    link.click();
  };

  // 清除签到状态
  const handleClearCheckIns = async () => {
    if (!confirm('确定要清除所有签到状态吗？')) return;
    
    try {
      const res = await fetch(`/api/checkin/checkin-clear?event_id=${eventId}`, { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        alert(data.message);
        loadData();
      } else {
        alert('清除失败: ' + data.error);
      }
    } catch (error) {
      alert('清除失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // 清空所有数据
  const handleClearAll = async () => {
    if (!confirm('确定要清空所有嘉宾数据吗？此操作不可恢复！')) return;
    
    try {
      const res = await fetch(`/api/checkin/guests-clear?event_id=${eventId}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        alert('已清空所有数据');
        loadData();
      } else {
        alert('清空失败: ' + data.error);
      }
    } catch (error) {
      alert('清空失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // 删除嘉宾
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该嘉宾吗？')) return;
    
    try {
      const res = await fetch(`/api/checkin/guests/${id}?event_id=${eventId}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        loadData();
      } else {
        alert('删除失败: ' + data.error);
      }
    } catch (error) {
      alert('删除失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedIds.length === guests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(guests.map(g => g.id));
    }
  };

  // 切换单个选择
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">活动签到管理系统</h1>
          <div className="flex gap-2">
            <Link
              href="/checkin"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              去签到
            </Link>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              刷新
            </button>
          </div>
        </div>
      </div>

      {/* 功能标签栏 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { key: 'guests', label: '嘉宾管理', icon: '👥' },
              { key: 'templateDesign', label: '模版设计', icon: '🎨' },
              { key: 'settings', label: '活动设置', icon: '⚙️' },
              { key: 'stats', label: '统计看板', icon: '📊' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'guests' && (
          <div className="space-y-6">
            {/* 添加嘉宾卡片 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">+ 添加嘉宾</h2>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">姓名 *</label>
                  <input
                    type="text"
                    value={newGuest.name}
                    onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">电话</label>
                  <input
                    type="text"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="电话"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">单位</label>
                  <input
                    type="text"
                    value={newGuest.organization}
                    onChange={(e) => setNewGuest({ ...newGuest, organization: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="单位"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">嘉宾身份</label>
                  <input
                    type="text"
                    list="guestTypeList"
                    value={newGuest.guestType}
                    onChange={(e) => setNewGuest({ ...newGuest, guestType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="选择或输入身份"
                  />
                  <datalist id="guestTypeList">
                    {guestTypes.map((type) => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">桌号</label>
                  <input
                    type="text"
                    value={newGuest.tableNumber}
                    onChange={(e) => setNewGuest({ ...newGuest, tableNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="桌号"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleAddGuest}
                    className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                  >
                    添加
                  </button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-gray-500">快速添加身份:</span>
                <input
                  type="text"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddType()}
                  className="px-3 py-1 border rounded text-sm"
                  placeholder="输入新身份"
                />
                <button
                  onClick={handleAddType}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                >
                  添加
                </button>
              </div>
            </div>

            {/* 批量操作卡片 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">导出数据</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportAll}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                >
                  📤 导出全部嘉宾
                </button>
                <button
                  onClick={handleExportChecked}
                  className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg text-sm"
                >
                  📊 导出签到数据
                </button>
                <button
                  onClick={() => {
                    if (selectedIds.length === 0) {
                      alert('请先在表格中选择要修改的嘉宾');
                    } else {
                      setShowBatchModal(true);
                    }
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                >
                  ✏️ 批量修改
                </button>
                <button
                  onClick={handleGenerateQRCodes}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm"
                >
                  🔲 生成邀请码
                </button>
                <button
                  onClick={handleDownloadSelected}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                >
                  📥 下载邀请卡
                </button>
                <button
                  onClick={() => handleDownloadByTable()}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
                >
                  📦 按桌打包下载
                </button>
                <button
                  onClick={handleClearCheckIns}
                  className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg text-sm"
                >
                  🔄 清除签到
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                >
                  🗑️ 清空名单
                </button>
              </div>
            </div>

            {/* 数据展示区 */}
            <div className="bg-white rounded-lg shadow">
              {/* 搜索和筛选 */}
              <div className="p-4 border-b flex flex-wrap gap-4 items-center">
                <input
                  type="text"
                  placeholder="搜索姓名、电话、单位..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部身份</option>
                  {guestTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <select
                  value={filterTable}
                  onChange={(e) => setFilterTable(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部桌号</option>
                  {tableNumbers.map((table) => (
                    <option key={table} value={table}>{table} 桌</option>
                  ))}
                </select>
                {filterTable !== 'all' && (
                  <button
                    onClick={() => {
                      const tableGuests = guests.filter(g => g.tableNumber === filterTable);
                      setSelectedIds(tableGuests.map(g => g.id));
                    }}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                  >
                    选择 {filterTable} 桌全部 ({guests.filter(g => g.tableNumber === filterTable).length}人)
                  </button>
                )}
              </div>

              {/* 表格 */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filteredGuests.length && filteredGuests.length > 0}
                          onChange={() => {
                            if (selectedIds.length === filteredGuests.length) {
                              setSelectedIds([]);
                            } else {
                              setSelectedIds(filteredGuests.map(g => g.id));
                            }
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">姓名</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">电话</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">单位</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">嘉宾身份</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">桌号</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">签到码</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredGuests.map((guest) => (
                      <tr key={guest.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(guest.id)}
                            onChange={() => handleToggleSelect(guest.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{guest.name}</td>
                        <td className="px-4 py-3 text-sm">{guest.phone || '-'}</td>
                        <td className="px-4 py-3 text-sm">{guest.organization || '-'}</td>
                        <td className="px-4 py-3 text-sm">{guest.guestType}</td>
                        <td className="px-4 py-3 text-sm">{guest.tableNumber || '-'}</td>
                        <td className="px-4 py-3 text-sm font-mono text-xs">{guest.qrCode}</td>
                        <td className="px-4 py-3 text-sm">
                          {guest.checkInStatus === 1 ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              已签到
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              未签到
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={async () => {
                              if (guest.qrCode) {
                                const dataUrl = await downloadSingleInviteCard(guest);
                                if (dataUrl) {
                                  const link = document.createElement('a');
                                  link.download = `${guest.name}_邀请卡.png`;
                                  link.href = dataUrl;
                                  link.click();
                                }
                              } else {
                                alert('该嘉宾没有邀请码，请先生成');
                              }
                            }}
                            className="text-blue-500 hover:text-blue-700 mr-3"
                          >
                            下载
                          </button>
                          <button
                            onClick={() => handleDelete(guest.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredGuests.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                          暂无数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 底部统计 */}
              <div className="p-4 border-t text-sm text-gray-500 flex justify-between">
                <span>显示 {filteredGuests.length} 条记录（共 {guests.length} 条）</span>
                {selectedIds.length > 0 && (
                  <span className="text-blue-600">已选择 {selectedIds.length} 人</span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-4xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-600 mt-1">总人数</div>
                </div>
                <div 
                  className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setStatsFilter('checkedIn');
                    setShowStatsModal(true);
                  }}
                >
                  <div className="text-4xl font-bold text-green-600">{stats.checkedIn}</div>
                  <div className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                    已签到
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div 
                  className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setStatsFilter('notCheckedIn');
                    setShowStatsModal(true);
                  }}
                >
                  <div className="text-4xl font-bold text-orange-600">{stats.notCheckedIn}</div>
                  <div className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                    未签到
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-4xl font-bold text-purple-600">{stats.checkInRate}%</div>
                  <div className="text-sm text-gray-600 mt-1">签到率</div>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">按行业统计</h3>
              <div className="space-y-3">
                {stats?.byType && Object.entries(stats.byType).map(([type, item]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-gray-700">{type}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">总数: {item.total}</span>
                      <span className="text-green-600">已签到: {item.checkedIn}</span>
                    </div>
                  </div>
                ))}
                {(!stats?.byType || Object.keys(stats.byType).length === 0) && (
                  <div className="text-gray-400 text-sm">暂无行业数据</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templateDesign' && (
          <TemplateDesignPage guests={guests} />
        )}

        {activeTab === 'settings' && (
          <SettingsPage />
        )}
      </div>


      {/* 批量修改弹窗 */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">批量修改 ({selectedIds.length} 人)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">嘉宾身份</label>
                <input
                  type="text"
                  list="batchGuestTypeList"
                  value={batchData.guestType}
                  onChange={(e) => setBatchData({ ...batchData, guestType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="选择或输入身份（留空不修改）"
                />
                <datalist id="batchGuestTypeList">
                  <option value="" />
                  {guestTypes.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-400 mt-1">可从列表选择或直接输入自定义身份</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">桌号</label>
                <input
                  type="text"
                  value={batchData.tableNumber}
                  onChange={(e) => setBatchData({ ...batchData, tableNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="不修改请留空"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBatchModal(false);
                  setBatchData({ guestType: '', tableNumber: '' });
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleBatchUpdate}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 统计穿透弹窗 */}
      {showStatsModal && statsFilter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {statsFilter === 'checkedIn' ? '已签到嘉宾' : '未签到嘉宾'}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  共 {statsFilter === 'checkedIn' ? stats?.checkedIn : stats?.notCheckedIn} 人
                </span>
              </h3>
              <button
                onClick={() => {
                  setShowStatsModal(false);
                  setStatsFilter(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const filteredGuests = statsFilter === 'checkedIn'
                  ? guests.filter(g => g.checkInStatus === 1)
                  : guests.filter(g => g.checkInStatus === 0);
                
                if (filteredGuests.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-500">
                      暂无{statsFilter === 'checkedIn' ? '已签到' : '未签到'}嘉宾
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-2">
                    {filteredGuests.map(guest => {
                      const isSpecialGuest = guest.guestType === '特邀嘉宾';
                      return (
                        <div 
                          key={guest.id} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isSpecialGuest ? 'bg-red-100' : 'bg-gray-200'
                            }`}>
                              <span className="text-sm">{isSpecialGuest ? '🌹' : '👤'}</span>
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {guest.name}
                                {isSpecialGuest && <span className="text-xs text-red-500">特邀</span>}
                              </div>
                              <div className="text-sm text-gray-500">
                                {guest.organization || '-'}
                                {guest.tableNumber && <span className="ml-2">· {guest.tableNumber}桌</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-1 rounded ${
                              isSpecialGuest
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {guest.guestType}
                            </span>
                            {guest.checkInTime && (
                              <span className="text-xs text-gray-400">
                                {new Date(guest.checkInTime).toLocaleString('zh-CN')}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 模版设计组件 ====================

// 模版类型定义
type TemplateType = 'badge' | 'label' | 'invite';

// 元素类型
interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'qrcode';
  label: string;
  field?: string; // 关联的数据字段
  content?: string; // 固定内容
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
  bold: boolean;
  visible: boolean;
  required: boolean; // 是否为必要元素
  aspectRatio?: number; // 图像宽高比
}

// 模版配置
interface TemplateConfig {
  id: string;
  name: string;
  type: TemplateType;
  width: number; // mm
  height: number; // mm
  background: string;
  elements: TemplateElement[];
}

// 默认模版配置
const defaultTemplates: Record<TemplateType, TemplateConfig> = {
  badge: {
    id: 'badge_default',
    name: '标准胸牌',
    type: 'badge',
    width: 63,
    height: 88,
    background: '#ffffff',
    elements: [
      { id: 'logo', type: 'image', label: '活动LOGO', field: 'eventLogo', x: 21.5, y: 5, width: 20, height: 20, fontSize: 12, fontFamily: 'sans-serif', color: '#000000', align: 'center', bold: false, visible: true, required: false, aspectRatio: 1 },
      { id: 'eventName', type: 'text', label: '活动名称', field: 'eventName', x: 31.5, y: 28, width: 63, height: 8, fontSize: 14, fontFamily: 'sans-serif', color: '#1f2937', align: 'center', bold: true, visible: true, required: false },
      { id: 'qrcode', type: 'qrcode', label: '签到二维码', field: 'qrCode', x: 16.5, y: 35, width: 30, height: 30, fontSize: 12, fontFamily: 'sans-serif', color: '#000000', align: 'center', bold: false, visible: true, required: true },
      { id: 'name', type: 'text', label: '姓名', field: 'name', x: 31.5, y: 68, width: 63, height: 10, fontSize: 24, fontFamily: 'sans-serif', color: '#1f2937', align: 'center', bold: true, visible: true, required: true },
      { id: 'guestType', type: 'text', label: '嘉宾身份', field: 'guestType', x: 31.5, y: 78, width: 63, height: 6, fontSize: 12, fontFamily: 'sans-serif', color: '#3b82f6', align: 'center', bold: false, visible: true, required: false },
      { id: 'tableNumber', type: 'text', label: '桌号', field: 'tableNumber', x: 31.5, y: 84, width: 63, height: 5, fontSize: 10, fontFamily: 'sans-serif', color: '#6b7280', align: 'center', bold: false, visible: true, required: false },
    ],
  },
  label: {
    id: 'label_default',
    name: '标准标签',
    type: 'label',
    width: 50,
    height: 25,
    background: '#ffffff',
    elements: [
      { id: 'name', type: 'text', label: '姓名', field: 'name', x: 25, y: 8, width: 50, height: 8, fontSize: 14, fontFamily: 'sans-serif', color: '#1f2937', align: 'center', bold: true, visible: true, required: true },
      { id: 'guestType', type: 'text', label: '嘉宾身份', field: 'guestType', x: 25, y: 17, width: 50, height: 5, fontSize: 10, fontFamily: 'sans-serif', color: '#6b7280', align: 'center', bold: false, visible: true, required: false },
    ],
  },
  invite: {
    id: 'invite_default',
    name: '邀请卡',
    type: 'invite',
    width: 63,
    height: 88,
    background: '#ffffff',
    elements: [
      { id: 'logo', type: 'image', label: '活动LOGO', field: 'eventLogo', x: 21.5, y: 5, width: 20, height: 20, fontSize: 12, fontFamily: 'sans-serif', color: '#000000', align: 'center', bold: false, visible: true, required: false, aspectRatio: 1 },
      { id: 'eventName', type: 'text', label: '活动名称', field: 'eventName', x: 31.5, y: 28, width: 63, height: 8, fontSize: 16, fontFamily: 'sans-serif', color: '#1f2937', align: 'center', bold: true, visible: true, required: false },
      { id: 'qrcode', type: 'qrcode', label: '邀请二维码', field: 'qrCode', x: 16.5, y: 38, width: 30, height: 30, fontSize: 12, fontFamily: 'sans-serif', color: '#000000', align: 'center', bold: false, visible: true, required: true },
      { id: 'name', type: 'text', label: '姓名', field: 'name', x: 31.5, y: 70, width: 63, height: 8, fontSize: 18, fontFamily: 'sans-serif', color: '#1f2937', align: 'center', bold: true, visible: true, required: true },
      { id: 'organization', type: 'text', label: '单位', field: 'organization', x: 31.5, y: 78, width: 63, height: 5, fontSize: 10, fontFamily: 'sans-serif', color: '#6b7280', align: 'center', bold: false, visible: true, required: false },
      { id: 'eventDate', type: 'text', label: '活动日期', field: 'eventDate', x: 31.5, y: 84, width: 63, height: 4, fontSize: 9, fontFamily: 'sans-serif', color: '#9ca3af', align: 'center', bold: false, visible: true, required: false },
    ],
  },
};

// 可用字段列表
const availableFields = {
  guest: [
    { key: 'name', label: '姓名', required: true },
    { key: 'organization', label: '单位' },
    { key: 'guestType', label: '嘉宾身份' },
    { key: 'tableNumber', label: '桌号' },
    { key: 'phone', label: '手机号' },
    { key: 'qrCode', label: '签到二维码', type: 'qrcode' },
  ],
  event: [
    { key: 'eventName', label: '活动名称' },
    { key: 'eventDate', label: '活动日期' },
    { key: 'eventLocation', label: '活动地点' },
    { key: 'eventLogo', label: '活动LOGO', type: 'image' },
  ],
};

function TemplateDesignPage({ guests }: { guests: Guest[] }) {
  const [templateType, setTemplateType] = useState<TemplateType>('badge');
  const [template, setTemplate] = useState<TemplateConfig>(defaultTemplates.badge);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [previewGuest, setPreviewGuest] = useState<Guest | null>(guests[0] || null);
  const [eventInfo, setEventInfo] = useState({ eventName: '', eventDate: '', eventLocation: '', eventLogo: '' });
  const [zoom, setZoom] = useState(2); // 预览缩放比例
  
  // 加载活动信息
  useEffect(() => {
    const saved = localStorage.getItem('eventSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      setEventInfo({
        eventName: settings.eventName || '',
        eventDate: settings.eventDate || '',
        eventLocation: settings.eventLocation || '',
        eventLogo: settings.eventLogo || '',
      });
    }
  }, []);
  
  // 加载保存的模版
  useEffect(() => {
    const saved = localStorage.getItem(`template_${templateType}`);
    if (saved) {
      setTemplate(JSON.parse(saved));
    } else {
      setTemplate(defaultTemplates[templateType]);
    }
    setSelectedElement(null);
  }, [templateType]);
  
  // 保存模版
  const saveTemplate = () => {
    localStorage.setItem(`template_${templateType}`, JSON.stringify(template));
    alert('模版已保存');
  };
  
  // 重置模版
  const resetTemplate = () => {
    setTemplate(defaultTemplates[templateType]);
    localStorage.removeItem(`template_${templateType}`);
  };
  
  // 更新元素属性
  const updateElement = (elementId: string, updates: Partial<TemplateElement>) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      ),
    }));
  };
  
  // 切换元素可见性
  const toggleElementVisibility = (elementId: string) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId ? { ...el, visible: !el.visible } : el
      ),
    }));
  };
  
  // 获取字段值
  const getFieldValue = (field: string): string => {
    if (!previewGuest) return `[${field}]`;
    
    const guestData: Record<string, string> = {
      name: previewGuest.name,
      organization: previewGuest.organization || '',
      guestType: previewGuest.guestType,
      tableNumber: previewGuest.tableNumber || '',
      phone: previewGuest.phone || '',
      qrCode: previewGuest.qrCode,
    };
    
    const eventData: Record<string, string> = {
      eventName: eventInfo.eventName,
      eventDate: eventInfo.eventDate,
      eventLocation: eventInfo.eventLocation,
      eventLogo: eventInfo.eventLogo,
    };
    
    return guestData[field] || eventData[field] || '';
  };
  
  // 当前选中的元素
  const currentElement = template.elements.find(el => el.id === selectedElement);
  
  // 计算预览尺寸 (mm -> px, 1mm ≈ 3.78px @ 96dpi)
  const previewWidth = template.width * 3.78 * zoom;
  const previewHeight = template.height * 3.78 * zoom;

  return (
    <div className="space-y-4">
      {/* 顶部工具栏 */}
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">模版类型:</span>
          <div className="flex gap-2">
            {[
              { key: 'badge', label: '胸牌', icon: '🎫' },
              { key: 'label', label: '标签', icon: '🏷️' },
              { key: 'invite', label: '邀请卡', icon: '💌' },
            ].map(type => (
              <button
                key={type.key}
                onClick={() => setTemplateType(type.key as TemplateType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  templateType === type.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetTemplate}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
          >
            重置默认
          </button>
          <button
            onClick={saveTemplate}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
          >
            保存模版
          </button>
        </div>
      </div>
      
      {/* 编辑器主体 */}
      <div className="flex gap-6 h-[calc(100vh-280px)]">
        {/* 左侧：元素列表 */}
        <div className="w-64 bg-white rounded-lg shadow p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-4">模版元素</h3>
        
        <div className="space-y-2">
          {template.elements.map(el => (
            <div
              key={el.id}
              onClick={() => setSelectedElement(el.id)}
              className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${
                selectedElement === el.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : el.visible 
                    ? 'border-gray-200 hover:border-gray-300' 
                    : 'border-gray-100 bg-gray-50 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{el.label}</span>
                <div className="flex items-center gap-1">
                  {el.required && <span className="text-xs text-red-500">必填</span>}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleElementVisibility(el.id); }}
                    className={`p-1 rounded ${el.visible ? 'text-blue-500' : 'text-gray-400'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {el.visible ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {el.type === 'text' ? '文字' : el.type === 'image' ? '图片' : '二维码'}
                {el.field && ` · ${el.field}`}
              </div>
            </div>
          ))}
        </div>
        
        {/* 活动信息字段 */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium text-gray-700 mb-3 text-sm">活动信息字段</h4>
          <div className="space-y-1">
            {availableFields.event.map(field => (
              <label key={field.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={template.elements.some(el => el.field === field.key && el.visible)}
                  onChange={(e) => {
                    const el = template.elements.find(el => el.field === field.key);
                    if (el) {
                      updateElement(el.id, { visible: e.target.checked });
                    }
                  }}
                  className="rounded"
                />
                <span>{field.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      
      {/* 中间：预览区域 */}
      <div className="flex-1 bg-gray-100 rounded-lg p-6 overflow-auto flex flex-col items-center">
        <div className="mb-4 flex items-center gap-4">
          <span className="text-sm text-gray-600">预览缩放:</span>
          <input
            type="range"
            min="1"
            max="4"
            step="0.5"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-32"
          />
          <span className="text-sm text-gray-600">{zoom}x</span>
          
          {/* 预览嘉宾选择 */}
          <select
            value={previewGuest?.id || ''}
            onChange={(e) => setPreviewGuest(guests.find(g => g.id === e.target.value) || null)}
            className="ml-4 px-3 py-1 border rounded text-sm"
          >
            {guests.slice(0, 20).map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        
        {/* 模版预览 */}
        <div 
          className="bg-white shadow-lg relative"
          style={{ 
            width: previewWidth, 
            height: previewHeight,
            backgroundColor: template.background,
          }}
        >
          {template.elements.filter(el => el.visible).map(el => {
            const style: React.CSSProperties = {
              position: 'absolute',
              left: el.x * 3.78 * zoom,
              top: el.y * 3.78 * zoom,
              width: el.width * 3.78 * zoom,
              height: el.height * 3.78 * zoom,
              textAlign: el.align,
              fontSize: el.fontSize * zoom,
              fontFamily: el.fontFamily,
              color: el.color,
              fontWeight: el.bold ? 'bold' : 'normal',
              display: 'flex',
              alignItems: 'center',
              justifyContent: el.align === 'center' ? 'center' : el.align === 'right' ? 'flex-end' : 'flex-start',
            };
            
            if (el.type === 'qrcode') {
              return (
                <div key={el.id} style={style}>
                  <img 
                    src={`/api/checkin/qrcode?text=${encodeURIComponent(getFieldValue(el.field || '') || 'preview')}&size=${Math.floor(el.width * 3.78)}`}
                    alt="QR"
                    className="w-full h-full object-contain"
                  />
                </div>
              );
            }
            
            if (el.type === 'image') {
              const src = getFieldValue(el.field || '');
              if (!src) return null;
              return (
                <div key={el.id} style={style}>
                  <img 
                    src={src}
                    alt={el.label}
                    className="max-w-full max-h-full object-contain"
                    style={{ aspectRatio: el.aspectRatio }}
                  />
                </div>
              );
            }
            
            return (
              <div key={el.id} style={style} className="overflow-hidden">
                <span className="truncate w-full">{getFieldValue(el.field || '') || el.content}</span>
              </div>
            );
          })}
          
          {/* 选中元素高亮 */}
          {selectedElement && currentElement?.visible && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
              style={{
                left: currentElement.x * 3.78 * zoom,
                top: currentElement.y * 3.78 * zoom,
                width: currentElement.width * 3.78 * zoom,
                height: currentElement.height * 3.78 * zoom,
              }}
            />
          )}
        </div>
        
        <div className="mt-2 text-sm text-gray-500">
          模版尺寸: {template.width}mm × {template.height}mm
        </div>
      </div>
      
      {/* 右侧：属性编辑 */}
      <div className="w-72 bg-white rounded-lg shadow p-4 overflow-y-auto">
        <h3 className="font-semibold text-gray-900 mb-4">元素属性</h3>
        
        {currentElement ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">元素名称</label>
              <input
                type="text"
                value={currentElement.label}
                onChange={(e) => updateElement(currentElement.id, { label: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>
            
            {/* 位置 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">X (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={currentElement.x}
                  onChange={(e) => updateElement(currentElement.id, { x: parseFloat(e.target.value) })}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Y (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={currentElement.y}
                  onChange={(e) => updateElement(currentElement.id, { y: parseFloat(e.target.value) })}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
            
            {/* 尺寸 */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">宽度 (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={currentElement.width}
                  onChange={(e) => updateElement(currentElement.id, { width: parseFloat(e.target.value) })}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">高度 (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={currentElement.height}
                  onChange={(e) => updateElement(currentElement.id, { height: parseFloat(e.target.value) })}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
            
            {/* 文字属性 */}
            {currentElement.type === 'text' && (
              <>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">字号</label>
                  <input
                    type="number"
                    min="8"
                    max="48"
                    value={currentElement.fontSize}
                    onChange={(e) => updateElement(currentElement.id, { fontSize: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">字体颜色</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={currentElement.color}
                      onChange={(e) => updateElement(currentElement.id, { color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentElement.color}
                      onChange={(e) => updateElement(currentElement.id, { color: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">对齐方式</label>
                  <div className="flex gap-1">
                    {(['left', 'center', 'right'] as const).map(align => (
                      <button
                        key={align}
                        onClick={() => updateElement(currentElement.id, { align })}
                        className={`flex-1 py-2 text-sm rounded ${
                          currentElement.align === align 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {align === 'left' ? '居左' : align === 'center' ? '居中' : '居右'}
                      </button>
                    ))}
                  </div>
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentElement.bold}
                    onChange={(e) => updateElement(currentElement.id, { bold: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">加粗</span>
                </label>
              </>
            )}
            
            {/* 图像属性 */}
            {(currentElement.type === 'image' || currentElement.type === 'qrcode') && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">约束比例（宽:高）</label>
                <select
                  value={currentElement.aspectRatio || ''}
                  onChange={(e) => updateElement(currentElement.id, { 
                    aspectRatio: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  className="w-full px-3 py-2 border rounded text-sm"
                >
                  <option value="">不约束</option>
                  <option value="1">1:1 (正方形)</option>
                  <option value="1.5">3:2</option>
                  <option value="1.333">4:3</option>
                  <option value="0.5625">16:9 (竖向)</option>
                </select>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            请在左侧选择一个元素进行编辑
          </div>
        )}
        
        {/* 模版尺寸设置 */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium text-gray-700 mb-3 text-sm">模版尺寸</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">宽度 (mm)</label>
              <input
                type="number"
                value={template.width}
                onChange={(e) => setTemplate(prev => ({ ...prev, width: parseFloat(e.target.value) }))}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">高度 (mm)</label>
              <input
                type="number"
                value={template.height}
                onChange={(e) => setTemplate(prev => ({ ...prev, height: parseFloat(e.target.value) }))}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>
          
          <div className="mt-3">
            <label className="block text-xs text-gray-500 mb-1">背景颜色</label>
            <input
              type="color"
              value={template.background}
              onChange={(e) => setTemplate(prev => ({ ...prev, background: e.target.value }))}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

// ==================== 二维码邀请码组件 ====================
function QRCodePage({ guests }: { guests: Guest[] }) {
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterTable, setFilterTable] = useState('all');
  const [eventInfo, setEventInfo] = useState({ 
    eventName: '', 
    eventDate: '', 
    eventLocation: '', 
    eventLogo: '' 
  });
  
  // 从localStorage加载活动信息
  useEffect(() => {
    const saved = localStorage.getItem('eventSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      setEventInfo({
        eventName: settings.eventName || '',
        eventDate: settings.eventDate || '',
        eventLocation: settings.eventLocation || '',
        eventLogo: settings.eventLogo || '',
      });
    }
  }, []);
  
  // 提取所有身份类型和桌号
  const guestTypes = [...new Set(guests.map(g => g.guestType))];
  const tableNumbers = [...new Set(guests.map(g => g.tableNumber).filter(Boolean))].sort((a, b) => {
    // 按字母数字排序
    const matchA = String(a).match(/^([A-Za-z]*)(\d+)/);
    const matchB = String(b).match(/^([A-Za-z]*)(\d+)/);
    if (matchA && matchB) {
      if (matchA[1] !== matchB[1]) return matchA[1].localeCompare(matchB[1]);
      return parseInt(matchA[2]) - parseInt(matchB[2]);
    }
    return String(a).localeCompare(String(b));
  });
  
  // 过滤嘉宾
  const filteredGuests = guests.filter(g => {
    const matchSearch = !searchKeyword || 
      g.name.includes(searchKeyword) || 
      (g.phone && g.phone.includes(searchKeyword)) ||
      (g.organization && g.organization.includes(searchKeyword));
    const matchType = filterType === 'all' || g.guestType === filterType;
    const matchTable = filterTable === 'all' || g.tableNumber === filterTable;
    return matchSearch && matchType && matchTable;
  });

  // 下载单个邀请卡（扑克牌尺寸）
  const downloadInviteCard = async (guest: Guest) => {
    // 创建canvas绘制邀请卡
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 扑克牌尺寸比例 (63mm × 88mm)，分辨率150dpi
    const width = 372;  // 63mm @ 150dpi
    const height = 520; // 88mm @ 150dpi
    canvas.width = width;
    canvas.height = height;
    
    // 背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // 边框
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, width - 4, height - 4);
    
    let startY = 20;
    
    // 绘制LOGO（如果有）
    if (eventInfo.eventLogo) {
      const logoImg = new window.Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = eventInfo.eventLogo;
      
      await new Promise<void>((resolve) => {
        logoImg.onload = () => {
          const logoSize = 50;
          const logoX = (width - logoSize) / 2;
          ctx.drawImage(logoImg, logoX, startY, logoSize, logoSize);
          startY += logoSize + 5;
          resolve();
        };
        logoImg.onerror = () => resolve();
      });
    }
    
    // 活动名称
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(eventInfo.eventName || '活动签到', width / 2, startY + 15);
    
    // 分割线
    ctx.strokeStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.moveTo(20, startY + 25);
    ctx.lineTo(width - 20, startY + 25);
    ctx.stroke();
    
    // 二维码区域
    const qrSize = 100;
    const qrX = (width - qrSize) / 2;
    const qrY = startY + 40;
    
    // 加载并绘制二维码
    const qrImg = new window.Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.src = `/api/checkin/qrcode?text=${encodeURIComponent(guest.qrCode)}&size=${qrSize}`;
    
    await new Promise<void>((resolve) => {
      qrImg.onload = () => {
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
        resolve();
      };
      qrImg.onerror = () => resolve();
    });
    
    // 姓名区域
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(guest.name, width / 2, qrY + qrSize + 40);
    
    // 身份标签
    const typeY = qrY + qrSize + 65;
    ctx.fillStyle = guest.guestType === '特邀嘉宾' ? '#dc2626' : '#3b82f6';
    ctx.font = 'bold 16px sans-serif';
    const typeText = guest.guestType === '特邀嘉宾' ? '特邀嘉宾 🌹' : guest.guestType;
    ctx.fillText(typeText, width / 2, typeY);
    
    // 桌号
    if (guest.tableNumber) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px sans-serif';
      ctx.fillText(`桌号: ${guest.tableNumber}`, width / 2, typeY + 22);
    }
    
    // 公司
    if (guest.organization) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px sans-serif';
      const maxWidth = width - 40;
      let orgText = guest.organization;
      if (ctx.measureText(orgText).width > maxWidth) {
        while (ctx.measureText(orgText + '...').width > maxWidth && orgText.length > 0) {
          orgText = orgText.slice(0, -1);
        }
        orgText += '...';
      }
      ctx.fillText(orgText, width / 2, typeY + (guest.tableNumber ? 40 : 22));
    }
    
    // 底部分割线
    const bottomY = height - 50;
    ctx.strokeStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.moveTo(20, bottomY);
    ctx.lineTo(width - 20, bottomY);
    ctx.stroke();
    
    // 底部信息
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    if (eventInfo.eventDate) {
      ctx.fillText(eventInfo.eventDate, width / 2, bottomY + 18);
    }
    if (eventInfo.eventLocation) {
      ctx.fillText(eventInfo.eventLocation, width / 2, bottomY + 35);
    }
    
    // 下载
    const link = document.createElement('a');
    link.download = `${guest.name}_邀请卡.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // 批量下载（当前筛选结果）
  const downloadAllCards = async () => {
    if (filteredGuests.length === 0) {
      alert('没有可下载的邀请卡');
      return;
    }
    
    alert(`即将下载 ${filteredGuests.length} 张邀请卡，请稍候...`);
    
    for (let i = 0; i < filteredGuests.length; i++) {
      await downloadInviteCard(filteredGuests[i]);
      await new Promise(resolve => setTimeout(resolve, 300)); // 延迟避免浏览器阻止
    }
  };

  // 按桌位批量下载
  const downloadByTable = async (tableNumber: string) => {
    const tableGuests = guests.filter(g => g.tableNumber === tableNumber);
    if (tableGuests.length === 0) {
      alert('该桌位没有嘉宾');
      return;
    }
    
    alert(`即将下载 ${tableNumber} 桌的 ${tableGuests.length} 张邀请卡...`);
    
    for (const guest of tableGuests) {
      await downloadInviteCard(guest);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  // 判断是否特邀嘉宾
  const isSpecialGuest = (type: string) => type === '特邀嘉宾';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">二维码邀请码</h2>
          <div className="flex gap-2">
            <button
              onClick={downloadAllCards}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              批量下载邀请卡
            </button>
          </div>
        </div>
        
        {/* 搜索和筛选 */}
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="搜索姓名、手机、单位..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部身份</option>
            {guestTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={filterTable}
            onChange={(e) => setFilterTable(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部桌位</option>
            {tableNumbers.map(table => (
              <option key={String(table)} value={String(table)}>{String(table)} 桌</option>
            ))}
          </select>
        </div>

        {/* 按桌位快速下载 */}
        {tableNumbers.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">按桌位批量下载：</div>
            <div className="flex flex-wrap gap-2">
              {tableNumbers.map(table => (
                <button
                  key={String(table)}
                  onClick={() => downloadByTable(String(table))}
                  className="px-3 py-1 bg-white border rounded hover:bg-gray-100 text-sm"
                >
                  {String(table)} 桌
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 嘉宾邀请卡列表 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredGuests.slice(0, 50).map(guest => (
            <div 
              key={guest.id} 
              className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer bg-white"
              onClick={() => setSelectedGuest(guest)}
            >
              {/* 扑克牌比例卡片预览 (63:88 ≈ 0.716) */}
              <div className="aspect-[63/88] bg-gradient-to-b from-gray-50 to-white border rounded-lg p-2 flex flex-col items-center justify-between text-center">
                {/* 活动名称 */}
                <div className="text-xs text-gray-500 truncate w-full">
                  {eventInfo.eventName || '活动签到'}
                </div>
                
                {/* 二维码 */}
                <img 
                  src={`/api/checkin/qrcode?text=${encodeURIComponent(guest.qrCode)}&size=60`}
                  alt="二维码"
                  className="w-12 h-12"
                />
                
                {/* 姓名 */}
                <div className="font-bold text-sm truncate w-full">{guest.name}</div>
                
                {/* 身份 */}
                <div className={`text-xs px-2 py-0.5 rounded ${
                  isSpecialGuest(guest.guestType) 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {isSpecialGuest(guest.guestType) ? `🌹 ${guest.guestType}` : guest.guestType}
                </div>
                
                {/* 桌号和公司 */}
                <div className="text-xs text-gray-400 truncate w-full">
                  {guest.tableNumber && `${guest.tableNumber}桌`}
                  {guest.tableNumber && guest.organization && ' · '}
                  {guest.organization}
                </div>
              </div>
              
              {/* 签到状态 */}
              {guest.checkInStatus === 1 && (
                <div className="mt-2 text-center">
                  <span className="text-xs text-green-600">✓ 已签到</span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {filteredGuests.length > 50 && (
          <div className="text-center text-gray-500 text-sm mt-4">
            显示前50条，共 {filteredGuests.length} 条记录
          </div>
        )}
        
        {filteredGuests.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            暂无数据
          </div>
        )}
      </div>

      {/* 邀请卡详情弹窗 */}
      {selectedGuest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-center">邀请卡预览</h3>
            <div className="flex flex-col items-center">
              {/* 扑克牌尺寸预览 */}
              <div className="w-[234px] bg-white border-2 border-gray-200 rounded-lg shadow-md p-4 flex flex-col items-center">
                {/* 活动名称 */}
                <div className="text-sm font-semibold text-gray-800 mb-2">
                  {eventInfo.eventName || '活动签到'}
                </div>
                <div className="w-full border-t border-gray-200 mb-3"></div>
                
                {/* 二维码 */}
                <img 
                  src={`/api/checkin/qrcode?text=${encodeURIComponent(selectedGuest.qrCode)}&size=140`}
                  alt="二维码"
                  className="mb-3"
                />
                
                {/* 姓名 */}
                <div className="text-2xl font-bold text-gray-900 mb-2">{selectedGuest.name}</div>
                
                {/* 身份 */}
                <div className={`text-sm px-3 py-1 rounded-full mb-2 ${
                  isSpecialGuest(selectedGuest.guestType)
                    ? 'bg-red-100 text-red-600'
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {isSpecialGuest(selectedGuest.guestType) ? `🌹 ${selectedGuest.guestType}` : selectedGuest.guestType}
                </div>
                
                {/* 桌号 */}
                {selectedGuest.tableNumber && (
                  <div className="text-sm text-gray-500 mb-1">桌号: {selectedGuest.tableNumber}</div>
                )}
                
                {/* 公司 */}
                {selectedGuest.organization && (
                  <div className="text-sm text-gray-500 mb-2">{selectedGuest.organization}</div>
                )}
                
                <div className="w-full border-t border-gray-200 mt-2 pt-2">
                  {/* 底部信息 */}
                  <div className="text-xs text-gray-400 text-center">
                    {eventInfo.eventDate && <div>{eventInfo.eventDate}</div>}
                    {eventInfo.eventLocation && <div>{eventInfo.eventLocation}</div>}
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-400 mt-2">签到码: {selectedGuest.qrCode}</div>
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => downloadInviteCard(selectedGuest)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  下载邀请卡
                </button>
                <button
                  onClick={() => setSelectedGuest(null)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 标签模板组件 ====================
function TemplatePage() {
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  
  const templates = [
    { 
      id: 'standard', 
      name: '标准模板', 
      description: '经典竖版胸牌，适合大多数活动',
      size: '54mm × 86mm',
      preview: (
        <div className="w-32 h-48 bg-white border-2 border-gray-200 rounded shadow-sm p-2">
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">活动签到</div>
            <div className="font-bold text-sm mb-1">张三</div>
            <div className="text-xs text-gray-500">科技有限公司</div>
            <div className="mt-2 text-xs bg-blue-100 px-2 py-0.5 rounded inline-block">VIP</div>
          </div>
        </div>
      )
    },
    { 
      id: 'horizontal', 
      name: '横向模板', 
      description: '横向胸牌，信息展示更宽敞',
      size: '86mm × 54mm',
      preview: (
        <div className="w-48 h-32 bg-white border-2 border-gray-200 rounded shadow-sm p-3 flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-xs">照片</span>
          </div>
          <div>
            <div className="font-bold text-sm">张三</div>
            <div className="text-xs text-gray-500">科技有限公司</div>
            <div className="text-xs text-blue-500">VIP</div>
          </div>
        </div>
      )
    },
    { 
      id: 'minimal', 
      name: '简约模板', 
      description: '极简设计，突出姓名',
      size: '50mm × 80mm',
      preview: (
        <div className="w-28 h-44 bg-white border-2 border-gray-200 rounded shadow-sm p-3">
          <div className="text-center h-full flex flex-col justify-center">
            <div className="font-bold text-lg">张三</div>
            <div className="text-xs text-gray-400 mt-1">科技有限公司</div>
          </div>
        </div>
      )
    },
    { 
      id: 'business', 
      name: '商务模板', 
      description: '商务风格，适合正式会议',
      size: '54mm × 90mm',
      preview: (
        <div className="w-32 h-52 bg-gradient-to-b from-blue-600 to-blue-800 rounded shadow-sm p-3">
          <div className="text-center text-white">
            <div className="text-xs opacity-80 mb-2">2024 年度峰会</div>
            <div className="font-bold text-base mb-1">张三</div>
            <div className="text-xs opacity-80">科技有限公司</div>
            <div className="mt-4 text-xs bg-white/20 px-2 py-0.5 rounded inline-block">VIP嘉宾</div>
          </div>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-6">选择标签模板</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map(template => (
            <div 
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                selectedTemplate === template.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  {template.preview}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{template.name}</h3>
                    {selectedTemplate === template.id && (
                      <span className="text-blue-500">✓</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  <p className="text-xs text-gray-400 mt-2">尺寸: {template.size}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            保存设置
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">自定义字段</h3>
        <p className="text-gray-500 text-sm mb-4">选择要在胸牌上显示的字段</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['姓名', '单位', '身份', '桌号', '签到码', '头像', '联系电话'].map(field => (
            <label key={field} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked={['姓名', '单位', '身份'].includes(field)} className="rounded" />
              <span className="text-sm">{field}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== 胸牌皮肤组件 ====================
function BadgePage() {
  const [selectedSkin, setSelectedSkin] = useState('blue');
  
  const skins = [
    { id: 'blue', name: '商务蓝', gradient: 'from-blue-500 to-blue-700' },
    { id: 'purple', name: '典雅紫', gradient: 'from-purple-500 to-purple-700' },
    { id: 'green', name: '清新绿', gradient: 'from-green-500 to-green-700' },
    { id: 'red', name: '热情红', gradient: 'from-red-500 to-red-700' },
    { id: 'orange', name: '活力橙', gradient: 'from-orange-500 to-orange-700' },
    { id: 'gray', name: '简约灰', gradient: 'from-gray-600 to-gray-800' },
    { id: 'gradient', name: '渐变彩虹', gradient: 'from-pink-500 via-purple-500 to-indigo-500' },
    { id: 'gold', name: '金色尊贵', gradient: 'from-yellow-500 to-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-6">选择胸牌皮肤</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {skins.map(skin => (
            <div 
              key={skin.id}
              onClick={() => setSelectedSkin(skin.id)}
              className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                selectedSkin === skin.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'
              }`}
            >
              <div className={`h-20 bg-gradient-to-r ${skin.gradient}`}></div>
              <div className="p-2 text-center bg-gray-50">
                <span className="text-sm font-medium">{skin.name}</span>
                {selectedSkin === skin.id && (
                  <span className="ml-1 text-blue-500">✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* 预览 */}
        <div className="border rounded-lg p-8">
          <h3 className="text-lg font-semibold mb-4 text-center">预览效果</h3>
          <div className="flex justify-center gap-8 flex-wrap">
            {/* 竖版预览 */}
            <div className={`w-40 h-56 bg-gradient-to-br ${skins.find(s => s.id === selectedSkin)?.gradient} rounded-lg shadow-lg p-4`}>
              <div className="text-center text-white h-full flex flex-col justify-between">
                <div className="text-xs opacity-80">2024 行业峰会</div>
                <div>
                  <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div className="font-bold text-xl">张三</div>
                  <div className="text-sm opacity-80">科技有限公司</div>
                  <div className="mt-2 inline-block px-3 py-1 bg-white/20 rounded-full text-xs">VIP嘉宾</div>
                </div>
                <div className="text-xs opacity-60">桌号: A1</div>
              </div>
            </div>
            
            {/* 横版预览 */}
            <div className={`w-64 h-40 bg-gradient-to-r ${skins.find(s => s.id === selectedSkin)?.gradient} rounded-lg shadow-lg p-4`}>
              <div className="text-white h-full flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-3xl">👤</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs opacity-80">2024 行业峰会</div>
                  <div className="font-bold text-xl">张三</div>
                  <div className="text-sm opacity-80">科技有限公司</div>
                  <div className="mt-2 inline-block px-3 py-0.5 bg-white/20 rounded text-xs">VIP嘉宾</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            保存设置
          </button>
        </div>
      </div>
      
      {/* 自定义颜色 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">自定义颜色</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-600 mb-2">主色调</label>
            <input type="color" defaultValue="#3B82F6" className="w-full h-12 rounded cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">辅助色</label>
            <input type="color" defaultValue="#1D4ED8" className="w-full h-12 rounded cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== 活动设置组件 ====================
function SettingsPage() {
  const [settings, setSettings] = useState({
    eventName: '',
    eventDate: '',
    eventLocation: '',
    eventDescription: '',
    checkInNotice: '',
    enablePrint: true,
    enableSMS: false,
    checkInMode: 'single', // single, multiple
    eventLogo: '', // LOGO base64
    // NPL打印服务配置
    printServiceUrl: '', // 打印服务地址，如 http://localhost:8080
    printServiceEnabled: false, // 是否启用打印服务
    printerName: '', // 打印机名称
  });
  
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    // 保存到localStorage
    localStorage.setItem('eventSettings', JSON.stringify(settings));
    alert('设置已保存');
  };

  // 从localStorage加载
  useEffect(() => {
    const saved = localStorage.getItem('eventSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);
  
  // 处理LOGO上传
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }
    
    // 检查文件大小（最大2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过2MB');
      return;
    }
    
    // 转换为base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSettings({ ...settings, eventLogo: base64 });
    };
    reader.readAsDataURL(file);
  };
  
  // 删除LOGO
  const handleRemoveLogo = () => {
    setSettings({ ...settings, eventLogo: '' });
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* 基本信息设置 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-6">基本信息</h2>
        <div className="space-y-4">
          {/* LOGO上传 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">活动LOGO</label>
            <div className="flex items-start gap-4">
              {settings.eventLogo ? (
                <div className="relative">
                  <img 
                    src={settings.eventLogo} 
                    alt="活动LOGO" 
                    className="w-32 h-32 object-contain border rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-500">点击上传LOGO</span>
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div className="text-sm text-gray-500">
                <p>支持 JPG、PNG、SVG 格式</p>
                <p>建议尺寸：200×200 像素</p>
                <p>最大文件：2MB</p>
                <p className="text-gray-400 mt-2">LOGO将显示在签到页面和胸牌上</p>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">活动名称 *</label>
            <input
              type="text"
              value={settings.eventName}
              onChange={(e) => setSettings({ ...settings, eventName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入活动名称"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">活动日期</label>
              <input
                type="date"
                value={settings.eventDate}
                onChange={(e) => setSettings({ ...settings, eventDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">活动地点</label>
              <input
                type="text"
                value={settings.eventLocation}
                onChange={(e) => setSettings({ ...settings, eventLocation: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入活动地点"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">活动简介</label>
            <textarea
              value={settings.eventDescription}
              onChange={(e) => setSettings({ ...settings, eventDescription: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="请输入活动简介（可选）"
            />
          </div>
        </div>
      </div>

      {/* 签到设置 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-6">签到设置</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">签到须知</label>
            <textarea
              value={settings.checkInNotice}
              onChange={(e) => setSettings({ ...settings, checkInNotice: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="签到时显示的提示信息（可选）"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">签到模式</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="checkInMode"
                  value="single"
                  checked={settings.checkInMode === 'single'}
                  onChange={(e) => setSettings({ ...settings, checkInMode: e.target.value })}
                  className="text-blue-500"
                />
                <span className="text-sm">单次签到（每人只能签到一次）</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="checkInMode"
                  value="multiple"
                  checked={settings.checkInMode === 'multiple'}
                  onChange={(e) => setSettings({ ...settings, checkInMode: e.target.value })}
                  className="text-blue-500"
                />
                <span className="text-sm">多次签到（允许多次进出签到）</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 功能开关 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-6">功能开关</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-medium">启用胸牌打印</span>
              <p className="text-sm text-gray-500">签到后自动打印胸牌</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enablePrint}
              onChange={(e) => setSettings({ ...settings, enablePrint: e.target.checked })}
              className="w-5 h-5 rounded text-blue-500"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-medium">启用短信通知</span>
              <p className="text-sm text-gray-500">签到成功后发送短信通知</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableSMS}
              onChange={(e) => setSettings({ ...settings, enableSMS: e.target.checked })}
              className="w-5 h-5 rounded text-blue-500"
            />
          </label>
        </div>
      </div>

      {/* 打印服务设置 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-6">打印服务设置</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-medium">启用NPL静默打印</span>
              <p className="text-sm text-gray-500">签到成功后自动调用打印服务静默打印胸牌</p>
            </div>
            <input
              type="checkbox"
              checked={settings.printServiceEnabled}
              onChange={(e) => setSettings({ ...settings, printServiceEnabled: e.target.checked })}
              className="w-5 h-5 rounded text-blue-500"
            />
          </label>
          
          {settings.printServiceEnabled && (
            <>
              <div>
                <label className="block text-sm text-gray-600 mb-1">打印服务地址</label>
                <input
                  type="text"
                  value={settings.printServiceUrl}
                  onChange={(e) => setSettings({ ...settings, printServiceUrl: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: http://localhost:8080 或 http://192.168.1.100:8080"
                />
                <p className="text-xs text-gray-400 mt-1">NPL打印服务监听地址，需在本地或局域网部署打印服务</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">打印机名称（可选）</label>
                <input
                  type="text"
                  value={settings.printerName}
                  onChange={(e) => setSettings({ ...settings, printerName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="留空使用默认打印机"
                />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <strong>说明：</strong>启用NPL静默打印后，签到成功会自动发送打印任务，无需手动操作。
                如打印服务不可用，仍可使用“补打胸牌”按钮手动打印。
              </div>
            </>
          )}
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => {
            setSettings({
              eventName: '',
              eventDate: '',
              eventLocation: '',
              eventDescription: '',
              checkInNotice: '',
              enablePrint: true,
              enableSMS: false,
              checkInMode: 'single',
              eventLogo: '',
              printServiceUrl: '',
              printServiceEnabled: false,
              printerName: '',
            });
          }}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          重置
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          保存设置
        </button>
      </div>
    </div>
  );
}
