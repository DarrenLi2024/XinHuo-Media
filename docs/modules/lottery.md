# 抽奖系统 - 功能模块详细设计

> **模块编号**：M05  
> **优先级**：P0  
**负责人**：前后端开发工程师  
> **创建日期**：2025-01-15

---

## 一、模块概述

### 1.1 功能定位

抽奖系统是活动现场的核心互动功能，支持多种抽奖方式（随机抽奖、滚动抽奖、预设中奖），提供炫酷的抽奖大屏效果，确保抽奖过程公平、有趣、顺利。

### 1.2 核心价值

| 价值点 | 描述 |
|--------|------|
| **公平公正** | 真随机算法，抽奖结果不可预测 |
| **视觉效果** | 炫酷动画效果，提升活动氛围 |
| **灵活配置** | 支持多种抽奖方式，满足不同场景 |
| **实时同步** | 大屏与控制端实时同步 |

---

## 二、功能清单

### 2.1 奖品管理功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S05-01 | 奖品创建 | 创建奖品，设置名称、数量、等级等 | P0 |
| S05-02 | 奖品编辑 | 编辑奖品信息 | P0 |
| S05-03 | 奖品删除 | 删除未抽奖的奖品 | P0 |
| S05-04 | 奖品排序 | 调整奖品抽奖顺序 | P0 |
| S05-05 | 奖品图片 | 设置奖品展示图片 | P1 |
| S05-06 | 赞助商信息 | 设置奖品赞助商信息 | P1 |
| S05-07 | 奖品等级 | 设置奖品等级（特等奖、一等奖等） | P0 |

### 2.2 抽奖配置功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S05-08 | 参与条件设置 | 设置参与抽奖的条件（VIP专属、排除已中奖等） | P0 |
| S05-09 | 抽奖方式选择 | 选择抽奖方式（随机、滚动、预设） | P0 |
| S05-10 | 动画效果选择 | 选择抽奖动画效果（转盘、卡片、数字等） | P0 |
| S05-11 | 每次抽取数量 | 设置每次抽奖的中奖人数 | P0 |
| S05-12 | 预设中奖名单 | 设置预设中奖嘉宾名单 | P1 |

### 2.3 抽奖操作功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S05-13 | 开始抽奖 | 启动抽奖流程 | P0 |
| S05-14 | 暂停抽奖 | 暂停滚动动画 | P1 |
| S05-15 | 继续抽奖 | 继续抽奖流程 | P1 |
| S05-16 | 确认中奖 | 确认抽奖结果 | P0 |
| S05-17 | 取消中奖 | 取消当前中奖结果，重新抽奖 | P1 |
| S05-18 | 重置抽奖 | 重置奖品状态，重新开始 | P2 |

### 2.4 抽奖大屏功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S05-19 | 奖品展示 | 展示当前抽取的奖品信息 | P0 |
| S05-20 | 嘉宾滚动 | 滚动展示参与抽奖的嘉宾 | P0 |
| S05-21 | 中奖动画 | 中奖时的特效动画 | P0 |
| S05-22 | 中奖展示 | 展示中奖嘉宾信息 | P0 |
| S05-23 | 中奖名单 | 展示已中奖嘉宾列表 | P0 |

### 2.5 领奖管理功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S05-24 | 领奖状态更新 | 更新嘉宾领奖状态 | P0 |
| S05-25 | 领奖地点设置 | 设置领奖地点 | P1 |
| S05-26 | 领奖名单导出 | 导出中奖领奖名单 | P0 |

---

## 三、界面设计

### 3.1 抽奖大屏界面

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                     ┌─────────────────────────────┐                        │
│                     │    🎁 一等奖抽奖             │                        │
│                     │    iPhone 15 Pro (3名)      │                        │
│                     │    赞助商: 科技公司          │                        │
│                     └─────────────────────────────┘                        │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │  嘉宾滚动区域                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐ │   │
│  │  │                                                             │ │   │
│  │  │     ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐       │ │   │
│  │  │     │ 张三 │   │ 李四 │   │ 率五 │   │ 赵六 │   │ 孙七 │       │ │   │
│  │  │     └─────┘   └─────┘   └─────┘   └─────┘   └─────┘       │ │   │
│  │  │                                                             │ │   │
│  │  │         ↙  滚动方向  ↘                                       │ │   │
│  │  │                                                             │ │   │
│  │  │     ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐       │ │   │
│  │  │     │ 王八 │   │ 李九 │   │ 周十 │   │ 吴一 │   │ 郑二 │       │ │   │
│  │  │     └─────┘   └─────┘   └─────┘   └─────┘   └─────┘       │ │   │
│  │  │                                                             │ │   │
│  │  └─────────────────────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │  中奖结果                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │   │
│  │  │   🎉 中奖    │  │   🎉 中奖    │  │   🎉 中奖    │               │   │
│  │  │             │  │             │  │             │               │   │
│  │  │   张三      │  │   李四      │  │   王五      │               │   │
│  │  │  芯片公司A  │  │  芯片公司B  │  │  芯片公司C  │               │   │
│  │  │             │  │             │  │             │               │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘               │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │  已中奖名单                                                        │   │
│  │  一等奖: 张三、李四、王五                                          │   │
│  │  二等奖: 赵六、孙七                                                │   │
│  │  三等奖: 周八、吴九、郑十                                          │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 抽奖控制界面

