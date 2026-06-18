'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CalendarDays, ContactRound, FileText, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Contact = {
  id: string;
  name: string;
  company_name?: string;
  position?: string;
  native_place?: string;
  gender?: string;
  address?: string;
  phone?: string;
  email?: string;
  wechat_id?: string;
  qq?: string;
  avatar_url?: string;
  motto?: string;
  is_primary: boolean;
  relationship_role?: string;
};

type RelatedEvent = {
  id: string;
  role: string;
  is_primary: boolean;
  sponsor_level?: string;
  sponsor_profile?: {
    level?: string;
    level_name?: string;
    amount?: number;
    currency?: string;
    benefits?: string[];
  } | null;
  event?: {
    id: string;
    name: string;
    status: string;
    start_time?: string;
    location?: string;
  } | null;
  events?: {
    id: string;
    name: string;
    status: string;
    start_time?: string;
    location?: string;
  } | null;
  contact?: Contact | null;
};

type RelatedGuest = {
  id: string;
  name: string;
  company?: string;
  position?: string;
  check_in_status?: string;
  guest_role?: string;
  event?: {
    id: string;
    name: string;
  } | null;
};

type ReportSummary = {
  id: string;
  title: string;
  summary?: string;
  event?: {
    id: string;
    name: string;
  } | null;
};

type CustomerDetail = {
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
  customer_contacts?: Contact[];
  events?: RelatedEvent[];
  event_customers?: RelatedEvent[];
  guests?: RelatedGuest[];
  reports?: ReportSummary[];
};

type CustomerResponse = {
  data?: CustomerDetail;
  error?: string;
};

const statusLabels: Record<string, string> = {
  lead: '线索',
  prospect: '潜在客户',
  active: '合作客户',
  inactive: '暂停合作',
  archived: '归档',
};

const sponsorLevelLabels: Record<string, string> = {
  title: '冠名赞助',
  strategic: '战略赞助',
  platinum: '白金赞助',
  gold: '黄金赞助',
  silver: '白银赞助',
  bronze: '青铜赞助',
  supporting: '支持单位',
  custom: '自定义赞助',
};

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCustomer = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/customers/${customerId}`, { credentials: 'include' });
        const result: CustomerResponse = await response.json();
        if (!response.ok || !result.data) throw new Error(result.error || '客户详情加载失败');
        setCustomer(result.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '客户详情加载失败');
      } finally {
        setIsLoading(false);
      }
    };
    void loadCustomer();
  }, [customerId]);

  if (isLoading) return <div className="py-10 text-center text-muted-foreground">正在加载客户详情...</div>;

  if (error || !customer) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="space-y-4 py-6">
          <div className="text-sm text-destructive">{error || '客户不存在'}</div>
          <Button variant="outline" asChild>
            <Link href="/customers">返回客户列表</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const contacts = customer.contacts || customer.customer_contacts || [];
  const events = customer.events || customer.event_customers || [];
  const guests = customer.guests || [];
  const reports = customer.reports || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{customer.organization_name}</h1>
            <Badge variant={customer.status === 'active' ? 'default' : 'outline'}>{statusLabels[customer.status] || customer.status}</Badge>
          </div>
          <p className="text-muted-foreground">{customer.company_name || '未填写公司名'} · {customer.industry_category || '未分类'}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="合作次数" value={`${customer.cooperation_count || events.length} 次`} icon={CalendarDays} />
        <Metric title="关键人" value={`${contacts.length} 位`} icon={ContactRound} />
        <Metric title="关联活动" value={`${events.length} 场`} icon={FileText} />
        <Metric title="关联嘉宾" value={`${guests.length} 位`} icon={Users} />
      </div>

      <Tabs defaultValue="base">
        <TabsList>
          <TabsTrigger value="base">基础信息</TabsTrigger>
          <TabsTrigger value="contacts">关键人</TabsTrigger>
          <TabsTrigger value="events">合作活动</TabsTrigger>
          <TabsTrigger value="guests">关联嘉宾</TabsTrigger>
          <TabsTrigger value="reports">复盘摘要</TabsTrigger>
        </TabsList>

        <TabsContent value="base">
          <Card>
            <CardHeader>
              <CardTitle>客户主档案</CardTitle>
              <CardDescription>客户组织主信息作为活动、嘉宾、台本和复盘的统一来源。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Info label="行业" value={customer.industry_category || '未分类'} />
              <Info label="来源" value={customer.source || '未填写'} />
              <Info label="地区" value={customer.region || '未填写'} />
              <Info label="官网" value={customer.website || '未填写'} />
              <Info label="地址" value={customer.address || '未填写'} />
              <Info label="最近合作" value={customer.last_cooperation_at || '暂无'} />
              <div className="md:col-span-2">
                <Info label="备注" value={customer.notes || '暂无备注'} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <div className="grid gap-4 md:grid-cols-2">
            {contacts.map((contact) => (
              <Card key={contact.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{contact.name}</CardTitle>
                    {contact.is_primary && <Badge>主联系人</Badge>}
                  </div>
                  <CardDescription>{contact.relationship_role || '关键人'} · {contact.position || '未填写职务'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div>电话：{contact.phone || '未填写'}</div>
                  <div>邮箱：{contact.email || '未填写'}</div>
                  <div>微信：{contact.wechat_id || '未填写'} · QQ：{contact.qq || '未填写'}</div>
                  <div>籍贯：{contact.native_place || '未填写'} · 性别：{contact.gender || '未填写'}</div>
                  <div>地址：{contact.address || '未填写'}</div>
                  {contact.motto && <div>座右铭：{contact.motto}</div>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>多活动合作记录</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.map((link) => {
                const event = link.event || link.events;
                return (
                  <div key={link.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <div className="font-medium">{event?.name || '未命名活动'}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{event?.start_time || '未填写时间'} · {event?.location || '未填写地点'}</div>
                    {link.role === 'sponsor' && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {link.sponsor_profile?.level_name || sponsorLevelLabels[link.sponsor_level || link.sponsor_profile?.level || 'custom']} · {link.sponsor_profile?.amount ? `${link.sponsor_profile.currency || 'CNY'} ${link.sponsor_profile.amount.toLocaleString()}` : '金额待定'} · {link.sponsor_profile?.benefits?.slice(0, 2).join('、') || '权益待确认'}
                      </div>
                    )}
                  </div>
                    <Badge variant={link.is_primary ? 'default' : 'outline'}>{link.role}</Badge>
                  </div>
                );
              })}
              {events.length === 0 && <div className="py-8 text-center text-muted-foreground">暂无关联活动</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guests">
          <Card>
            <CardHeader>
              <CardTitle>关联嘉宾</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {guests.map((guest) => (
                <div key={guest.id} className="rounded-lg border border-border p-3">
                  <div className="font-medium">{guest.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{guest.company || '未填写公司'} · {guest.position || '未填写职位'} · {guest.check_in_status || 'pending'}</div>
                </div>
              ))}
              {guests.length === 0 && <div className="py-8 text-center text-muted-foreground">暂无关联嘉宾</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>复盘摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="rounded-lg border border-border p-3">
                  <div className="font-medium">{report.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{report.summary || '暂无摘要'}</div>
                </div>
              ))}
              {reports.length === 0 && <div className="py-8 text-center text-muted-foreground">暂无复盘摘要</div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: string; icon: typeof CalendarDays }) {
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
