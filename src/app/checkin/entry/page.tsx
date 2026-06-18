'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

interface CheckInLog {
  id: string;
  guestId: string;
  guestName: string;
  organization: string | null;
  guestType: string;
  tableNumber: string | null;
  checkInTime: string;
}

export default function CheckInPage() {
  const [mode, setMode] = useState<'scan' | 'search'>('scan');
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [badgeGuest, setBadgeGuest] = useState<Guest | null>(null);
  const [duplicateGuest, setDuplicateGuest] = useState<Guest | null>(null); // 重复签到的嘉宾
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, notCheckedIn: 0, checkInRate: 0 });
  const [recentLogs, setRecentLogs] = useState<CheckInLog[]>([]);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [logsSearch, setLogsSearch] = useState('');
  const [isScanning, setIsScanning] = useState(false); // 正在扫码中
  
  const scanBufferRef = useRef<string>(''); // 扫码缓冲区
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 扫码超时
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 加载统计
  const loadStats = async () => {
    try {
      const res = await fetch('/api/checkin/stats-detailed');
      const data = await res.json();
      if (data.success) {
        setStats({
          total: data.data.total,
          checkedIn: data.data.checkedIn,
          notCheckedIn: data.data.notCheckedIn,
          checkInRate: data.data.checkInRate,
        });
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  // 加载最近签到记录
  const loadRecentLogs = async () => {
    try {
      const res = await fetch('/api/checkin/history?limit=20');
      const data = await res.json();
      if (data.success) {
        setRecentLogs(data.data);
      }
    } catch (error) {
      console.error('加载签到记录失败:', error);
    }
  };

  useEffect(() => {
    loadStats();
    loadRecentLogs();
    const interval = setInterval(() => {
      loadStats();
      loadRecentLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // NPL静默打印
  const handleSilentPrint = async (guest: Guest): Promise<boolean> => {
    try {
      // 从localStorage读取打印服务配置
      const savedSettings = localStorage.getItem('eventSettings');
      const eventSettings = savedSettings ? JSON.parse(savedSettings) : {};
      
      // 如果未启用打印服务，返回false
      if (!eventSettings.printServiceEnabled || !eventSettings.printServiceUrl) {
        return false;
      }
      
      const printServiceUrl = eventSettings.printServiceUrl.replace(/\/$/, ''); // 移除末尾斜杠
      const printerName = eventSettings.printerName || '';
      
      // 构建打印数据
      const printData = {
        guest: {
          name: guest.name,
          organization: guest.organization,
          guestType: guest.guestType,
          tableNumber: guest.tableNumber,
          qrCode: guest.qrCode,
        },
        event: {
          name: eventSettings.eventName || '活动签到',
          logo: eventSettings.eventLogo || '',
          date: eventSettings.eventDate || '',
          location: eventSettings.eventLocation || '',
        },
        printer: printerName,
      };
      
      // 调用打印服务
      const response = await fetch(`${printServiceUrl}/api/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(printData),
      });
      
      if (response.ok) {
        console.log('[打印] 静默打印成功:', guest.name);
        return true;
      } else {
        console.error('[打印] 静默打印失败:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('[打印] 打印服务调用失败:', error);
      return false;
    }
  };

  // 签到
  const handleCheckIn = useCallback(async (qrCode: string) => {
    setIsScanning(true);
    setDuplicateGuest(null); // 清除之前的重复签到提示
    
    try {
      const res = await fetch('/api/checkin/checkin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode }),
      });
      const data = await res.json();
      
      if (data.success) {
        const guest = data.data;
        setMessage({ type: 'success', text: `${guest.name} 签到成功！` });
        setBadgeGuest(guest);
        loadStats();
        loadRecentLogs();
        
        // 自动静默打印
        const printSuccess = await handleSilentPrint(guest);
        if (printSuccess) {
          setMessage({ type: 'success', text: `${guest.name} 签到成功！胸牌已发送打印` });
        }
        
        // 3秒后清除提示，但保留胸牌预览
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      } else {
        // 检查是否是重复签到
        if (data.error?.includes('已签到')) {
          // 获取嘉宾信息显示胸牌预览
          try {
            const guestRes = await fetch(`/api/checkin/guests?qrCode=${encodeURIComponent(qrCode)}`);
            const guestData = await guestRes.json();
            if (guestData.success && guestData.data) {
              setDuplicateGuest(guestData.data);
              setMessage({ type: 'error', text: `⚠️ ${guestData.data.name} 已签到，请勿重复签到！` });
            } else {
              setMessage({ type: 'error', text: data.error });
            }
          } catch {
            setMessage({ type: 'error', text: data.error });
          }
        } else {
          setMessage({ type: 'error', text: data.error });
        }
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: '签到失败: ' + (error instanceof Error ? error.message : String(error)) });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // 全局扫码监听 - 扫码模式
  useEffect(() => {
    if (mode !== 'scan') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果正在签到中，忽略输入
      if (isScanning) return;
      
      // 如果焦点在搜索框或其他输入框，不处理
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      
      // 回车键 - 完成扫码
      if (e.key === 'Enter') {
        e.preventDefault();
        const code = scanBufferRef.current.trim();
        if (code) {
          handleCheckIn(code);
          scanBufferRef.current = '';
        }
        return;
      }
      
      // 普通字符 - 添加到缓冲区
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        scanBufferRef.current += e.key;
        
        // 设置超时：如果500ms没有新输入，自动提交
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }
        scanTimeoutRef.current = setTimeout(() => {
          const code = scanBufferRef.current.trim();
          if (code.length > 5) { // 签到码通常较长
            handleCheckIn(code);
            scanBufferRef.current = '';
          }
        }, 500);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [mode, isScanning, handleCheckIn]);

  // 搜索嘉宾
  const handleSearch = async () => {
    if (!keyword.trim()) return;
    
    try {
      const res = await fetch(`/api/checkin/guests?keyword=${encodeURIComponent(keyword)}`);
      const data = await res.json();
      
      if (data.success) {
        setSearchResults(data.data);
        if (data.data.length === 0) {
          setMessage({ type: 'error', text: '未找到该嘉宾' });
        }
      }
    } catch {
      setMessage({ type: 'error', text: '搜索失败' });
    }
  };

  // 点击最近签到记录，显示胸牌预览
  const handleShowBadge = (log: CheckInLog) => {
    setBadgeGuest({
      id: log.guestId,
      name: log.guestName,
      phone: null,
      organization: log.organization,
      guestType: log.guestType,
      tableNumber: log.tableNumber,
      qrCode: '',
      checkInStatus: 1,
      checkInTime: log.checkInTime,
    });
    setMode('scan');
  };

  // 打印胸牌
  const handlePrintBadge = (guest: Guest) => {
    // 创建打印窗口
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert('请允许弹出窗口以打印胸牌');
      return;
    }
    
    const isSpecialGuest = guest.guestType === '特邀嘉宾';
    
    // 从localStorage读取活动设置
    const savedSettings = localStorage.getItem('eventSettings');
    const eventSettings = savedSettings ? JSON.parse(savedSettings) : {};
    const eventLogo = eventSettings.eventLogo || '';
    const eventName = eventSettings.eventName || '活动签到';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>胸牌 - ${guest.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f5f5f5;
          }
          .badge {
            width: 63mm;
            height: 88mm;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 8mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .badge-header {
            text-align: center;
            margin-bottom: 4mm;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .event-logo {
            width: 20mm;
            height: 20mm;
            object-fit: contain;
            margin-bottom: 2mm;
          }
          .event-name {
            font-size: 12pt;
            font-weight: bold;
            color: #1f2937;
          }
          .divider {
            width: 100%;
            height: 1px;
            background: #e5e7eb;
            margin: 3mm 0;
          }
          .badge-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
          }
          .qr-code {
            width: 25mm;
            height: 25mm;
            margin-bottom: 4mm;
          }
          .name {
            font-size: 24pt;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 3mm;
          }
          .guest-type {
            font-size: 12pt;
            padding: 2mm 5mm;
            border-radius: 20px;
            margin-bottom: 3mm;
            ${isSpecialGuest 
              ? 'background: #fee2e2; color: #dc2626;' 
              : 'background: #dbeafe; color: #2563eb;'}
          }
          .info {
            font-size: 10pt;
            color: #6b7280;
            text-align: center;
          }
          .badge-footer {
            text-align: center;
            padding-top: 3mm;
            border-top: 1px solid #e5e7eb;
            width: 100%;
          }
          .footer-text {
            font-size: 8pt;
            color: #9ca3af;
          }
          @media print {
            body { background: white; }
            .badge { 
              box-shadow: none; 
              border: 1px solid #000;
            }
            @page {
              size: 63mm 88mm;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="badge">
          <div class="badge-header">
            ${eventLogo ? `<img class="event-logo" src="${eventLogo}" alt="LOGO" />` : ''}
            <div class="event-name">${eventName}</div>
          </div>
          <div class="divider"></div>
          <div class="badge-body">
            <img class="qr-code" src="/api/checkin/qrcode?text=${encodeURIComponent(guest.qrCode)}&size=150" alt="QR" />
            <div class="name">${guest.name}</div>
            <div class="guest-type">${isSpecialGuest ? '🌹 ' : ''}${guest.guestType}</div>
            ${guest.tableNumber ? `<div class="info">桌号: ${guest.tableNumber}</div>` : ''}
            ${guest.organization ? `<div class="info">${guest.organization}</div>` : ''}
          </div>
          <div class="badge-footer">
            <div class="footer-text">${new Date().toLocaleDateString('zh-CN')}</div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 过滤签到记录
  const filteredLogs = recentLogs.filter(log => 
    !logsSearch || 
    log.guestName.includes(logsSearch) || 
    (log.organization && log.organization.includes(logsSearch))
  );

  const displayLogs = showAllLogs ? filteredLogs : filteredLogs.slice(0, 5);

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6" tabIndex={0}>
      <div className="max-w-5xl mx-auto">
        {/* 顶部标题 */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">活动签到系统</h1>
          <p className="text-gray-500 mt-1">扫码签到 · 现场打印胸卡</p>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg text-center font-medium ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' && '✓ '}{message.text}
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">总人数</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.checkedIn}</div>
                <div className="text-sm text-gray-500">已签到</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.notCheckedIn}</div>
                <div className="text-sm text-gray-500">未签到</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.checkInRate}%</div>
                <div className="text-sm text-gray-500">签到率</div>
              </div>
            </div>
          </div>
        </div>

        {/* 签到方式切换 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setMode('scan');
                setKeyword('');
                setSearchResults([]);
              }}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                mode === 'scan'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              扫码签到
            </button>
            <button
              onClick={() => {
                setMode('search');
                setKeyword('');
                setBadgeGuest(null);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                mode === 'search'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              手动搜索
            </button>
          </div>

          {/* 扫码签到模式 */}
          {mode === 'scan' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* 扫码区域 */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center min-h-[280px]">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">扫码签到</h3>
                
                {/* 扫码状态显示 */}
                <div className={`w-full max-w-xs h-16 rounded-lg flex items-center justify-center ${
                  isScanning 
                    ? 'bg-blue-100 border-2 border-blue-400' 
                    : 'bg-gray-50 border-2 border-blue-400'
                }`}>
                  {isScanning ? (
                    <div className="flex items-center gap-2 text-blue-600">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>签到中...</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-gray-400 text-sm">准备扫码</div>
                      <div className="text-gray-300 text-xs mt-1">无需点击，直接扫码即可</div>
                    </div>
                  )}
                </div>
                
                <p className="text-gray-400 text-sm mt-4">将二维码对准扫码枪</p>
                <p className="text-green-500 text-sm font-medium">支持连续扫码，快速签到</p>
              </div>

              {/* 胸牌预览 */}
              <div className="border-2 border-gray-200 rounded-xl p-6 min-h-[280px]">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">胸牌预览</h3>
                {duplicateGuest ? (
                  // 重复签到提示
                  <div>
                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white mb-3">
                      <div className="text-center">
                        <div className="text-xl font-bold mb-2">⚠️ 重复签到</div>
                        <div className="text-2xl font-bold mb-2">{duplicateGuest.name}</div>
                        <div className="text-sm opacity-90 mb-1">{duplicateGuest.organization || '-'}</div>
                        <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mt-2">
                          {duplicateGuest.guestType}
                        </div>
                        {duplicateGuest.tableNumber && (
                          <div className="mt-3 text-sm opacity-80">桌号: {duplicateGuest.tableNumber}</div>
                        )}
                        {duplicateGuest.checkInTime && (
                          <div className="mt-2 text-sm opacity-70">
                            签到时间: {new Date(duplicateGuest.checkInTime).toLocaleString('zh-CN')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-center text-red-600 text-sm font-medium">
                      该嘉宾已签到，请勿重复签到！
                    </div>
                  </div>
                ) : badgeGuest ? (
                  <div>
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white">
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-2">{badgeGuest.name}</div>
                        <div className="text-sm opacity-90 mb-1">{badgeGuest.organization || '-'}</div>
                        <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mt-2">
                          {badgeGuest.guestType}
                        </div>
                        {badgeGuest.tableNumber && (
                          <div className="mt-3 text-sm opacity-80">桌号: {badgeGuest.tableNumber}</div>
                        )}
                      </div>
                    </div>
                    {/* 补打胸牌按钮（备选操作） */}
                    <button
                      onClick={() => handlePrintBadge(badgeGuest)}
                      className="w-full mt-3 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      补打胸牌（系统打印不可用时使用）
                    </button>
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p>等待签到...</p>
                    <p className="text-sm">扫码后将显示胸牌预览</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 手动搜索模式 */}
          {mode === 'search' && (
            <div>
              <div className="flex gap-3 mb-4">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="输入姓名或手机号搜索"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSearch}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
                >
                  搜索
                </button>
              </div>

              {/* 搜索结果 */}
              {searchResults.length > 0 && (
                <div className="border rounded-lg divide-y">
                  {searchResults.slice(0, 5).map((guest) => (
                    <div
                      key={guest.id}
                      onClick={() => {
                        setSelectedGuest(guest);
                        setSearchResults([]);
                      }}
                      className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium">{guest.name}</div>
                        <div className="text-sm text-gray-500">
                          {guest.phone} · {guest.organization}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        guest.checkInStatus === 1 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {guest.checkInStatus === 1 ? '已签到' : '未签到'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 选中嘉宾确认（搜索模式） */}
        {mode === 'search' && selectedGuest && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">确认签到</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">姓名</span>
                <span className="font-medium">{selectedGuest.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">手机</span>
                <span>{selectedGuest.phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">单位</span>
                <span>{selectedGuest.organization || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">身份</span>
                <span>{selectedGuest.guestType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">桌号</span>
                <span>{selectedGuest.tableNumber || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">状态</span>
                <span className={selectedGuest.checkInStatus === 1 ? 'text-green-600' : 'text-gray-500'}>
                  {selectedGuest.checkInStatus === 1 ? '已签到' : '未签到'}
                </span>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setSelectedGuest(null);
                  setKeyword('');
                }}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => handleCheckIn(selectedGuest.qrCode)}
                disabled={selectedGuest.checkInStatus === 1 || isScanning}
                className={`flex-1 py-3 rounded-lg font-medium ${
                  selectedGuest.checkInStatus === 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isScanning ? '签到中...' : selectedGuest.checkInStatus === 1 ? '已签到' : '确认签到'}
              </button>
            </div>
          </div>
        )}

        {/* 最近签到 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">最近签到</h3>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="搜索最近签到..."
                value={logsSearch}
                onChange={(e) => setLogsSearch(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {filteredLogs.length > 5 && (
                <button
                  onClick={() => setShowAllLogs(!showAllLogs)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  {showAllLogs ? '收起' : '展开'}
                </button>
              )}
            </div>
          </div>
          
          {displayLogs.length > 0 ? (
            <div className="space-y-2">
              {displayLogs.map((log) => {
                const isSpecialGuest = log.guestType === '特邀嘉宾';
                return (
                  <div 
                    key={log.id} 
                    onClick={() => handleShowBadge(log)}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isSpecialGuest ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        <svg className={`w-4 h-4 ${isSpecialGuest ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {log.guestName}
                          {isSpecialGuest && <span className="text-red-500 text-sm">🌹</span>}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.organization || '-'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        isSpecialGuest 
                          ? 'bg-red-100 text-red-600 font-medium' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {log.guestType}
                      </span>
                      <span className="text-xs text-blue-500 hover:text-blue-600">查看胸牌</span>
                      <div className="text-sm text-gray-400">
                        {formatTime(log.checkInTime)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              暂无签到记录
            </div>
          )}
        </div>

        {/* 管理后台入口 */}
        <div className="flex justify-end">
          <Link
            href="/checkin/admin"
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            管理后台
          </Link>
        </div>
      </div>
    </div>
  );
}
