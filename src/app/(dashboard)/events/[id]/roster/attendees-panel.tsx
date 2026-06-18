'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, Plus, Search, Upload, Download, FileSpreadsheet, CheckCircle, Clock, Filter } from 'lucide-react';
import type { AttendeeEntry, AttendeeSource } from '@/types/roster';
import { ATTENDEE_SOURCE_LABELS } from '@/types/roster';
/* XLSX loaded dynamically on export/import */

const emptyForm = { name: '', phone: '', wechat_id: '', email: '', company: '', position: '', industry: '', city: '', is_member: false, need_invoice: false, attend_dinner: true, tags: '' as string, notes: '' };

export default function AttendeesPanel({ eventId }: { eventId: string }) {
  const [attendees, setAttendees] = useState<AttendeeEntry[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AttendeeEntry | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [importOpen, setImportOpen] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ event_id: eventId, type: 'attendees' });
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    const res = await fetch(`/api/roster?${params}`);
    const json = await res.json();
    if (json.success) setAttendees(json.data);
  }, [eventId, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name) return;
    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { id: editing.id, ...form, tags: form.tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean) } : { event_id: eventId, ...form, tags: form.tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean) };
    await fetch(`/api/roster?type=attendees`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setDialogOpen(false); setEditing(null); setForm(emptyForm); load();
  };

  const remove = async (id: string) => { await fetch(`/api/roster?type=attendees&id=${id}`, { method: 'DELETE' }); load(); };

  const reviewStatus = async (id: string, status: string) => {
    await fetch(`/api/roster?type=attendees`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, review_status: status }) });
    load();
  };

  const openEdit = (a: AttendeeEntry) => { setEditing(a); setForm({ name: a.name, phone: a.phone || '', wechat_id: a.wechat_id || '', email: a.email || '', company: a.company || '', position: a.position || '', industry: a.industry || '', city: a.city || '', is_member: a.is_member, need_invoice: a.need_invoice, attend_dinner: a.attend_dinner, tags: a.tags.join(', '), notes: a.notes || '' }); setDialogOpen(true); };

  const handleExport = async () => {
    const XLSX = await import('xlsx');
    const data = attendees.map((a) => ({ 姓名: a.name, 手机号: a.phone || '', 公司: a.company || '', 职位: a.position || '', 城市: a.city || '', 来源: ATTENDEE_SOURCE_LABELS[a.source] || a.source, 审核状态: a.review_status === 'approved' ? '已通过' : '待审核', 签到状态: a.checkin_status === 'checked_in' ? '已签到' : '未签到' }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '参会名单');
    XLSX.writeFile(wb, `参会名单_${eventId.slice(0, 8)}.xlsx`);
  };

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const XLSX = await import('xlsx');
    const wb = await file.arrayBuffer().then((buf) => XLSX.read(buf, { type: 'array' }));
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);
    const res = await fetch(`/api/roster?type=attendees_batch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_id: eventId, rows }) });
    const json = await res.json();
    if (json.success) {
      setImportMsg(`导入完成：新增 ${json.data.created} 条，跳过 ${json.data.skipped} 条${json.data.errors.length > 0 ? '，错误 ' + json.data.errors.length + ' 条' : ''}`);
      load();
    }
  };

  const approved = attendees.filter((a) => a.review_status === 'approved').length;
  const checkedIn = attendees.filter((a) => a.checkin_status === 'checked_in').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>共 {attendees.length} 人</span>
        <span>·</span>
        <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-500" />已审核 {approved}</span>
        <span>·</span>
        <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-blue-500" />已签到 {checkedIn}</span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="搜索姓名/公司/手机号..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="全部" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="checked_in">已签到</SelectItem>
              <SelectItem value="pending_review">待审核</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild><Button variant="outline" size="sm"><Upload className="mr-1 h-4 w-4" />导入Excel</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>批量导入参会人</DialogTitle></DialogHeader>
              <div className="space-y-3 py-4">
                <p className="text-sm text-muted-foreground">上传 .xlsx 文件，表头需包含: 姓名, 手机号, 公司, 职位, 城市 等列。</p>
                <Input type="file" accept=".xlsx,.xls" ref={fileRef} />
                <Button onClick={handleImport}>开始导入</Button>
                {importMsg && <p className="text-sm">{importMsg}</p>}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1 h-4 w-4" />导出</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={() => { setEditing(null); setForm(emptyForm); }}><Plus className="mr-1 h-4 w-4" />添加参会人</Button></DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto max-w-md">
              <DialogHeader><DialogTitle>{editing ? '编辑参会人' : '添加参会人'}</DialogTitle></DialogHeader>
              <div className="space-y-3 py-4">
                <div className="space-y-1"><Label>姓名 *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>手机号</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="space-y-1"><Label>微信号</Label><Input value={form.wechat_id} onChange={(e) => setForm({ ...form, wechat_id: e.target.value })} /></div>
                </div>
                <div className="space-y-1"><Label>邮箱</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>公司</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
                  <div className="space-y-1"><Label>职位</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>行业</Label><Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></div>
                  <div className="space-y-1"><Label>城市</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2"><Switch checked={form.is_member} onCheckedChange={(v) => setForm({ ...form, is_member: v })} /><Label className="text-xs">商会会员</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={form.need_invoice} onCheckedChange={(v) => setForm({ ...form, need_invoice: v })} /><Label className="text-xs">需要发票</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={form.attend_dinner} onCheckedChange={(v) => setForm({ ...form, attend_dinner: v })} /><Label className="text-xs">参加晚宴</Label></div>
                </div>
                <div className="space-y-1"><Label>标签 (逗号分隔)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="如: VIP, 老客户" /></div>
                <div className="space-y-1"><Label>备注</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={1} /></div>
                <Button className="w-full" onClick={save}>保存</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      {attendees.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">暂无参会人，点击添加或导入Excel。</CardContent></Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">姓名</TableHead>
                <TableHead className="w-[120px]">公司</TableHead>
                <TableHead className="w-[80px]">手机号</TableHead>
                <TableHead className="w-[60px]">来源</TableHead>
                <TableHead className="w-[60px]">审核</TableHead>
                <TableHead className="w-[60px]">签到</TableHead>
                <TableHead className="w-[100px]">标签</TableHead>
                <TableHead className="w-[80px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendees.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="font-medium">{a.name}</div>
                    {a.position && <div className="text-xs text-muted-foreground">{a.position}</div>}
                  </TableCell>
                  <TableCell className="text-sm">{a.company || '-'}</TableCell>
                  <TableCell className="text-sm tabular-nums">{a.phone || '-'}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{ATTENDEE_SOURCE_LABELS[a.source] || a.source}</Badge></TableCell>
                  <TableCell>
                    {a.review_status === 'approved' ? (
                      <Badge className="bg-green-100 text-green-700 text-[10px]">已通过</Badge>
                    ) : a.review_status === 'rejected' ? (
                      <Badge className="bg-red-100 text-red-700 text-[10px]">已拒绝</Badge>
                    ) : (
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => reviewStatus(a.id, 'approved')}><CheckCircle className="h-3.5 w-3.5 text-green-500" /></Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {a.checkin_status === 'checked_in' ? (
                      <Badge className="bg-blue-100 text-blue-700 text-[10px]">已签到</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">未签到</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {a.is_member && <Badge variant="outline" className="text-[10px]">会员</Badge>}
                      {a.attend_dinner && <Badge variant="outline" className="text-[10px]">晚宴</Badge>}
                      {a.tags.slice(0, 1).map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
