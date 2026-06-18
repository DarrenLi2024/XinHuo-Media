'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ListOrdered,
  Edit,
  CalendarDays,
  MapPin,
  Users,
  DollarSign as BudgetIcon,
  LayoutGrid,
  FileText,
  QrCode,
  Gift,
  BarChart3,
  CheckCircle2,
  Plus,
  Truck,
  Upload,
} from 'lucide-react';

type EventSettings = {
  require_check_in?: boolean;
  allow_lottery?: boolean;
  enable_seating?: boolean;
  enable_script?: boolean;
  enable_report?: boolean;
};

type EventTask = {
  id: string;
  title?: string;
  name?: string;
  status: string;
  priority?: string;
  progress?: number;
  due_date?: string;
  deadline?: string;
};

type EventGuest = {
  id: string;
  customer_id?: string;
  contact_id?: string;
  name: string;
  company?: string;
  position?: string;
  level?: string;
  check_in_status?: string;
  source?: string;
  invite_status?: string;
  guest_role?: string;
};

type GuestForm = {
  name: string;
  company: string;
  position: string;
  phone: string;
  email: string;
  level: 'vip' | 'important' | 'normal';
  invite_status: 'draft' | 'invited' | 'confirmed' | 'declined' | 'waitlist';
  guest_role: 'speaker' | 'award_guest' | 'host' | 'attendee' | 'vip' | 'staff' | 'other';
};

type EventCustomerLink = {
  id: string;
  customer_id?: string;
  contact_id?: string;
  role: string;
  is_primary: boolean;
  sponsor_level?: string;
  sponsor_profile?: {
    level?: string;
    level_name?: string;
    sponsorship_type?: string;
    amount?: number;
    currency?: string;
    benefits?: string[];
    deliverables?: string[];
    logo_url?: string;
    booth_number?: string;
    booth_size?: string;
    speaking_slot?: string;
    ad_placements?: string[];
    material_requirements?: string[];
    contract_status?: string;
    payment_status?: string;
    invoice_title?: string;
    invoice_tax_no?: string;
    notes?: string;
  } | null;
  notes?: string;
  customer?: {
    id: string;
    organization_name: string;
    company_name?: string;
    industry_category?: string;
    cooperation_count?: number;
    customer_contacts?: EventCustomerContact[];
  } | null;
  customers?: {
    id: string;
    organization_name: string;
    company_name?: string;
    industry_category?: string;
    cooperation_count?: number;
    customer_contacts?: EventCustomerContact[];
  } | null;
  contact?: EventCustomerContact | null;
  customer_contacts?: EventCustomerContact | null;
};

type EventCustomerContact = {
  id: string;
  name: string;
  position?: string;
  phone?: string;
  wechat_id?: string;
  is_primary?: boolean;
};

type CustomerOption = {
  id: string;
  organization_name: string;
  company_name?: string;
  industry_category?: string;
  contacts?: EventCustomerContact[];
  customer_contacts?: EventCustomerContact[];
};

type EventRelationForm = {
  customer_id: string;
  contact_id: string;
  role: 'client' | 'host' | 'organizer' | 'co_organizer' | 'sponsor' | 'invited_org';
  sponsor_level: 'title' | 'strategic' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'supporting' | 'custom';
  notes: string;
};

type EventDetail = {
  id: string;
  name: string;
  type: string;
  status: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  address?: string;
  expected_guests: number;
  actual_guests?: number;
  primary_customer_id?: string;
  budget?: number;
  actual_cost?: number;
  settings?: EventSettings;
  tasks?: EventTask[];
  guests?: EventGuest[];
  event_customers?: EventCustomerLink[];
  supplier_event_links?: Array<{
    id: string;
    service_scope?: string;
    contract_amount?: number;
    status?: string;
    supplier?: {
      id: string;
      name: string;
      category?: string;
      contact?: string;
      phone?: string;
      rating?: number;
    } | null;
    suppliers?: {
      id: string;
      name: string;
      category?: string;
      contact?: string;
      phone?: string;
      rating?: number;
    } | null;
    contact?: {
      id: string;
      name: string;
      phone?: string;
      position?: string;
    } | null;
    supplier_contacts?: {
      id: string;
      name: string;
      phone?: string;
      position?: string;
    } | null;
  }>;
  primary_customer?: {
    id: string;
    organization_name: string;
    company_name?: string;
  } | null;
};

type EventDetailResponse = {
  data?: EventDetail;
  error?: string;
};

const eventTypeMap: Record<string, string> = {
  annual_meeting: '年会',
  product_launch: '发布会',
  seminar: '研讨会',
  appreciation: '答谢会',
  training: '培训',
  other: '其他',
};

const eventStatusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: '草稿', variant: 'secondary' },
  pending: { label: '待筹备', variant: 'outline' },
  preparing: { label: '筹备中', variant: 'default' },
  ongoing: { label: '进行中', variant: 'default' },
  completed: { label: '已完成', variant: 'secondary' },
  archived: { label: '已归档', variant: 'outline' },
};

const taskStatusMap: Record<string, { label: string; className: string }> = {
  completed: { label: '已完成', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  in_progress: { label: '进行中', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  pending: { label: '待开始', className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  delayed: { label: '已延期', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  cancelled: { label: '已取消', className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
};

const guestLevelMap: Record<string, { label: string; className: string }> = {
  vip: { label: 'VIP', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  important: { label: '重要', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  normal: { label: '普通', className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
};

const sponsorLevelMap: Record<string, string> = {
  title: '冠名赞助',
  strategic: '战略赞助',
  platinum: '白金赞助',
  gold: '黄金赞助',
  silver: '白银赞助',
  bronze: '青铜赞助',
  supporting: '支持单位',
  custom: '自定义赞助',
};

const roleLabels: Record<string, string> = {
  speaker: '演讲嘉宾',
  award_guest: '颁奖嘉宾',
  host: '主持/主礼',
  attendee: '参会人员',
  vip: 'VIP 贵宾',
  staff: '工作人员',
  other: '其他',
};

const emptyGuestForm: GuestForm = {
  name: '',
  company: '',
  position: '',
  phone: '',
  email: '',
  level: 'normal',
  invite_status: 'draft',
  guest_role: 'attendee',
};

const emptyRelationForm: EventRelationForm = {
  customer_id: '',
  contact_id: '',
  role: 'invited_org',
  sponsor_level: 'custom',
  notes: '',
};

type BulkMode = 'attendee' | 'speaker' | 'vip' | 'staff';

function calculateProgress(tasks: EventTask[], status: string): number {
  if (status === 'completed') return 100;
  if (tasks.length === 0) return status === 'draft' ? 10 : 30;
  const completed = tasks.filter((task) => task.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [guestForm, setGuestForm] = useState<GuestForm>(emptyGuestForm);
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<BulkMode>('attendee');
  const [bulkText, setBulkText] = useState('');
  const [isImportingGuests, setIsImportingGuests] = useState(false);
  const [relationDialogOpen, setRelationDialogOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [relationForm, setRelationForm] = useState<EventRelationForm>(emptyRelationForm);
  const [isSavingRelation, setIsSavingRelation] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingEventCustomer, setEditingEventCustomer] = useState<EventCustomerLink | null>(null);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [isSavingContact, setIsSavingContact] = useState(false);

  const loadEvent = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/events/${eventId}`, { credentials: 'include' });
      const result: EventDetailResponse = await response.json();

      if (!response.ok || !result.data) {
        throw new Error(result.error || '活动详情加载失败');
      }

      setEvent(result.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '活动详情加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEvent();
  }, [eventId]);

  const createGuest = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    setIsCreatingGuest(true);
    setError('');
    try {
      const response = await fetch('/api/guests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          name: guestForm.name.trim(),
          company: guestForm.company.trim() || undefined,
          position: guestForm.position.trim() || undefined,
          phone: guestForm.phone.trim() || undefined,
          email: guestForm.email.trim() || undefined,
          level: guestForm.level,
          source: 'manual',
          invite_status: guestForm.invite_status,
          guest_role: guestForm.guest_role,
        }),
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error || '名单成员创建失败');
      setGuestDialogOpen(false);
      setGuestForm(emptyGuestForm);
      await loadEvent();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '名单成员创建失败');
    } finally {
      setIsCreatingGuest(false);
    }
  };

  const openBulkImport = (mode: BulkMode) => {
    setBulkMode(mode);
    setBulkText('');
    setBulkDialogOpen(true);
  };

  const parseBulkGuests = () => {
    const defaultRole: GuestForm['guest_role'] = bulkMode === 'speaker' ? 'speaker' : bulkMode === 'staff' ? 'staff' : bulkMode === 'vip' ? 'vip' : 'attendee';
    const defaultLevel: GuestForm['level'] = bulkMode === 'vip' || bulkMode === 'speaker' ? 'vip' : 'normal';
    return bulkText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, company, position, phone, email, role, level, inviteStatus] = line.split(/[,，\t]/).map((cell) => cell.trim());
        return {
          name,
          company: company || undefined,
          position: position || undefined,
          phone: phone || undefined,
          email: email || undefined,
          guest_role: (role || defaultRole) as GuestForm['guest_role'],
          level: (level || defaultLevel) as GuestForm['level'],
          invite_status: (inviteStatus || 'draft') as GuestForm['invite_status'],
        };
      })
      .filter((guest) => guest.name);
  };

  const importBulkGuests = async () => {
    const rows = parseBulkGuests();
    if (rows.length === 0) {
      setError('请粘贴至少一行名单数据');
      return;
    }
    setIsImportingGuests(true);
    setError('');
    try {
      const response = await fetch('/api/guests/batch', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, guests: rows }),
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error || '批量导入失败');
      setBulkDialogOpen(false);
      setBulkText('');
      await loadEvent();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : '批量导入失败');
    } finally {
      setIsImportingGuests(false);
    }
  };

  const loadCustomers = async () => {
    const response = await fetch('/api/customers', { credentials: 'include' });
    const result: { data?: CustomerOption[]; error?: string } = await response.json();
    if (!response.ok || !result.data) throw new Error(result.error || '客户列表加载失败');
    setCustomers(result.data);
  };

  const openRelationDialog = async (role?: EventRelationForm['role']) => {
    setRelationForm({ ...emptyRelationForm, role: role || 'invited_org' });
    setRelationDialogOpen(true);
    try {
      if (customers.length === 0) await loadCustomers();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '客户列表加载失败');
    }
  };

  const saveEventRelation = async () => {
    if (!relationForm.customer_id) {
      setError('请选择客户组织');
      return;
    }
    setIsSavingRelation(true);
    setError('');
    try {
      const response = await fetch(`/api/events/${eventId}/customers`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: relationForm.customer_id,
          contact_id: relationForm.contact_id || undefined,
          role: relationForm.role,
          sponsor_level: relationForm.role === 'sponsor' ? relationForm.sponsor_level : undefined,
          sponsor_profile: relationForm.role === 'sponsor' ? { level: relationForm.sponsor_level } : undefined,
          notes: relationForm.notes.trim() || undefined,
        }),
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error || '活动关系保存失败');
      setRelationDialogOpen(false);
      setRelationForm(emptyRelationForm);
      await loadEvent();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '活动关系保存失败');
    } finally {
      setIsSavingRelation(false);
    }
  };

  const getLinkCustomer = (link: EventCustomerLink) => link.customer || link.customers || null;

  const getCustomerContacts = (link: EventCustomerLink) => getLinkCustomer(link)?.customer_contacts || [];

  const getLinkContact = (link: EventCustomerLink) => (
    link.contact ||
    link.customer_contacts ||
    getCustomerContacts(link).find((contact) => contact.id === link.contact_id) ||
    getCustomerContacts(link).find((contact) => contact.is_primary) ||
    getCustomerContacts(link)[0] ||
    null
  );

  const openContactEditor = (link: EventCustomerLink) => {
    const contact = getLinkContact(link);
    setEditingEventCustomer(link);
    setSelectedContactId(contact?.id || '');
  };

  const saveEventCustomerContact = async () => {
    if (!editingEventCustomer) return;
    const customer = getLinkCustomer(editingEventCustomer);
    if (!customer || !selectedContactId) {
      setError('请选择关键人');
      return;
    }
    setIsSavingContact(true);
    setError('');
    try {
      const response = await fetch(`/api/events/${eventId}/customers`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customer.id,
          contact_id: selectedContactId,
          role: editingEventCustomer.role,
          is_primary: editingEventCustomer.is_primary,
          sponsor_level: editingEventCustomer.sponsor_level,
          sponsor_profile: editingEventCustomer.sponsor_profile || undefined,
          notes: editingEventCustomer.notes,
        }),
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error || '关键人指定失败');
      setEditingEventCustomer(null);
      setSelectedContactId('');
      await loadEvent();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '关键人指定失败');
    } finally {
      setIsSavingContact(false);
    }
  };

  const tasks = event?.tasks || [];
  const guests = event?.guests || [];
  const eventCustomers = event?.event_customers || [];
  const supplierLinks = event?.supplier_event_links || [];
  const sponsors = eventCustomers.filter((link) => link.role === 'sponsor');
  const customerKeyPeople = eventCustomers.filter((link) => getLinkContact(link));
  const speakerGuests = guests.filter((guest) => guest.guest_role === 'speaker' || guest.guest_role === 'award_guest' || guest.guest_role === 'host');
  const attendeeGuests = guests.filter((guest) => !guest.guest_role || guest.guest_role === 'attendee' || guest.guest_role === 'vip');
  const checkedInGuests = guests.filter((guest) => guest.check_in_status === 'checked_in').length;
  const linkedGuests = guests.filter((guest) => guest.customer_id || guest.contact_id).length;
  const progress = useMemo(() => calculateProgress(tasks, event?.status || 'draft'), [tasks, event?.status]);
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const inProgressTasks = tasks.filter((task) => task.status === 'in_progress').length;
  const readiness = {
    hasCustomer: eventCustomers.some((link) => link.is_primary || link.role === 'client'),
    hasGuests: guests.length > 0,
    hasRoles: tasks.length > 0 || speakerGuests.length > 0 || true,
    hasSuppliers: supplierLinks.length > 0,
    hasSponsors: sponsors.length > 0,
  };

  if (isLoading) {
    return <div className="py-10 text-center text-muted-foreground">正在加载活动详情...</div>;
  }

  if (error || !event) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="space-y-4 py-6">
          <div className="text-sm text-destructive">{error || '活动不存在'}</div>
          <Button variant="outline" asChild>
            <Link href="/events">返回活动列表</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const settings = event.settings || {};
  const modules = [
    {
      title: '名单管理',
      icon: ListOrdered,
      href: `/events/${eventId}/roster`,
      enabled: true,
      hint: '执行小组、嘉宾、赞助商、参会人统一管理',
    },
    {
      title: '智能排座',
      icon: LayoutGrid,
      href: `/seating?event=${eventId}`,
      enabled: (settings.enable_seating ?? true) && readiness.hasGuests,
      hint: readiness.hasGuests ? '读取活动名单' : '先在活动管理维护参会名单',
    },
    {
      title: '流程台本',
      icon: FileText,
      href: `/scripts?event=${eventId}`,
      enabled: (settings.enable_script ?? true) && readiness.hasCustomer,
      hint: readiness.hasRoles ? '读取活动角色与嘉宾' : '建议先补角色职责和发言嘉宾',
    },
    {
      title: '签到系统',
      icon: QrCode,
      href: `/checkin?event=${eventId}`,
      enabled: (settings.require_check_in ?? true) && readiness.hasGuests,
      hint: readiness.hasGuests ? '读取活动参会名单' : '先在活动管理维护参会名单',
    },
    {
      title: '抽奖系统',
      icon: Gift,
      href: `/lottery?event=${eventId}`,
      enabled: (settings.allow_lottery ?? true) && readiness.hasGuests,
      hint: readiness.hasGuests ? '读取活动可抽奖名单' : '先在活动管理维护参会名单',
    },
    {
      title: '复盘报告',
      icon: BarChart3,
      href: `/reports?event=${eventId}`,
      enabled: settings.enable_report ?? true,
      hint: '汇总客户、名单、签到、供应商与成本',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{event.name}</h1>
              <Badge variant={eventStatusMap[event.status]?.variant || 'outline'}>
                {eventStatusMap[event.status]?.label || event.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {eventTypeMap[event.type] || event.type} · {event.location || '未填写地点'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/events/${eventId}?edit=true`}>
              <Edit className="mr-2 h-4 w-4" />
              编辑
            </Link>
          </Button>
          <Button>发布活动</Button>
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">筹备进度</span>
              <Progress value={progress} className="h-2 w-[200px]" />
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {completedTasks} 任务已完成
              </span>
              <span>{inProgressTasks} 任务进行中</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">活动时间</p>
                <p className="font-medium">{event.start_time}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">活动地点</p>
                <p className="font-medium">{event.location || '未填写'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">嘉宾人数</p>
                <p className="font-medium">{guests.length || event.actual_guests || 0}/{event.expected_guests} 人</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BudgetIcon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">预算金额</p>
                <p className="font-medium">¥{(event.budget || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>活动工作台</CardTitle>
          <CardDescription>名单、职责、供应商和赞助商在活动管理中统一维护，下游模块只读取当前活动数据</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {modules.map((item) => (
              <Link
                key={item.title}
                href={item.enabled ? item.href : '#'}
                className={`flex flex-col items-center gap-2 rounded-lg border border-border p-4 transition-colors ${
                  item.enabled ? 'hover:bg-muted cursor-pointer' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <item.icon className={`h-8 w-8 ${item.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">{item.title}</span>
                <span className="text-center text-xs text-muted-foreground">{item.hint}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <ReadinessCard title="客户关键人" value={`${customerKeyPeople.length} 位`} ready={readiness.hasCustomer} detail="主客户和关键人是活动归属与对接基础" />
        <ReadinessCard title="角色职责" value={`${tasks.length} 项`} ready={readiness.hasRoles} detail="台本、现场执行和复盘依赖职责分工" />
        <ReadinessCard title="嘉宾名单" value={`${speakerGuests.length} 位`} ready={speakerGuests.length > 0} detail="致辞、演讲、颁奖等关键角色" />
        <ReadinessCard title="参会名单" value={`${attendeeGuests.length} 位`} ready={readiness.hasGuests} detail="排座、签到和抽奖统一读取" />
        <ReadinessCard title="供应商/赞助商" value={`${supplierLinks.length}/${sponsors.length}`} ready={readiness.hasSuppliers || readiness.hasSponsors} detail="服务执行和权益露出统一归档" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>客户与关键人</CardTitle>
            <CardDescription>活动主客户、关联组织与嘉宾主数据统一口径</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/customers${event.primary_customer_id ? `/${event.primary_customer_id}` : ''}`}>客户档案</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {eventCustomers.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              暂未绑定客户组织，旧活动嘉宾仍可继续签到、排座和抽奖。
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {eventCustomers.map((link) => {
                const customer = getLinkCustomer(link);
                const contact = getLinkContact(link);
                return (
                  <div key={link.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{customer?.organization_name || '未命名客户'}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {customer?.company_name || '未填写公司'} · {customer?.industry_category || '未分类'}
                        </div>
                      </div>
                      <Badge variant={link.is_primary ? 'default' : 'outline'}>{link.role}</Badge>
                    </div>
                    {link.role === 'sponsor' && (
                      <div className="mt-3 grid gap-2 rounded-md border border-yellow-500/20 bg-yellow-500/5 p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium">
                            {link.sponsor_profile?.level_name || sponsorLevelMap[link.sponsor_level || link.sponsor_profile?.level || 'custom'] || '赞助商'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {link.sponsor_profile?.amount ? `${link.sponsor_profile.currency || 'CNY'} ${link.sponsor_profile.amount.toLocaleString()}` : '金额待定'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          权益：{link.sponsor_profile?.benefits?.slice(0, 3).join('、') || '待确认'}
                        </div>
                      </div>
                    )}
                    <div className="mt-3 rounded-md bg-muted px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium">{contact?.name || '未指定关键人'}</div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => openContactEditor(link)}>
                          {contact ? '更换' : '指定'}
                        </Button>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {contact?.position || '未填写职务'} · {contact?.phone || '未填写电话'} · 微信 {contact?.wechat_id || '未填写'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">关联组织</div>
              <div className="mt-1 font-medium">{eventCustomers.length} 个</div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">主数据嘉宾</div>
              <div className="mt-1 font-medium">{linkedGuests}/{guests.length} 位</div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">签到口径</div>
              <div className="mt-1 font-medium">统一 guests</div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">赞助商</div>
              <div className="mt-1 font-medium">{sponsors.length} 个</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">活动总览</TabsTrigger>
          <TabsTrigger value="customers">客户与关键人</TabsTrigger>
          <TabsTrigger value="tasks">任务分工</TabsTrigger>
          <TabsTrigger value="guests">名单管理</TabsTrigger>
          <TabsTrigger value="details">活动详情</TabsTrigger>
          <TabsTrigger value="suppliers">供应商</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>名单数据来源</CardTitle>
                <CardDescription>活动内名单是排座、签到、抽奖、台本和复盘的唯一业务来源</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <LifecycleRow label="客户关键人" value={`${customerKeyPeople.length} 位`} ready={readiness.hasCustomer}>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('customers')}>管理</Button>
                </LifecycleRow>
                <LifecycleRow label="角色职责" value={`${tasks.length} 项任务 / ${speakerGuests.length} 位关键嘉宾`} ready={readiness.hasRoles}>
                  <Button size="sm" variant="outline" asChild><Link href={`/events/tasks?event=${eventId}`}>管理</Link></Button>
                </LifecycleRow>
                <LifecycleRow label="嘉宾名单" value={`${speakerGuests.length} 位`} ready={speakerGuests.length > 0}>
                  <Button size="sm" variant="outline" onClick={() => openBulkImport('speaker')}>批量导入</Button>
                </LifecycleRow>
                <LifecycleRow label="参会名单" value={`${attendeeGuests.length} 位`} ready={attendeeGuests.length > 0}>
                  <Button size="sm" variant="outline" onClick={() => openBulkImport('attendee')}>批量导入</Button>
                </LifecycleRow>
                <LifecycleRow label="赞助商名单" value={`${sponsors.length} 个`} ready={sponsors.length > 0}>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('customers')}>管理</Button>
                </LifecycleRow>
                <LifecycleRow label="供应商名单" value={`${supplierLinks.length} 个`} ready={supplierLinks.length > 0}>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('suppliers')}>管理</Button>
                </LifecycleRow>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>下游模块调用关系</CardTitle>
                <CardDescription>这些模块不再维护孤立名单</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ModuleDependency title="智能排座" source="参会名单、VIP等级、桌位信息" ready={readiness.hasGuests} />
                <ModuleDependency title="流程台本" source="客户关键人、角色职责、演讲/颁奖嘉宾、赞助权益" ready={readiness.hasCustomer && readiness.hasRoles} />
                <ModuleDependency title="签到系统" source="参会名单、二维码、签到状态" ready={readiness.hasGuests} />
                <ModuleDependency title="抽奖系统" source="参会名单、签到状态、赞助奖品" ready={readiness.hasGuests} />
                <ModuleDependency title="复盘报告" source="客户、名单、签到率、供应商评分、赞助履约" ready={readiness.hasCustomer} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>活动客户关系</CardTitle>
                <CardDescription>客户关键人、主办/协办/受邀组织和赞助商都在此维护</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => void openRelationDialog('invited_org')}>添加组织</Button>
                <Button size="sm" onClick={() => void openRelationDialog('sponsor')}>添加赞助商</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {eventCustomers.map((link) => {
                const customer = getLinkCustomer(link);
                const contact = getLinkContact(link);
                return (
                  <div key={link.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{customer?.organization_name || '未命名客户'}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {contact?.name || '未指定关键人'} · {contact?.position || '未填写职务'} · {link.notes || '无备注'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openContactEditor(link)}>
                          {contact ? '更换关键人' : '指定关键人'}
                        </Button>
                        <Badge variant={link.is_primary ? 'default' : 'outline'}>{link.role}</Badge>
                      </div>
                    </div>
                    {link.role === 'sponsor' && (
                      <div className="mt-3 grid gap-3 rounded-md bg-muted p-3 text-sm md:grid-cols-3">
                        <div>
                          <div className="text-xs text-muted-foreground">赞助等级</div>
                          <div className="mt-1 font-medium">{link.sponsor_profile?.level_name || sponsorLevelMap[link.sponsor_level || link.sponsor_profile?.level || 'custom'] || '自定义赞助'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">赞助金额</div>
                          <div className="mt-1 font-medium">{link.sponsor_profile?.amount ? `${link.sponsor_profile.currency || 'CNY'} ${link.sponsor_profile.amount.toLocaleString()}` : '待定'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">合同/付款</div>
                          <div className="mt-1 font-medium">{link.sponsor_profile?.contract_status || 'draft'} / {link.sponsor_profile?.payment_status || 'unpaid'}</div>
                        </div>
                        <div className="md:col-span-3 text-xs text-muted-foreground">
                          权益：{link.sponsor_profile?.benefits?.join('、') || '待确认'}
                        </div>
                        <div className="md:col-span-3 text-xs text-muted-foreground">
                          交付物：{link.sponsor_profile?.deliverables?.join('、') || '待确认'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {eventCustomers.length === 0 && <div className="py-8 text-center text-muted-foreground">暂无客户关系</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>任务列表</CardTitle>
              <Button size="sm" asChild>
                <Link href={`/events/tasks?event=${eventId}`}>添加任务</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">暂无任务</div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{task.title || task.name}</span>
                          <Badge className={taskStatusMap[task.status]?.className || taskStatusMap.pending.className}>
                            {taskStatusMap[task.status]?.label || task.status}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          进度: {task.progress || 0}% · 截止: {task.due_date || task.deadline || '未设置'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guests" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>活动名单管理</CardTitle>
                <CardDescription>嘉宾、参会人员、主持、演讲和颁奖角色都在当前活动中维护</CardDescription>
              </div>
              <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" type="button" onClick={() => openBulkImport('attendee')}>
                    <Upload className="mr-2 h-4 w-4" />
                    批量导入
                  </Button>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      新增名单成员
                    </Button>
                  </DialogTrigger>
                </div>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>新增活动名单成员</DialogTitle>
                  </DialogHeader>
                  <form className="grid gap-4 md:grid-cols-2" onSubmit={createGuest}>
                    <Field label="姓名">
                      <Input value={guestForm.name} onChange={(inputEvent) => setGuestForm({ ...guestForm, name: inputEvent.target.value })} required />
                    </Field>
                    <Field label="公司/组织">
                      <Input value={guestForm.company} onChange={(inputEvent) => setGuestForm({ ...guestForm, company: inputEvent.target.value })} />
                    </Field>
                    <Field label="职务">
                      <Input value={guestForm.position} onChange={(inputEvent) => setGuestForm({ ...guestForm, position: inputEvent.target.value })} />
                    </Field>
                    <Field label="联系电话">
                      <Input value={guestForm.phone} onChange={(inputEvent) => setGuestForm({ ...guestForm, phone: inputEvent.target.value })} />
                    </Field>
                    <Field label="邮箱">
                      <Input value={guestForm.email} onChange={(inputEvent) => setGuestForm({ ...guestForm, email: inputEvent.target.value })} />
                    </Field>
                    <Field label="名单角色">
                      <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={guestForm.guest_role} onChange={(inputEvent) => setGuestForm({ ...guestForm, guest_role: inputEvent.target.value as GuestForm['guest_role'] })}>
                        <option value="attendee">参会人员</option>
                        <option value="vip">VIP 贵宾</option>
                        <option value="speaker">演讲嘉宾</option>
                        <option value="award_guest">颁奖嘉宾</option>
                        <option value="host">主持/主礼</option>
                        <option value="staff">工作人员</option>
                        <option value="other">其他</option>
                      </select>
                    </Field>
                    <Field label="嘉宾等级">
                      <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={guestForm.level} onChange={(inputEvent) => setGuestForm({ ...guestForm, level: inputEvent.target.value as GuestForm['level'] })}>
                        <option value="normal">普通</option>
                        <option value="important">重要</option>
                        <option value="vip">VIP</option>
                      </select>
                    </Field>
                    <Field label="邀请状态">
                      <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={guestForm.invite_status} onChange={(inputEvent) => setGuestForm({ ...guestForm, invite_status: inputEvent.target.value as GuestForm['invite_status'] })}>
                        <option value="draft">草稿</option>
                        <option value="invited">已邀请</option>
                        <option value="confirmed">已确认</option>
                        <option value="declined">已婉拒</option>
                        <option value="waitlist">候补</option>
                      </select>
                    </Field>
                    <div className="md:col-span-2 flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setGuestDialogOpen(false)}>取消</Button>
                      <Button type="submit" disabled={isCreatingGuest}>{isCreatingGuest ? '保存中...' : '保存名单成员'}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {guests.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  暂无活动名单。排座、签到、抽奖和台本暂不能获得可靠名单来源。
                </div>
              ) : (
                <div className="grid gap-3">
                  {guests.map((guest) => {
                    const level = guest.level || 'normal';
                    return (
                      <div key={guest.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{guest.name}</span>
                            <Badge className={guestLevelMap[level]?.className || guestLevelMap.normal.className}>
                              {guestLevelMap[level]?.label || level}
                            </Badge>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {guest.company || '未填写公司'} · {guest.position || '未填写职位'} · {roleLabels[guest.guest_role || 'attendee'] || guest.guest_role || '参会人员'} · {guest.invite_status || 'draft'} · {guest.check_in_status || 'pending'}
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {guest.customer_id || guest.contact_id ? '已关联主数据' : '活动快照'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>活动描述</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{event.description || '暂无活动描述'}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>活动供应商</CardTitle>
                <CardDescription>供应商主档案独立维护，活动内只绑定服务范围、联系人和合同金额</CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href={`/suppliers?event=${eventId}`}>添加供应商</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {supplierLinks.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  暂无活动供应商。台本执行、物料交付和复盘评分会缺少供应商来源。
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {supplierLinks.map((link) => {
                    const supplier = link.supplier || link.suppliers;
                    const contact = link.contact || link.supplier_contacts;
                    return (
                      <div key={link.id} className="rounded-lg border border-border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{supplier?.name || '未命名供应商'}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {supplier?.category || '未分类'} · {link.service_scope || '未填写服务范围'}
                            </div>
                          </div>
                          <Badge variant="outline">{link.status || 'pending'}</Badge>
                        </div>
                        <div className="mt-3 grid gap-2 rounded-md bg-muted p-3 text-sm">
                          <div>联系人：{contact?.name || supplier?.contact || '未指定'} · {contact?.phone || supplier?.phone || '未填写电话'}</div>
                          <div>合同金额：¥{(link.contract_amount || 0).toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(editingEventCustomer)} onOpenChange={(open) => {
        if (!open) {
          setEditingEventCustomer(null);
          setSelectedContactId('');
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>指定活动关键人</DialogTitle>
          </DialogHeader>
          {editingEventCustomer && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-3 text-sm">
                <div className="font-medium">{getLinkCustomer(editingEventCustomer)?.organization_name || '未命名客户'}</div>
                <div className="mt-1 text-xs text-muted-foreground">角色：{editingEventCustomer.role}</div>
              </div>
              <Field label="关键人">
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedContactId}
                  onChange={(inputEvent) => setSelectedContactId(inputEvent.target.value)}
                >
                  <option value="">请选择关键人</option>
                  {getCustomerContacts(editingEventCustomer).map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}{contact.is_primary ? '（主联系人）' : ''} · {contact.position || '未填写职务'} · {contact.phone || '未填写电话'}
                    </option>
                  ))}
                </select>
              </Field>
              {getCustomerContacts(editingEventCustomer).length === 0 && (
                <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  该客户档案暂无联系人，请先到客户管理中添加关键人。
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingEventCustomer(null)}>取消</Button>
                <Button type="button" onClick={() => void saveEventCustomerContact()} disabled={isSavingContact || !selectedContactId}>
                  {isSavingContact ? '保存中...' : '保存关键人'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={relationDialogOpen} onOpenChange={setRelationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{relationForm.role === 'sponsor' ? '添加赞助商' : '添加活动组织关系'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="客户/组织">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={relationForm.customer_id}
                onChange={(event) => {
                  const customer = customers.find((item) => item.id === event.target.value);
                  const contacts = customer?.contacts || customer?.customer_contacts || [];
                  setRelationForm({
                    ...relationForm,
                    customer_id: event.target.value,
                    contact_id: contacts.find((contact) => contact.is_primary)?.id || contacts[0]?.id || '',
                  });
                }}
              >
                <option value="">请选择客户/组织</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.organization_name}</option>
                ))}
              </select>
            </Field>
            <Field label="关键人">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={relationForm.contact_id}
                onChange={(event) => setRelationForm({ ...relationForm, contact_id: event.target.value })}
              >
                <option value="">自动使用主联系人</option>
                {(customers.find((customer) => customer.id === relationForm.customer_id)?.contacts || customers.find((customer) => customer.id === relationForm.customer_id)?.customer_contacts || []).map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}{contact.is_primary ? '（主联系人）' : ''} · {contact.position || '未填写职务'}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="活动角色">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={relationForm.role}
                onChange={(event) => setRelationForm({ ...relationForm, role: event.target.value as EventRelationForm['role'] })}
              >
                <option value="client">客户</option>
                <option value="host">主办</option>
                <option value="organizer">承办</option>
                <option value="co_organizer">协办</option>
                <option value="sponsor">赞助商</option>
                <option value="invited_org">受邀组织</option>
              </select>
            </Field>
            {relationForm.role === 'sponsor' && (
              <Field label="赞助等级">
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={relationForm.sponsor_level}
                  onChange={(event) => setRelationForm({ ...relationForm, sponsor_level: event.target.value as EventRelationForm['sponsor_level'] })}
                >
                  {Object.entries(sponsorLevelMap).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>
            )}
            <div className="md:col-span-2">
              <Field label="备注">
                <Input value={relationForm.notes} onChange={(event) => setRelationForm({ ...relationForm, notes: event.target.value })} />
              </Field>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRelationDialogOpen(false)}>取消</Button>
              <Button type="button" onClick={() => void saveEventRelation()} disabled={isSavingRelation}>
                {isSavingRelation ? '保存中...' : '保存关系'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>批量导入活动名单</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
              <Field label="导入类型">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={bulkMode} onChange={(event) => setBulkMode(event.target.value as BulkMode)}>
                  <option value="attendee">参会名单</option>
                  <option value="speaker">嘉宾名单</option>
                  <option value="vip">VIP 名单</option>
                  <option value="staff">工作人员名单</option>
                </select>
              </Field>
              <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
                每行一人，支持逗号、中文逗号或 Tab 分隔。字段顺序：姓名、公司、职务、电话、邮箱、名单角色、等级、邀请状态。
              </div>
            </div>
            <Textarea
              className="min-h-[240px] font-mono text-sm"
              value={bulkText}
              onChange={(event) => setBulkText(event.target.value)}
              placeholder={`张三,芯火传媒,市场负责人,13900000000,zhang@example.com,attendee,normal,confirmed\n李四,合作伙伴,演讲嘉宾,13800000000,li@example.com,speaker,vip,invited`}
            />
            <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              批量编辑当前以“导出后粘贴覆盖”的方式处理：复制现有名单到表格中修改，再粘贴导入为新版本。下一阶段会加入行级多选、批量改角色/等级/状态和去重合并。
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setBulkDialogOpen(false)}>取消</Button>
              <Button type="button" onClick={() => void importBulkGuests()} disabled={isImportingGuests}>
                {isImportingGuests ? '导入中...' : `导入 ${parseBulkGuests().length} 条`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReadinessCard({ title, value, ready, detail }: { title: string; value: string; ready: boolean; detail: string }) {
  return (
    <Card className={ready ? 'border-primary/30' : 'border-dashed'}>
      <CardContent className="space-y-2 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">{title}</div>
          <Badge variant={ready ? 'default' : 'outline'}>{ready ? '已就绪' : '待补充'}</Badge>
        </div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{detail}</div>
      </CardContent>
    </Card>
  );
}

function LifecycleRow({ label, value, ready, children }: { label: string; value: string; ready: boolean; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div>
        <div className="font-medium">{label}</div>
        <div className="mt-1 text-xs text-muted-foreground">{value}</div>
      </div>
      <div className="flex items-center gap-2">
        {children}
        <Badge variant={ready ? 'default' : 'outline'}>{ready ? '已建立' : '缺失'}</Badge>
      </div>
    </div>
  );
}

function ModuleDependency({ title, source, ready }: { title: string; source: string; ready: boolean }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">{title}</div>
        <Badge variant={ready ? 'secondary' : 'outline'}>{ready ? '可调用' : '缺前置'}</Badge>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">来源：{source}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <Label>{label}</Label>
      {children}
    </label>
  );
}
