import type { SystemConfig } from '@/types';

class AudioManager {
  private bgMusic: HTMLAudioElement | null = null;
  private rollSound: HTMLAudioElement | null = null;
  private winSound: HTMLAudioElement | null = null;
  private rollSoundInterval: ReturnType<typeof setInterval> | null = null;
  private config: SystemConfig = {
    theme: 'tech-blue',
    bgMusicVolume: 0.3,
    effectVolume: 0.7,
    enableBgMusic: false,
    enableEffects: true,
  };
  // 共享的AudioContext（避免重复创建）
  private audioContext: AudioContext | null = null;
  private isContextReady: boolean = false;
  
  // 预生成的滚动音效缓冲区池（性能优化）
  private rollingBufferPool: AudioBuffer[] = [];
  private isBufferPoolReady: boolean = false;

  constructor() {
    this.loadConfig();
  }

  /**
   * 获取或创建共享的AudioContext
   * 优化：确保返回的context始终是running状态
   */
  private async getAudioContext(): Promise<AudioContext | null> {
    if (typeof window === 'undefined') return null;
    
    // 如果context已存在且可用
    if (this.audioContext && this.audioContext.state !== 'closed') {
      // 确保context是running状态
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      return this.audioContext;
    }
    
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;
      
      this.audioContext = new AudioContextClass();
      
      // 如果context被挂起（浏览器自动挂起），尝试恢复
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.isContextReady = true;
      return this.audioContext;
    } catch (e) {
      console.error('Failed to create AudioContext:', e);
      return null;
    }
  }

  /**
   * 预热AudioContext（在用户交互时调用）
   * 同时预生成滚动音效缓冲区池，优化性能
   */
  async warmup(): Promise<void> {
    if (typeof window === 'undefined') return;
    await this.getAudioContext();
    // 预生成滚动音效缓冲区池
    this.generateRollingBufferPool();
  }

  /**
   * 预生成滚动音效缓冲区池
   * 保持原来轻快灵动的音效，同时优化性能
   * 
   * 音效参数（与原来实时生成一致）：
   * - 频率：300-600Hz
   * - 持续：50-100ms
   * - 波形：纯sine波
   * - 简洁的起音+衰减
   */
  private generateRollingBufferPool(): void {
    const ctx = this.audioContext;
    if (!ctx || this.isBufferPoolReady) return;
    
    try {
      // 预生成30个buffer，足够覆盖变化
      const poolSize = 30;
      this.rollingBufferPool = [];
      
      for (let i = 0; i < poolSize; i++) {
        // 与原来createRollingTone完全一致的参数
        const frequency = 300 + Math.random() * 300; // 300-600Hz
        const duration = 0.05 + Math.random() * 0.05; // 50-100ms
        
        const buffer = this.createSimpleRollingBuffer(ctx, frequency, duration);
        if (buffer) {
          this.rollingBufferPool.push(buffer);
        }
      }
      
      this.isBufferPoolReady = true;
    } catch (e) {
      console.error('Failed to generate rolling buffer pool:', e);
    }
  }
  
  /**
   * 创建简洁轻快的滚动音效AudioBuffer
   * 与原来createRollingTone音效完全一致
   */
  private createSimpleRollingBuffer(ctx: AudioContext, frequency: number, duration: number): AudioBuffer | null {
    try {
      const sampleRate = ctx.sampleRate;
      const length = Math.ceil(sampleRate * duration);
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      
      // 与原来一致的音量
      const volume = this.config.effectVolume * 0.5;
      
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        
        // 纯sine波，与原来一致
        let sample = Math.sin(2 * Math.PI * frequency * t);
        
        // 简洁的包络：快速起音 + 指数衰减
        let envelope: number;
        const attackTime = 0.005;
        
        if (t < attackTime) {
          envelope = t / attackTime;
        } else {
          // 指数衰减，与原来一致
          envelope = Math.exp(-(t - attackTime) / (duration * 0.3));
        }
        
        // 确保最后不会太小，与原来一致
        envelope = Math.max(envelope, 0.01);
        sample *= envelope * volume;
        data[i] = sample;
      }
      
      return buffer;
    } catch (e) {
      return null;
    }
  }

  /**
   * 同步版本的getAudioContext（用于非async场景）
   * 会自动尝试恢复suspended状态
   */
  private getAudioContextSync(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      // 异步恢复suspended状态（不阻塞当前播放）
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      return this.audioContext;
    }
    
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;
      
      this.audioContext = new AudioContextClass();
      
      // 异步恢复suspended状态
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      
      return this.audioContext;
    } catch (e) {
      return null;
    }
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lottery-config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    }
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lottery-config', JSON.stringify(this.config));
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SystemConfig>): void {
    const oldEffectVolume = this.config.effectVolume;
    this.config = { ...this.config, ...config };
    this.saveConfig();
    this.applyVolume();
    
    // 如果音效音量改变，需要重新生成缓冲区池
    if (config.effectVolume !== undefined && config.effectVolume !== oldEffectVolume) {
      this.isBufferPoolReady = false;
      this.rollingBufferPool = [];
      if (this.audioContext) {
        this.generateRollingBufferPool();
      }
    }
  }

  /**
   * 获取配置
   */
  getConfig(): SystemConfig {
    return { ...this.config };
  }

  /**
   * 应用音量设置
   */
  private applyVolume(): void {
    if (this.bgMusic) {
      this.bgMusic.volume = this.config.bgMusicVolume;
    }
    if (this.rollSound) {
      this.rollSound.volume = this.config.effectVolume;
    }
    if (this.winSound) {
      this.winSound.volume = this.config.effectVolume;
    }
  }

  /**
   * 初始化背景音乐（使用Web Audio API生成）
   */
  initBgMusic(): void {
    if (typeof window === 'undefined') return;
    
    // 创建一个简单的背景音乐
    // 注意：实际应用中应该加载真实的音频文件
    const audioContext = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    // 这里只是示例，实际应该加载音频文件
  }

  /**
   * 播放背景音乐
   */
  playBgMusic(): void {
    if (!this.config.enableBgMusic) return;
    // 实际实现应该播放音频文件
  }

  /**
   * 停止背景音乐
   */
  stopBgMusic(): void {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
    }
  }

  /**
   * 播放滚动音效
   */
  playRollSound(): void {
    if (!this.config.enableEffects) return;
    
    // 使用Web Audio API生成滚动音效
    this.createTone(440, 0.05, 'sine');
  }

  /**
   * 播放中奖音效
   */
  playWinSound(): void {
    if (!this.config.enableEffects) return;
    
    // 播放一连串欢庆的音效
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.createTone(freq, 0.25, 'triangle');
      }, index * 80);
    });
  }

  /**
   * 播放倒计时音效
   */
  playCountdownSound(): void {
    if (!this.config.enableEffects) return;
    
    this.createTone(880, 0.15, 'square');
  }

  /**
   * 生成音调（使用共享AudioContext，同步版本避免延迟）
   */
  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (typeof window === 'undefined') return;
    
    try {
      const audioContext = this.getAudioContextSync();
      if (!audioContext) return;

      // 使用当前时间，确保立即播放
      const currentTime = audioContext.currentTime;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, currentTime);

      // 平滑的音量包络，避免爆音
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(this.config.effectVolume, currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);
    } catch (error) {
      console.error('Audio error:', error);
    }
  }

  /**
   * 播放摇奖音效（滚动/抽奖开始时的音效）
   * 参考体彩/双色球摇奖音效，持续、清晰、灵动而不嘈杂
   * 
   * 性能优化：使用预生成的AudioBuffer池，避免实时创建OscillatorNode
   * 音效：轻快灵动，与原来前5秒效果一致
   */
  playStartDrawSound(): void {
    if (!this.config.enableEffects) return;

    // 停止之前可能存在的摇奖音效
    this.stopRollSound();

    // 如果缓冲区池未就绪，尝试同步生成
    if (!this.isBufferPoolReady || this.rollingBufferPool.length === 0) {
      const ctx = this.getAudioContextSync();
      if (ctx) {
        this.generateRollingBufferPool();
      }
    }

    // 播放滚动音效
    const playRollingSound = () => {
      if (!this.config.enableEffects) return;
      this.playFromBufferPool();
    };

    // 立即播放第一个声音
    playRollingSound();

    // 持续播放，间隔 80-120ms，与原来完全一致
    this.rollSoundInterval = setInterval(() => {
      playRollingSound();
    }, 80 + Math.random() * 40);
  }
  
  /**
   * 从预生成的缓冲区池中播放音效
   * 简单直接，轻快灵动
   */
  private playFromBufferPool(): void {
    const ctx = this.getAudioContextSync();
    if (!ctx || this.rollingBufferPool.length === 0) {
      // 降级：如果缓冲区池不可用，使用实时生成
      const baseFreq = 300 + Math.random() * 300;
      const duration = 0.05 + Math.random() * 0.05;
      this.createRollingTone(baseFreq, duration, 'sine');
      return;
    }

    try {
      // 随机选择一个buffer
      const buffer = this.rollingBufferPool[Math.floor(Math.random() * this.rollingBufferPool.length)];
      
      // 创建AudioBufferSourceNode
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (error) {
      // 静默处理错误
    }
  }

  /**
   * 停止摇奖音效
   */
  stopRollSound(): void {
    if (this.rollSoundInterval) {
      clearInterval(this.rollSoundInterval);
      this.rollSoundInterval = null;
    }
  }

  /**
   * 生成滚动音调（使用共享AudioContext，同步版本避免延迟）
   */
  private createRollingTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (typeof window === 'undefined') return;

    try {
      const audioContext = this.getAudioContextSync();
      if (!audioContext) return;

      // 使用当前时间，确保立即播放
      const currentTime = audioContext.currentTime;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, currentTime);

      // 使用较小的音量，避免嘈杂
      const volume = this.config.effectVolume * 0.5;
      
      // 平滑的音量包络，避免爆音
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);
    } catch (error) {
      console.error('Audio error:', error);
    }
  }

  /**
   * 播放喝彩声（中奖时的欢呼声）
   */
  playCheerSound(): void {
    if (!this.config.enableEffects) return;
    
    // 播放一系列欢庆的音效，模拟人群欢呼
    const cheers = [
      [523.25, 0.3],   // C5
      [659.25, 0.3],   // E5
      [783.99, 0.4],   // G5
      [1046.50, 0.5],  // C6
      [1318.51, 0.6],  // E6
    ];
    
    // 第一波欢呼
    cheers.forEach(([freq, dur], index) => {
      setTimeout(() => {
        this.createTone(freq, dur, 'triangle');
      }, index * 150);
    });
    
    // 第二波欢呼（音调更高）
    setTimeout(() => {
      cheers.forEach(([freq, dur], index) => {
        setTimeout(() => {
          this.createTone(freq * 1.2, dur * 0.8, 'triangle');
        }, index * 120);
      });
    }, 800);
  }

  /**
   * 播放烟花音效
   */
  playFireworkSound(): void {
    if (!this.config.enableEffects) return;
    
    // 模拟爆炸音效
    this.createTone(200, 0.3, 'sawtooth');
    setTimeout(() => {
      this.createTone(150, 0.4, 'sawtooth');
    }, 100);
  }

  /**
   * 播放碎裂音效（卡牌碎裂时的音效）
   */
  playBreakSound(): void {
    if (!this.config.enableEffects) return;

    // 模拟玻璃破碎的声音，使用快速下降的音调
    const breakSounds = [
      [800, 0.1],   // 高频开始
      [600, 0.1],   // 快速下降
      [400, 0.15],  // 继续
      [200, 0.2],   // 低频结束
    ];

    breakSounds.forEach(([freq, dur], index) => {
      setTimeout(() => {
        this.createTone(freq, dur, 'sawtooth');
      }, index * 50);
    });
  }

  /**
   * 播放惊喜音效（重抽中奖时的惊喜特效音效）
   * 比普通中奖音效更加强烈和欢快
   */
  playSurpriseSound(): void {
    if (!this.config.enableEffects) return;

    // 第一波：惊喜开场音效
    const surpriseIntro = [
      [880, 0.1],   // A5 - 快速起始
      [1100, 0.1],  // 高音
      [1320, 0.15], // 更高
      [1760, 0.2],  // A6 - 惊喜爆发
    ];

    surpriseIntro.forEach(([freq, dur], index) => {
      setTimeout(() => {
        this.createTone(freq, dur, 'sine');
      }, index * 80);
    });

    // 第二波：欢庆旋律（延迟后开始）
    setTimeout(() => {
      const celebration = [
        [523.25, 0.2],   // C5
        [659.25, 0.2],   // E5
        [783.99, 0.2],   // G5
        [1046.50, 0.3],  // C6
        [1318.51, 0.3],  // E6
        [1567.98, 0.4],  // G6
        [2093.00, 0.5],  // C7 - 高潮
      ];

      celebration.forEach(([freq, dur], index) => {
        setTimeout(() => {
          this.createTone(freq, dur, 'triangle');
        }, index * 100);
      });
    }, 400);

    // 第三波：持续欢呼声
    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          // 随机高音，模拟欢呼
          this.createTone(1200 + Math.random() * 400, 0.15, 'sine');
        }, i * 150);
      }
    }, 1200);

    // 同时播放喝彩声
    this.playCheerSound();
  }
}

// 导出单例
export const audioManager = new AudioManager();
