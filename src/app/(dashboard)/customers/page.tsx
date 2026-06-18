'use client';

import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, ContactRound, Pencil, Plus, Search, Upload } from 'lucide-react';

type Contact = {
  id: string;
  customer_id: string;
  name: string;
  company_name?: string;
  position?: string;
  native_place?: string;
  gender?: string;
  address?: string;
  phone?: string;
  email?: string;
  wechat_qr_url?: string;
  wechat_id?: string;
  qq?: string;
  avatar_url?: string;
  motto?: string;
  is_primary: boolean;
  relationship_role?: string;
  custom_fields?: Record<string, unknown>;
};

type Customer = {
  id: string;
  organization_name: string;
  company_name?: string;
  industry_category?: string;
  cooperation_intent: string;
  intent_level: string;
  status: string;
  source?: string;
  address?: string;
  region?: string;
  website?: string;
  cooperation_count: number;
  last_cooperation_at?: string;
  tags?: string[];
  notes?: string;
  contacts?: Contact[];
  primary_contact?: Contact | null;
  events_count?: number;
  guests_count?: number;
};

type CustomerStats = {
  total: number;
  strong_intent: number;
  active: number;
  cooperation_count: number;
};

type CustomersResponse = {
  data?: Customer[];
  stats?: CustomerStats;
  error?: string;
};

type ApiErrorResponse = {
  error?: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
};

type CustomerForm = {
  organization_name: string;
  company_name: string;
  industry_category: string;
  cooperation_intent: string;
  intent_level: string;
  status: string;
  source: string;
  region: string;
  address: string;
  website: string;
  tags: string;
  notes: string;
};

type ContactForm = {
  name: string;
  company_name: string;
  position: string;
  native_place: string;
  gender: string;
  address: string;
  phone: string;
  email: string;
  wechat_id: string;
  wechat_qr_url: string;
  qq: string;
  avatar_url: string;
  motto: string;
  relationship_role: string;
  is_primary: boolean;
};

const emptyCustomerForm: CustomerForm = {
  organization_name: '',
  company_name: '',
  industry_category: '',
  cooperation_intent: 'medium',
  intent_level: 'medium',
  status: 'prospect',
  source: '',
  region: '',
  address: '',
  website: '',
  tags: '',
  notes: '',
};

const emptyContactForm: ContactForm = {
  name: '',
  company_name: '',
  position: '',
  native_place: '',
  gender: 'unknown',
  address: '',
  phone: '',
  email: '',
  wechat_id: '',
  wechat_qr_url: '',
  qq: '',
  avatar_url: '',
  motto: '',
  relationship_role: '',
  is_primary: false,
};

function formatApiError(result: ApiErrorResponse, fallback: string) {
  if (result.error) return result.error;
  const fieldErrors = result.details?.fieldErrors || {};
  const messages = Object.entries(fieldErrors).flatMap(([field, errors]) => errors.map((message) => `${field}: ${message}`));
  const formErrors = result.details?.formErrors || [];
  return [...messages, ...formErrors].join('；') || fallback;
}

function contactToForm(contact: Contact): ContactForm {
  return {
    name: contact.name || '',
    company_name: contact.company_name || '',
    position: contact.position || '',
    native_place: contact.native_place || '',
    gender: contact.gender || '',
    address: contact.address || '',
    phone: contact.phone || '',
    email: contact.email || '',
    wechat_id: contact.wechat_id || '',
    wechat_qr_url: contact.wechat_qr_url || '',
    qq: contact.qq || '',
    avatar_url: contact.avatar_url || '',
    motto: contact.motto || '',
    relationship_role: contact.relationship_role || '',
    is_primary: contact.is_primary,
  };
}

function cleanContactPayload(form: ContactForm) {
  return {
    name: form.name.trim(),
    company_name: form.company_name.trim() || undefined,
    position: form.position.trim() || undefined,
    native_place: form.native_place.trim() || undefined,
    gender: form.gender.trim() || undefined,
    address: form.address.trim() || undefined,
    phone: form.phone.trim() || undefined,
    email: form.email.trim() || undefined,
    wechat_id: form.wechat_id.trim() || undefined,
    wechat_qr_url: form.wechat_qr_url.trim() || undefined,
    qq: form.qq.trim() || undefined,
    avatar_url: form.avatar_url.trim() || undefined,
    motto: form.motto.trim() || undefined,
    relationship_role: form.relationship_role.trim() || undefined,
    is_primary: form.is_primary,
  };
}

