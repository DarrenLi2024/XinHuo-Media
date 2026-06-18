# 签到系统 - 功能模块详细设计

> **模块编号**：M04  
> **优先级**：P0  
> **负责人**：前后端开发工程师  
> **创建日期**：2025-01-15

---

## 一、模块概述

### 1.1 功能定位

签到系统是活动现场的核心功能模块，提供多种签到方式（二维码扫码、手动签到、人脸识别），实时统计签到数据，并支持签到大屏展示，确保活动签到高效、有序。

### 1.2 核心价值

| 价值点 | 描述 |
|--------|------|
| **高效签到** | 扫码签到秒级完成，无需排队 |
| **实时数据** | 签到数据实时统计，同步大屏 |
| **多种方式** | 支持扫码、手动、人脸等多种签到方式 |
| **大屏展示** | 签到头像滚动、数据可视化展示 |

---

## 二、功能架构

```
┌─────────────────────────────────────────────────────────────┐
│                       签到系统                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   签到方式层                          │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐       │   │
│  │  │ 二维码    │  │ 手动签到   │  │ 人脸识别   │       │   │
│  │  │  扫码    │  │  补签     │  │  签到     │       │   │
│  │  └───────────┘  └───────────┘  └───────────┘       │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                  │
│                         ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   数据处理层                          │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐       │   │
│  │  │ 嘉宾验证   │  │ 状态更新   │  │ 数据存储   │       │   │
│  │  │  识别     │  │  同步     │  │  记录     │       │   │
│  │  └───────────┘  └───────────┘  └───────────┘       │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                  │
│                         ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   展示同步层                          │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐       │   │
│  │  │ 签到大屏   │  │ 统计数据   │  │ WebSocket │       │   │
│  │  │  展示     │  │  计算     │  │  同步     │       │   │
│  │  └───────────┘  └───────────┘  └───────────┘       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、功能清单

### 3.1 签到准备功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S04-01 | 签到二维码生成 | 生成活动专属签到二维码 | P0 |
| S04-02 | 签到点设置 | 设置多个签到点（正门、VIP通道等） | P1 |
| S04-03 | 签到时间设置 | 设置签到开始/结束时间 | P0 |
| S04-04 | 签到规则设置 | 设置是否允许重复签到、签到范围等 | P0 |
| S04-05 | 签到大屏配置 | 配置大屏展示样式、动画效果 | P0 |

### 3.2 签到操作功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S04-06 | 扫码签到 | 嘉宾扫描二维码完成签到 | P0 |
| S04-07 | 手动签到 | 工作人员手动帮嘉宾签到 | P0 |
| S04-08 | 人脸签到 | 人脸识别自动签到（可选） | P2 |
| S04-09 | 补签功能 | 为未扫码的嘉宾补签 | P1 |
| S04-10 | 取消签到 | 取消已签到嘉宾的签到状态 | P1 |
| S04-11 | 签到失败处理 | 签到失败时的提示和处理流程 | P0 |
| S04-12 | 重复签到提示 | 已签到嘉宾再次扫码提示 | P0 |

### 3.3 签到大屏功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S04-13 | 签到头像滚动 | 实时滚动展示签到嘉宾头像 | P0 |
| S04-14 | 签到数据统计 | 显示签到人数、签到率等 | P0 |
| S04-15 | VIP签到展示 | VIP嘉宾签到特效展示 | P1 |
| S04-16 | 签到动画效果 | 签到时的动画效果（烟花、气泡等） | P1 |
| S04-17 | 大屏主题配置 | 可配置大屏主题风格 | P1 |
| S04-18 | 签到历史展示 | 展示最近签到的嘉宾列表 | P0 |

### 3.4 签到统计功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S04-19 | 实时签到率 | 实时计算签到率 | P0 |
| S04-20 | VIP签到统计 | VIP嘉宾签到情况统计 | P0 |
| S04-21 | 分组签到统计 | 各分组签到情况统计 | P1 |
| S04-22 | 时间分布统计 | 各时段签到人数统计 | P1 |
| S04-23 | 签到点统计 | 各签到点签到人数统计 | P1 |

### 3.5 签到记录功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S04-24 | 签到记录查询 | 查询签到记录列表 | P0 |
| S04-25 | 签到记录导出 | 导出签到数据Excel | P0 |
| S04-26 | 签到记录详情 | 查看签到详细信息 | P0 |
| S04-27 | 未签到嘉宾查询 | 查询未签到嘉宾列表 | P0 |

### 3.6 签到提醒功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S04-28 | 未签到提醒 | 向未签到嘉宾发送提醒 | P2 |
| S04-29 | 签到成功通知 | 签到成功后通知嘉宾座位信息 | P1 |
| S04-30 | 签到异常通知 | 签到异常时通知工作人员 | P1 |

---

## 四、界面设计

### 4.1 签到大屏界面

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                     ┌─────────────────────────────┐                        │
│                     │      2025年度盛典            │                        │
│                     │      现场签到                │                        │
│                     └─────────────────────────────┘                        │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │  签到统计                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │   │
│  │  │ 应到人数     │  │ 实到人数     │  │ 签到率      │               │   │
│  │  │             │  │             │  │             │               │   │
│  │  │    500      │  │    350      │  │    70%     │               │   │
│  │  │             │  │             │  │             │               │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────┐ │   │
│  │  │  VIP签到: 45/50 (90%)                                       │ │   │
│  │  │  普通嘉宾签到: 305/450 (68%)                                 │ │   │
│  │  └─────────────────────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │  签到头像滚动                                                       │   │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│   │
│  │  │ 张三 │ │ 李四 │ │ 王五 │ │ 赵六 │ │ 孙七 │ │ 周八 │ │ 吴九 │ │ 郑十 ││   │
│  │  │ VIP │ │ VIP │ │      │ │      │ │      │ │      │ │      │ │      ││   │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘│   │
│  │                                                                   │   │
│  │  芯片公司A          芯片公司B          芯片公司C                   │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────┐ │   │
│  │  │ 最近签到: 张三 | 李四 | 王五 | 赵六 | 孙七 | 周八 | 吴九     │ │   │
│  │  └─────────────────────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │  签到时间分布                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐ │   │
│  │  │ 09:00-09:15 ████████████ 150人                               │ │   │
│  │  │ 09:15-09:30 █████████ 100人                                  │ │   │
│  │  │ 09:30-09:45 ████████ 80人                                    │ │   │
│  │  │ 09:45-10:00 ██████ 20人                                      │ │   │
│  │  └─────────────────────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 签到操作界面（嘉宾端）

```
┌─────────────────────────────────────────┐
│                                         │
│         ┌─────────────────────┐        │
│         │                     │        │
│         │    签到二维码区域    │        │
│         │                     │        │
│         │    ┌───────────┐   │        │
│         │    │ [扫描]    │   │        │
│         │    └───────────┘   │        │
│         │                     │        │
│         └─────────────────────┘        │
│                                         │
│  提示：请将二维码对准扫描框             │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  签到成功！                        │ │
│  │                                    │ │
│  │  姓名：张三                        │ │
│  │  公司：芯片公司A                   │ │
│  │  座位：VIP桌 T1-1                  │ │
│  │                                    │ │
│  │  签到时间：09:05:30               │ │
│  │                                    │ │
│  │  [查看座位图] [返回首页]           │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### 4.3 签到管理界面（工作人员端）