```
┌─────────────────────────────────────────────────────────────────────┐
│  抽奖管理                              [活动] [奖品管理] [中奖记录]  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  奖品列表                                                    │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │ 特等奖 (0/1) [开始抽奖]                                │ │   │
│  │  │ 一等奖 (0/3) [开始抽奖]                                │ │   │
│  │  │ 二等奖 (0/5) [开始抽奖]                                │ │   │
│  │  │ 三等奖 (0/10) [开始抽奖]                               │ │   │
│  │  │ 幸运奖 (0/20) [开始抽奖]                               │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  │  [+ 添加奖品]                                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  当前抽奖                                                      │ │
│  │  奖品: 一等奖 iPhone 15 Pro                                   │ │
│  │  剩余数量: 3                                                   │ │
│  │  参与人数: 350                                                 │ │
│  │                                                             │ │
│  │  抽取数量: [ 1 ] [ 3 ] [ 5 ]                                  │ │
│  │                                                             │ │
│  │  [开始抽奖] [暂停] [确认结果] [取消重抽]                       │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  中奖结果                                                      │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 嘉宾      公司        奖品        领奖状态               │ │ │
│  │  │ 张三      芯片公司A   一等奖      未领取 [标记领取]      │ │ │
│  │  │ 李四      芯片公司B   一等奖      未领取 [标记领取]      │ │ │
│  │  │ 王五      芯片公司C   一等奖      已领取 ✓               │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │  [导出名单]                                                    │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  抽奖设置                                                      │ │
│  │  参与条件: ☑ 已签到嘉宾 ☐ VIP专属 ☑ 排除已中奖              │ │
│  │  抽奖方式: ○ 随机抽奖 ○ 滚动抽奖 ○ 预设中奖                  │ │
│  │  动画效果: ○ 默认 ○ 转盘 ○ 卡片翻转 ○ 数字滚动              │ │
│  │                                                             │ │
│  │  预设中奖名单:                                                │ │
│  │  [导入名单] [清空]                                            │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 四、抽奖算法设计

### 4.1 随机抽奖算法

```typescript
class LotteryEngine {
  // 随机抽奖（真随机）
  async randomDraw(
    eligibleGuests: Guest[], 
    count: number
  ): Promise<Guest[]> {
    // 使用加密安全的随机数生成器
    const winners: Guest[] = [];
    const pool = [...eligibleGuests];
    
    for (let i = 0; i < count && pool.length > 0; i++) {
      // 使用 crypto.getRandomValues 确保随机性
      const randomIndex = this.secureRandom(pool.length);
      winners.push(pool[randomIndex]);
      pool.splice(randomIndex, 1);  // 移除已中奖者
    }
    
    return winners;
  }
  
  // 安全随机数生成
  private secureRandom(max: number): number {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }
  
  // 滚动抽奖（带动画效果）
  async rollingDraw(
    eligibleGuests: Guest[],
    count: number,
    duration: number  // 滚动时长（毫秒）
  ): Promise<Guest[]> {
    // 滚动过程中随机显示嘉宾
    const startTime = Date.now();
    let currentIndex = 0;
    
    // 滚动动画回调
    const onRolling = (guests: Guest[]) => {
      // 每隔一定时间切换显示的嘉宾
      currentIndex = this.secureRandom(guests.length);
      return guests[currentIndex];
    };
    
    // 滚动结束后确定中奖者
    while (Date.now() - startTime < duration) {
      // 继续滚动
      await this.delay(100);
    }
    
    // 最终确定中奖者
    return this.randomDraw(eligibleGuests, count);
  }
  
