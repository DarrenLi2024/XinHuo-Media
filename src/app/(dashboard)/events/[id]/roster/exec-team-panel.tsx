'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil, Trash2, Plus, Phone, MessageCircle } from 'lucide-react';
import type { ExecTeamMember, ExecRole } from '@/types/roster';
import { EXEC_ROLE_LABELS } from '@/types/roster';

export default function ExecTeamPanel({ eventId }: { eventId: string }) {
  const [members, setMembers] = useState<ExecTeamMember[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExecTeamMember | null>(null);
  const [form, setForm] = useState({ role: 'director' as ExecRole, role_label: '', name: '', phone: '', wechat_id: '', email: '', responsibility: '', notes: '' });

  const load = useCallback(async () => {
    const res = await fetch(`/api/roster?event_id=${eventId}&type=exec`);
    const json = await res.json();
    if (json.success) setMembers(json.data);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => setForm({ role: 'director' as ExecRole, role_label: '', name: '', phone: '', wechat_id: '', email: '', responsibility: '', notes: '' });

  const save = async () => {
    if (!form.name || !form.responsibility) return;
    const url = editing ? `/api/roster?type=exec` : `/api/roster?type=exec`;
    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { id: editing.id, ...form } : { ...form, event_id: eventId };
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setDialogOpen(false); setEditing(null); resetForm(); load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/roster?type=exec&id=${id}`, { method: 'DELETE' }); load();
  };

  const openEdit = (m: ExecTeamMember) => { setEditing(m); setForm({ role: m.role, role_label: m.role_label || '', name: m.name, phone: m.phone || '', wechat_id: m.wechat_id || '', email: m.email || '', responsibility: m.responsibility, notes: m.notes || '' }); setDialogOpen(true); };

  const openCreate = () => { setEditing(null); resetForm(); setDialogOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">共 {members.length} 人 · 点击角色名称编辑</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm" onClick={openCreate}><Plus className="mr-1 h-4 w-4" />添加成员</Button></DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto max-w-md">
            <DialogHeader><DialogTitle>{editing ? '编辑成员' : '添加执行小组成员'}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-4">
              <div className="space-y-1"><Label>角色</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as ExecRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXEC_ROLE_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>姓名 *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label>手机号</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-1"><Label>微信</Label><Input value={form.wechat_id} onChange={(e) => setForm({ ...form, wechat_id: e.target.value })} /></div>
              </div>
              <div className="space-y-1"><Label>邮箱</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-1"><Label>职责分工 *</Label><Textarea value={form.responsibility} onChange={(e) => setForm({ ...form, responsibility: e.target.value })} rows={3} /></div>
              <div className="space-y-1"><Label>备注</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={1} /></div>
              <Button className="w-full" onClick={save}>保存</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {members.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">暂无执行小组成员，点击添加。</CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {members.map((m) => (
            <Card key={m.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded">
                        {m.role_label || EXEC_ROLE_LABELS[m.role] || m.role}
                      </span>
                      <span className="font-bold">{m.name}</span>
                    </div>
                    <p className="text-sm mt-2 text-muted-foreground">{m.responsibility}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {m.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{m.phone}</span>}
                      {m.wechat_id && <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{m.wechat_id}</span>}
                      {m.email && <span>{m.email}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
