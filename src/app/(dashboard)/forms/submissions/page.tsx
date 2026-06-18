'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { FormTemplate, FormSubmission } from '@/types/forms';

const FORM_TYPE_LABELS: Record<string, string> = { registration: '报名表单', sponsor: '赞助商表单' };
const STATUS_LABELS: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已拒绝' };
const STATUS_VARIANTS: Record<string, 'secondary' | 'default' | 'destructive'> = { pending: 'secondary', approved: 'default', rejected: 'destructive' };

export default function FormSubmissionsPage() {
  const searchParams = useSearchParams();
  const formId = searchParams.get('form_id') || '';
  const router = useRouter();
  const [form, setForm] = useState<FormTemplate | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!formId) return;
    setLoading(true);
    const res = await fetch(`/api/forms/${formId}/submissions`);
    const json = await res.json();
    if (json.success) {
      setForm(json.data.form);
      setSubmissions(json.data.submissions);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [formId]);

  const handleReview = async (submissionId: string, status: 'approved' | 'rejected') => {
    await fetch(`/api/forms/${formId}/submissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: submissionId, status }),
    });
    fetchData();
  };

  if (!formId) {
    return (
      <div className="p-6"><Card><CardContent className="py-12 text-center text-muted-foreground">请选择表单查看提交数据。</CardContent></Card></div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{form?.title || '...'} - 提交记录</h1>
          <p className="text-muted-foreground">{form ? FORM_TYPE_LABELS[form.type] : ''} · 共{submissions.length}条提交</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : submissions.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">暂无提交数据。</CardContent></Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>提交时间</TableHead>
              <TableHead>关键信息</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((sub) => {
              const d = sub.data as Record<string, unknown>;
              const name = d.name || d.contact_name || d['姓名'] || d['联系人'] || '-';
              const company = d.company || d.company_name || d['公司'] || d['企业名称'] || '-';
              const phone = d.phone || d['手机号'] || d['电话'] || '-';
              return (
                <TableRow key={sub.id}>
                  <TableCell className="text-sm">{new Date(sub.created_at).toLocaleString('zh-CN')}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{String(name)}</div>
                    <div className="text-xs text-muted-foreground">{String(company)} · {String(phone)}</div>
                  </TableCell>
                  <TableCell><Badge variant={STATUS_VARIANTS[sub.status]}>{STATUS_LABELS[sub.status]}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    {sub.status === 'pending' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleReview(sub.id, 'approved')}><Check className="mr-1 h-3 w-3" />通过</Button>
                        <Button variant="outline" size="sm" onClick={() => handleReview(sub.id, 'rejected')}><X className="mr-1 h-3 w-3" />拒绝</Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
