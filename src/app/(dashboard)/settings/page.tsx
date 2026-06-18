'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/tabs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Globe,
  Key,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

type LLMKeyStatus = {
  configured: boolean;
  hint: string;
};

export default function SettingsPage() {
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('zh-CN');

  // LLM Key 管理状态
  const [llmKeyStatus, setLlmKeyStatus] = useState<LLMKeyStatus | null>(null);
  const [llmKeyLoading, setLlmKeyLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; message: string } | null>(null);

  const fetchKeyStatus = useCallback(async () => {
    setLlmKeyLoading(true);
    try {
      const res = await fetch('/api/settings/llm-key');
      if (res.ok) {
        setLlmKeyStatus(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLlmKeyLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchKeyStatus();
  }, [fetchKeyStatus]);

  const handleVerifyKey = async () => {
    if (!apiKey.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch('/api/settings/llm-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: apiKey.trim() }),
      });
      const data = await res.json();
      setVerifyResult(data);
      if (res.ok && data.valid) {
        // 刷新状态
        await fetchKeyStatus();
      }
    } catch {
      setVerifyResult({ valid: false, message: '网络错误，请重试' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">系统设置</h1>
          <p className="text-muted-foreground">管理系统配置与偏好设置</p>
        </div>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          保存设置
        </Button>
      </div>

      {/* 设置 Tabs */}
      <Tabs defaultValue="system">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">基本设置</TabsTrigger>
          <TabsTrigger value="profile">个人资料</TabsTrigger>
          <TabsTrigger value="notification">通知设置</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
          <TabsTrigger value="system">系统配置</TabsTrigger>
        </TabsList>

        {/* 基本设置 */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                外观设置
              </CardTitle>
              <CardDescription>调整系统外观和显示偏好</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>主题模式</Label>
                  <p className="text-sm text-muted-foreground">选择系统显示主题</p>
                </div>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">浅色</SelectItem>
                    <SelectItem value="dark">深色</SelectItem>
                    <SelectItem value="system">跟随系统</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>语言设置</Label>
                  <p className="text-sm text-muted-foreground">选择系统显示语言</p>
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh-CN">简体中文</SelectItem>
                    <SelectItem value="en-US">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                默认配置
              </CardTitle>
              <CardDescription>设置活动默认配置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: '默认启用签到系统', desc: '新创建活动默认开启签到功能', checked: true },
                { label: '默认启用智能排座', desc: '新创建活动默认开启排座功能', checked: true },
                { label: '默认启用抽奖系统', desc: '新创建活动默认开启抽奖功能', checked: false },
                { label: '默认启用复盘报告', desc: '活动结束后自动生成复盘报告', checked: true },
              ].map((item, i, arr) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{item.label}</Label>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={item.checked} />
                  </div>
                  {i < arr.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 个人资料 */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                个人信息
              </CardTitle>
              <CardDescription>管理您的个人资料</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { id: 'name', label: '姓名', defaultValue: '管理员' },
                  { id: 'email', label: '邮箱', defaultValue: 'admin@xinhuo.com' },
                  { id: 'phone', label: '手机号', defaultValue: '138-0000-0000' },
                  { id: 'company', label: '所属公司', defaultValue: '芯火传媒' },
                ].map((f) => (
                  <div key={f.id} className="space-y-2">
                    <Label htmlFor={f.id}>{f.label}</Label>
                    <Input id={f.id} defaultValue={f.defaultValue} />
                  </div>
                ))}
              </div>
              <Button className="mt-4">更新资料</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知设置 */}
        <TabsContent value="notification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                通知偏好
              </CardTitle>
              <CardDescription>配置系统通知方式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: '任务提醒', desc: '任务截止前自动发送提醒', checked: true },
                { label: '活动状态更新通知', desc: '活动状态变更时发送通知', checked: true },
                { label: '签到异常提醒', desc: '签到数据异常时发送警报', checked: true },
                { label: '邮件通知', desc: '通过邮件接收重要通知', checked: false },
              ].map((item, i, arr) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{item.label}</Label>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={item.checked} />
                  </div>
                  {i < arr.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 安全设置 */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                安全配置
              </CardTitle>
              <CardDescription>管理账户安全设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>修改密码</Label>
                <div className="grid gap-2 md:grid-cols-3">
                  <Input type="password" placeholder="当前密码" />
                  <Input type="password" placeholder="新密码" />
                  <Input type="password" placeholder="确认新密码" />
                </div>
                <Button className="mt-2">更新密码</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>双因素认证</Label>
                  <p className="text-sm text-muted-foreground">启用双因素认证增强安全性</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>登录记录</Label>
                  <p className="text-sm text-muted-foreground">查看最近登录记录</p>
                </div>
                <Button variant="outline" size="sm">查看记录</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统配置 */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                数据库配置
              </CardTitle>
              <CardDescription>管理系统数据库连接</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>数据库状态</Label>
                  <p className="text-sm text-muted-foreground">Supabase PostgreSQL</p>
                </div>
                <Badge variant="default" className="bg-green-500">已连接</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>数据备份</Label>
                  <p className="text-sm text-muted-foreground">自动每日备份</p>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-1 h-3 w-3" />
                  手动备份
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ========== API 密钥管理 — 真实服务端联动 ========== */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                API 密钥管理
              </CardTitle>
              <CardDescription>
                管理第三方 API 密钥。密钥仅存储在服务端环境变量，前端不会泄露。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* DeepSeek API Key */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Label>DeepSeek API Key</Label>
                    {llmKeyLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : llmKeyStatus?.configured ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {llmKeyLoading
                      ? '查询中...'
                      : llmKeyStatus?.configured
                        ? 'DeepSeek V4 Flash + V4 Pro — 智能排座、报告生成'
                        : '未配置。用于 AI 智能排座、复盘报告生成、新闻通稿等功能'}
                  </p>
                  {llmKeyStatus?.configured && (
                    <p className="text-xs text-green-600 mt-1">模型：deepseek-reasoner (Pro) + deepseek-chat (Flash)</p>
                  )}
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant={llmKeyStatus?.configured ? 'outline' : 'default'} size="sm">
                      {llmKeyStatus?.configured ? '更换密钥' : '配置密钥'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>配置 DeepSeek API Key</DialogTitle>
                      <DialogDescription>
                        密钥仅用于验证，不会存储到数据库。
                        验证通过后，请在 Vercel 环境变量中添加 <code className="bg-muted px-1 py-0.5 rounded text-xs">DEEPSEEK_API_KEY</code>
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="api-key">API Key</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              id="api-key"
                              type={showKey ? 'text' : 'password'}
                              placeholder="sk-..."
                              value={apiKey}
                              onChange={(e) => {
                                setApiKey(e.target.value);
                                setVerifyResult(null);
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={() => setShowKey(!showKey)}
                            >
                              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          前往 <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="underline">platform.deepseek.com</a> 创建
                        </p>
                      </div>

                      {verifyResult && (
                        <div
                          className={`rounded-md p-3 text-sm ${
                            verifyResult.valid
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {verifyResult.valid ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              {verifyResult.message}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4" />
                              {verifyResult.message}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleVerifyKey} disabled={verifying || !apiKey.trim()}>
                        {verifying ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            验证中...
                          </>
                        ) : (
                          '验证密钥'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Separator />

              {/* 存储服务 — 由 Supabase 自带，无需额外配置 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label>文件存储</Label>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Supabase Storage — 文件上传与存储由 Supabase 内置提供
                  </p>
                </div>
                <Badge variant="secondary">Supabase 集成</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
