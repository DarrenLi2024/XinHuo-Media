// 纯 Canvas 烟花效果实现，不依赖外部库

export class Fireworks {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private animationId: number | null = null;

  init() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9999';
    document.body.appendChild(this.canvas);

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return;

    window.addEventListener('resize', () => {
      if (this.canvas) {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
      }
    });
  }

  launch(x: number, y: number, colors: string[] = []) {
    if (!this.ctx || !this.canvas) return;

    const particleCount = 100;
    const defaultColors = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'];
    const particleColors = colors.length > 0 ? colors : defaultColors;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 2 + Math.random() * 4;
      const color = particleColors[Math.floor(Math.random() * particleColors.length)];
      
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        alpha: 1,
        color,
        decay: 0.01 + Math.random() * 0.02,
        gravity: 0.05,
      });
    }

    if (!this.animationId) {
      this.animate();
    }
  }

  private animate() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 更新和绘制粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalAlpha = 1;

    // 如果还有粒子，继续动画
    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.animate());
    } else {
      this.animationId = null;
    }
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.canvas) {
      document.body.removeChild(this.canvas);
      this.canvas = null;
    }
    this.ctx = null;
    this.particles = [];
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  decay: number;
  gravity: number;
}

// 单例模式
let fireworksInstance: Fireworks | null = null;

export function getFireworks(): Fireworks {
  if (!fireworksInstance) {
    fireworksInstance = new Fireworks();
    fireworksInstance.init();
  }
  return fireworksInstance;
}

export function launchFireworks(x: number, y: number, colors?: string[]) {
  const fireworks = getFireworks();
  fireworks.launch(x, y, colors);
}

export function destroyFireworks() {
  if (fireworksInstance) {
    fireworksInstance.destroy();
    fireworksInstance = null;
  }
}
