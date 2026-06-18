'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarDays, ArrowLeft, Save, X, Building2 } from 'lucide-react';
import Link from 'next/link';

const eventTypeOptions = [
  { value: 'annual_meeting', label: '年会' },
  { value: 'product_launch', label: '发布会' },
  { value: 'seminar', label: '研讨会' },
  { value: 'appreciation', label: '答谢会' },
  { value: 'training', label: '培训' },
  { value: 'other', label: '其他' },
];

type EnabledModules = {
  require_check_in: boolean;
  enable_seating: boolean;
  enable_script: boolean;
  allow_lottery: boolean;
  enable_report: boolean;
};

const moduleOptions: Array<{ label: string; key: keyof EnabledModules }> = [
  { label: '签到系统', key: 'require_check_in' },
  { label: '智能排座', key: 'enable_seating' },
  { label: '流程台本', key: 'enable_script' },
  { label: '抽奖系统', key: 'allow_lottery' },
  { label: '复盘报告', key: 'enable_report' },
];

type EventCreatePayload = {
  name: string;
  type: string;
  primary_customer_id: string;
  description?: string;
  start_time: string;
  end_time: string;
  location: string;
  address?: string;
  expected_guests?: number;
  budget?: number;
  settings: EnabledModules;
};

type CustomerOption = {
  id: string;
  organization_name: string;
  company_name?: string;
  industry_category?: string;
  primary_contact?: {
    id: string;
    name: string;
    position?: string;
    phone?: string;
  } | null;
};

type CustomersResponse = {
  data?: CustomerOption[];
  error?: string;
};

function formatApiError(result: { error?: string; details?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] } }, fallback: string) {
  if (result.error) return result.error;
  const fieldErrors = result.details?.fieldErrors || {};
  const messages = Object.entries(fieldErrors).flatMap(([field, errors]) => errors.map((message) => `${field}: ${message}`));
  const formErrors = result.details?.formErrors || [];
  return [...messages, ...formErrors].join('；') || fallback;
}

export default function NewEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customersError, setCustomersError] = useState('');
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [formData, setFormData] = useState({
    primary_customer_id: '',
    name: '',
    type: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    address: '',
    expected_guests: '',
    budget: '',
  });
  const [enabledModules, setEnabledModules] = useState<EnabledModules>({
    require_check_in: true,
    enable_seating: true,
    enable_script: true,
    allow_lottery: true,
    enable_report: true,
  });

  useEffect(() => {
    const loadCustomers = async () => {
      setIsLoadingCustomers(true);
      setCustomersError('');
      try {
        const response = await fetch('/api/customers', { credentials: 'include' });
        const result: CustomersResponse = await response.json();
        if (!response.ok || !result.data) {
          throw new Error(result.error || '客户列表加载失败');
        }
        setCustomers(result.data);
        if (!formData.primary_customer_id && result.data[0]) {
          setFormData((current) => ({ ...current, primary_customer_id: result.data?.[0]?.id || '' }));
        }
      } catch (error) {
        setCustomersError(error instanceof Error ? error.message : '客户列表加载失败');
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    void loadCustomers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (!formData.type) {
        setSubmitError('请选择活动类型');
        setIsSubmitting(false);
        return;
      }
      if (!formData.primary_customer_id) {
        setSubmitError('请先选择活动主客户；活动必须归属到客户主档案。');
        setIsSubmitting(false);
        return;
      }
      const payload: EventCreatePayload = {
        name: formData.name.trim(),
        type: formData.type,
        primary_customer_id: formData.primary_customer_id,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location.trim(),
        settings: enabledModules,
      };
      if (formData.description.trim()) payload.description = formData.description.trim();
      if (formData.address.trim()) payload.address = formData.address.trim();
      if (formData.expected_guests.trim()) payload.expected_guests = Number(formData.expected_guests);
      if (formData.budget.trim()) payload.budget = Number(formData.budget);

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const result: { data?: { id?: string }; error?: string; details?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] } } = await response.json();

      if (!response.ok) {
        throw new Error(formatApiError(result, '活动创建失败'));
      }

      router.push(result.data?.id ? `/events/${result.data.id}` : '/events');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '活动创建失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">创建新活动</h1>
          <p className="text-muted-foreground">填写活动基本信息</p>
        </div>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                主客户
              </CardTitle>
              <CardDescription>活动必须关联客户主档案，后续嘉宾、赞助商、供应商、排座、台本和复盘都会基于同一个活动客户关系沉淀。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {customersError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {customersError}
                </div>
              )}
              {isLoadingCustomers ? (
                <div className="text-sm text-muted-foreground">正在加载客户...</div>
              ) : customers.length === 0 ? (
                <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-medium">还没有客户档案</div>
                    <div className="mt-1 text-sm text-muted-foreground">请先录入客户组织和关键人，再创建活动。</div>
                  </div>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/customers">去客户管理</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]">
                  <div className="space-y-2">
                    <Label htmlFor="primary_customer_id">选择主客户 *</Label>
                    <Select
                      value={formData.primary_customer_id}
                      onValueChange={(value) => setFormData({ ...formData, primary_customer_id: value })}
                    >
                      <SelectTrigger id="primary_customer_id">
                        <SelectValue placeholder="选择客户" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.organization_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-sm">
                    {(() => {
                      const selectedCustomer = customers.find((customer) => customer.id === formData.primary_customer_id);
                      if (!selectedCustomer) return <div className="text-muted-foreground">请选择主客户</div>;
                      return (
                        <div>
                          <div className="font-medium">{selectedCustomer.organization_name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {selectedCustomer.company_name || '未填写公司'} · {selectedCustomer.industry_category || '未分类'}
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            主联系人：{selectedCustomer.primary_contact?.name || '未设置'} · {selectedCustomer.primary_contact?.phone || '未填写电话'}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 基本信息 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                基本信息
              </CardTitle>
              <CardDescription>活动名称、类型、时间地点等</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">活动名称 *</Label>
                  <Input
                    id="name"
                    placeholder="例如: 2025芯片行业春茗盛典"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">活动类型 *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择活动类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">活动描述</Label>
                <Textarea
                  id="description"
                  placeholder="描述活动的目的、主题、亮点等..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_time">开始时间 *</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">结束时间 *</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location">活动地点 *</Label>
                  <Input
                    id="location"
                    placeholder="例如: 深圳国际会展中心"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">详细地址</Label>
                  <Input
                    id="address"
                    placeholder="例如: 深圳市福田区福华三路"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 配置信息 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>规模与预算</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expected_guests">预计嘉宾人数</Label>
                  <Input
                    id="expected_guests"
                    type="number"
                    placeholder="100"
                    value={formData.expected_guests}
                    onChange={(e) => setFormData({ ...formData, expected_guests: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">预算金额</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="50000"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 功能模块配置 */}
            <Card>
              <CardHeader>
                <CardTitle>功能模块</CardTitle>
                <CardDescription>启用需要的功能模块</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {moduleOptions.map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-sm">{item.label}</span>
                    <Switch
                      checked={enabledModules[item.key]}
                      onCheckedChange={(checked) => {
                        setEnabledModules((current) => ({
                          ...current,
                          [item.key]: checked,
                        }));
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 操作按钮 */}
        {submitError && (
          <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}
        <div className="mt-6 flex items-center justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/events">
              <X className="mr-2 h-4 w-4" />
              取消
            </Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? '创建中...' : '创建活动'}
          </Button>
        </div>
      </form>
    </div>
  );
}
