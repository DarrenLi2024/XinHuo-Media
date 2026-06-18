'use client';

// 大屏抽奖系统 - 活动信息配置
//
// 配置大屏标题、主题风格、主办方、LOGO、底部信息。

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Save } from 'lucide-react';
import { LotteryAdminShell } from '@/components/lottery/admin-shell';
import { useLotteryEvent } from '@/hooks/use-lottery-event';
import { getEventInfo, saveEventInfo } from '@/lib/lottery/db';
import { THEMES, getThemeConfig } from '@/lib/lottery/theme';
import { broadcastLotteryChange } from '@/lib/lottery/sync';
import type { LotteryTheme } from '@/lib/lottery/db/types';

export default function EventInfoPage() {
  const { events, eventId, setEventId } = useLotteryEvent();
  const [eventName, setEventName] = useState('');
  const [theme, setTheme] = useState<LotteryTheme>('tech-blue');
  const [organizer, setOrganizer] = useState('');
  const [logo, setLogo] = useState('');
  const [footerText, setFooterText] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!eventId) return;
    const info = await getEventInfo(eventId);
    const fallbackName = events.find((e) => e.id === eventId)?.name || '';
    setEventName(info?.eventName || fallbackName);
    setTheme(info?.theme || 'tech-blue');
    setOrganizer(info?.organizer || '');
    setLogo(info?.logo || '');
    setFooterText(info?.footerText || '');
  }, [eventId, events]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!eventId) return;
    const ts = new Date().toISOString();
    await saveEventInfo({
      id: eventId,
      eventName,
      theme,
      organizer,
      logo,
      footerText,
      createdAt: ts,
      updatedAt: ts,
    });
    broadcastLotteryChange(eventId, 'eventInfo');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const themeConfig = getThemeConfig(theme);

  return (
    <LotteryAdminShell
      title="活动信息"
      description="大屏标题 · 主题 · LOGO · 底部信息"
      events={events}
      eventId={eventId}
      onEventChange={setEventId}
      actions={
        <Button onClick={() => void save()}>
          <Save className="mr-2 h-4 w-4" />
          {saved ? '已保存' : '保存'}
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>活动名称（大屏标题）</Label>
              <Input value={eventName} onChange={(e) => setEventName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>主题风格</Label>
              <Select value={theme} onValueChange={(v) => setTheme(v as LotteryTheme)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(THEMES).map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>主办方</Label>
              <Input value={organizer} onChange={(e) => setOrganizer(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>LOGO 图片 URL</Label>
              <Input value={logo} onChange={(e) => setLogo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>底部信息</Label>
              <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>主题预览</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="flex h-64 flex-col items-center justify-center rounded-xl border text-center"
              style={{ background: themeConfig.background }}
            >
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="logo" className="mb-3 h-12 object-contain" />
              )}
              <p className="text-sm tracking-widest text-white/70">{organizer || '主办方'}</p>
              <h2
                className="mt-1 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent"
                style={{ backgroundImage: `linear-gradient(to right, ${themeConfig.accent}, ${themeConfig.primary})` }}
              >
                {eventName || '活动名称'}
              </h2>
              <p className="mt-3 text-xs text-white/50">{footerText || '底部信息'}</p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">主色 {themeConfig.primary} · 强调 {themeConfig.accent}</p>
          </CardContent>
        </Card>
      </div>
    </LotteryAdminShell>
  );
}
