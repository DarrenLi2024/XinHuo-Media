'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { FormTemplate } from '@/types/forms';

export default function PublicFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: formId } = use(params);
  const [form, setForm] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    fetch(`/api/forms/${formId}/submissions`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setForm(json.data.form);
        else setError('表单不存在或已关闭');
      })
      .catch(() => setError('加载失败'))
      .finally(() => setLoading(false));
  }, [formId]);

  const handleSubmit = async () => {
    if (!form) return;
    setSubmitting(true);
    setError('');
    const res = await fetch(`/api/forms/${formId}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: formData }),
    });
    const json = await res.json();
    if (json.success) {
      setSubmitted(true);
      if (form.redirect_url) window.location.href = form.redirect_url;
    } else {
      setError(json.error || '提交失败');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">加载中...</p></div>;
  if (error && !form) return <div className="min-h-screen flex items-center justify-center"><Card className="w-96"><CardContent className="py-8 text-center"><p className="text-red-500">{error}</p></CardContent></Card></div>;
  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-96">
        <CardContent className="py-12 text-center space-y-4">
          <div className="text-4xl">🎉</div>
          <h2 className="text-xl font-bold">提交成功</h2>
          <p className="text-muted-foreground">感谢您的参与！{form?.auto_approve ? '您的信息已自动录入。' : '我们会尽快审核您的信息。'}</p>
        </CardContent>
      </Card>
    </div>
  );

  if (!form) return null;
  if (form.status !== 'published') return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-96"><CardContent className="py-8 text-center"><p className="text-muted-foreground">该表单暂未开放</p></CardContent></Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
          {form.description && <CardDescription>{form.description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          {form.fields.sort((a, b) => a.order - b.order).map((field) => (
            <div key={field.id} className="space-y-2">
              <Label>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {field.type === 'select' ? (
                <Select
                  value={String(formData[field.id] || '')}
                  onValueChange={(v) => setFormData((p) => ({ ...p, [field.id]: v }))}
                >
                  <SelectTrigger><SelectValue placeholder={field.placeholder || '请选择'} /></SelectTrigger>
                  <SelectContent>
                    {(field.options || []).map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'textarea' ? (
                <Textarea
                  placeholder={field.placeholder}
                  value={String(formData[field.id] || '')}
                  onChange={(e) => setFormData((p) => ({ ...p, [field.id]: e.target.value }))}
                />
              ) : field.type === 'checkbox' ? (
                <Checkbox
                  checked={Boolean(formData[field.id])}
                  onCheckedChange={(c) => setFormData((p) => ({ ...p, [field.id]: c }))}
                />
              ) : (
                <Input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={String(formData[field.id] || '')}
                  onChange={(e) => setFormData((p) => ({ ...p, [field.id]: e.target.value }))}
                />
              )}
            </div>
          ))}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '提交中...' : '提交'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
