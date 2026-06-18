'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
/* XLSX loaded dynamically on export */
import {
  CheckCircle2,
  ChevronDown,
  Cloud,
  Download,
  FileDown,
  FileSpreadsheet,
  FileText,
  GripVertical,
  ImageDown,
  Loader2,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  DEFAULT_EXPORT_CONFIG,
  DEFAULT_ROLES,
  EXPORT_CONFIG,
  SKIN_CONFIGS,
} from '@/config/script-constants';
import {
  apiChaptersToEventChapters,
  apiSegmentsToEventSegments,
  calculateSegmentTimes,
  createEmptyScript,
  generateId,
  responsibilitiesToList,
} from '@/lib/scripts/event-utils';
import type {
  ApiScriptChapter,
  ApiScriptSegment,
  EventChapter,
  EventOption,
  EventScript,
  EventSegment,
  EventStep,
  ExportSkin,
  ExportTemplateConfig,
  Role,
  SegmentStatus,
  SegmentType,
} from '@/types/script-event';

type ViewMode = 'edit' | 'export';

type ScriptApiResponse = {
  data?: {
    chapters?: ApiScriptChapter[];
    segments?: ApiScriptSegment[];
  };
  error?: string;
};

const segmentTypes: Array<{ value: SegmentType; label: string }> = [
  { value: 'speech', label: '致辞' },
  { value: 'performance', label: '表演' },
  { value: 'video', label: '视频' },
  { value: 'award', label: '颁奖' },
  { value: 'lottery', label: '抽奖' },
  { value: 'break', label: '休息' },
  { value: 'interactive', label: '互动' },
  { value: 'other', label: '其他' },
];

