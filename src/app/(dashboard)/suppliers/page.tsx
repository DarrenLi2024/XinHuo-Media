'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Truck,
  Star,
  Plus,
  Search,
  Filter,
  Phone,
  Building,
  Award,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';

type Supplier = {
  id: string;
  name: string;
  category: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  rating: number;
  cooperation_count: number;
  status: string;
};

const categoryConfig: Record<string, { label: string; className: string }> = {
  venue: { label: '场地', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  equipment: { label: '设备', className: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  printing: { label: '印刷', className: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  catering: { label: '餐饮', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  decoration: { label: '装饰', className: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
  photography: { label: '摄影', className: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  other: { label: '其他', className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
};

const supplierStatusConfig: Record<string, { label: string; className: string }> = {
  active: { label: '合作中', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  inactive: { label: '暂停合作', className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  blacklisted: { label: '黑名单', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('suppliers');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: 'venue',
    contact: '',
    phone: '',
    email: '',
    address: '',
    description: '',
  });

  const loadSuppliers = useCallback(async () => {
    setError('');
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (categoryFilter !== 'all') params.set('category', categoryFilter);

    try {
      const response = await fetch(`/api/suppliers?${params.toString()}`, { credentials: 'include' });
      const result: { data?: Supplier[]; error?: string } = await response.json();
      if (!response.ok || !result.data) {
        throw new Error(result.error || '供应商加载失败');
      }
      setSuppliers(result.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '供应商加载失败');
    }
  }, [categoryFilter, searchQuery]);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  const activeSuppliers = suppliers.filter((supplier) => supplier.status === 'active').length;
  const averageRating = useMemo(() => {
    if (suppliers.length === 0) return '0.0';
    return (suppliers.reduce((sum, supplier) => sum + supplier.rating, 0) / suppliers.length).toFixed(1);
  }, [suppliers]);

  const createSupplier = async () => {
    if (!form.name.trim()) {
      setError('供应商名称不能为空');
      return;
    }

    const response = await fetch('/api/suppliers', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const result: { data?: Supplier; error?: string } = await response.json();
    if (!response.ok || !result.data) {
      setError(result.error || '供应商创建失败');
      return;
    }

    setForm({ name: '', category: 'venue', contact: '', phone: '', email: '', address: '', description: '' });
    setDialogOpen(false);
    await loadSuppliers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">供应商管理</h1>
          <p className="text-muted-foreground">管理供应商库，跟踪采购协作</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              添加供应商
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加供应商</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>供应商名称</Label>
                  <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>类型</Label>
                  <Select value={form.category} onValueChange={(category) => setForm({ ...form, category })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>联系人</Label>
                  <Input value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>电话</Label>
                  <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>邮箱</Label>
                  <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>地址</Label>
                  <Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>说明</Label>
                  <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                </div>
              </div>
              <Button className="w-full" onClick={() => void createSupplier()}>保存供应商</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{suppliers.length}</p>
                <p className="text-sm text-muted-foreground">供应商总数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{activeSuppliers}</p>
                <p className="text-sm text-muted-foreground">合作中</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{suppliers.reduce((sum, supplier) => sum + supplier.cooperation_count, 0)}</p>
                <p className="text-sm text-muted-foreground">合作次数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{averageRating}</p>
                <p className="text-sm text-muted-foreground">平均评分</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索供应商名称、联系人..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="类型筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => void loadSuppliers()}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <Card className="border-destructive/30"><CardContent className="py-4 text-sm text-destructive">{error}</CardContent></Card>}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="suppliers">供应商库</TabsTrigger>
          <TabsTrigger value="orders">采购订单</TabsTrigger>
          <TabsTrigger value="evaluation">供应商评价</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>供应商列表</CardTitle>
              <CardDescription>共 {suppliers.length} 个供应商</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>供应商名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>联系人</TableHead>
                    <TableHead>联系方式</TableHead>
                    <TableHead>评分</TableHead>
                    <TableHead>合作次数</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">
                        <div>{supplier.name}</div>
                        {supplier.description && <div className="text-xs text-muted-foreground">{supplier.description}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge className={categoryConfig[supplier.category]?.className || categoryConfig.other.className}>
                          {categoryConfig[supplier.category]?.label || supplier.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{supplier.contact || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {supplier.phone || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          <span>{supplier.rating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{supplier.cooperation_count} 次</TableCell>
                      <TableCell>
                        <Badge className={supplierStatusConfig[supplier.status]?.className || supplierStatusConfig.inactive.className}>
                          {supplierStatusConfig[supplier.status]?.label || supplier.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <ShoppingBag className="h-4 w-4" />
              采购订单 API 尚未定义，已保留入口
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation">
          <Card>
            <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
              供应商评价将基于真实合作记录生成
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
