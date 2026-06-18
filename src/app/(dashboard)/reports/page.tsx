'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3, TrendingUp, Users, CheckCircle2, Sparkles, AlertTriangle,
  Lightbulb, FileText, CalendarDays, DollarSign, Trophy, Building2,
  Clock, Target, Download, RefreshCw, UserCog,
} from 'lucide-react';

// ---- 类型 ----
type RosterData = {
  stats: Record<string, unknown>;
  exec_team: { name: string; role: string; responsibility: string }[];
  guests: { name: string; title: string; company: string; status: string; guest_type: string }[];
  sponsors: { name: string; level_label: string; amount: number; payment_status: string; contact_name: string }[];
  attendees: { id: string; name: string; company: string; checkin_status: string; source: string; is_member: boolean; tags: string[] }[];
};
type EventData = { name: string; start_time: string; end_time: string; location: string; expected_guests: number };
type TaskRow = { id: string; title: string; status: string; assignee: string; start_date: string; end_date: string; deliverables: string };
type BudgetLine = { category: string; description: string; budget_amount: number; actual_amount: number };
type BudgetSummary = { total_budget: number; total_actual: number };

type FullStats = {
  registered: number; attended: number; rate: number; vip_count: number;
  guest_confirmed: number; guest_attended: number; no_show: number;
  by_source: Record<string, number>;
  tasks_total: number; tasks_completed: number; tasks_in_progress: number; tasks_delayed: number; tasks_completion_rate: number;
  sponsor_count: number; sponsor_amount: number; sponsor_paid: number;
  sponsor_by_level: Record<string, { count: number; amount: number }>;
  budget_total: number; budget_actual: number; budget_variance: number;
  budget_lines: BudgetLine[];
  lottery_participants: number; exec_team_count: number;
};

