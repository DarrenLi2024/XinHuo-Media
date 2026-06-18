'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Sponsor, SponsorLevel, SponsorBenefit } from '@/types/sponsor';
import { SPONSOR_LEVEL_LABELS, SPONSOR_BENEFIT_LABELS } from '@/types/sponsor';

const CONTRACT_STATUS_LABELS: Record<string, string> = { draft: '草稿', sent: '已发送', signed: '已签署', completed: '已完成', cancelled: '已取消' };
const PAYMENT_STATUS_LABELS: Record<string, string> = { unpaid: '未付', partial: '部分', paid: '已付', waived: '免付' };

export default function EventSponsorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);
  const router = useRouter();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editSponsor, setEditSponsor] = useState<Sponsor | null>(null);
  const [levelList, setLevelList] = useState<SponsorLevel[]>(['title', 'diamond', 'gold', 'silver', 'bronze']);

  const [form, setForm] = useState({
    name: '', level: 'gold' as SponsorLevel, level_name: '', amount: 0,
    contact_name: '', contact_phone: '', contact_wechat: '', contact_email: '',
    logo_url: '', company_intro: '', booth_needed: false, benefits: [] as SponsorBenefit[], notes: '',
  });

  const fetchSponsors = async () => {
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}/sponsors`);
    const json = await res.json();
    if (json.success) setSponsors(json.data);
    setLoading(false);
  };

  useEffect(() => { fetchSponsors(); }, [eventId]);

  const handleCreate = async () => {
    await fetch(`/api/events/${eventId}/sponsors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setCreateOpen(false);
    resetForm();
    fetchSponsors();
  };

  const handleUpdate = async () => {
    if (!editSponsor) return;
    await fetch(`/api/events/${eventId}/sponsors`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sponsor_id: editSponsor.id, ...form }),
    });
    setEditSponsor(null);
    resetForm();
    fetchSponsors();
  };

  const handleDelete = async (sponsorId: string) => {
    await fetch(`/api/events/${eventId}/sponsors?sponsor_id=${sponsorId}`, { method: 'DELETE' });
    fetchSponsors();
  };

  const resetForm = () => {
    setForm({ name: '', level: 'gold', level_name: '', amount: 0,
      contact_name: '', contact_phone: '', contact_wechat: '', contact_email: '',
      logo_url: '', company_intro: '', booth_needed: false, benefits: [], notes: '' });
  };

  const openEdit = (sponsor: Sponsor) => {
    setEditSponsor(sponsor);
    setForm({
      name: sponsor.name, level: sponsor.level, level_name: sponsor.level_name || '', amount: sponsor.amount || 0,
      contact_name: sponsor.contact_name || '', contact_phone: sponsor.contact_phone || '',
      contact_wechat: sponsor.contact_wechat || '', contact_email: sponsor.contact_email || '',
      logo_url: sponsor.logo_url || '', company_intro: sponsor.company_intro || '',
      booth_needed: sponsor.booth_needed, benefits: sponsor.benefits || [], notes: sponsor.notes || '',
    });
  };

  const toggleBenefit = (b: SponsorBenefit) => {
    setForm((prev) => ({
      ...prev,
      benefits: prev.benefits.includes(b) ? prev.benefits.filter((x) => x !== b) : [...prev.benefits, b],
    }));
  };

  const totalAmount = sponsors.reduce((sum, s) => sum + (s.amount || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/events/${eventId}`)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">赞助商管理</h1>
          <p className="text-muted-foreground">{sponsors.length}家赞助商 · 赞助总额 ¥{totalAmount.toLocaleString()}</p>
        </div>
        <div className="flex-1" />
        <Dialog open={createOpen || Boolean(editSponsor)} onOpenChange={(v) => { setCreateOpen(v); if (!v) { setEditSponsor(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setCreateOpen(true); resetForm(); }}><Plus className="mr-2 h-4 w-4" />新增赞助商</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editSponsor ? '编辑赞助商' : '新增赞助商'}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>赞助商名称 *</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
                <div className="space-y-1"><Label>赞助等级</Label>
                  <Select value={form.level} onValueChange={(v) => setForm((p) => ({ ...p, level: v as SponsorLevel }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SPONSOR_LEVEL_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>赞助金额</Label><Input type="number" value={form.amount || ''} onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))} /></div>
                <div className="space-y-1"><Label>联系人</Label><Input value={form.contact_name} onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))} /></div>
                <div className="space-y-1"><Label>电话</Label><Input value={form.contact_phone} onChange={(e) => setForm((p) => ({ ...p, contact_phone: e.target.value }))} /></div>
                <div className="space-y-1"><Label>微信</Label><Input value={form.contact_wechat} onChange={(e) => setForm((p) => ({ ...p, contact_wechat: e.target.value }))} /></div>
                <div className="space-y-1"><Label>邮箱</Label><Input value={form.contact_email} onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))} /></div>
              </div>
              <div className="space-y-1"><Label>企业简介</Label><Textarea value={form.company_intro} onChange={(e) => setForm((p) => ({ ...p, company_intro: e.target.value }))} rows={2} /></div>
              <div className="flex items-center space-x-2"><Checkbox checked={form.booth_needed} onCheckedChange={(c) => setForm((p) => ({ ...p, booth_needed: Boolean(c) }))} /><Label>需要展位</Label></div>
              <div className="space-y-2">
                <Label>权益配置</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(SPONSOR_BENEFIT_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox checked={form.benefits.includes(key as SponsorBenefit)} onCheckedChange={() => toggleBenefit(key as SponsorBenefit)} />
                      <span className="text-sm">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1"><Label>备注</Label><Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} /></div>
            </div>
            <Button onClick={editSponsor ? handleUpdate : handleCreate}>{editSponsor ? '更新' : '创建'}</Button>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : sponsors.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">暂无赞助商，点击新增。</CardContent></Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>赞助商</TableHead>
              <TableHead>等级</TableHead>
              <TableHead>金额</TableHead>
              <TableHead>合同</TableHead>
              <TableHead>付款</TableHead>
              <TableHead>权益</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sponsors.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="font-medium">{s.name}</div>
                  {s.contact_name && <div className="text-xs text-muted-foreground">联系人: {s.contact_name} {s.contact_phone}</div>}
                </TableCell>
                <TableCell><Badge variant="outline">{s.level_name || SPONSOR_LEVEL_LABELS[s.level] || s.level}</Badge></TableCell>
                <TableCell className="tabular-nums">¥{(s.amount || 0).toLocaleString()}</TableCell>
                <TableCell><Badge variant={s.contract_status === 'signed' ? 'default' : 'secondary'}>{CONTRACT_STATUS_LABELS[s.contract_status] || s.contract_status}</Badge></TableCell>
                <TableCell><Badge variant={s.payment_status === 'paid' ? 'default' : 'secondary'}>{PAYMENT_STATUS_LABELS[s.payment_status] || s.payment_status}</Badge></TableCell>
                <TableCell><span className="text-xs text-muted-foreground">{s.benefits.length}项权益</span></TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
