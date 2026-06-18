'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  name: string;
  opacity: number;
  targetOpacity: number;
  opacitySpeed: number;
  size: number;
}

interface FireworkParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// 彩条特效粒子
interface RibbonParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: string;
  width: number;
  height: number;
  rotation: number;
  rotationSpeed: number;
}

// Emoji特效粒子
interface EmojiParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  emoji: string;
  scale: number;
}

interface ParticleSphereProps {
  names: string[];
  isActive: boolean;
  rotationSpeed?: number;
  sphereRadius?: number;
  showEffects?: boolean;
}

// 性能配置
const SAMPLE_RATIO = 2 / 3; // 粒子采样比例
const FRAME_SKIP_THRESHOLD = 20; // 帧时间阈值(ms)，超过则跳帧

// 彩条颜色
const RIBBON_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFD93D', '#FF69B4',
  '#98FB98', '#DDA0DD', '#F0E68C', '#87CEEB', '#FFA07A'
];

// Emoji列表
const EMOJIS = ['🎉', '🎊', '✨', '⭐', '🌟', '💫', '🎈', '🎁', '🏆', '💎', '🌟', '🍀'];

/**
 * 粒子球体组件
 * 将参会名单转换为3D球体分布的粒子，实现360度转动和随机隐现效果
 * 
 * 性能优化策略：
 * 1. 粒子数量采样为2/3（保留视觉效果）
 * 2. 帧率监控和自适应跳帧（低帧率时跳过特效）
 * 3. AudioContext单例复用（音效优化）
 */
