'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, QrCode, BarChart3, Shield, Zap, ArrowRight } from 'lucide-react';

export default function CheckinHomePage() {
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    notCheckedIn: 0,
  });

  useEffect(() => {
    // 获取统计数据
    fetch('/api/checkin/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">活动签到系统</h1>
              <p className="text-sm text-gray-500">高效、简洁的签到管理</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/checkin/admin">
              <Button variant="outline" size="sm">
                管理后台
              </Button>
            </Link>
            <Link href="/checkin/entry">
              <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600">
                签到入口
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            专业活动签到解决方案
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            支持 600 人规模活动 · 实时统计 · 云端存储
          </p>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            <Card className="bg-white/60 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-500 mt-1">总人数</div>
              </CardContent>
            </Card>
            <Card className="bg-white/60 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600">{stats.checkedIn}</div>
                <div className="text-sm text-gray-500 mt-1">已签到</div>
              </CardContent>
            </Card>
            <Card className="bg-white/60 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-orange-600">{stats.notCheckedIn}</div>
                <div className="text-sm text-gray-500 mt-1">未签到</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Entry Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Admin Entry */}
          <Card className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-2 hover:border-blue-500">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                <Users className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <CardTitle className="text-xl">管理后台</CardTitle>
              <CardDescription>
                导入名单、管理嘉宾、查看统计
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/checkin/admin">
                <Button className="w-full group-hover:bg-blue-600 transition-colors">
                  进入管理后台
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Checkin Entry */}
          <Card className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-2 hover:border-purple-500">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500 transition-colors">
                <QrCode className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <CardTitle className="text-xl">签到入口</CardTitle>
              <CardDescription>
                扫码签到、搜索签到
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/checkin/entry">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 group-hover:from-purple-600 group-hover:to-pink-600 transition-colors">
                  进入签到入口
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white/50 backdrop-blur-sm py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">
            核心功能特性
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Shield className="w-8 h-8 text-blue-600 mb-4" />
                <h4 className="font-semibold mb-2">安全可靠</h4>
                <p className="text-sm text-gray-500">
                  数据云端存储，多重备份保障，确保数据安全不丢失
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Zap className="w-8 h-8 text-purple-600 mb-4" />
                <h4 className="font-semibold mb-2">高效便捷</h4>
                <p className="text-sm text-gray-500">
                  扫码即签，秒级响应，支持批量导入名单
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <BarChart3 className="w-8 h-8 text-green-600 mb-4" />
                <h4 className="font-semibold mb-2">实时统计</h4>
                <p className="text-sm text-gray-500">
                  签到数据实时更新，多维度统计分析
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>芯火会务管理系统 · 活动签到模块</p>
          <p className="mt-2">支持 600 人规模活动 · 实时统计 · 云端存储</p>
        </div>
      </footer>
    </div>
  );
}