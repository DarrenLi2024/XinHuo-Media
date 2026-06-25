'use client';

/* eslint-disable react-hooks/purity */
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Plus, Search, CalendarDays, Clock, AlertCircle, CheckCircle2, Play, Pencil, Trash2, X, Check,
} from 'lucide-react';

type TaskRow = {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  status: string;
  progress: number;
  priority: string;
  assignee: string;
  responsibility: string;
  start_date: string;
  end_date: string;
  deliverables: string;
  created_at: string;
  updated_at: string;
  events?: { name: string };
};

type EventOption = { id: string; name: string };

const STATUS_ITEMS: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending: { label: '待开始', icon: Clock, color: '#6b7280', bg: '#f3f4f6' },
  in_progress: { label: '进行中', icon: Play, color: '#3b82f6', bg: '#eff6ff' },
  completed: { label: '已完成', icon: CheckCircle2, color: '#22c55e', bg: '#f0fdf4' },
  delayed: { label: '已延期', icon: AlertCircle, color: '#ef4444', bg: '#fef2f2' },
  cancelled: { label: '已取消', icon: X, color: '#9ca3af', bg: '#f9fafb' },
};

const PRIORITY_ITEMS: Record<string, { label: string; className: string }> = {
  high: { label: '高', className: 'border-red-300 bg-red-50 text-red-700' },
  medium: { label: '中', className: 'border-yellow-300 bg-yellow-50 text-yellow-700' },
  low: { label: '低', className: 'border-green-300 bg-green-50 text-green-700' },
};