export default function ParticleSphere({
  names,
  isActive,
  rotationSpeed = 0.005,
  sphereRadius = 250,
  showEffects = false,
}: ParticleSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const rotationRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const fireworksRef = useRef<FireworkParticle[]>([]);
  const ribbonsRef = useRef<RibbonParticle[]>([]);
  const emojisRef = useRef<EmojiParticle[]>([]);
  const lastFireworkTimeRef = useRef(0);
  const lastRibbonTimeRef = useRef(0);
  const lastEmojiTimeRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const skipEffectsRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    // 斐波那契球面分布算法 - 带2/3采样
    const createSphereParticles = () => {
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const particles: Particle[] = [];
      
      // 计算采样数量（2/3）
      const totalNames = names.length;
      const sampleCount = Math.ceil(totalNames * SAMPLE_RATIO);
      
      // 随机选择采样索引
      const sampledIndices = new Set<number>();
      if (totalNames > sampleCount) {
        while (sampledIndices.size < sampleCount) {
          sampledIndices.add(Math.floor(Math.random() * totalNames));
        }
      }
      
      // 获取采样后的名称列表
      const sampledNames = totalNames > sampleCount 
        ? names.filter((_, i) => sampledIndices.has(i))
        : names;

      sampledNames.forEach((name, index) => {
        const theta = index * goldenAngle;
        const y = 1 - (index / (sampledNames.length - 1 || 1)) * 2;
        const radius = Math.sqrt(1 - y * y);

        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;

        particles.push({
          x: x * sphereRadius,
          y: y * sphereRadius,
          z: z * sphereRadius,
          name,
          opacity: Math.random() * 0.7 + 0.2,
          targetOpacity: Math.random() * 0.7 + 0.2,
          opacitySpeed: 0.003 + Math.random() * 0.008,
          size: 4 + Math.random() * 4,
        });
      });

      return particles;
    };

    particlesRef.current = createSphereParticles();

    // 3D旋转矩阵
    const rotateY = (x: number, y: number, z: number, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: x * cos + z * sin,
        y: y,
        z: -x * sin + z * cos,
      };
    };

    // 3D投影到2D
    const project = (x: number, y: number, z: number) => {
      const perspective = 1000;
      const scale = perspective / (perspective + z + sphereRadius);
      return {
        x: canvas.width / 2 + x * scale,
        y: canvas.height / 2 + y * scale,
        scale,
      };
    };

    const animate = (timestamp: number) => {
      if (!ctx || !canvas) return;

      // 帧率监控和自适应跳帧
      const frameDelta = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;
      
      // 如果上一帧耗时过长，跳过本帧的特效渲染
      if (frameDelta > FRAME_SKIP_THRESHOLD) {
        skipEffectsRef.current = true;
      } else {
        skipEffectsRef.current = false;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 更新旋转角度
      rotationRef.current += rotationSpeed;

      const currentTime = Date.now();

      // 仅在非跳帧时生成特效
      if (showEffects && !skipEffectsRef.current) {
        // 生成彩条特效（围绕球体）
        if (currentTime - lastRibbonTimeRef.current > 800 && Math.random() < 0.3) {
          lastRibbonTimeRef.current = currentTime;
          const theta = Math.random() * Math.PI * 2;
          const radius = sphereRadius * 1.1;
          
          ribbonsRef.current.push({
            x: Math.cos(theta) * radius,
            y: (Math.random() - 0.5) * sphereRadius * 0.8,
            z: Math.sin(theta) * radius,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 2 + 1,
            vz: (Math.random() - 0.5) * 2,
            life: 1.0,
            maxLife: 1.0,
            color: RIBBON_COLORS[Math.floor(Math.random() * RIBBON_COLORS.length)],
            width: 8 + Math.random() * 12,
            height: 20 + Math.random() * 30,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
          });
        }

        // 生成Emoji特效（围绕球体）- 每次迸射15-20个
        if (currentTime - lastEmojiTimeRef.current > 1500 && Math.random() < 0.3) {
          lastEmojiTimeRef.current = currentTime;
          const emojiCount = 15 + Math.floor(Math.random() * 6);
          
          for (let i = 0; i < emojiCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            // 从球体内部开始迸射
            const radius = sphereRadius * (0.6 + Math.random() * 0.6);
            
            emojisRef.current.push({
              x: Math.cos(theta) * radius,
              y: (Math.random() - 0.5) * sphereRadius * 0.8,
              z: Math.sin(theta) * radius,
              vx: (Math.random() - 0.5) * 5,  // 增大速度，辐射范围更大
              vy: Math.random() * 4 + 1,      // 向上飘动更快
              vz: (Math.random() - 0.5) * 5,
              life: 1.0,
              maxLife: 1.0,
              emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
              scale: 2.5 + Math.random() * 1.0,  // 更大的emoji
            });
          }
        }

        // 生成新的烟花碎屑（随机在球体内部迸射）
        if (currentTime - lastFireworkTimeRef.current > 500 && Math.random() < 0.1) {
          lastFireworkTimeRef.current = currentTime;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const radius = Math.random() * sphereRadius * 1.2;
          const fx = radius * Math.sin(phi) * Math.cos(theta);
          const fy = radius * Math.sin(phi) * Math.sin(theta);
          const fz = radius * Math.cos(phi);

          const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FF69B4', '#98FB98'];
          const particleCount = 8 + Math.floor(Math.random() * 8);
          for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
            const speed = 2 + Math.random() * 3;
            const verticalAngle = (Math.random() - 0.5) * Math.PI;
            fireworksRef.current.push({
              x: fx,
              y: fy,
              z: fz,
              vx: speed * Math.cos(verticalAngle) * Math.cos(angle),
              vy: speed * Math.cos(verticalAngle) * Math.sin(angle),
              vz: speed * Math.sin(verticalAngle),
              life: 1.0,
              maxLife: 1.0,
              color: colors[Math.floor(Math.random() * colors.length)],
              size: 3 + Math.random() * 4,
            });
          }
        }
      }

      // 更新烟花碎屑
      fireworksRef.current = fireworksRef.current.filter(fw => fw.life > 0);
      fireworksRef.current.forEach(fw => {
        fw.x += fw.vx;
        fw.y += fw.vy;
        fw.z += fw.vz;
        fw.vx *= 0.98;
        fw.vy *= 0.98;
        fw.vz *= 0.98;
        fw.life -= 0.015;
      });

      // 更新彩条
      ribbonsRef.current = ribbonsRef.current.filter(r => r.life > 0);
      ribbonsRef.current.forEach(r => {
        r.x += r.vx;
        r.y += r.vy;
        r.z += r.vz;
        r.rotation += r.rotationSpeed;
        r.life -= 0.008;
      });

      // 更新Emoji
      emojisRef.current = emojisRef.current.filter(e => e.life > 0);
      emojisRef.current.forEach(e => {
        e.x += e.vx;
        e.y += e.vy;
        e.z += e.vz;
        e.life -= 0.006;
      });

      // 更新粒子位置和透明度
      const rotatedParticles = particlesRef.current.map(p => {
        // 更新透明度（随机隐现 - 更明显更平滑）
        p.opacity += (p.targetOpacity - p.opacity) * p.opacitySpeed;
        if (Math.abs(p.opacity - p.targetOpacity) < 0.02) {
          p.targetOpacity = Math.random() * 0.7 + 0.2;
          p.opacitySpeed = 0.003 + Math.random() * 0.008;
        }

        // 3D旋转
        const rotated = rotateY(p.x, p.y, p.z, rotationRef.current);
        return {
          ...p,
          rx: rotated.x,
          ry: rotated.y,
          rz: rotated.z,
        };
      });

      // 计算投影后的2D坐标
      const projectedParticles = rotatedParticles.map(p => {
        const projected = project(p.rx, p.ry, p.rz);
        return {
          ...p,
          px: projected.x,
          py: projected.y,
          scale: projected.scale,
        };
      });

      // 根据Z轴排序，先画远的
      projectedParticles.sort((a, b) => a.rz - b.rz);

      // 绘制烟花碎屑（先绘制远处的）
      const projectedFireworks = fireworksRef.current.map(fw => {
        const projected = project(fw.x, fw.y, fw.z);
        return {
          ...fw,
          px: projected.x,
          py: projected.y,
          scale: projected.scale,
        };
      });
      projectedFireworks.sort((a, b) => a.z - b.z);

      projectedFireworks.forEach(fw => {
        if (fw.life > 0) {
          const alpha = fw.life * fw.scale;
          const hexColor = fw.color;
          const rVal = parseInt(hexColor.slice(1, 3), 16);
          const gVal = parseInt(hexColor.slice(3, 5), 16);
          const bVal = parseInt(hexColor.slice(5, 7), 16);
          
          ctx.beginPath();
          ctx.arc(fw.px, fw.py, fw.size * fw.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rVal}, ${gVal}, ${bVal}, ${alpha})`;
          ctx.fill();

          // 绘制碎屑尾迹
          if (fw.life > 0.3) {
            ctx.beginPath();
            ctx.moveTo(fw.px, fw.py);
            ctx.lineTo(fw.px - fw.vx * 2, fw.py - fw.vy * 2);
            ctx.strokeStyle = `rgba(${rVal}, ${gVal}, ${bVal}, ${alpha * 0.3})`;
            ctx.lineWidth = fw.size * fw.scale * 0.5;
            ctx.stroke();
          }
        }
      });

      // 绘制彩条（先绘制远处的）
      const projectedRibbons = ribbonsRef.current.map(r => {
        const projected = project(r.x, r.y, r.z);
        return {
          ...r,
          px: projected.x,
          py: projected.y,
          scale: projected.scale,
        };
      });
      projectedRibbons.sort((a, b) => a.z - b.z);

      projectedRibbons.forEach(r => {
        if (r.life > 0) {
          const alpha = r.life * r.scale;
          ctx.save();
          ctx.translate(r.px, r.py);
          ctx.rotate(r.rotation);
          
          const hexColor = r.color;
          const rVal = parseInt(hexColor.slice(1, 3), 16);
          const gVal = parseInt(hexColor.slice(3, 5), 16);
          const bVal = parseInt(hexColor.slice(5, 7), 16);
          ctx.fillStyle = `rgba(${rVal}, ${gVal}, ${bVal}, ${alpha})`;
          ctx.fillRect(-r.width * r.scale / 2, -r.height * r.scale / 2, r.width * r.scale, r.height * r.scale);
          
          // 添加光泽效果
          const gradient = ctx.createLinearGradient(-r.width * r.scale / 2, 0, r.width * r.scale / 2, 0);
          gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.3})`);
          gradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.1})`);
          gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.3})`);
          ctx.fillStyle = gradient;
          ctx.fillRect(-r.width * r.scale / 2, -r.height * r.scale / 2, r.width * r.scale, r.height * r.scale);
          
          ctx.restore();
        }
      });

      // 绘制Emoji（先绘制远处的）
      const projectedEmojis = emojisRef.current.map(e => {
        const projected = project(e.x, e.y, e.z);
        return {
          ...e,
          px: projected.x,
          py: projected.y,
          scale: projected.scale,
        };
      });
      projectedEmojis.sort((a, b) => a.z - b.z);

      projectedEmojis.forEach(e => {
        if (e.life > 0) {
          // 提高透明度，让emoji更明显
          const alpha = Math.min(1.0, e.life * 1.2);
          ctx.save();
          ctx.globalAlpha = alpha;
          // 增大字体，让emoji更大
          ctx.font = `${36 * e.scale * e.scale}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(e.emoji, e.px, e.py);
          ctx.restore();
        }
      });

      // 绘制连线（只连接距离近的粒子）
      const connectionDistance = 150;
      projectedParticles.forEach((p1, i) => {
        projectedParticles.slice(i + 1).forEach(p2 => {
          const dx = p1.px - p2.px;
          const dy = p1.py - p2.py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.5 * Math.min(p1.opacity, p2.opacity);
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);

            const gradient = ctx.createLinearGradient(p1.px, p1.py, p2.px, p2.py);
            gradient.addColorStop(0, `rgba(59, 130, 246, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(147, 197, 253, ${alpha * 0.8})`);
            gradient.addColorStop(1, `rgba(236, 72, 153, ${alpha})`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      });

      // 绘制粒子
      projectedParticles.forEach(p => {
        const depthOpacity = p.opacity * p.scale;

        // 绘制粒子光晕（增强）
        const glowRadius = p.size * 4 * p.scale;
        const gradient = ctx.createRadialGradient(p.px, p.py, 0, p.px, p.py, glowRadius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${depthOpacity})`);
        gradient.addColorStop(0.3, `rgba(147, 197, 253, ${depthOpacity * 0.8})`);
        gradient.addColorStop(0.6, `rgba(59, 130, 246, ${depthOpacity * 0.4})`);
        gradient.addColorStop(1, `rgba(236, 72, 153, 0)`);

        ctx.beginPath();
        ctx.arc(p.px, p.py, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 绘制粒子核心
        ctx.beginPath();
        ctx.arc(p.px, p.py, p.size * p.scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${depthOpacity})`;
        ctx.fill();

        // 绘制名字（只显示前面的粒子）
        if (p.rz < sphereRadius * 0.3 && p.scale > 0.5) {
          ctx.font = `bold ${14 * p.scale}px monospace`;
          ctx.fillStyle = `rgba(147, 197, 253, ${depthOpacity * 0.9})`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // 名字发光效果
          ctx.shadowColor = 'rgba(59, 130, 246, 0.8)';
          ctx.shadowBlur = 10;
          ctx.fillText(p.name, p.px, p.py + p.size * p.scale + 18);
          ctx.shadowBlur = 0;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate(0);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, names, rotationSpeed, sphereRadius, showEffects]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
    />
  );
}