export default function ReportsPage() {
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [eventId, setEventId] = useState('');
  const [event, setEvent] = useState<EventData | null>(null);
  const [stats, setStats] = useState<FullStats | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [sponsors, setSponsors] = useState<RosterData['sponsors']>([]);
  const [guests, setGuests] = useState<RosterData['guests']>([]);
  const [execTeam, setExecTeam] = useState<RosterData['exec_team']>([]);
  const [loading, setLoading] = useState(false);

  // 摘要编辑
  const [summary, setSummary] = useState('');
  const [highlights, setHighlights] = useState<{ desc: string; cat: string }[]>([]);
  const [issues, setIssues] = useState<{ desc: string; severity: string; root: string }[]>([]);

  const loadEvents = useCallback(async () => {
    const r = await fetch('/api/events?limit=100');
    const j = await r.json();
    setEvents(j.data || []);
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);
  useEffect(() => {
    const eid = new URLSearchParams(window.location.search).get('event');
    if (eid) setEventId(eid);
  }, []);

  const loadReport = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    const r = await fetch(`/api/reports?event_id=${eventId}`);
    const j = await r.json();
    if (j.success) {
      setStats(j.data.stats);
      setEvent(j.data.event);
      setTasks(j.data.tasks || []);
      setSponsors(j.data.sponsors || []);
      setGuests(j.data.guests || []);
      setExecTeam(j.data.execTeam || []);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const s: FullStats = stats || {} as FullStats;
  const attendRate = s.rate || 0;
  const taskRate = s.tasks_completion_rate || 0;
  const variancePct = s.budget_total > 0 ? Math.round((s.budget_variance / s.budget_total) * 100) : 0;

  const BUDGET_CAT_LABELS: Record<string, string> = {
    venue: '场地', construction: '搭建', catering: '餐饮', materials: '物料',
    gifts: '礼品', personnel: '人员', transport: '交通', other: '其他',
  };

  // 穿透弹窗
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailData, setDetailData] = useState<{ label: string; value: string }[]>([]);
  const openDetail = (title: string, rows: { label: string; value: string }[]) => {
    setDetailTitle(title); setDetailData(rows); setDetailOpen(true);
  };
  // 程序化 Tab 切换
  const [activeTab, setActiveTabState] = useState('attendance');
  const switchTab = (tab: string) => setActiveTabState(tab);

  if (loading) return <div className="p-6 text-muted-foreground">正在聚合活动数据...</div>;
  if (!eventId) return (
    <div className="p-6"><Card><CardContent className="py-12 text-center text-muted-foreground">请选择活动查看复盘报告</CardContent></Card></div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">复盘报告</h1>
          <p className="text-muted-foreground">{event?.name || '活动'} · {event?.start_time?.slice(0,10)} · <span className="cursor-pointer underline underline-offset-2 hover:text-primary" onClick={() => switchTab('exec')}>执行小组 {s.exec_team_count}人</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger className="w-[260px]"><SelectValue placeholder="选择活动" /></SelectTrigger>
            <SelectContent>{events.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}</SelectContent>
          </Select>
          <Button variant="outline" onClick={loadReport}><RefreshCw className="mr-2 h-4 w-4" />刷新</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" />导出</Button>
        </div>
      </div>

      {/* ---- KPI 总览 ---- */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <Card className="bg-blue-50 border-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => switchTab("attendees")}><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold tabular-nums">{s.registered}</p><p className="text-xs text-muted-foreground">报名</p></CardContent></Card>
        <Card className="bg-green-50 border-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => switchTab("attended")}><CardContent className="p-4 text-center"><CheckCircle2 className="h-5 w-5 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold tabular-nums">{s.attended}</p><p className="text-xs text-muted-foreground">实到</p></CardContent></Card>
        <Card className="bg-purple-50 border-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => switchTab("attendance")}><CardContent className="p-4 text-center"><TrendingUp className="h-5 w-5 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold tabular-nums">{attendRate}%</p><p className="text-xs text-muted-foreground">签到率</p></CardContent></Card>
        <Card className="bg-amber-50 border-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => switchTab("tasks")}><CardContent className="p-4 text-center"><Target className="h-5 w-5 mx-auto text-amber-500 mb-1" /><p className="text-2xl font-bold tabular-nums">{taskRate}%</p><p className="text-xs text-muted-foreground">任务完成率</p></CardContent></Card>
        <Card className="bg-cyan-50 border-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => switchTab("sponsors")}><CardContent className="p-4 text-center"><DollarSign className="h-5 w-5 mx-auto text-cyan-500 mb-1" /><p className="text-2xl font-bold tabular-nums">¥{(s.sponsor_amount || 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">赞助总额</p></CardContent></Card>
        <Card className="bg-rose-50 border-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => switchTab("sponsors")}><CardContent className="p-4 text-center"><Building2 className="h-5 w-5 mx-auto text-rose-500 mb-1" /><p className="text-2xl font-bold tabular-nums">{s.sponsor_count}</p><p className="text-xs text-muted-foreground">赞助商</p></CardContent></Card>
      </div>

      {/* ---- Tabs: 出席 | 任务 | 赞助 | 预算 | 嘉宾 | 执行组 | 总结 ---- */}
      <Tabs value={activeTab} onValueChange={setActiveTabState}>
        <TabsList>
          <TabsTrigger value="attendance"><Users className="mr-1 h-4 w-4" />出席统计</TabsTrigger>
          <TabsTrigger value="tasks"><Target className="mr-1 h-4 w-4" />任务执行</TabsTrigger>
          <TabsTrigger value="sponsors"><DollarSign className="mr-1 h-4 w-4" />赞助回报</TabsTrigger>
          <TabsTrigger value="budget"><BarChart3 className="mr-1 h-4 w-4" />预算决算</TabsTrigger>
          <TabsTrigger value="guests"><StarIcon className="mr-1 h-4 w-4" />嘉宾出席</TabsTrigger>
          <TabsTrigger value="exec"><UserCog className="mr-1 h-4 w-4" />执行小组</TabsTrigger>
          <TabsTrigger value="summary"><FileText className="mr-1 h-4 w-4" />总结与建议</TabsTrigger>
        </TabsList>

        {/* ====== 1. 出席统计 ====== */}
        <TabsContent value="attendance" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="cursor-pointer hover:shadow-sm" onClick={() => switchTab("attendance")}><CardContent className="p-4"><p className="text-sm text-muted-foreground">报名人数</p><p className="text-3xl font-bold tabular-nums">{s.registered}</p></CardContent></Card>
            <Card className="cursor-pointer hover:shadow-sm" onClick={() => switchTab("attendance")}><CardContent className="p-4"><p className="text-sm text-muted-foreground">实到人数</p><p className="text-3xl font-bold tabular-nums text-green-600">{s.attended}</p></CardContent></Card>
            <Card className="cursor-pointer hover:shadow-sm" onClick={() => switchTab("attendance")}><CardContent className="p-4"><p className="text-sm text-muted-foreground">未出席</p><p className="text-3xl font-bold tabular-nums text-red-500">{s.no_show}</p></CardContent></Card>
            <Card className="cursor-pointer hover:shadow-sm" onClick={() => switchTab("attendance")}><CardContent className="p-4"><p className="text-sm text-muted-foreground">VIP出席</p><p className="text-3xl font-bold tabular-nums text-purple-600">{s.vip_count}</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">签到率趋势</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Progress value={attendRate} className="h-4 flex-1" />
                <span className="text-2xl font-bold tabular-nums">{attendRate}%</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">按来源渠道</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {s.by_source && Object.entries(s.by_source as Record<string, number>).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm"><span>{k}</span><span className="font-bold tabular-nums">{v}</span></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== 2. 任务执行 ====== */}
        <TabsContent value="tasks" className="space-y-4 pt-4">
          <div className="grid grid-cols-4 gap-3">
            <Card className="bg-green-50 border-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => switchTab("attended")}><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground cursor-pointer hover:underline" onClick={() => switchTab("tasks")}>已完成</p><p className="text-2xl font-bold text-green-600">{s.tasks_completed}</p></CardContent></Card>
            <Card className="bg-blue-50 border-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => switchTab("attendees")}><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground cursor-pointer hover:underline" onClick={() => switchTab("tasks")}>进行中</p><p className="text-2xl font-bold text-blue-600">{s.tasks_in_progress}</p></CardContent></Card>
            <Card className="bg-red-50 border-0"><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground cursor-pointer hover:underline" onClick={() => switchTab("tasks")}>已延期</p><p className="text-2xl font-bold text-red-500">{s.tasks_delayed}</p></CardContent></Card>
            <Card className="bg-purple-50 border-0 cursor-pointer hover:shadow-md transition-shadow" onClick={() => switchTab("attendance")}><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">完成率</p><p className="text-2xl font-bold text-purple-600">{taskRate}%</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">任务明细 ({tasks.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border-b pb-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${t.status === 'completed' ? 'bg-green-500' : t.status === 'in_progress' ? 'bg-blue-500' : t.status === 'delayed' ? 'bg-red-500' : 'bg-gray-300'}`} />
                      <span>{t.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{t.assignee}</span>
                      <span>{t.start_date} → {t.end_date}</span>
                      <span className="italic truncate max-w-[180px]">{t.deliverables}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== 3. 赞助回报 ====== */}
        <TabsContent value="sponsors" className="space-y-4 pt-4">
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground cursor-pointer hover:underline" onClick={() => switchTab("sponsors")}>赞助商</p><p className="text-3xl font-bold">{s.sponsor_count}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground cursor-pointer hover:underline" onClick={() => switchTab("sponsors")}>赞助总额</p><p className="text-3xl font-bold">¥{(s.sponsor_amount || 0).toLocaleString()}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground cursor-pointer hover:underline" onClick={() => switchTab("sponsors")}>已收款</p><p className="text-3xl font-bold">{s.sponsor_paid}/{s.sponsor_count}</p></CardContent></Card>
          </div>
          {s.sponsor_by_level && Object.keys(s.sponsor_by_level).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">按等级分布</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(s.sponsor_by_level || {}).map(([lv, val]) => (
                    <div key={lv} className="flex justify-between text-sm"><span>{lv}</span><span className="tabular-nums">{val.count}家 · ¥{val.amount.toLocaleString()}</span></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {sponsors.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">赞助商清单</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sponsors.map((sp, i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b pb-2">
                      <span className="font-medium">{sp.name}</span>
                      <span className="text-muted-foreground">{sp.level_label}</span>
                      <span className="tabular-nums">¥{(sp.amount || 0).toLocaleString()}</span>
                      <Badge variant={sp.payment_status === 'paid' ? 'default' : 'secondary'}>{sp.payment_status}</Badge>
                      <span className="text-xs text-muted-foreground">{sp.contact_name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ====== 4. 预算决算 ====== */}
        <TabsContent value="budget" className="space-y-4 pt-4">
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground cursor-pointer hover:underline" onClick={() => switchTab("budget")}>预算总额</p><p className="text-3xl font-bold">¥{(s.budget_total || 0).toLocaleString()}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground cursor-pointer hover:underline" onClick={() => switchTab("budget")}>实际支出</p><p className="text-3xl font-bold">¥{(s.budget_actual || 0).toLocaleString()}</p></CardContent></Card>
            <Card className={variancePct > 0 ? 'bg-green-50' : 'bg-red-50'}><CardContent className="p-4"><p className="text-sm text-muted-foreground">差异</p><p className={`text-3xl font-bold ${variancePct > 0 ? 'text-green-600' : 'text-red-600'}`}>{variancePct > 0 ? '↓' : '↑'} {Math.abs(variancePct)}%</p></CardContent></Card>
          </div>
          {(s.budget_lines || []).length > 0 ? (
            <Card>
              <CardHeader><CardTitle className="text-base">分类明细</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(s.budget_lines || []).map((l, i) => {
                    const diff = l.budget_amount - l.actual_amount;
                    return (
                      <div key={i} className="flex items-center gap-4 text-sm">
                        <span className="w-16 text-xs text-muted-foreground">{BUDGET_CAT_LABELS[l.category] || l.category}</span>
                        <span className="flex-1 truncate">{l.description}</span>
                        <span className="tabular-nums">¥{l.budget_amount.toLocaleString()}</span>
                        <span className="tabular-nums text-muted-foreground">→ ¥{l.actual_amount.toLocaleString()}</span>
                        <span className={`tabular-nums font-bold ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>{diff >= 0 ? `节余${diff.toLocaleString()}` : `超支${Math.abs(diff).toLocaleString()}`}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">暂无预算数据。可在活动详情中设置预算字段，或在预算模块录入。</CardContent></Card>
          )}
        </TabsContent>

        {/* ====== 5. 嘉宾出席 ====== */}
        <TabsContent value="guests" className="space-y-4 pt-4">
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground cursor-pointer hover:underline" onClick={() => switchTab("guests")}>嘉宾总数</p><p className="text-3xl font-bold">{guests.length}</p></CardContent></Card>
            <Card className="bg-green-50"><CardContent className="p-4"><p className="text-sm text-muted-foreground cursor-pointer hover:underline" onClick={() => switchTab("guests")}>已确认</p><p className="text-3xl font-bold text-green-600">{s.guest_confirmed}</p></CardContent></Card>
            <Card className="bg-purple-50"><CardContent className="p-4"><p className="text-sm text-muted-foreground cursor-pointer hover:underline" onClick={() => switchTab("guests")}>已出席</p><p className="text-3xl font-bold text-purple-600">{s.guest_attended}</p></CardContent></Card>
          </div>
          {guests.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">嘉宾清单</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {guests.map((g, i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b pb-2">
                      <span className="font-medium">{g.name}</span>
                      <span className="text-muted-foreground">{g.title} · {g.company}</span>
                      <Badge variant="outline">{g.guest_type}</Badge>
                      <Badge variant={g.status === 'confirmed' || g.status === 'attended' ? 'default' : 'secondary'}>{g.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ====== 6. 执行小组 ====== */}
        <TabsContent value="exec" className="space-y-4 pt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">执行小组 ({execTeam.length}人)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {execTeam.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm border rounded-lg p-3">
                    <div className="font-medium min-w-[60px]">{m.name}</div>
                    <Badge variant="secondary" className="text-xs">{m.role}</Badge>
                    <span className="text-xs text-muted-foreground truncate flex-1">{m.responsibility}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== 7. 总结与建议 ====== */}
        <TabsContent value="summary" className="space-y-4 pt-4">
          <Card>
            <CardHeader><CardTitle>活动总结</CardTitle><CardDescription>对活动整体情况做简要概括</CardDescription></CardHeader>
            <CardContent><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} placeholder="输入活动总结..." /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" />活动亮点</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {highlights.map((h, i) => (
                <div key={i} className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 flex justify-between">
                  <span className="text-sm">{h.desc}</span>
                  <Badge variant="outline" className="text-xs">{h.cat}</Badge>
                </div>
              ))}
              <div className="flex gap-2">
                <Input placeholder="亮点描述" id="hl-desc" />
                <Select defaultValue="execution">
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="execution">执行</SelectItem><SelectItem value="guest">嘉宾</SelectItem><SelectItem value="sponsor">赞助</SelectItem><SelectItem value="content">内容</SelectItem><SelectItem value="team">团队</SelectItem><SelectItem value="innovation">创新</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => {
                  const i = (document.getElementById('hl-desc') as HTMLInputElement);
                  const s = (document.querySelector('#hl-desc + div [data-value]') as HTMLElement)?.dataset?.value || 'execution';
                  if (i?.value.trim()) { setHighlights([...highlights, { desc: i.value.trim(), cat: s }]); i.value = ''; }
                }}>添加</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-500" />问题记录与根因分析</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {issues.map((iss, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={iss.severity === 'critical' ? 'destructive' : iss.severity === 'major' ? 'default' : 'secondary'}>{iss.severity}</Badge>
                    <span className="text-sm font-medium">{iss.desc}</span>
                  </div>
                  {iss.root && <p className="text-xs text-muted-foreground">根因: {iss.root}</p>}
                </div>
              ))}
              <div className="flex gap-2">
                <Input placeholder="问题描述" id="iss-desc" />
                <Select defaultValue="minor"><SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="critical">严重</SelectItem><SelectItem value="major">重要</SelectItem><SelectItem value="minor">轻微</SelectItem></SelectContent>
                </Select>
                <Input placeholder="根因" id="iss-root" className="w-40" />
                <Button variant="outline" onClick={() => {
                  const d = (document.getElementById('iss-desc') as HTMLInputElement);
                  const r = (document.getElementById('iss-root') as HTMLInputElement);
                  if (d?.value.trim()) { setIssues([...issues, { desc: d.value.trim(), severity: 'minor', root: r.value.trim() }]); d.value = ''; r.value = ''; }
                }}>添加</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-yellow-500" />改进建议</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                {s.tasks_delayed > 0 && <p>• 任务延期 {s.tasks_delayed} 项，建议活动前期增加缓冲时间（T-7天完成核心筹备）</p>}
                {s.no_show > s.registered * 0.2 && <p>• 未出席率偏高 ({Math.round(s.no_show / Math.max(s.registered, 1) * 100)}%)，建议提前一周做最终确认回访</p>}
                {s.budget_variance < 0 && <p>• 预算超支 ¥{Math.abs(s.budget_variance || 0).toLocaleString()}，建议按品类设置硬上限并实时预警</p>}
                {(s.sponsor_count || 0) < (s.registered || 0) * 0.05 && <p>• 赞助转化率偏低，建议增设更多分层权益包吸引中小额度赞助</p>}
                <p>• 建议每次活动后沉淀标准 SOP 模板（场地/嘉宾/签到/物料/台本 5 个关键链路）</p>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" onClick={() => {}}><Sparkles className="mr-2 h-4 w-4" />AI 生成复盘报告</Button>
        </TabsContent>
      
      {/* ====== 穿透明细弹窗 ====== */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-xl max-h-[70vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{detailTitle}</DialogTitle></DialogHeader>
          <Table>
            <TableHeader><TableRow><TableHead>项目</TableHead><TableHead className="text-right">数据</TableHead></TableRow></TableHeader>
            <TableBody>
              {detailData.map((row, i) => (
                <TableRow key={i}><TableCell>{row.label}</TableCell><TableCell className="text-right tabular-nums font-medium">{row.value}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
</Tabs>
    </div>
  );
}

// shim for Star icon
function StarIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
