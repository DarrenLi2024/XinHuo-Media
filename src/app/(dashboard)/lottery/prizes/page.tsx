'use client';

// 大屏抽奖系统 - 奖项管理
//
// 奖项创建/编辑/删除/排序，配置等级、数量、单次抽取、是否重复、奖品图/赞助商/价值。

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Edit3, Gift, ArrowUp, ArrowDown } from 'lucide-react';
import { LotteryAdminShell } from '@/components/lottery/admin-shell';
import { useLotteryEvent } from '@/hooks/use-lottery-event';
import {
  getAllPrizes,
  getAllDrawRecords,
  createPrize,
  updatePrize,
  deletePrize,
  type PrizeInput,
} from '@/lib/lottery/db';
import { DrawEngine } from '@/lib/lottery/draw-engine';
import { LEVEL_NAMES, levelName } from '@/lib/lottery/theme';
import { broadcastLotteryChange } from '@/lib/lottery/sync';
import type { Prize, DrawRecord } from '@/lib/lottery/db/types';

const emptyForm = {
  name: '',
  prizeName: '',
  level: 2,
  quantity: 1,
  drawCount: 1,
  allowRepeat: false,
  value: '',
  sponsor: '',
  image: '',
  description: '',
};

export default function PrizesPage() {
  const { events, eventId, setEventId } = useLotteryEvent();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [records, setRecords] = useState<DrawRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    if (!eventId) return;
    const [p, r] = await Promise.all([getAllPrizes(eventId), getAllDrawRecords(eventId)]);
    setPrizes(p);
    setRecords(r);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (p: Prize) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      prizeName: p.prizeName,
      level: p.level,
      quantity: p.quantity,
      drawCount: p.drawCount,
      allowRepeat: p.allowRepeat,
      value: p.value,
      sponsor: p.sponsor,
      image: p.image,
      description: p.description,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !eventId) return;
    const sanitized = {
      ...form,
      quantity: Math.max(1, Math.floor(form.quantity) || 1),
      drawCount: Math.max(1, Math.floor(form.drawCount) || 1),
    };
    if (editingId) {
      await updatePrize(editingId, sanitized);
    } else {
      await createPrize(eventId, sanitized as PrizeInput);
    }
    broadcastLotteryChange(eventId, 'prizes');
    setDialogOpen(false);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm('确定删除该奖项？相关中奖记录不会自动删除。')) return;
    await deletePrize(id);
    broadcastLotteryChange(eventId, 'prizes');
    await load();
  };

  // 调整排序：与相邻奖项交换 order
  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= prizes.length) return;
    const a = prizes[index];
    const b = prizes[target];
    await Promise.all([updatePrize(a.id, { order: b.order }), updatePrize(b.id, { order: a.order })]);
    broadcastLotteryChange(eventId, 'prizes');
    await load();
  };

  return (
    <LotteryAdminShell
      title="奖项管理"
      description="等级 · 数量 · 抽取规则 · 排序"
      events={events}
      eventId={eventId}
      onEventChange={setEventId}
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          添加奖项
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            奖项列表（{prizes.length}）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">排序</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>奖项</TableHead>
                <TableHead>奖品</TableHead>
                <TableHead>总数</TableHead>
                <TableHead>剩余</TableHead>
                <TableHead>单次抽</TableHead>
                <TableHead>可重复</TableHead>
                <TableHead>赞助商</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prizes.map((p, index) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => void move(index, -1)}>
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={index === prizes.length - 1}
                        onClick={() => void move(index, 1)}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge>{levelName(p.level)}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.prizeName || '-'}</TableCell>
                  <TableCell>{p.quantity}</TableCell>
                  <TableCell>
                    <Badge variant={DrawEngine.getRemaining(p, records) > 0 ? 'default' : 'destructive'}>
                      {DrawEngine.getRemaining(p, records)}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.drawCount}</TableCell>
                  <TableCell>{p.allowRepeat ? '是' : '否'}</TableCell>
                  <TableCell>{p.sponsor || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => void remove(p.id)}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {prizes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                    暂无奖项，点击右上角「添加奖项」
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑奖项' : '添加奖项'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>奖项名称 *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如 一等奖" />
              </div>
              <div className="space-y-2">
                <Label>奖品名称</Label>
                <Input value={form.prizeName} onChange={(e) => setForm({ ...form, prizeName: e.target.value })} placeholder="如 iPhone 15 Pro" />
              </div>
              <div className="space-y-2">
                <Label>等级</Label>
                <Select value={String(form.level)} onValueChange={(v) => setForm({ ...form, level: Number(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEVEL_NAMES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>总数量</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>单次抽取人数</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.drawCount}
                  onChange={(e) => setForm({ ...form, drawCount: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>奖品价值</Label>
                <Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="￥0" />
              </div>
              <div className="space-y-2">
                <Label>赞助商</Label>
                <Input value={form.sponsor} onChange={(e) => setForm({ ...form, sponsor: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>奖品图片 URL</Label>
                <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>奖项描述</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>允许重复中奖</Label>
              <Switch checked={form.allowRepeat} onCheckedChange={(v) => setForm({ ...form, allowRepeat: v })} />
            </div>
            <Button className="w-full" onClick={() => void save()}>
              {editingId ? '保存修改' : '创建奖项'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </LotteryAdminShell>
  );
}