const EMPTY_FORM = {
  title: '', description: '', assignee: '', responsibility: '',
  start_date: '', end_date: '', deliverables: '', priority: 'medium',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('list');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<TaskRow>>({});

  // 存储当前时间，避免在 useMemo 中直接调用 Date.now()
  const nowRef = useRef(Date.now());

  const loadEvents = useCallback(async () => {
    const res = await fetch('/api/events?limit=100');
    const json = await res.json();
    setEvents(json.data || []);
  }, []);

  const loadTasks = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedEventId) params.set('event_id', selectedEventId);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    const res = await fetch(`/api/tasks?${params}`);
    const json = await res.json();
    if (json.success) setTasks(json.data);
    else setError(json.error || '加载失败');
  }, [selectedEventId, statusFilter]);

  useEffect(() => { loadEvents(); }, [loadEvents]);
  useEffect(() => { loadTasks(); }, [loadTasks]);
  useEffect(() => {
    const eid = new URLSearchParams(window.location.search).get('event');
    if (eid) setSelectedEventId(eid);
  }, []);

  const filteredTasks = useMemo(() => {
    const s = searchQuery.trim().toLowerCase();
    return tasks.filter((t) => {
      const title = t.title.toLowerCase();
      const assignee = (t.assignee || '').toLowerCase();
      const matchesSearch = !s || title.includes(s) || assignee.includes(s);
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

  const ganttRange = useMemo(() => {
    if (filteredTasks.length === 0) return { min: '', max: '', days: 0, dateList: [] as string[] };
    const dates = filteredTasks.flatMap((t) => [t.start_date, t.end_date].filter(Boolean));
    if (dates.length === 0) return { min: '', max: '', days: 0, dateList: [] as string[] };
    const sorted = [...dates].sort();
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const minD = new Date(min);
    const maxD = new Date(max);
    const days = Math.ceil((maxD.getTime() - minD.getTime()) / 86400000) + 1;
    const dateList: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(minD);
      d.setDate(d.getDate() + i);
      dateList.push(d.toISOString().slice(0, 10));
    }
    return { min, max, days, dateList };
  }, [filteredTasks]);

  const weekDueCount = useMemo(() => {
    const nowT = nowRef.current;
    const weekLater = nowT + 7 * 86400000;
    return tasks.filter((t) => {
      const due = new Date(t.end_date).getTime();
      return Number.isFinite(due) && due < weekLater && t.status !== 'completed';
    }).length;
  }, [tasks]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { pending: 0, in_progress: 0, completed: 0, delayed: 0, cancelled: 0 };
    tasks.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return counts;
  }, [tasks]);

  const handleCreate = async () => {
    if (!selectedEventId || !form.title || !form.end_date) {
      setError('请选择活动并填写任务名称、截止时间'); return;
    }
    const res = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, event_id: selectedEventId }),
    });
    const json = await res.json();
    if (!json.success) { setError(json.error); return; }
    setForm(EMPTY_FORM);
    setDialogOpen(false);
    loadTasks();
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    await fetch('/api/tasks', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, status }),
    });
    loadTasks();
  };

  const handleDelete = async (taskId: string) => {
    await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' });
    loadTasks();
  };

  const startEdit = (task: TaskRow) => {
    setEditingId(task.id);
    setEditValues({
      title: task.title, description: task.description || '',
      assignee: task.assignee, responsibility: task.responsibility,
      start_date: task.start_date, end_date: task.end_date,
      deliverables: task.deliverables, priority: task.priority,
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditValues({}); };

  const saveEdit = async (taskId: string) => {
    await fetch('/api/tasks', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, ...editValues }),
    });
    setEditingId(null);
    loadTasks();
  };

  // 甘特图辅助
  const ganttColWidth = 36;
  const ganttLabelWidth = 260;

  const ganttBarStyle = (task: TaskRow) => {
    const { dateList } = ganttRange;
    const sIdx = dateList.indexOf(task.start_date);
    const eIdx = dateList.indexOf(task.end_date);
    if (sIdx === -1 || eIdx === -1) return { display: 'none' };
    const left = sIdx * ganttColWidth;
    const width = (eIdx - sIdx + 1) * ganttColWidth;
    const cfg = STATUS_ITEMS[task.status] || STATUS_ITEMS.pending;
    return {
      left: `${left}px`,
      width: `${width}px`,
      backgroundColor: cfg.color,
      opacity: task.status === 'completed' ? 0.7 : 0.9,
    };
  };

  // 计算任务在全局天数中的百分比（用于移动端时序条宽度）
  const taskDayPct = (task: TaskRow) => {
    const { dateList, days } = ganttRange;
    if (days === 0) return { leftPct: 0, widthPct: 0 };
    const sIdx = dateList.indexOf(task.start_date);
    const eIdx = dateList.indexOf(task.end_date);
    if (sIdx === -1 || eIdx === -1) return { leftPct: 0, widthPct: 0 };
    return {
      leftPct: (sIdx / days) * 100,
      widthPct: ((eIdx - sIdx + 1) / days) * 100,
    };
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayPos = ganttRange.dateList.indexOf(today);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-serif">任务分工</h1>
          <p className="text-muted-foreground text-sm">管理活动筹备任务，甘特图直观展现进度</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />新建任务</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto max-w-lg">
            <DialogHeader><DialogTitle>新建任务</DialogTitle></DialogHeader>
            <div className="space-y-3 py-4">
              <div className="space-y-2"><Label>所属活动</Label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger><SelectValue placeholder="选择活动" /></SelectTrigger>
                  <SelectContent>{events.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>任务名称 *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="space-y-2"><Label>优先级</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">高</SelectItem><SelectItem value="medium">中</SelectItem><SelectItem value="low">低</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>责任人</Label><Input value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} placeholder="如：张经理" /></div>
              <div className="space-y-2"><Label>职责内容</Label><Textarea value={form.responsibility} onChange={(e) => setForm({ ...form, responsibility: e.target.value })} placeholder="描述该任务的具体工作内容" rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>开始时间</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>截止时间 *</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>交付物</Label><Textarea value={form.deliverables} onChange={(e) => setForm({ ...form, deliverables: e.target.value })} placeholder="任务完成后需要产出的成果" rows={2} /></div>
              <div className="space-y-2"><Label>备注</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="其他说明" rows={1} /></div>
              <Button className="w-full" onClick={handleCreate}>保存任务</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {['pending', 'in_progress', 'completed', 'delayed'].map((s) => {
          const cfg = STATUS_ITEMS[s];
          return (
            <Card key={s} className="border-0" style={{ backgroundColor: cfg.bg }}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-3">
                  <cfg.icon className="h-5 w-5" style={{ color: cfg.color }} />
                  <div><p className="text-2xl font-bold tabular-nums">{statusCounts[s] || 0}</p><p className="text-xs text-muted-foreground">{cfg.label}</p></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-orange-500" />
              <div><p className="text-2xl font-bold tabular-nums">{weekDueCount}</p><p className="text-xs text-muted-foreground">本周到期</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedEventId || 'all'} onValueChange={(v) => setSelectedEventId(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="全部活动" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部活动</SelectItem>
                {events.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="搜索任务或责任人..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {Object.entries(STATUS_ITEMS).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="优先级" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部优先级</SelectItem>
                {Object.entries(PRIORITY_ITEMS).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && <Card className="border-destructive/30"><CardContent className="py-4 text-sm text-destructive">{error}</CardContent></Card>}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">列表视图</TabsTrigger>
          <TabsTrigger value="gantt">甘特图</TabsTrigger>
        </TabsList>

        {/* === LIST VIEW === */}
        <TabsContent value="list" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-4">
              {filteredTasks.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">暂无任务，点击「新建任务」开始。</div>
              ) : (
                <div className="space-y-2">
                  {filteredTasks.map((task) => {
                    const isEditing = editingId === task.id;
                    const StatusIcon = STATUS_ITEMS[task.status]?.icon || Clock;
                    const pCfg = PRIORITY_ITEMS[task.priority] || PRIORITY_ITEMS.medium;
                    return (
                      <div key={task.id} className="rounded-lg border p-4 hover:border-primary/30 transition-colors">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Input className="w-[60%] font-medium" value={editValues.title || ''} onChange={(e) => setEditValues({ ...editValues, title: e.target.value })} />
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={cancelEdit}><X className="h-4 w-4" /></Button>
                                <Button size="sm" onClick={() => saveEdit(task.id)}><Check className="h-4 w-4 mr-1" />保存</Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-xs">责任人</Label><Input value={editValues.assignee || ''} onChange={(e) => setEditValues({ ...editValues, assignee: e.target.value })} /></div>
                              <div className="space-y-1"><Label className="text-xs">优先级</Label>
                                <Select value={editValues.priority || 'medium'} onValueChange={(v) => setEditValues({ ...editValues, priority: v })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="high">高</SelectItem><SelectItem value="medium">中</SelectItem><SelectItem value="low">低</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-1"><Label className="text-xs">职责内容</Label><Textarea value={editValues.responsibility || ''} onChange={(e) => setEditValues({ ...editValues, responsibility: e.target.value })} rows={2} /></div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1"><Label className="text-xs">开始时间</Label><Input type="date" value={editValues.start_date || ''} onChange={(e) => setEditValues({ ...editValues, start_date: e.target.value })} /></div>
                              <div className="space-y-1"><Label className="text-xs">截止时间</Label><Input type="date" value={editValues.end_date || ''} onChange={(e) => setEditValues({ ...editValues, end_date: e.target.value })} /></div>
                            </div>
                            <div className="space-y-1"><Label className="text-xs">交付物</Label><Textarea value={editValues.deliverables || ''} onChange={(e) => setEditValues({ ...editValues, deliverables: e.target.value })} rows={1} /></div>
                            <div className="space-y-1"><Label className="text-xs">备注</Label><Textarea value={editValues.description || ''} onChange={(e) => setEditValues({ ...editValues, description: e.target.value })} rows={1} /></div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <StatusIcon className="h-4 w-4 mt-0.5" style={{ color: STATUS_ITEMS[task.status]?.color }} />
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold">{task.title}</span>
                                    <Badge variant="outline" className={pCfg.className}>{pCfg.label}</Badge>
                                    <Badge variant="outline" style={{ color: STATUS_ITEMS[task.status]?.color, borderColor: STATUS_ITEMS[task.status]?.color }}>
                                      {STATUS_ITEMS[task.status]?.label}
                                    </Badge>
                                  </div>
                                  {task.assignee && <p className="text-sm text-muted-foreground mt-1">👤 {task.assignee}</p>}
                                  {task.responsibility && <p className="text-sm mt-1 line-clamp-2">{task.responsibility}</p>}
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <span>📅 {task.start_date} → {task.end_date}</span>
                                    {task.deliverables && <span>📦 {task.deliverables}</span>}
                                  </div>
                                  <div className="mt-2 flex items-center gap-2">
                                    <Progress value={task.progress} className="h-1.5 w-[120px]" />
                                    <span className="text-xs text-muted-foreground tabular-nums">{task.progress}%</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <TooltipProvider delayDuration={300}>
                                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(task)}><Pencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>编辑</TooltipContent></Tooltip>
                                </TooltipProvider>
                                <TooltipProvider delayDuration={300}>
                                  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(task.id)}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>删除</TooltipContent></Tooltip>
                                </TooltipProvider>
                                {task.status === 'pending' && <Button size="sm" variant="outline" onClick={() => handleStatusChange(task.id, 'in_progress')}>开始</Button>}
                                {task.status === 'in_progress' && <Button size="sm" variant="outline" onClick={() => handleStatusChange(task.id, 'completed')}>完成</Button>}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* === GANTT VIEW — PC 横向 / 移动端竖向 ========================== */}
        {/* ================================================================ */}
        <TabsContent value="gantt" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-serif">活动任务甘特图</CardTitle>
              <p className="text-sm text-muted-foreground">共 {filteredTasks.length} 个任务</p>
            </CardHeader>
            <CardContent>
              {filteredTasks.length === 0 || ganttRange.days === 0 ? (
                <div className="py-8 text-center text-muted-foreground">暂无任务数据，请先创建任务。</div>
              ) : (
                <>
                  {/* === PC: Horizontal Gantt (hidden on mobile) === */}
                  <div className="hidden lg:block overflow-x-auto">
                    <div style={{ minWidth: ganttLabelWidth + ganttRange.days * ganttColWidth + 20, position: 'relative' }}>
                      {/* Date header */}
                      <div className="flex" style={{ marginLeft: ganttLabelWidth }}>
                        {ganttRange.dateList.map((date) => (
                          <div key={date} className="text-[10px] text-muted-foreground text-center border-l border-gray-100 shrink-0"
                            style={{ width: ganttColWidth }}>{date.slice(5)}</div>
                        ))}
                      </div>

                      {/* Today line */}
                      {todayPos !== -1 && (
                        <div style={{
                          position: 'absolute', top: 0,
                          left: `${ganttLabelWidth + todayPos * ganttColWidth + ganttColWidth / 2}px`,
                          width: '2px', height: `${22 + filteredTasks.length * 40}px`,
                          backgroundColor: '#ef4444', zIndex: 20, pointerEvents: 'none' }}>
                          <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: '#ef4444', whiteSpace: 'nowrap', fontWeight: 600 }}>今天</span>
                        </div>
                      )}

                      {/* Task rows */}
                      <div className="mt-2">
                        {filteredTasks.map((task) => (
                          <div key={task.id} className="flex items-center border-b border-gray-50 hover:bg-muted/30" style={{ height: 40 }}>
                            <div className="shrink-0 flex items-center gap-2 pr-3" style={{ width: ganttLabelWidth }}>
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_ITEMS[task.status]?.color }} />
                              <span className="text-xs truncate font-medium" title={task.title}>{task.title}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0">{task.assignee}</span>
                            </div>
                            <div className="relative flex-1" style={{ height: 24 }}>
                              <div className="absolute top-0 rounded-full h-full flex items-center justify-center text-[10px] text-white font-medium px-1.5 truncate cursor-default"
                                style={ganttBarStyle(task)}
                                title={`${task.title}: ${task.start_date} → ${task.end_date} (${task.progress}%)`}>
                                {task.progress > 0 ? `${task.progress}%` : ''}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                        {Object.entries(STATUS_ITEMS).slice(0, 4).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: v.color }} /><span>{v.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* === Mobile: Vertical Timeline (visible below lg) === */}
                  <div className="lg:hidden space-y-4">
                    {/* Today marker strip */}
                    {todayPos !== -1 && (
                      <div className="flex items-center gap-2 px-1">
                        <div className="h-0.5 flex-1 bg-red-200" />
                        <span className="text-[11px] font-semibold text-red-500 whitespace-nowrap">● 今天</span>
                        <div className="h-0.5 flex-1 bg-red-200" />
                      </div>
                    )}

                    {filteredTasks.map((task) => {
                      const { leftPct, widthPct } = taskDayPct(task);
                      const cfg = STATUS_ITEMS[task.status] || STATUS_ITEMS.pending;
                      const totalDays = ganttRange.days;
                      const sIdx = ganttRange.dateList.indexOf(task.start_date);
                      const eIdx = ganttRange.dateList.indexOf(task.end_date);
                      const taskDays = sIdx === -1 || eIdx === -1 ? 0 : eIdx - sIdx + 1;

                      return (
                        <div key={task.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                          {/* Header row */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                              <span className="text-sm font-semibold truncate">{task.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge variant="outline" className={PRIORITY_ITEMS[task.priority]?.className || ''}>
                                {PRIORITY_ITEMS[task.priority]?.label || task.priority}
                              </Badge>
                              <Badge variant="outline" style={{ color: cfg.color, borderColor: cfg.color }}>{cfg.label}</Badge>
                            </div>
                          </div>

                          {/* Meta */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {task.assignee && <span>👤 {task.assignee}</span>}
                            <span>{task.start_date} → {task.end_date}</span>
                            <span>{taskDays}天</span>
                          </div>

                          {/* Vertical Timeline Bar */}
                          <div className="relative h-8 rounded-full bg-muted overflow-hidden">
                            {/* Task bar */}
                            <div
                              className="absolute top-0 h-full rounded-full flex items-center justify-end pr-2 text-[10px] text-white font-semibold transition-all"
                              style={{
                                left: `${leftPct}%`,
                                width: `${Math.max(widthPct, 2)}%`,
                                backgroundColor: cfg.color,
                                opacity: task.status === 'completed' ? 0.7 : 0.9,
                              }}
                            >
                              {widthPct > 15 && `${task.progress}%`}
                            </div>
                            {/* Today marker on bar */}
                            {todayPos !== -1 && sIdx !== -1 && eIdx !== -1 && todayPos >= sIdx && todayPos <= eIdx && (
                              <div
                                className="absolute top-0 w-0.5 h-full bg-red-500 z-10"
                                style={{ left: `${((todayPos - sIdx) / Math.max(eIdx - sIdx, 1)) * widthPct + leftPct}%` }}
                              />
                            )}
                          </div>

                          {/* Progress */}
                          <div className="flex items-center gap-2">
                            <Progress value={task.progress} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground tabular-nums">{task.progress}%</span>
                          </div>

                          {/* Action */}
                          <div className="flex items-center gap-2 pt-1">
                            {task.status === 'pending' && (
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleStatusChange(task.id, 'in_progress')}>开始</Button>
                            )}
                            {task.status === 'in_progress' && (
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleStatusChange(task.id, 'completed')}>完成</Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => startEdit(task)}><Pencil className="h-3 w-3 mr-1" />编辑</Button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-2">
                      {Object.entries(STATUS_ITEMS).slice(0, 4).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: v.color }} /><span>{v.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
