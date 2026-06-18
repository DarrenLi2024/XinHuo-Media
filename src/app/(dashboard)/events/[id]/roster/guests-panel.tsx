'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pencil, Trash2, Plus, Search, MapPin, Mic, Users, UtensilsCrossed } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { GuestEntry, GuestType, GuestStatus } from '@/types/roster';
import { GUEST_TYPE_LABELS, GUEST_STATUS_LABELS } from '@/types/roster';

const STATUS_COLORS: Record<string, string> = { pending: 'bg-gray-100 text-gray-600', invited: 'bg-blue-100 text-blue-600', confirmed: 'bg-green-100 text-green-600', declined: 'bg-red-100 text-red-600', attended: 'bg-purple-100 text-purple-600', absent: 'bg-orange-100 text-orange-600' };

const emptyForm = { name: '', guest_type: 'speaker' as GuestType, guest_type_label: '', title: '', company: '', avatar_url: '', bio: '', speech_topic: '', segment: '', need_reception: false, need_seat: true, seat_info: '', need_dinner: true, status: 'pending' as GuestStatus, phone: '', wechat_id: '', email: '', notes: '' };

export default function GuestsPanel({ eventId }: { eventId: string }) {
  const [guests, setGuests] = useState<GuestEntry[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GuestEntry | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailGuest, setDetailGuest] = useState<GuestEntry | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ event_id: eventId, type: 'guests' });
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    const res = await fetch(`/api/roster?${params}`);
    const json = await res.json();
    if (json.success) setGuests(json.data);
  }, [eventId, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name || !form.title || !form.company) return;
    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { id: editing.id, ...form } : { ...form, event_id: eventId };
    await fetch(`/api/roster?type=guests`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setDialogOpen(false); setEditing(null); setForm(emptyForm); load();
  };

  const remove = async (id: string) => { await fetch(`/api/roster?type=guests&id=${id}`, { method: 'DELETE' }); load(); };

  const openEdit = (g: GuestEntry) => { setEditing(g); setForm({ name: g.name, guest_type: g.guest_type, guest_type_label: g.guest_type_label || '', title: g.title, company: g.company, avatar_url: g.avatar_url || '', bio: g.bio, speech_topic: g.speech_topic || '', segment: g.segment || '', need_reception: g.need_reception, need_seat: g.need_seat, seat_info: g.seat_info || '', need_dinner: g.need_dinner, status: g.status, phone: g.phone || '', wechat_id: g.wechat_id || '', email: g.email || '', notes: g.notes || '' }); setDialogOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="搜索姓名或公司..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="全部状态" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              {Object.entries(GUEST_STATUS_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm" onClick={() => { setEditing(null); setForm(emptyForm); }}><Plus className="mr-1 h-4 w-4" />添加嘉宾</Button></DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto max-w-lg">
            <DialogHeader><DialogTitle>{editing ? '编辑嘉宾' : '添加嘉宾'}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>姓名 *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-1"><Label>嘉宾类型</Label>
                  <Select value={form.guest_type} onValueChange={(v) => setForm({ ...form, guest_type: v as GuestType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(GUEST_TYPE_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>职称/职务 *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="space-y-1"><Label>公司/单位 *</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
              </div>
              <div className="space-y-1"><Label>形象照片URL</Label><Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." /></div>
              <div className="space-y-1"><Label>背景介绍 *</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>演讲主题</Label><Input value={form.speech_topic} onChange={(e) => setForm({ ...form, speech_topic: e.target.value })} /></div>
                <div className="space-y-1"><Label>出场环节</Label><Input value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })} placeholder="如: 主旨演讲" /></div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2"><Switch checked={form.need_reception} onCheckedChange={(v) => setForm({ ...form, need_reception: v })} /><Label className="text-xs">安排接待</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.need_seat} onCheckedChange={(v) => setForm({ ...form, need_seat: v })} /><Label className="text-xs">安排座位</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.need_dinner} onCheckedChange={(v) => setForm({ ...form, need_dinner: v })} /><Label className="text-xs">参加晚宴</Label></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>手机号</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-1"><Label>状态</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as GuestStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(GUEST_STATUS_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1"><Label>备注</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={1} /></div>
              <Button className="w-full" onClick={save}>保存</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {guests.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">暂无嘉宾，点击添加。</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {guests.map((g) => (
            <Card key={g.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setDetailGuest(g); setDetailOpen(true); }}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-14 w-14 shrink-0">
                    <AvatarImage src={g.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{g.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base">{g.name}</span>
                      <Badge variant="outline" className="text-[10px]">{GUEST_TYPE_LABELS[g.guest_type] || g.guest_type}</Badge>
                      <Badge className={`text-[10px] ${STATUS_COLORS[g.status]}`}>{GUEST_STATUS_LABELS[g.status]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{g.title} · {g.company}</p>
                    {g.speech_topic && <p className="text-xs mt-1 flex items-center gap-1"><Mic className="h-3 w-3" />{g.speech_topic}</p>}
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{g.bio}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      {g.need_reception && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />需接待</span>}
                      {g.need_seat && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{g.seat_info || '有座'}</span>}
                      {g.need_dinner && <span className="flex items-center gap-1"><UtensilsCrossed className="h-3 w-3" />晚宴</span>}
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(g)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(g.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>嘉宾详情</DialogTitle></DialogHeader>
          {detailGuest && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20"><AvatarImage src={detailGuest.avatar_url || undefined} /><AvatarFallback className="text-2xl">{detailGuest.name.slice(0, 2)}</AvatarFallback></Avatar>
                <div>
                  <h3 className="text-xl font-bold">{detailGuest.name}</h3>
                  <p className="text-muted-foreground">{detailGuest.title} · {detailGuest.company}</p>
                  <div className="flex gap-2 mt-1"><Badge variant="outline">{GUEST_TYPE_LABELS[detailGuest.guest_type]}</Badge><Badge className={STATUS_COLORS[detailGuest.status]}>{GUEST_STATUS_LABELS[detailGuest.status]}</Badge></div>
                </div>
              </div>
              <div><Label className="text-xs font-bold">背景介绍</Label><p className="text-sm mt-1">{detailGuest.bio}</p></div>
              {detailGuest.speech_topic && <div><Label className="text-xs font-bold">演讲主题</Label><p className="text-sm mt-1">{detailGuest.speech_topic}</p></div>}
              {detailGuest.segment && <div><Label className="text-xs font-bold">出场环节</Label><p className="text-sm mt-1">{detailGuest.segment}</p></div>}
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 bg-muted rounded"><MapPin className="h-4 w-4 mx-auto mb-1" />{detailGuest.need_reception ? '需接待' : '无需接待'}</div>
                <div className="text-center p-2 bg-muted rounded"><Users className="h-4 w-4 mx-auto mb-1" />{detailGuest.need_seat ? (detailGuest.seat_info || '已排座') : '无座位'}</div>
                <div className="text-center p-2 bg-muted rounded"><UtensilsCrossed className="h-4 w-4 mx-auto mb-1" />{detailGuest.need_dinner ? '参加晚宴' : '不参加'}</div>
              </div>
              {(detailGuest.phone || detailGuest.wechat_id || detailGuest.email) && (
                <div className="text-sm text-muted-foreground space-y-1">
                  {detailGuest.phone && <p>📱 {detailGuest.phone}</p>}
                  {detailGuest.wechat_id && <p>💬 {detailGuest.wechat_id}</p>}
                  {detailGuest.email && <p>📧 {detailGuest.email}</p>}
                </div>
              )}
              {detailGuest.notes && <div><Label className="text-xs font-bold">备注</Label><p className="text-sm mt-1">{detailGuest.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
