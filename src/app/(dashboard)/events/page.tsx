'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  MapPin,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type EventRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  start_time: string;
  location: string;
  expected_guests: number;
  actual_guests?: number;
  event_tasks?: Array<{ count: number }>;
  guests?: Array<{ count: number }>;
};

type EventsResponse = {
  data?: EventRow[];
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

function getProgress(event: EventRow): number {
  const total = event.event_tasks?.[0]?.count || 0;
  if (event.status === 'completed') return 100;
  if (event.status === 'draft') return 10;
  if (total === 0) return event.status === 'preparing' ? 30 : 0;
  return event.status === 'preparing' ? 60 : 40;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/events?${params.toString()}`, { credentials: 'include' });
      const result: EventsResponse = await response.json();

      if (!response.ok || !result.data) {
        throw new Error(result.error || '活动加载失败');
      }

      setEvents(result.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '活动加载失败');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => typeFilter === 'all' || event.type === typeFilter);
  }, [events, typeFilter]);

  const handleDelete = async (eventId: string) => {
    const response = await fetch(`/api/events/${eventId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const result: { error?: string } = await response.json();
      setError(result.error || '删除活动失败');
      return;
    }
    setEvents((current) => current.filter((event) => event.id !== eventId));
  };

  const preparingCount = events.filter((event) => event.status === 'preparing').length;
  const ongoingCount = events.filter((event) => event.status === 'ongoing').length;
  const completedCount = events.filter((event) => event.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">活动管理</h1>
          <p className="text-muted-foreground">管理活动的全生命周期</p>
        </div>
        <Button asChild>
          <Link href="/events/new">
            <Plus className="mr-2 h-4 w-4" />
            创建活动
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">全部活动</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">筹备中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{preparingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">进行中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{ongoingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">已完成</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索活动名称..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="pending">待筹备</SelectItem>
                <SelectItem value="preparing">筹备中</SelectItem>
                <SelectItem value="ongoing">进行中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="archived">已归档</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="类型筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="annual_meeting">年会</SelectItem>
                <SelectItem value="product_launch">发布会</SelectItem>
                <SelectItem value="seminar">研讨会</SelectItem>
                <SelectItem value="appreciation">答谢会</SelectItem>
                <SelectItem value="training">培训</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => void loadEvents()}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>活动列表</CardTitle>
          <CardDescription>共 {filteredEvents.length} 个活动</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">正在加载活动...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">暂无活动，请先创建活动</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>活动名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>地点</TableHead>
                  <TableHead>嘉宾</TableHead>
                  <TableHead>进度</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  const progress = getProgress(event);
                  const guestCount = event.guests?.[0]?.count ?? event.actual_guests ?? 0;

                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="font-medium">{event.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{eventTypeMap[event.type] || event.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={eventStatusMap[event.status]?.variant || 'outline'}>
                          {eventStatusMap[event.status]?.label || event.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {event.start_time}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-[150px] items-center gap-1 truncate text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {event.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {guestCount}/{event.expected_guests}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-2 w-[60px]" />
                          <span className="text-xs text-muted-foreground">{progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/events/${event.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                查看详情
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/events/${event.id}?edit=true`}>
                                <Edit className="mr-2 h-4 w-4" />
                                编辑
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => void handleDelete(event.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
