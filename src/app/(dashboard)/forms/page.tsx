'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, ExternalLink, Copy, Trash2, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { FormTemplate } from '@/types/forms';

const FORM_TYPE_LABELS: Record<string, string> = { registration: '报名表单', sponsor: '赞助商报名表单' };
const STATUS_LABELS: Record<string, string> = { draft: '草稿', published: '已发布', closed: '已关闭' };
const STATUS_VARIANTS: Record<string, 'secondary' | 'default' | 'destructive'> = { draft: 'secondary', published: 'default', closed: 'destructive' };

export default function FormsPage() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('event_id') || '';
  const router = useRouter();
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<'registration' | 'sponsor'>('registration');

  const fetchForms = async () => {
    setLoading(true);
    const res = await fetch(`/api/forms?event_id=${eventId}`);
    const json = await res.json();
    if (json.success) setForms(json.data);
    setLoading(false);
  };

  useEffect(() => { fetchForms(); }, [eventId]);

  const handleCreate = async () => {
    const res = await fetch('/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, type: formType, title: formTitle }),
    });
    const json = await res.json();
    if (json.success) {
      setCreateOpen(false);
      setFormTitle('');
      fetchForms();
    }
  };

  const handleDelete = async (formId: string) => {
    await fetch(`/api/forms?id=${formId}`, { method: 'DELETE' });
    fetchForms();
  };

  const handlePublish = async (formId: string) => {
    await fetch(`/api/forms/${formId}/submissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_id: formId, status: 'published' }),
    });
    fetchForms();
  };

  const copyLink = (formId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/forms/${formId}`);
  };

  if (!eventId) {
    return (
      <div className="p-6">
        <Card><CardContent className="py-12 text-center text-muted-foreground">请从活动页面进入，选择需要管理表单的活动。</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">表单回收管理</h1>
          <p className="text-muted-foreground">管理活动的报名表单和赞助商报名表单</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />新建表单</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>新建表单</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>表单类型</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as 'registration' | 'sponsor')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registration">报名表单</SelectItem>
                    <SelectItem value="sponsor">赞助商报名表单</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>表单标题</Label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="如: 2026春茗活动报名" />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={!formTitle}>创建</Button>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : forms.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">暂无表单，点击「新建表单」创建。</CardContent></Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>表单名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forms.map((form) => (
              <TableRow key={form.id}>
                <TableCell className="font-medium">{form.title}</TableCell>
                <TableCell>{FORM_TYPE_LABELS[form.type] || form.type}</TableCell>
                <TableCell><Badge variant={STATUS_VARIANTS[form.status] || 'secondary'}>{STATUS_LABELS[form.status] || form.status}</Badge></TableCell>
                <TableCell>{new Date(form.created_at).toLocaleDateString('zh-CN')}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => router.push(`/forms/submissions?form_id=${form.id}`)} title="查看提交"><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => window.open(`/forms/${form.id}`, '_blank')} title="预览"><ExternalLink className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => copyLink(form.id)} title="复制链接"><Copy className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(form.id)} title="删除"><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
