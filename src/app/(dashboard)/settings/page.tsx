'use client';

import { useState } from 'react';
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
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';

export default function SettingsPage() {
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('zh-CN');

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
      <Tabs defaultValue="general">
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
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>默认启用签到系统</Label>
                  <p className="text-sm text-muted-foreground">新创建活动默认开启签到功能</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>默认启用智能排座</Label>
                  <p className="text-sm text-muted-foreground">新创建活动默认开启排座功能</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>默认启用抽奖系统</Label>
                  <p className="text-sm text-muted-foreground">新创建活动默认开启抽奖功能</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>默认启用复盘报告</Label>
                  <p className="text-sm text-muted-foreground">活动结束后自动生成复盘报告</p>
                </div>
                <Switch defaultChecked />
              </div>
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
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input id="name" defaultValue="管理员" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input id="email" defaultValue="admin@xinhuo.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">手机号</Label>
                  <Input id="phone" defaultValue="138-0000-0000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">所属公司</Label>
                  <Input id="company" defaultValue="芯火传媒" />
                </div>
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
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>任务提醒</Label>
                  <p className="text-sm text-muted-foreground">任务截止前自动发送提醒</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>活动状态更新通知</Label>
                  <p className="text-sm text-muted-foreground">活动状态变更时发送通知</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>签到异常提醒</Label>
                  <p className="text-sm text-muted-foreground">签到数据异常时发送警报</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>邮件通知</Label>
                  <p className="text-sm text-muted-foreground">通过邮件接收重要通知</p>
                </div>
                <Switch />
              </div>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                API 密钥管理
              </CardTitle>
              <CardDescription>管理系统 API 密钥</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>LLM API Key</Label>
                  <p className="text-sm text-muted-foreground">用于 AI 智能排座、报告生成等功能</p>
                </div>
                <Button variant="outline" size="sm">配置密钥</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>存储服务密钥</Label>
                  <p className="text-sm text-muted-foreground">用于文件上传和存储</p>
                </div>
                <Button variant="outline" size="sm">配置密钥</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}