const statusConfig: Record<SegmentStatus, { label: string; className: string }> = {
  pending: { label: '待执行', className: 'bg-slate-100 text-slate-700' },
  ready: { label: '准备中', className: 'bg-blue-100 text-blue-700' },
  ongoing: { label: '进行中', className: 'bg-emerald-100 text-emerald-700' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-700' },
  skipped: { label: '已跳过', className: 'bg-red-100 text-red-700' },
};

export default function ScriptsPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [script, setScript] = useState<EventScript>(() => createEmptyScript());
  const [exportConfig, setExportConfig] = useState<ExportTemplateConfig>(DEFAULT_EXPORT_CONFIG);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [customRole, setCustomRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [previewElement, setPreviewElement] = useState<HTMLDivElement | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrationRef = useRef(false);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId],
  );

  const storageKey = selectedEventId ? `eventsync-pro:${selectedEventId}` : '';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const loadEvents = useCallback(async () => {
    const response = await fetch('/api/events?limit=100', { credentials: 'include' });
    const result: { data?: EventOption[] } = await response.json();
    const nextEvents = result.data || [];
    setEvents(nextEvents);
    const queryEventId = new URLSearchParams(window.location.search).get('event');
    setSelectedEventId((current) => current || queryEventId || nextEvents[0]?.id || '');
  }, []);

  const loadScript = useCallback(async (eventId: string, event?: EventOption) => {
    if (!eventId) return;
    hydrationRef.current = false;
    setLoading(true);
    setError('');

    const key = `eventsync-pro:${eventId}`;
    let localScript: EventScript | null = null;
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        localScript = JSON.parse(cached) as EventScript;
        setScript(localScript);
      } else {
        setScript(createEmptyScript(event));
      }
    } catch {
      localScript = null;
      setScript(createEmptyScript(event));
    }

    try {
      const response = await fetch(`/api/scripts?event_id=${eventId}`, { credentials: 'include' });
      const result: ScriptApiResponse = await response.json();
      if (!response.ok) throw new Error(result.error || '台本加载失败');
      const serverChapters = result.data?.chapters || [];
      const serverSegments = result.data?.segments || [];
      if (!localScript || serverSegments.length > 0 || serverChapters.length > 0) {
        const base = localScript || createEmptyScript(event);
        const meta = { ...base.meta, ...createEmptyScript(event).meta, id: eventId };
        const startTime = base.meta.startTime || meta.startTime;
        setScript({
          meta: { ...meta, startTime, updatedAt: new Date().toISOString() },
          chapters: serverChapters.length > 0
            ? apiChaptersToEventChapters(serverChapters, eventId)
            : base.chapters.map((chapter) => ({ ...chapter, eventId })),
          segments: apiSegmentsToEventSegments(serverSegments, startTime),
          roles: base.roles?.length ? base.roles : DEFAULT_ROLES,
        });
      }
      setLastSyncedAt(new Date().toISOString());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '台本加载失败');
    } finally {
      hydrationRef.current = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!selectedEventId) return;
    void loadScript(selectedEventId, selectedEvent);
  }, [loadScript, selectedEvent, selectedEventId]);

  const persistScript = useCallback(async (nextScript: EventScript) => {
    if (!selectedEventId) return;
    setSyncing(true);
    try {
      const response = await fetch('/api/scripts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          event_id: selectedEventId,
          chapters: nextScript.chapters.map((chapter) => ({
            id: chapter.id,
            event_id: selectedEventId,
            order: chapter.order,
            name: chapter.name,
            description: chapter.description,
            color: chapter.color,
          })),
          segments: nextScript.segments.map((segment) => ({
            id: segment.id,
            event_id: selectedEventId,
            chapter_id: segment.chapterId,
            order: segment.order,
            type: segment.type,
            name: segment.name,
            duration: segment.duration,
            speaker: segment.speaker,
            content: segment.content,
            notes: segment.notes,
            start_time: segment.startTime,
            end_time: segment.endTime,
            is_next_day: segment.isNextDay,
            responsibilities: responsibilitiesToList(segment.responsibilities),
            steps: segment.steps.map((step) => ({
              id: step.id,
              title: step.name || step.content,
              owner: step.owner,
              duration: step.duration,
              status: step.status || 'pending',
            })),
            status: segment.status,
          })),
        }),
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error || '同步失败');
      setLastSyncedAt(new Date().toISOString());
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : '同步失败');
    } finally {
      setSyncing(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (!hydrationRef.current || !storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(script));
    } catch {
      setError('本地缓存写入失败');
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      void persistScript(script);
    }, 800);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [persistScript, script, storageKey]);

  const updateScript = (updater: (current: EventScript) => EventScript) => {
    setScript((current) => updater(current));
  };

  const updateMeta = (patch: Partial<EventScript['meta']>) => {
    updateScript((current) => {
      const meta = { ...current.meta, ...patch, updatedAt: new Date().toISOString() };
      const shouldRecalculate = patch.startTime !== undefined;
      return {
        ...current,
        meta,
        segments: shouldRecalculate ? calculateSegmentTimes(current.segments, meta.startTime) : current.segments,
      };
    });
  };

  const addChapter = () => {
    updateScript((current) => ({
      ...current,
      chapters: [
        ...current.chapters,
        {
          id: generateId(),
          eventId: selectedEventId,
          name: `新章节 ${current.chapters.length + 1}`,
          color: '#64748b',
          order: current.chapters.length + 1,
        },
      ],
    }));
  };

  const updateChapter = (chapterId: string, patch: Partial<EventChapter>) => {
    updateScript((current) => ({
      ...current,
      chapters: current.chapters.map((chapter) => (
        chapter.id === chapterId ? { ...chapter, ...patch } : chapter
      )),
    }));
  };

  const deleteChapter = (chapterId: string) => {
    updateScript((current) => ({
      ...current,
      chapters: current.chapters.filter((chapter) => chapter.id !== chapterId),
      segments: current.segments.map((segment) => (
        segment.chapterId === chapterId ? { ...segment, chapterId: undefined } : segment
      )),
    }));
  };

  const addRole = () => {
    const label = customRole.trim();
    if (!label) return;
    updateScript((current) => ({
      ...current,
      roles: [
        ...current.roles,
        { key: `role-${generateId()}`, label, color: '#64748b', isDefault: false },
      ],
    }));
    setCustomRole('');
  };

  const addSegment = (chapterId?: string) => {
    updateScript((current) => {
      const segment: EventSegment = {
        id: generateId(),
        eventId: selectedEventId,
        chapterId,
        order: current.segments.length + 1,
        type: 'speech',
        name: '新流程环节',
        duration: 10,
        startTime: current.meta.startTime,
        endTime: current.meta.startTime,
        isNextDay: false,
        content: '',
        responsibilities: {},
        steps: [],
        status: 'pending',
      };
      return {
        ...current,
        segments: calculateSegmentTimes([...current.segments, segment], current.meta.startTime),
      };
    });
  };

  const updateSegment = (segmentId: string, patch: Partial<EventSegment>) => {
    updateScript((current) => ({
      ...current,
      segments: calculateSegmentTimes(
        current.segments.map((segment) => (segment.id === segmentId ? { ...segment, ...patch } : segment)),
        current.meta.startTime,
      ),
    }));
  };

  const deleteSegment = (segmentId: string) => {
    updateScript((current) => ({
      ...current,
      segments: calculateSegmentTimes(
        current.segments.filter((segment) => segment.id !== segmentId),
        current.meta.startTime,
      ),
    }));
    if (selectedSegmentId === segmentId) setSelectedSegmentId(null);
  };

  const addStep = (segmentId: string) => {
    updateScript((current) => ({
      ...current,
      segments: current.segments.map((segment) => {
        if (segment.id !== segmentId) return segment;
        const step: EventStep = {
          id: generateId(),
          order: segment.steps.length + 1,
          name: '新步骤',
          content: '新步骤',
          duration: 1,
          status: 'pending',
        };
        return { ...segment, steps: [...segment.steps, step] };
      }),
    }));
  };

  const updateStep = (segmentId: string, stepId: string, patch: Partial<EventStep>) => {
    updateScript((current) => ({
      ...current,
      segments: current.segments.map((segment) => (
        segment.id === segmentId
          ? {
              ...segment,
              steps: segment.steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step)),
            }
          : segment
      )),
    }));
  };

  const deleteStep = (segmentId: string, stepId: string) => {
    updateScript((current) => ({
      ...current,
      segments: current.segments.map((segment) => (
        segment.id === segmentId
          ? { ...segment, steps: segment.steps.filter((step) => step.id !== stepId) }
          : segment
      )),
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = script.segments.findIndex((segment) => segment.id === active.id);
    const newIndex = script.segments.findIndex((segment) => segment.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    updateScript((current) => ({
      ...current,
      segments: calculateSegmentTimes(
        arrayMove(current.segments, oldIndex, newIndex).map((segment, index) => ({ ...segment, order: index + 1 })),
        current.meta.startTime,
      ),
    }));
  };

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ['活动名称', script.meta.name],
        ['活动主题', script.meta.theme || ''],
        ['活动日期', script.meta.date],
        ['活动地点', script.meta.location],
        ['主办方', script.meta.organizer],
        ['策划方', script.meta.planner || ''],
        ['开始时间', script.meta.startTime],
      ]),
      '活动信息',
    );
    const headers = [
      '序号',
      '章节',
      '环节名称',
      '开始时间',
      '结束时间',
      '时长(分钟)',
      '次日',
      '状态',
      '内容',
      ...script.roles.map((role) => role.label),
      '备注',
    ];
    const rows = script.segments.map((segment) => [
      segment.order,
      script.chapters.find((chapter) => chapter.id === segment.chapterId)?.name || '',
      segment.name,
      segment.startTime,
      segment.endTime,
      segment.duration,
      segment.isNextDay ? '是' : '否',
      statusConfig[segment.status].label,
      segment.content,
      ...script.roles.map((role) => segment.responsibilities[role.key] || ''),
      segment.notes || '',
    ]);
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([headers, ...rows]), '流程台本');
    XLSX.writeFile(workbook, `${script.meta.name || '流程台本'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPng = async () => {
    if (!previewElement) return;
    try {
      const { domToPng } = await import('modern-screenshot');
      const dataUrl = await domToPng(previewElement, { scale: EXPORT_CONFIG.scale });
      const link = document.createElement('a');
      link.download = `${exportConfig.eventName || script.meta.name}_${SKIN_CONFIGS[exportConfig.skin].name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'PNG 导出失败，请确认 modern-screenshot 已安装');
    }
  };

  const stats = useMemo(() => {
    const totalDuration = script.segments.reduce((sum, segment) => sum + segment.duration, 0);
    return {
      totalDuration,
      totalSegments: script.segments.length,
      completed: script.segments.filter((segment) => segment.status === 'completed').length,
    };
  }, [script.segments]);

  const segmentsByChapter = useMemo(() => {
    const groups = new Map<string, EventSegment[]>();
    groups.set('none', []);
    script.chapters.forEach((chapter) => groups.set(chapter.id, []));
    script.segments.forEach((segment) => {
      const key = segment.chapterId || 'none';
      groups.set(key, [...(groups.get(key) || []), segment]);
    });
    return groups;
  }, [script.chapters, script.segments]);

  if (loading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">流程台本</h1>
          <p className="text-muted-foreground">EventSync Pro 核心台本：时间轴编辑、多角色职责、高清导出</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="选择活动" /></SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" asChild>
            <Link href="/checkin">
              <Users className="mr-2 h-4 w-4" />
              签到模块
            </Link>
          </Button>
          <Button variant="outline" onClick={exportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button onClick={() => void exportPng()}>
            <ImageDown className="mr-2 h-4 w-4" />
            PNG
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={FileText} label="环节总数" value={stats.totalSegments} />
        <MetricCard icon={Download} label="总时长" value={`${stats.totalDuration} 分钟`} />
        <MetricCard icon={CheckCircle2} label="已完成" value={stats.completed} />
        <MetricCard icon={Cloud} label="同步状态" value={syncing ? '同步中' : lastSyncedAt ? '已同步' : '本地缓存'} />
      </div>

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="py-3 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        <TabsList>
          <TabsTrigger value="edit">编辑台本</TabsTrigger>
          <TabsTrigger value="export">导出预览</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4">
          <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">活动信息</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Field label="活动名称"><Input value={script.meta.name} onChange={(event) => updateMeta({ name: event.target.value })} /></Field>
                  <Field label="活动主题"><Input value={script.meta.theme || ''} onChange={(event) => updateMeta({ theme: event.target.value })} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="日期"><Input type="date" value={script.meta.date} onChange={(event) => updateMeta({ date: event.target.value })} /></Field>
                    <Field label="开始时间"><Input type="time" value={script.meta.startTime} onChange={(event) => updateMeta({ startTime: event.target.value })} /></Field>
                  </div>
                  <Field label="地点"><Input value={script.meta.location} onChange={(event) => updateMeta({ location: event.target.value })} /></Field>
                  <Field label="主办方"><Input value={script.meta.organizer} onChange={(event) => updateMeta({ organizer: event.target.value })} /></Field>
                  <Field label="策划方"><Input value={script.meta.planner || ''} onChange={(event) => updateMeta({ planner: event.target.value })} /></Field>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">章节</CardTitle>
                  <Button size="sm" variant="outline" onClick={addChapter}><Plus className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {script.chapters.map((chapter) => (
                    <div key={chapter.id} className="grid grid-cols-[24px_1fr_auto] items-center gap-2">
                      <Input type="color" value={chapter.color} onChange={(event) => updateChapter(chapter.id, { color: event.target.value })} className="h-8 w-8 p-1" />
                      <Input value={chapter.name} onChange={(event) => updateChapter(chapter.id, { name: event.target.value })} />
                      <Button size="icon" variant="ghost" onClick={() => deleteChapter(chapter.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">角色职责</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {script.roles.map((role) => (
                      <Badge key={role.key} variant="secondary">{role.label}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={customRole} onChange={(event) => setCustomRole(event.target.value)} placeholder="自定义角色" />
                    <Button variant="outline" onClick={addRole}>添加</Button>
                  </div>
                </CardContent>
              </Card>
            </aside>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">可视化时间轴</h2>
                  <p className="text-sm text-muted-foreground">拖拽排序后自动重算起止时间，跨午夜自动标识次日。</p>
                </div>
                <Button onClick={() => addSegment()}><Plus className="mr-2 h-4 w-4" />添加环节</Button>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={script.segments.map((segment) => segment.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {segmentsByChapter.get('none')?.length ? (
                      <TimelineGroup
                        title="未分组"
                        color="#64748b"
                        segments={segmentsByChapter.get('none') || []}
                        roles={script.roles}
                        chapters={script.chapters}
                        selectedSegmentId={selectedSegmentId}
                        onSelect={setSelectedSegmentId}
                        onAdd={() => addSegment()}
                        onUpdate={updateSegment}
                        onDelete={deleteSegment}
                        onAddStep={addStep}
                        onUpdateStep={updateStep}
                        onDeleteStep={deleteStep}
                      />
                    ) : null}
                    {script.chapters.map((chapter) => (
                      <TimelineGroup
                        key={chapter.id}
                        title={chapter.name}
                        color={chapter.color}
                        segments={segmentsByChapter.get(chapter.id) || []}
                        roles={script.roles}
                        chapters={script.chapters}
                        selectedSegmentId={selectedSegmentId}
                        onSelect={setSelectedSegmentId}
                        onAdd={() => addSegment(chapter.id)}
                        onUpdate={updateSegment}
                        onDelete={deleteSegment}
                        onAddStep={addStep}
                        onUpdateStep={updateStep}
                        onDeleteStep={deleteStep}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="export" className="mt-4">
          <ExportWorkspace
            script={script}
            config={exportConfig}
            onConfigChange={setExportConfig}
            captureNode={setPreviewElement}
            onExportPng={() => void exportPng()}
            onExportExcel={exportExcel}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <Icon className="h-5 w-5 text-primary" />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function TimelineGroup(props: {
  title: string;
  color: string;
  segments: EventSegment[];
  roles: Role[];
  chapters: EventChapter[];
  selectedSegmentId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<EventSegment>) => void;
  onDelete: (id: string) => void;
  onAddStep: (id: string) => void;
  onUpdateStep: (segmentId: string, stepId: string, patch: Partial<EventStep>) => void;
  onDeleteStep: (segmentId: string, stepId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3" style={{ borderLeft: `4px solid ${props.color}` }}>
        <button type="button" className="flex items-center gap-2" onClick={() => setCollapsed((current) => !current)}>
          <ChevronDown className={cn('h-4 w-4 transition-transform', collapsed && '-rotate-90')} />
          <CardTitle className="text-base" style={{ color: props.color }}>{props.title}</CardTitle>
          <Badge variant="outline">{props.segments.length}</Badge>
        </button>
        <Button size="sm" variant="ghost" onClick={props.onAdd}><Plus className="h-4 w-4" /></Button>
      </CardHeader>
      {!collapsed && (
        <CardContent className="space-y-3">
          {props.segments.map((segment) => (
            <SortableSegmentCard
              key={segment.id}
              segment={segment}
              roles={props.roles}
              chapters={props.chapters}
              selected={props.selectedSegmentId === segment.id}
              onSelect={() => props.onSelect(segment.id)}
              onUpdate={(patch) => props.onUpdate(segment.id, patch)}
              onDelete={() => props.onDelete(segment.id)}
              onAddStep={() => props.onAddStep(segment.id)}
              onUpdateStep={(stepId, patch) => props.onUpdateStep(segment.id, stepId, patch)}
              onDeleteStep={(stepId) => props.onDeleteStep(segment.id, stepId)}
            />
          ))}
          {props.segments.length === 0 && <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">本章节暂无环节</div>}
        </CardContent>
      )}
    </Card>
  );
}

function SortableSegmentCard(props: {
  segment: EventSegment;
  roles: Role[];
  chapters: EventChapter[];
  selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<EventSegment>) => void;
  onDelete: () => void;
  onAddStep: () => void;
  onUpdateStep: (stepId: string, patch: Partial<EventStep>) => void;
  onDeleteStep: (stepId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.segment.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={cn('border bg-card', props.selected && 'border-primary shadow-sm')}>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <button type="button" className="mt-2 cursor-grab text-muted-foreground" {...attributes} {...listeners}>
              <GripVertical className="h-5 w-5" />
            </button>
            <button type="button" className="grid h-12 w-16 place-items-center rounded-md bg-muted text-left" onClick={props.onSelect}>
              <span className="font-mono text-sm">{props.segment.startTime}</span>
              <span className="text-[10px] text-muted-foreground">{props.segment.endTime}{props.segment.isNextDay ? ' 次日' : ''}</span>
            </button>
            <div className="grid flex-1 gap-3 lg:grid-cols-[1.2fr_120px_120px_120px]">
              <Input value={props.segment.name} onChange={(event) => props.onUpdate({ name: event.target.value })} />
              <Select value={props.segment.type} onValueChange={(value) => props.onUpdate({ type: value as SegmentType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{segmentTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" min={0} value={props.segment.duration} onChange={(event) => props.onUpdate({ duration: Number(event.target.value) || 0 })} />
              <Select value={props.segment.status} onValueChange={(value) => props.onUpdate({ status: value as SegmentStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([key, config]) => <SelectItem key={key} value={key}>{config.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button size="icon" variant="ghost" onClick={props.onDelete}><Trash2 className="h-4 w-4" /></Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[180px_1fr]">
            <Field label="所属章节">
              <Select value={props.segment.chapterId || 'none'} onValueChange={(value) => props.onUpdate({ chapterId: value === 'none' ? undefined : value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未分组</SelectItem>
                  {props.chapters.map((chapter) => <SelectItem key={chapter.id} value={chapter.id}>{chapter.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="环节内容">
              <Textarea value={props.segment.content} onChange={(event) => props.onUpdate({ content: event.target.value })} />
            </Field>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {props.roles.map((role) => (
              <Field key={role.key} label={role.label}>
                <Textarea
                  value={props.segment.responsibilities[role.key] || ''}
                  onChange={(event) => props.onUpdate({
                    responsibilities: { ...props.segment.responsibilities, [role.key]: event.target.value },
                  })}
                  className="min-h-20"
                />
              </Field>
            ))}
          </div>

          <Field label="备注">
            <Textarea value={props.segment.notes || ''} onChange={(event) => props.onUpdate({ notes: event.target.value })} />
          </Field>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>执行步骤</Label>
              <Button size="sm" variant="outline" onClick={props.onAddStep}><Plus className="mr-1 h-3 w-3" />步骤</Button>
            </div>
            {props.segment.steps.map((step) => (
              <div key={step.id} className="grid gap-2 rounded-md border p-2 md:grid-cols-[1fr_110px_140px_auto]">
                <Input value={step.name} onChange={(event) => props.onUpdateStep(step.id, { name: event.target.value, content: event.target.value })} />
                <Input type="number" min={0} value={step.duration} onChange={(event) => props.onUpdateStep(step.id, { duration: Number(event.target.value) || 0 })} />
                <Input value={step.owner || ''} placeholder="负责人" onChange={(event) => props.onUpdateStep(step.id, { owner: event.target.value })} />
                <Button size="icon" variant="ghost" onClick={() => props.onDeleteStep(step.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExportWorkspace(props: {
  script: EventScript;
  config: ExportTemplateConfig;
  onConfigChange: (config: ExportTemplateConfig) => void;
  captureNode: (node: HTMLDivElement | null) => void;
  onExportPng: () => void;
  onExportExcel: () => void;
}) {
  const config = props.config;
  const mergedConfig = {
    ...config,
    eventName: config.eventName || props.script.meta.name,
    eventTheme: config.eventTheme || props.script.meta.theme,
    organizer: config.organizer || props.script.meta.organizer,
  };

  const setConfig = (patch: Partial<ExportTemplateConfig>) => props.onConfigChange({ ...config, ...patch });

  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card>
        <CardHeader><CardTitle className="text-base">导出配置</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="皮肤">
            <Select value={config.skin} onValueChange={(value) => setConfig({ skin: value as ExportSkin })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SKIN_CONFIGS).map(([key, skin]) => (
                  <SelectItem key={key} value={key}>{skin.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="导出标题"><Input value={config.eventName} placeholder={props.script.meta.name} onChange={(event) => setConfig({ eventName: event.target.value })} /></Field>
          <Field label="导出主题"><Input value={config.eventTheme || ''} placeholder={props.script.meta.theme} onChange={(event) => setConfig({ eventTheme: event.target.value })} /></Field>
          <Field label="底部信息"><Input value={config.footerLine1 || ''} onChange={(event) => setConfig({ footerLine1: event.target.value })} /></Field>
          <Separator />
          <div className="space-y-2">
            <Label>字段显隐</Label>
            {(['responsibilities', 'notes', 'duration', 'status'] as const).map((field) => (
              <label key={field} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={!config.hiddenFields.includes(field)}
                  onCheckedChange={(checked) => {
                    setConfig({
                      hiddenFields: checked
                        ? config.hiddenFields.filter((item) => item !== field)
                        : [...config.hiddenFields, field],
                    });
                  }}
                />
                显示 {fieldLabel(field)}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={config.showSteps} onCheckedChange={(checked) => setConfig({ showSteps: Boolean(checked) })} />
              显示执行步骤
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={props.onExportExcel}><FileDown className="mr-2 h-4 w-4" />Excel</Button>
            <Button onClick={props.onExportPng}><ImageDown className="mr-2 h-4 w-4" />PNG</Button>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-auto rounded-lg border bg-muted p-6">
        <ExportPreview captureNode={props.captureNode} script={props.script} config={mergedConfig} />
      </div>
    </div>
  );
}

function fieldLabel(field: 'responsibilities' | 'notes' | 'duration' | 'status') {
  const labels = {
    responsibilities: '角色职责',
    notes: '备注',
    duration: '时长',
    status: '状态',
  };
  return labels[field];
}

function ExportPreview(props: {
  captureNode: (node: HTMLDivElement | null) => void;
  script: EventScript;
  config: ExportTemplateConfig;
}) {
  const { captureNode, config, script } = props;
  const skin = SKIN_CONFIGS[config.skin];
  const assignNode = useCallback((node: HTMLDivElement | null) => {
    captureNode(node);
  }, [captureNode]);
  return (
    <div
      ref={assignNode}
      style={{
        width: EXPORT_CONFIG.baseWidth,
        minHeight: 1600,
        transform: `scale(${EXPORT_CONFIG.previewWidth / EXPORT_CONFIG.baseWidth})`,
        transformOrigin: 'top left',
        background: skin.background,
        color: skin.textColor,
        fontFamily: '"Noto Serif SC", "Songti SC", "STSong", serif',
        padding: 64,
        boxSizing: 'border-box',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{ border: `2px solid ${skin.primaryColor}`, padding: 36, minHeight: 1460 }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ color: skin.primaryColor, fontSize: 20, letterSpacing: 0 }}>{skin.name}</div>
          <h1 style={{ margin: '18px 0 8px', fontSize: 52, lineHeight: 1.15 }}>{config.eventName}</h1>
          <div style={{ color: skin.mutedColor, fontSize: 24 }}>{config.eventTheme}</div>
          <div style={{ marginTop: 18, color: skin.mutedColor, fontSize: 18 }}>
            {script.meta.date} · {script.meta.location} · {config.organizer}
          </div>
        </div>

        {script.chapters.map((chapter) => {
          const segments = script.segments.filter((segment) => segment.chapterId === chapter.id);
          if (segments.length === 0) return null;
          return (
            <div key={chapter.id} style={{ marginBottom: 34 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 10, height: 30, background: skin.primaryColor }} />
                <h2 style={{ margin: 0, fontSize: 30 }}>{chapter.name}</h2>
              </div>
              {segments.map((segment) => (
                <div key={segment.id} style={{ background: skin.panelColor, border: `1px solid ${skin.accentColor}`, padding: 22, marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 22, alignItems: 'baseline' }}>
                    <div style={{ color: skin.primaryColor, fontSize: 24, fontFamily: 'ui-monospace, monospace', width: 150 }}>
                      {segment.startTime}-{segment.endTime}{segment.isNextDay ? ' 次日' : ''}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <h3 style={{ margin: 0, fontSize: 28 }}>{segment.name}</h3>
                        {!config.hiddenFields.includes('status') && (
                          <span style={{ color: skin.accentColor, fontSize: 16 }}>{statusConfig[segment.status].label}</span>
                        )}
                        {!config.hiddenFields.includes('duration') && (
                          <span style={{ color: skin.mutedColor, fontSize: 16 }}>{segment.duration} 分钟</span>
                        )}
                      </div>
                      <p style={{ color: skin.mutedColor, fontSize: 18, lineHeight: 1.7, margin: '12px 0 0' }}>{segment.content}</p>
                    </div>
                  </div>
                  {!config.hiddenFields.includes('responsibilities') && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 16 }}>
                      {script.roles.map((role) => segment.responsibilities[role.key] ? (
                        <div key={role.key} style={{ fontSize: 16, color: skin.mutedColor }}>
                          <span style={{ color: skin.accentColor }}>{role.label}：</span>{segment.responsibilities[role.key]}
                        </div>
                      ) : null)}
                    </div>
                  )}
                  {config.showSteps && segment.steps.length > 0 && (
                    <div style={{ marginTop: 16, borderTop: `1px solid ${skin.accentColor}`, paddingTop: 12 }}>
                      {segment.steps.map((step) => (
                        <div key={step.id} style={{ color: skin.mutedColor, fontSize: 16, lineHeight: 1.8 }}>
                          {step.order}. {step.name}{step.owner ? ` · ${step.owner}` : ''}{step.duration ? ` · ${step.duration} 分钟` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                  {!config.hiddenFields.includes('notes') && segment.notes && (
                    <div style={{ color: skin.mutedColor, fontSize: 15, marginTop: 14 }}>备注：{segment.notes}</div>
                  )}
                </div>
              ))}
            </div>
          );
        })}

        <div style={{ marginTop: 44, textAlign: 'center', color: skin.mutedColor, fontSize: 16 }}>
          <div>{config.footerLine1}</div>
          <div style={{ marginTop: 6 }}>{config.footerLine2}</div>
        </div>
      </div>
    </div>
  );
}