  // 预设中奖
  presetDraw(
    presetGuestIds: string[],
    eligibleGuests: Guest[]
  ): Promise<Guest[]> {
    // 验证预设嘉宾是否在参与名单中
    const winners = presetGuestIds
      .map(id => eligibleGuests.find(g => g.id === id))
      .filter(g => g !== undefined);
    
    return Promise.resolve(winners as Guest[]);
  }
  
  // 获取符合条件的嘉宾
  getEligibleGuests(
    allGuests: Guest[],
    config: LotteryConfig
  ): Guest[] {
    let eligible = allGuests;
    
    // 已签到筛选
    if (config.requireCheckIn) {
      eligible = eligible.filter(g => g.checkInStatus);
    }
    
    // VIP专属筛选
    if (config.vipOnly) {
      eligible = eligible.filter(g => g.vipLevel >= config.minVipLevel);
    }
    
    // 排除已中奖
    if (config.excludeWinners) {
      const winnerIds = this.getWinnerIds(config.eventId);
      eligible = eligible.filter(g => !winnerIds.includes(g.id));
    }
    
    return eligible;
  }
}
```

---

## 五、大屏动画效果

### 5.1 滚动动画实现

```typescript
class LotteryAnimationController {
  private animationFrame: number;
  private guests: Guest[];
  private currentIndex: number;
  private speed: number;
  
  // 开始滚动动画
  startRollingAnimation(guests: Guest[], duration: number) {
    this.guests = guests;
    this.currentIndex = 0;
    this.speed = 100;  // 初始速度（毫秒/帧）
    
    const startTime = Date.now();
    
    const animate = () => {
      // 计算剩余时间
      const remaining = duration - (Date.now() - startTime);
      
      // 根据剩余时间调整速度（最后减速）
      if (remaining < 1000) {
        this.speed = Math.max(50, this.speed + 10);
      } else if (remaining < 500) {
        this.speed = Math.max(200, this.speed + 20);
      }
      
      // 更新当前显示
      this.currentIndex = Math.floor(Math.random() * this.guests.length);
      this.updateDisplay(this.guests[this.currentIndex]);
      
      // 继续动画或结束
      if (remaining > 0) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.stopAnimation();
      }
    };
    
    animate();
  }
  
  // 停止动画，显示最终结果
  stopAnimation() {
    cancelAnimationFrame(this.animationFrame);
    
    // 显示中奖者
    const winners = this.getFinalWinners();
    this.showWinners(winners);
    
    // 播放中奖特效
    this.playWinAnimation();
  }
  
  // 中奖特效
  playWinAnimation() {
    // 烟花效果
    createFireworks();
    
    // 闪烁效果
    createFlashEffect();
    
    // 播放音效
    playWinSound();
  }
}
```

---

## 六、状态管理

```typescript
// Zustand 状态管理
import { create } from 'zustand';

interface LotteryState {
  prizes: Prize[];
  currentPrize: Prize | null;
  eligibleGuests: Guest[];
  winners: WinnerRecord[];
  
  // 抽奖状态
  isRolling: boolean;
  rollingGuests: Guest[];
  currentWinners: Guest[];
  
  // 配置
  config: LotteryConfig;
  
  // Actions
  setPrizes: (prizes: Prize[]) => void;
  setCurrentPrize: (prize: Prize) => void;
  startDraw: (prizeId: string, count: number) => Promise<void>;
  stopDraw: () => void;
  confirmWinners: () => void;
  cancelWinners: () => void;
  updatePickupStatus: (winnerId: string, status: string) => void;
  exportWinners: () => void;
}

