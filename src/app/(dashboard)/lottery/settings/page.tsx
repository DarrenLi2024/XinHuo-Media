'use client';

// 大屏抽奖系统 - 系统设置
//
// 数据备份/恢复、清空数据、重置抽奖结果、音效配置。
// 清空/恢复等危险操作仅超级管理员可执行。

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Download, Upload, Trash2, RotateCcw, Volume2, AlertTriangle } from 'lucide-react';
import { LotteryAdminShell } from '@/components/lottery/admin-shell';
import { useLotteryEvent } from '@/hooks/use-lottery-event';
import { useUserStore } from '@/store';
import {
  exportEventBackup,
  importEventBackup,
  clearEventData,
  resetDrawResults,
  type LotteryBackup,
} from '@/lib/lottery/db';
import { broadcastLotteryChange } from '@/lib/lottery/sync';
import { audioManager } from '@/lib/lottery/audio';
import type { SystemConfig } from '@/types';

export default function LotterySettingsPage() {
  const { events, eventId, setEventId } = useLotteryEvent();
  const { user } = useUserStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const [message, setMessage] = useState('');
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConfig(audioManager.getConfig());
  }, []);

  const updateConfig = useCallback((patch: Partial<SystemConfig>) => {
    audioManager.updateConfig(patch);
    setConfig(audioManager.getConfig());
  }, []);

  const exportBackup = async () => {
    if (!eventId) return;
    const backup = await exportEventBackup(eventId);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `抽奖备份_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !eventId) return;
    if (!confirm('恢复备份将覆盖当前活动的全部抽奖数据，确认继续？')) {
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    try {
      const text = await file.text();
      const backup = JSON.parse(text) as LotteryBackup;
      await importEventBackup(eventId, backup);
      broadcastLotteryChange(eventId, 'all');
      setMessage('备份已恢复');
    } catch {
      setMessage('备份文件解析失败');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const doReset = async () => {
    if (!eventId || !confirm('确认重置抽奖结果？将清除全部中奖记录并恢复人员中奖状态，奖项与人员名单保留。')) return;
    await resetDrawResults(eventId);
    broadcastLotteryChange(eventId, 'all');
    setMessage('抽奖结果已重置');
  };

  const doClear = async () => {
    if (!eventId || !confirm('危险操作：将清空该活动的全部抽奖数据（人员、奖项、锁定、记录、活动信息），不可恢复！')) return;
    await clearEventData(eventId);
    broadcastLotteryChange(eventId, 'all');
    setMessage('该活动的抽奖数据已全部清空');
  };

  return (
    <LotteryAdminShell
      title="系统设置"
      description="备份恢复 · 数据清理 · 音效"
      events={events}
      eventId={eventId}
      onEventChange={setEventId}
    >
      {message && (
        <Card className="border-primary/30">
          <CardContent className="py-3 text-sm">{message}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            音效设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {config && (
            <>
              <div className="flex items-center justify-between">
                <Label>启用音效</Label>
                <Switch checked={config.enableEffects} onCheckedChange={(v) => updateConfig({ enableEffects: v })} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>音效音量</Label>
                  <span className="text-sm text-muted-foreground">{Math.round(config.effectVolume * 100)}%</span>
                </div>
                <Slider
                  value={[config.effectVolume * 100]}
                  max={100}
                  step={5}
                  onValueChange={([v]) => updateConfig({ effectVolume: v / 100 })}
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => audioManager.playWinSound()}>
                试听中奖音效
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>数据备份</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => void exportBackup()}>
            <Download className="mr-2 h-4 w-4" />
            导出备份（JSON）
          </Button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={onImport} />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={!isSuperAdmin}>
            <Upload className="mr-2 h-4 w-4" />
            恢复备份
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            危险区域
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isSuperAdmin && (
            <p className="text-sm text-muted-foreground">以下操作需超级管理员权限。</p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => void doReset()} disabled={!isSuperAdmin}>
              <RotateCcw className="mr-2 h-4 w-4" />
              重置抽奖结果
            </Button>
            <Button variant="destructive" onClick={() => void doClear()} disabled={!isSuperAdmin}>
              <Trash2 className="mr-2 h-4 w-4" />
              清空全部数据
            </Button>
          </div>
        </CardContent>
      </Card>
    </LotteryAdminShell>
  );
}