const intentLabels: Record<string, string> = {
  high: '高意向',
  medium: '中意向',
  low: '低意向',
  none: '无意向',
};

const statusLabels: Record<string, string> = {
  lead: '线索',
  prospect: '潜在客户',
  active: '合作客户',
  inactive: '暂停合作',
  archived: '归档',
};

function toTags(value: string) {
  return value.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean);
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats>({ total: 0, strong_intent: 0, active: 0, cooperation_count: 0 });
  const [selectedId, setSelectedId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [intent, setIntent] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [customerForm, setCustomerForm] = useState<CustomerForm>(emptyCustomerForm);
  const [contactForm, setContactForm] = useState<ContactForm>(emptyContactForm);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedId) || customers[0],
    [customers, selectedId],
  );

  const loadCustomers = async () => {
    setIsLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (industry) params.set('industry', industry);
    if (intent) params.set('cooperation_intent', intent);
    if (status) params.set('status', status);
    try {
      const response = await fetch(`/api/customers?${params.toString()}`, { credentials: 'include' });
      const result: CustomersResponse = await response.json();
      if (!response.ok || !result.data) throw new Error(result.error || '客户列表加载失败');
      setCustomers(result.data);
      setStats(result.stats || { total: result.data.length, strong_intent: 0, active: 0, cooperation_count: 0 });
      if (!selectedId && result.data[0]) setSelectedId(result.data[0].id);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '客户列表加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCustomers();
  }, []);

  const updateCustomerForm = (field: keyof CustomerForm, value: string) => {
    setCustomerForm((current) => ({ ...current, [field]: value }));
  };

  const updateContactForm = (field: keyof ContactForm, value: string | boolean) => {
    setContactForm((current) => ({ ...current, [field]: value }));
  };

  const createCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch('/api/customers', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...customerForm,
        tags: toTags(customerForm.tags),
        custom_fields: {},
      }),
    });
    if (!response.ok) {
      const result: ApiErrorResponse = await response.json();
      setError(formatApiError(result, '客户创建失败'));
      return;
    }
    setCustomerForm(emptyCustomerForm);
    setCustomerDialogOpen(false);
    await loadCustomers();
  };

  const createContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCustomer) return;
    const response = await fetch(
      editingContact
        ? `/api/customers/${selectedCustomer.id}/contacts/${editingContact.id}`
        : `/api/customers/${selectedCustomer.id}/contacts`,
      {
      method: editingContact ? 'PUT' : 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanContactPayload(contactForm)),
      },
    );
    if (!response.ok) {
      const result: ApiErrorResponse = await response.json();
      setError(formatApiError(result, editingContact ? '关键人更新失败' : '关键人创建失败'));
      return;
    }
    setContactForm(emptyContactForm);
    setEditingContact(null);
    setContactDialogOpen(false);
    await loadCustomers();
  };

  const openCreateContactDialog = () => {
    setEditingContact(null);
    setContactForm(emptyContactForm);
    setContactDialogOpen(true);
  };

  const openEditContactDialog = (contact: Contact) => {
    setEditingContact(contact);
    setContactForm(contactToForm(contact));
    setContactDialogOpen(true);
  };

  const importContactsFromText = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!selectedCustomer || !event.target.files?.[0]) return;
    const text = await event.target.files[0].text();
    const rows = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    for (const row of rows) {
      const [name, phone, companyName, position, email, wechatId] = row.split(/[,，\t]/).map((cell) => cell.trim());
      if (!name) continue;
      await fetch(`/api/customers/${selectedCustomer.id}/contacts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          company_name: companyName || selectedCustomer.company_name || selectedCustomer.organization_name,
          position,
          email: email || undefined,
          wechat_id: wechatId,
          is_primary: false,
        }),
      });
    }
    event.target.value = '';
    await loadCustomers();
  };

  const industries = Array.from(new Set(customers.map((customer) => customer.industry_category).filter((item): item is string => Boolean(item))));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">客户管理</h1>
          <p className="text-muted-foreground">统一维护客户组织、关键人、活动合作记录和嘉宾沉淀关系。</p>
        </div>
        <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新增客户
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>新增客户档案</DialogTitle>
            </DialogHeader>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={createCustomer}>
              <Field label="组织名称/公司名">
                <Input value={customerForm.organization_name} onChange={(event) => updateCustomerForm('organization_name', event.target.value)} required />
              </Field>
              <Field label="工商公司名">
                <Input value={customerForm.company_name} onChange={(event) => updateCustomerForm('company_name', event.target.value)} />
              </Field>
              <Field label="行业分类">
                <Input value={customerForm.industry_category} onChange={(event) => updateCustomerForm('industry_category', event.target.value)} />
              </Field>
              <Field label="客户来源">
                <Input value={customerForm.source} onChange={(event) => updateCustomerForm('source', event.target.value)} />
              </Field>
              <Field label="合作意向">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={customerForm.cooperation_intent} onChange={(event) => updateCustomerForm('cooperation_intent', event.target.value)}>
                  <option value="high">高意向</option>
                  <option value="medium">中意向</option>
                  <option value="low">低意向</option>
                  <option value="none">无意向</option>
                </select>
              </Field>
              <Field label="状态">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={customerForm.status} onChange={(event) => updateCustomerForm('status', event.target.value)}>
                  <option value="lead">线索</option>
                  <option value="prospect">潜在客户</option>
                  <option value="active">合作客户</option>
                  <option value="inactive">暂停合作</option>
                </select>
              </Field>
              <Field label="地区">
                <Input value={customerForm.region} onChange={(event) => updateCustomerForm('region', event.target.value)} />
              </Field>
              <Field label="官网">
                <Input value={customerForm.website} onChange={(event) => updateCustomerForm('website', event.target.value)} />
              </Field>
              <Field label="标签">
                <Input value={customerForm.tags} onChange={(event) => updateCustomerForm('tags', event.target.value)} placeholder="重点客户, 年度合作" />
              </Field>
              <Field label="地址">
                <Input value={customerForm.address} onChange={(event) => updateCustomerForm('address', event.target.value)} />
              </Field>
              <div className="md:col-span-2">
                <Field label="备注">
                  <Textarea value={customerForm.notes} onChange={(event) => updateCustomerForm('notes', event.target.value)} />
                </Field>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCustomerDialogOpen(false)}>取消</Button>
                <Button type="submit">保存客户</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="客户总数" value={stats.total} icon={Building2} />
        <StatCard title="强意向客户" value={stats.strong_intent} icon={Search} />
        <StatCard title="合作客户" value={stats.active} icon={ContactRound} />
        <StatCard title="累计合作次数" value={stats.cooperation_count} icon={Upload} />
      </div>

      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-5">
          <div className="md:col-span-2">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索客户、公司、联系人、电话" />
          </div>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={industry} onChange={(event) => setIndustry(event.target.value)}>
            <option value="">全部行业</option>
            {industries.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={intent} onChange={(event) => setIntent(event.target.value)}>
            <option value="">全部意向</option>
            <option value="high">高意向</option>
            <option value="medium">中意向</option>
            <option value="low">低意向</option>
          </select>
          <div className="flex gap-2">
            <select className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">全部状态</option>
              <option value="lead">线索</option>
              <option value="prospect">潜在客户</option>
              <option value="active">合作客户</option>
            </select>
            <Button variant="outline" onClick={() => void loadCustomers()}>筛选</Button>
          </div>
        </CardContent>
      </Card>

      {error && <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>客户列表</CardTitle>
            <CardDescription>{isLoading ? '正在加载...' : `共 ${customers.length} 个客户`}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => setSelectedId(customer.id)}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${selectedCustomer?.id === customer.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{customer.organization_name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{customer.company_name || '未填写公司名'} · {customer.industry_category || '未分类'}</div>
                  </div>
                  <Badge variant={customer.status === 'active' ? 'default' : 'outline'}>{statusLabels[customer.status] || customer.status}</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                  <span>意向：{intentLabels[customer.cooperation_intent] || customer.cooperation_intent}</span>
                  <span>合作：{customer.cooperation_count || 0} 次</span>
                  <span>关键人：{customer.contacts?.length || 0} 位</span>
                </div>
              </button>
            ))}
            {!isLoading && customers.length === 0 && <div className="py-10 text-center text-muted-foreground">暂无客户</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>{selectedCustomer?.organization_name || '客户详情'}</CardTitle>
              <CardDescription>{selectedCustomer?.region || '选择客户查看主数据关系'}</CardDescription>
            </div>
            {selectedCustomer && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/customers/${selectedCustomer.id}`}>详情</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {selectedCustomer ? (
              <>
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <Info label="行业" value={selectedCustomer.industry_category || '未分类'} />
                  <Info label="合作意向" value={intentLabels[selectedCustomer.cooperation_intent] || selectedCustomer.cooperation_intent} />
                  <Info label="合作次数" value={`${selectedCustomer.cooperation_count || 0} 次`} />
                  <Info label="关联嘉宾" value={`${selectedCustomer.guests_count || 0} 位`} />
                </div>
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-medium">多关键人</h2>
                    <div className="flex gap-2">
                      <Label className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input px-3 text-sm">
                        <Upload className="mr-2 h-4 w-4" />
                        导入
                        <Input className="hidden" type="file" accept=".csv,.txt,.tsv" onChange={importContactsFromText} />
                      </Label>
                      <Dialog open={contactDialogOpen} onOpenChange={(open) => {
                        setContactDialogOpen(open);
                        if (!open) {
                          setEditingContact(null);
                          setContactForm(emptyContactForm);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" type="button" onClick={openCreateContactDialog}>
                            <Plus className="mr-2 h-4 w-4" />
                            关键人
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>{editingContact ? '编辑关键人' : '新增关键人'}</DialogTitle>
                          </DialogHeader>
                          <form className="grid gap-4 md:grid-cols-2" onSubmit={createContact}>
                            {contactFields.map((field) => (
                              <Field key={field.key} label={field.label}>
                                <Input value={String(contactForm[field.key] || '')} onChange={(event) => updateContactForm(field.key, event.target.value)} required={field.key === 'name'} />
                              </Field>
                            ))}
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" checked={contactForm.is_primary} onChange={(event) => updateContactForm('is_primary', event.target.checked)} />
                              设为主联系人
                            </label>
                            <div className="md:col-span-2 flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => {
                                setContactDialogOpen(false);
                                setEditingContact(null);
                                setContactForm(emptyContactForm);
                              }}>取消</Button>
                              <Button type="submit">{editingContact ? '保存修改' : '保存关键人'}</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {(selectedCustomer.contacts || []).map((contact) => (
                      <div key={contact.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{contact.name}</div>
                            {contact.is_primary && <Badge>主联系人</Badge>}
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => openEditContactDialog(contact)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            编辑
                          </Button>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">{contact.position || '未填写职务'} · {contact.phone || '未填写电话'}</div>
                        <div className="mt-1 text-xs text-muted-foreground">微信：{contact.wechat_id || '未填写'} · QQ：{contact.qq || '未填写'}</div>
                        {contact.motto && <div className="mt-2 text-xs text-muted-foreground">{contact.motto}</div>}
                      </div>
                    ))}
                    {(selectedCustomer.contacts || []).length === 0 && <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">暂无关键人</div>}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-muted-foreground">暂无客户数据</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: number; icon: typeof Building2 }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-primary" />
      </CardContent>
    </Card>
  );
}

const contactFields: Array<{ key: Exclude<keyof ContactForm, 'is_primary'>; label: string }> = [
  { key: 'name', label: '姓名' },
  { key: 'company_name', label: '公司名称' },
  { key: 'position', label: '职务' },
  { key: 'native_place', label: '籍贯' },
  { key: 'gender', label: '性别' },
  { key: 'address', label: '地址' },
  { key: 'phone', label: '联系电话' },
  { key: 'email', label: '邮箱' },
  { key: 'wechat_id', label: '微信号' },
  { key: 'wechat_qr_url', label: '微信二维码 URL' },
  { key: 'qq', label: 'QQ 号' },
  { key: 'avatar_url', label: '形象照片 URL' },
  { key: 'motto', label: '座右铭' },
  { key: 'relationship_role', label: '关系角色' },
];