const useLotteryStore = create<LotteryState>((set, get) => ({
  prizes: [],
  currentPrize: null,
  eligibleGuests: [],
  winners: [],
  isRolling: false,
  rollingGuests: [],
  currentWinners: [],
  config: defaultConfig,
  
  setPrizes: (prizes) => set({ prizes }),
  setCurrentPrize: (prize) => set({ currentPrize: prize }),
  
  startDraw: async (prizeId, count) => {
    const { prizes, config } = get();
    const prize = prizes.find(p => p.id === prizeId);
    
    if (!prize) return;
    
    // 设置当前奖品
    set({ currentPrize: prize, isRolling: true });
    
    // 获取符合条件的嘉宾
    const engine = new LotteryEngine();
    const eligible = await engine.getEligibleGuests(
      await fetchGuests(prize.eventId),
      config
    );
    set({ eligibleGuests: eligible });
    
    // 根据抽奖方式执行抽奖
    if (config.drawMethod === 'random') {
      // 随机抽奖
      const winners = await engine.randomDraw(eligible, count);
      set({ currentWinners: winners, isRolling: false });
    } else if (config.drawMethod === 'rolling') {
      // 滚动抽奖（先开始动画）
      set({ rollingGuests: eligible });
      
      // 等待动画结束后确定中奖者
      setTimeout(async () => {
        const winners = await engine.randomDraw(eligible, count);
        set({ currentWinners: winners, isRolling: false });
      }, config.animationDuration);
    } else if (config.drawMethod === 'preset') {
      // 预设中奖
      const winners = await engine.presetDraw(prize.presetWinners, eligible);
      set({ currentWinners: winners, isRolling: false });
    }
    
    // WebSocket 广播抽奖开始
    broadcastLotteryStart(prizeId, prize);
  },
  
  stopDraw: () => {
    set({ isRolling: false });
  },
  
  confirmWinners: () => {
    const { currentPrize, currentWinners, winners } = get();
    
    if (!currentPrize || currentWinners.length === 0) return;
    
    // 创建中奖记录
    const records: WinnerRecord[] = currentWinners.map(guest => ({
      id: uuid(),
      prizeId: currentPrize.id,
      guestId: guest.id,
      drawTime: new Date(),
      drawMethod: get().config.drawMethod,
      pickupStatus: 'pending'
    }));
    
    // 更新奖品已抽取数量
    const updatedPrizes = get().prizes.map(p => 
      p.id === currentPrize.id 
        ? { ...p, drawnCount: p.drawnCount + currentWinners.length }
        : p
    );
    
    set({
      winners: [...winners, ...records],
      prizes: updatedPrizes,
      currentWinners: [],
      currentPrize: null
    });
    
    // WebSocket 广播中奖结果
    broadcastLotteryResult(currentPrize, currentWinners);
  },
  
  cancelWinners: () => {
    set({ currentWinners: [], isRolling: false });
  },
  
  updatePickupStatus: (winnerId, status) => {
    const { winners } = get();
    set({
      winners: winners.map(w => 
        w.id === winnerId ? { ...w, pickupStatus: status } : w
      )
    });
  },
  
  exportWinners: () => {
    exportService.exportWinnersExcel(get().winners);
  }
}));
```

---

## 七、WebSocket 实时同步

```typescript
// WebSocket 消息类型
interface LotteryWebSocketMessage {
  type: 'LOTTERY_START' | 'LOTTERY_ROLLING' | 'LOTTERY_RESULT' | 'LOTTERY_CANCEL';
  eventId: string;
  payload: any;
}

// 服务端广播
class LotteryWebSocketServer {
  broadcastLotteryStart(eventId: string, prize: Prize) {
    this.broadcast(eventId, {
      type: 'LOTTERY_START',
      payload: {
        prizeId: prize.id,
        prizeName: prize.name,
        prizeLevel: prize.prizeLevel,
        prizeImage: prize.imageUrl,
        animationType: prize.animationType
      }
    });
  }
  
  broadcastLotteryRolling(eventId: string, guest: Guest) {
    this.broadcast(eventId, {
      type: 'LOTTERY_ROLLING',
      payload: {
        guestId: guest.id,
        name: guest.name,
        company: guest.company,
        avatar: guest.avatar
      }
    });
  }
  
  broadcastLotteryResult(eventId: string, prize: Prize, winners: Guest[]) {
    this.broadcast(eventId, {
      type: 'LOTTERY_RESULT',
      payload: {
        prizeId: prize.id,
        prizeName: prize.name,
        winners: winners.map(w => ({
          guestId: w.id,
          name: w.name,
          company: w.company,
          avatar: w.avatar
        }))
      }
    });
  }
}
```

---

## 八、测试要点

### 8.1 功能测试

| 测试场景 | 验证点 |
|----------|--------|
| 随机抽奖 | 随机性验证、中奖者不重复 |
| 滚动抽奖 | 动画效果流畅、最终结果正确 |
| 预设中奖 | 预设嘉宾正确中奖 |
| 参与条件筛选 | VIP专属、排除已中奖等规则正确 |
| WebSocket 同步 | 大屏与控制端实时同步 |

### 8.2 性能测试

| 测试场景 | 性能指标 |
|----------|----------|
| 大量参与嘉宾 | 1000人抽奖响应 < 1s |
| 滚动动画 | 帧率 > 30fps |
| WebSocket 同步 | 消息延迟 < 100ms |

---

> **模块负责人**：前后端开发工程师  
> **最后更新**：2025-01-15