```
┌─────────────────────────────────────────────────────────────────────┐
│  签到管理                              [活动] [签到点] [导出数据]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  签到二维码                                                    │   │
│  │  ┌───────────┐  有效期至: 2025-02-15 18:00                   │   │
│  │  │  [二维码] │  签到点: 正门入口                               │   │
│  │  │           │  [重新生成] [下载打印]                         │   │
│  │  └───────────┘                                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  签到统计                                                      │ │
│  │  总签到率: 70%  VIP签到率: 90%  今日签到: 350人                │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 正门入口: 300人 (86%)  VIP通道: 50人 (14%)               │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  手动签到                                                      │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 搜索嘉宾: [输入姓名/手机号...]                [搜索]     │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 张三  芯片公司A  CEO  VIP3  状态: 已签到 ✅               │ │ │
│  │  │ 李四  芯片公司B  总监 VIP2  状态: 未签到 [手动签到]      │ │ │
│  │  │ 王五  芯片公司C  经理       状态: 未签到 [手动签到]      │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  签到记录                                                      │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 姓名    公司        签到时间    签到点    操作人         │ │ │
│  │  │ 张三    芯片公司A   09:05:30   正门      自动           │ │ │
│  │  │ 李四    芯片公司B   09:10:15   VIP通道   自动           │ │ │
│  │  │ 王五    芯片公司C   09:08:00   正门      手动(张三)     │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │  [导出Excel] [查看全部]                                        │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 五、技术实现要点

### 5.1 WebSocket 实时同步

```typescript
// WebSocket 服务端
import { WebSocketServer, WebSocket } from 'ws';

class CheckInWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket[]> = new Map();
  
  constructor() {
    this.wss = new WebSocketServer({ port: 8080 });
    this.setupHandlers();
  }
  
  private setupHandlers() {
    this.wss.on('connection', (ws, req) => {
      const eventId = this.getEventId(req);
      
      // 将客户端加入对应活动的房间
      if (!this.clients.has(eventId)) {
        this.clients.set(eventId, []);
      }
      this.clients.get(eventId)!.push(ws);
      
      ws.on('close', () => {
        const clients = this.clients.get(eventId);
        if (clients) {
          const index = clients.indexOf(ws);
          if (index !== -1) {
            clients.splice(index, 1);
          }
        }
      });
    });
  }
  
  // 广播签到事件
  broadcastCheckIn(eventId: string, data: CheckInData) {
    const clients = this.clients.get(eventId);
    if (!clients) return;
    
    const message = JSON.stringify({
      type: 'CHECK_IN',
      payload: data,
      timestamp: new Date()
    });
    
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  // 广播统计数据更新
  broadcastStatsUpdate(eventId: string, stats: CheckInStats) {
    const clients = this.clients.get(eventId);
    if (!clients) return;
    
    const message = JSON.stringify({
      type: 'STATS_UPDATE',
      payload: stats,
      timestamp: new Date()
    });
    
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// 客户端连接
class CheckInWebSocketClient {
  private ws: WebSocket;
  private eventId: string;
  
  connect(eventId: string) {
    this.eventId = eventId;
    this.ws = new WebSocket(`${WS_URL}?event=${eventId}`);
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }
  
  handleMessage(message: any) {
    switch (message.type) {
      case 'CHECK_IN':
        this.addRecentCheckIn(message.payload);
        this.playCheckInAnimation();
        break;
      case 'STATS_UPDATE':
        this.updateStats(message.payload);
        break;
    }
  }
  
  addRecentCheckIn(data: CheckInData) {
    // 添加到签到头像列表
    const recentList = document.getElementById('recent-check-ins');
    const avatar = createAvatarElement(data);
    
    // 滚动动画
    recentList!.prepend(avatar);
    setTimeout(() => {
      avatar.classList.add('fade-in');
    }, 100);
    
    // 保持列表数量限制
    while (recentList!.children.length > 20) {
      recentList!.lastChild?.remove();
    }
  }
  
  playCheckInAnimation() {
    // VIP签到特效
    if (this.currentCheckIn.vipLevel > 0) {
      playVIPAnimation();
    } else {
      playNormalAnimation();
    }
  }
  
  updateStats(stats: CheckInStats) {
    // 更新统计数据显示
    document.getElementById('total-guests')!.textContent = stats.totalGuests;
    document.getElementById('checked-in')!.textContent = stats.checkedIn;
    document.getElementById('check-in-rate')!.textContent = `${stats.checkInRate}%`;
    
    // 更新进度条
    const progressBar = document.getElementById('progress-bar');
    progressBar!.style.width = `${stats.checkInRate}%`;
  }
}
```

### 5.2 签到数据处理

```typescript
// 签到服务
class CheckInService {
  async checkIn(data: CheckInRequest): Promise<CheckInResult> {
    // 1. 验证嘉宾身份
    const guest = await this.verifyGuest(data.eventCode, data.guestId);
    if (!guest) {
      return { success: false, error: '嘉宾信息不存在' };
    }
    
    // 2. 检查是否已签到
    if (guest.checkInStatus) {
      return { 
        success: false, 
        error: '已签到',
        guest: guest 
      };
    }
    
    // 3. 更新签到状态
    await this.updateGuestStatus(guest.id, {
      checkInStatus: true,
      checkInTime: new Date(),
      checkInMethod: data.method,
      checkInPoint: data.checkInPoint
    });
    
    // 4. 创建签到记录
    await this.createCheckInRecord({
      eventId: guest.eventId,
      guestId: guest.id,
      checkInTime: new Date(),
      checkInMethod: data.method,
      checkInPoint: data.checkInPoint,
      deviceInfo: data.deviceInfo
    });
    
    // 5. 更新统计数据
    const stats = await this.calculateStats(guest.eventId);
    
    // 6. 广播签到事件
    this.broadcastCheckIn(guest.eventId, {
      guestId: guest.id,
      name: guest.name,
      company: guest.company,
      avatar: guest.avatar,
      vipLevel: guest.vipLevel,
      checkInTime: new Date()
    });
    
    // 7. 广播统计更新
    this.broadcastStatsUpdate(guest.eventId, stats);
    
    return {
      success: true,
      guest: guest,
      seatInfo: await this.getSeatInfo(guest.id)
    };
  }
  
  async calculateStats(eventId: string): Promise<CheckInStats> {
    const guests = await this.getGuests(eventId);
    const totalGuests = guests.length;
    const checkedIn = guests.filter(g => g.checkInStatus).length;
    const vipGuests = guests.filter(g => g.vipLevel > 0);
    const vipCheckedIn = vipGuests.filter(g => g.checkInStatus).length;
    
    // 计算时间分布
    const checkInRecords = await this.getCheckInRecords(eventId);
    const timeDistribution = this.calculateTimeDistribution(checkInRecords);
    
    return {
      totalGuests,
      checkedIn,
      checkInRate: Math.round((checkedIn / totalGuests) * 100),
      vipTotal: vipGuests.length,
      vipCheckedIn,
      vipCheckInRate: Math.round((vipCheckedIn / vipGuests.length) * 100),
      timeDistribution,
      recentCheckIns: checkInRecords.slice(-20).reverse()
    };
  }
  
  calculateTimeDistribution(records: CheckInRecord[]): TimeDistribution {
    const distribution: Record<string, number> = {};
    
    for (const record of records) {
      const hour = formatTime(record.checkInTime, 'HH:mm');
      const slot = `${hour.split(':')[0]}:${parseInt(hour.split(':')[1]) < 30 ? '00' : '30'}`;
      
      distribution[slot] = (distribution[slot] || 0) + 1;
    }
    
    return distribution;
  }
}
```

### 5.3 大屏动画效果

```typescript
// 大屏动画效果
class CheckInScreenAnimations {
  // VIP签到特效
  playVIPAnimation(guest: Guest) {
    // 烟花效果
    this.createFireworks();
    
    // VIP标识动画
    this.showVIPBadge(guest);
    
    // 播放音效
    this.playVIPSound();
  }
  
  // 普通签到特效
  playNormalAnimation(guest: Guest) {
    // 气泡动画
    this.createBubbleEffect();
    
    // 头像放大动画
    this.animateAvatar(guest);
    
    // 播放音效
    this.playCheckInSound();
  }
  
  // 头像滚动动画
  scrollAvatars(newGuest: Guest) {
    const container = document.getElementById('avatar-scroll');
    const newAvatar = this.createAvatarCard(newGuest);
    
    // 添加新头像
    container!.prepend(newAvatar);
    
    // CSS动画
    newAvatar.classList.add('slide-in');
    
    // 移除超出数量的头像
    while (container!.children.length > MAX_AVATARS) {
      const last = container!.lastElementChild;
      last?.classList.add('slide-out');
      setTimeout(() => last?.remove(), 500);
    }
  }
  
  // 烟花效果
  createFireworks() {
    const canvas = document.getElementById('fireworks-canvas');
    const ctx = canvas?.getContext('2d');
    
    // 创建烟花粒子
    const particles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color: this.getRandomColor(),
        life: 100
      });
    }
    
    // 动画循环
    const animate = () => {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      
      for (const p of particles) {
        if (p.life > 0) {
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx!.fillStyle = p.color;
          ctx!.fill();
          
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
        }
      }
      
      if (particles.some(p => p.life > 0)) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
}
```

---

## 六、签到流程设计

### 6.1 扫码签到流程

```
嘉宾扫描二维码
    │
    ▼
┌─────────────┐
│ 解析二维码   │
│ 获取活动ID  │
└─────────────┘
    │
    ▼
┌─────────────┐
│ 查询嘉宾信息 │
│ (手机号匹配) │
└─────────────┘
    │
    ├─ 未找到 ──▶ 显示错误提示
    │
    ▼ 找到嘉宾
┌─────────────┐
│ 检查签到状态 │
└─────────────┘
    │
    ├─ 已签到 ──▶ 显示已签到提示 + 座位信息
    │
    ▼ 未签到
┌─────────────┐
│ 更新签到状态 │
│ 创建签到记录 │
└─────────────┘
    │
    ▼
┌─────────────┐
│ WebSocket   │
│ 广播签到事件 │
└─────────────┘
    │
    ▼
┌─────────────┐
│ 显示签到成功 │
│ + 座位信息   │
└─────────────┘
```

---

## 七、性能优化

### 7.1 高并发处理

| 场景 | 优化策略 |
|------|----------|
| 大量同时签到 | 使用消息队列异步处理 |
| WebSocket 连接 | 连接池管理，限制单活动连接数 |
| 大屏渲染 | Canvas 分层渲染，离屏缓存 |
| 数据查询 | Redis 缓存热点数据 |

### 7.2 离线签到支持

```typescript
// 离线签到模式
class OfflineCheckIn {
  private pendingQueue: CheckInRequest[] = [];
  
  // 保存待处理的签到请求
  savePending(data: CheckInRequest) {
    this.pendingQueue.push(data);
    localStorage.setItem('pendingCheckIns', JSON.stringify(this.pendingQueue));
  }
  
  // 网络恢复后批量提交
  async syncPending() {
    const pending = JSON.parse(localStorage.getItem('pendingCheckIns') || '[]');
    
    for (const data of pending) {
      try {
        await checkInService.checkIn(data);
      } catch (e) {
        // 失败的保留
        this.pendingQueue.push(data);
      }
    }
    
    localStorage.setItem('pendingCheckIns', JSON.stringify(this.pendingQueue));
  }
}
```

---

## 八、测试要点

### 8.1 功能测试

| 测试场景 | 验证点 |
|----------|--------|
| 扫码签到 | 正常签到、已签到提示、嘉宾不存在 |
| 手动签到 | 搜索嘉宾、手动签到、补签 |
| 大屏同步 | WebSocket 连接、签到事件实时同步 |
| 统计数据 | 签到率计算、时间分布统计 |

### 8.2 性能测试

| 测试场景 | 性能指标 |
|----------|----------|
| 1000人同时签到 | 处理时间 < 5s |
| WebSocket 连接 | 支持 100+ 并发连接 |
| 大屏渲染 | 刷新延迟 < 100ms |
| 统计计算 | 更新延迟 < 1s |

---

> **模块负责人**：前后端开发工程师  
> **最后更新**：2025-01-15