import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { X, Download, Users, Crown, Settings, Palette, ImagePlus, Trash2, FileText } from 'lucide-react';
import type { Table, Person } from '@/types/seating';
import { extractCompanyShortName, simplifyTag, isEnglishTag } from '@/lib/seating/helpers';

interface TableCardGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  activityName: string;
  tables: Table[];
}

interface CardConfig {
  theme: string;
  subtitle: string;
  footer: string;
}

// 四套皮肤配置
const SKINS = {
  'tech-blue': {
    name: '科技蓝',
    gradient: 'linear-gradient(180deg, #dbeafe 0%, #ffffff 30%, #eff6ff 70%, #dbeafe 100%)',
    primaryColor: '#2563eb',
    primaryGradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    textColor: '#1e3a8a',
    accentColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.3)',
    seatBg: 'rgba(219, 234, 254, 0.8)',
    seatBorder: 'rgba(59, 130, 246, 0.2)',
    seatNumberBg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    seatNumberColor: '#3b82f6',
  },
  'cool-purple': {
    name: '炫酷紫',
    gradient: 'linear-gradient(180deg, #f3e8ff 0%, #ffffff 30%, #faf5ff 70%, #f3e8ff 100%)',
    primaryColor: '#7c3aed',
    primaryGradient: 'linear-gradient(135deg, #5b21b6 0%, #8b5cf6 100%)',
    textColor: '#5b21b6',
    accentColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.3)',
    seatBg: 'rgba(243, 232, 255, 0.8)',
    seatBorder: 'rgba(139, 92, 246, 0.2)',
    seatNumberBg: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
    seatNumberColor: '#8b5cf6',
  },
  'glory-gold': {
    name: '辉煌金',
    gradient: 'linear-gradient(180deg, #fef3c7 0%, #ffffff 30%, #fffbeb 70%, #fef3c7 100%)',
    primaryColor: '#d97706',
    primaryGradient: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
    textColor: '#92400e',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.3)',
    seatBg: 'rgba(254, 243, 199, 0.8)',
    seatBorder: 'rgba(245, 158, 11, 0.3)',
    seatNumberBg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    seatNumberColor: '#d97706',
  },
  'rainbow': {
    name: '盛唐红',
    gradient: 'linear-gradient(180deg, #fef2f2 0%, #ffffff 20%, #fff1f2 40%, #ffffff 60%, #fef2f2 80%, #fff5f5 100%)',
    primaryColor: '#dc2626',
    primaryGradient: 'linear-gradient(135deg, #b91c1c 0%, #ef4444 50%, #f87171 100%)',
    textColor: '#991b1b',
    accentColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.3)',
    seatBg: 'rgba(254, 226, 226, 0.8)',
    seatBorder: 'rgba(239, 68, 68, 0.3)',
    seatNumberBg: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
    seatNumberColor: '#dc2626',
  },
};

type SkinKey = keyof typeof SKINS;

// LOGO缓存
const LOGO_STORAGE_KEY = 'smart-seating-logo-cache';

const getCachedLogo = (): string => {
  try {
    return localStorage.getItem(LOGO_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

const cacheLogo = (logoUrl: string): void => {
  try {
    localStorage.setItem(LOGO_STORAGE_KEY, logoUrl);
  } catch {
    // 忽略存储错误
  }
};

// 处理标签显示（简化+竖向排列英文）
const formatTagForDisplay = (tag: string): { text: string; isVertical: boolean } => {
  // 先简化标签
  const simplified = simplifyTag(tag);
  // 判断是否为英文标签
  const isVertical = isEnglishTag(simplified);
  return { text: simplified, isVertical };
};

// 旧函数名保留兼容，内部使用新逻辑
const truncateTag = (tag: string): string => {
  return simplifyTag(tag);
};

// PDF 皮肤配置（颜色值）
const PDF_SKINS = {
  'tech-blue': {
    primaryColor: [37, 99, 235] as [number, number, number],     // #2563eb 科技蓝
    textColor: [30, 58, 138] as [number, number, number],        // #1e3a8a
    accentColor: [59, 130, 246] as [number, number, number],     // #3b82f6
    seatBg: [219, 234, 254] as [number, number, number],         // 浅蓝背景
    seatNumberBg: [219, 234, 254] as [number, number, number],   // 座位号背景
    seatNumberColor: [59, 130, 246] as [number, number, number], // 座位号颜色
    borderColor: [147, 197, 253] as [number, number, number],    // 边框颜色
    gradientTop: [219, 234, 254] as [number, number, number],    // 渐变顶部
    gradientMiddle: [255, 255, 255] as [number, number, number], // 渐变中部
    gradientBottom: [219, 234, 254] as [number, number, number], // 渐变底部
  },
  'cool-purple': {
    primaryColor: [124, 58, 237] as [number, number, number],
    textColor: [91, 33, 182] as [number, number, number],
    accentColor: [139, 92, 246] as [number, number, number],
    seatBg: [243, 232, 255] as [number, number, number],
    seatNumberBg: [243, 232, 255] as [number, number, number],
    seatNumberColor: [139, 92, 246] as [number, number, number],
    borderColor: [196, 181, 253] as [number, number, number],
    gradientTop: [243, 232, 255] as [number, number, number],
    gradientMiddle: [255, 255, 255] as [number, number, number],
    gradientBottom: [243, 232, 255] as [number, number, number],
  },
  'glory-gold': {
    primaryColor: [217, 119, 6] as [number, number, number],
    textColor: [146, 64, 14] as [number, number, number],
    accentColor: [245, 158, 11] as [number, number, number],
    seatBg: [254, 243, 199] as [number, number, number],
    seatNumberBg: [254, 243, 199] as [number, number, number],
    seatNumberColor: [217, 119, 6] as [number, number, number],
    borderColor: [252, 211, 77] as [number, number, number],
    gradientTop: [254, 243, 199] as [number, number, number],
    gradientMiddle: [255, 255, 255] as [number, number, number],
    gradientBottom: [254, 243, 199] as [number, number, number],
  },
  'rainbow': {
    primaryColor: [220, 38, 38] as [number, number, number],      // #dc2626 盛唐红
    textColor: [153, 27, 27] as [number, number, number],         // #991b1b
    accentColor: [239, 68, 68] as [number, number, number],       // #ef4444
    seatBg: [254, 226, 226] as [number, number, number],          // 浅红背景
    seatNumberBg: [254, 202, 202] as [number, number, number],    // 座位号背景
    seatNumberColor: [220, 38, 38] as [number, number, number],   // 座位号颜色
    borderColor: [252, 165, 165] as [number, number, number],     // 边框颜色
    gradientTop: [254, 242, 242] as [number, number, number],     // 渐变顶部
    gradientMiddle: [255, 255, 255] as [number, number, number],  // 渐变中部
    gradientBottom: [254, 242, 242] as [number, number, number],  // 渐变底部
  },
};

// 卡片尺寸（mm）- 300px × 660px 转换
const CARD_WIDTH = 79.4;  // 300px ≈ 79.4mm
const CARD_HEIGHT = 174.6; // 660px ≈ 174.6mm

// 卡片像素尺寸（用于Canvas绘制）
const CARD_PIXEL_WIDTH = 300;
const CARD_PIXEL_HEIGHT = 660;
const CARD_SCALE = 4; // 高清绘制缩放

// px 转 mm
const px2mm = (px: number): number => px * 0.264583;

// Canvas绘制渐变背景
const drawCanvasGradientBackground = (
  ctx: CanvasRenderingContext2D, 
  skin: typeof SKINS['tech-blue'],
  width: number,
  height: number
) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  
  // 根据skin设置颜色 - 通过primaryColor判断是哪套皮肤
  if (skin.primaryColor === '#2563eb') { // tech-blue 科技蓝
    gradient.addColorStop(0, '#dbeafe');
    gradient.addColorStop(0.3, '#ffffff');
    gradient.addColorStop(0.7, '#eff6ff');
    gradient.addColorStop(1, '#dbeafe');
  } else if (skin.primaryColor === '#7c3aed') { // cool-purple
    gradient.addColorStop(0, '#f3e8ff');
    gradient.addColorStop(0.3, '#ffffff');
    gradient.addColorStop(0.7, '#faf5ff');
    gradient.addColorStop(1, '#f3e8ff');
  } else if (skin.primaryColor === '#d97706') { // glory-gold
    gradient.addColorStop(0, '#fef3c7');
    gradient.addColorStop(0.3, '#ffffff');
    gradient.addColorStop(0.7, '#fffbeb');
    gradient.addColorStop(1, '#fef3c7');
  } else { // rainbow 盛唐红
    gradient.addColorStop(0, '#fef2f2');
    gradient.addColorStop(0.2, '#ffffff');
    gradient.addColorStop(0.4, '#fff1f2');
    gradient.addColorStop(0.6, '#ffffff');
    gradient.addColorStop(0.8, '#fef2f2');
    gradient.addColorStop(1, '#fff5f5');
  }
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

// Canvas绘制圆角矩形
const drawCanvasRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill?: string,
  stroke?: string,
  strokeWidth: number = 1
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
};

// Canvas绘制左侧圆角矩形（右侧直角）
const drawCanvasLeftRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill?: string,
  stroke?: string,
  strokeWidth: number = 1
) => {
  ctx.beginPath();
  // 左上角圆角
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width, y); // 右上角直角
  ctx.lineTo(x + width, y + height); // 右下角直角
  ctx.lineTo(x + radius, y + height); // 左下角开始圆角
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius); // 左下圆角
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y); // 左上圆角
  ctx.closePath();
  
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
};

// Canvas绘制皇冠图标（空心）
const drawCanvasCrown = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1; // 更细的边框
  ctx.lineJoin = 'round';
  ctx.beginPath();
  
  // 简化的皇冠形状
  const h = size;
  const w = size * 1.2;
  
  // 从左下角开始
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + h * 0.5); // 左边
  ctx.lineTo(x + w * 0.2, y + h * 0.7); // 左侧斜边
  ctx.lineTo(x + w * 0.35, y); // 左尖角
  ctx.lineTo(x + w * 0.5, y + h * 0.5); // 中间斜边
  ctx.lineTo(x + w * 0.65, y); // 右尖角
  ctx.lineTo(x + w * 0.8, y + h * 0.7); // 右侧斜边
  ctx.lineTo(x + w, y + h * 0.5); // 右边
  ctx.lineTo(x + w, y + h); // 右下角
  ctx.closePath();
  ctx.stroke();
  
  ctx.restore();
};

// Canvas绘制边框装饰
const drawCanvasBorder = (
  ctx: CanvasRenderingContext2D,
  skin: typeof SKINS['tech-blue'],
  width: number,
  height: number
) => {
  const primaryColor = skin.primaryColor;
  const cornerSize = 16;
  const margin = 12;
  const lineWidth = 1.5;
  
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  
  // 左上角
  ctx.beginPath();
  ctx.moveTo(margin, margin + cornerSize);
  ctx.lineTo(margin, margin);
  ctx.lineTo(margin + cornerSize, margin);
  ctx.stroke();
  
  // 右上角
  ctx.beginPath();
  ctx.moveTo(width - margin - cornerSize, margin);
  ctx.lineTo(width - margin, margin);
  ctx.lineTo(width - margin, margin + cornerSize);
  ctx.stroke();
  
  // 左下角
  ctx.beginPath();
  ctx.moveTo(margin, height - margin - cornerSize);
  ctx.lineTo(margin, height - margin);
  ctx.lineTo(margin + cornerSize, height - margin);
  ctx.stroke();
  
  // 右下角
  ctx.beginPath();
  ctx.moveTo(width - margin - cornerSize, height - margin);
  ctx.lineTo(width - margin, height - margin);
  ctx.lineTo(width - margin, height - margin - cornerSize);
  ctx.stroke();
};

// Canvas绘制桌位牌
const drawTableCardToCanvas = (
  canvas: HTMLCanvasElement,
  table: Table,
  config: CardConfig,
  skin: typeof SKINS['tech-blue'],
  logoUrl: string,
  activityName: string
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const scale = CARD_SCALE;
  const width = CARD_PIXEL_WIDTH * scale;
  const height = CARD_PIXEL_HEIGHT * scale;
  
  canvas.width = width;
  canvas.height = height;
  
  // 缩放上下文
  ctx.scale(scale, scale);
  
  // 1. 绘制渐变背景
  drawCanvasGradientBackground(ctx, skin, CARD_PIXEL_WIDTH, CARD_PIXEL_HEIGHT);
  
  // 2. 绘制边框装饰
  drawCanvasBorder(ctx, skin, CARD_PIXEL_WIDTH, CARD_PIXEL_HEIGHT);
  
  let currentY = 30;
  
  // 3. Logo（如果有）
  if (logoUrl) {
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    try {
      // 同步绘制logo（如果已加载）
      const logoHeight = 24;
      const logoWidth = 64;
      const logoX = (CARD_PIXEL_WIDTH - logoWidth) / 2;
      ctx.drawImage(logoImg, logoX, currentY, logoWidth, logoHeight);
      currentY += logoHeight + 12;
    } catch (e) {
      console.warn('绘制Logo失败', e);
    }
  }
  
  // 4. 活动主题
  ctx.font = 'bold 20px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = skin.textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const theme = config.theme || activityName;
  ctx.fillText(theme, CARD_PIXEL_WIDTH / 2, currentY);
  currentY += 28;
  
  // 5. 副标题
  if (config.subtitle) {
    ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(config.subtitle, CARD_PIXEL_WIDTH / 2, currentY);
    currentY += 20;
  }
  
  // 6. 桌号徽章 - 使用最大圆角
  currentY += 10;
  const badgeWidth = 100;
  const badgeHeight = 36;
  const badgeX = (CARD_PIXEL_WIDTH - badgeWidth) / 2;
  const badgeRadius = badgeHeight / 2; // 最大圆角
  
  // 徽章背景
  drawCanvasRoundedRect(
    ctx, 
    badgeX, 
    currentY, 
    badgeWidth, 
    badgeHeight, 
    badgeRadius,
    skin.primaryColor
  );
  
  // 桌号文字
  ctx.font = 'bold 24px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(table.name, CARD_PIXEL_WIDTH / 2, currentY + badgeHeight / 2);
  currentY += badgeHeight + 16;
  
  // 7. 分隔线
  ctx.strokeStyle = skin.primaryColor;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(40, currentY);
  ctx.lineTo(CARD_PIXEL_WIDTH - 40, currentY);
  ctx.stroke();
  ctx.globalAlpha = 1;
  currentY += 16;
  
  // 8. 桌长信息
  const tableLeader = table.persons.length > 0 ? table.persons[0] : null;
  if (tableLeader) {
    // 绘制皇冠图标 - 与文字水平对齐
    const crownX = CARD_PIXEL_WIDTH / 2 - 65; // 往左移动
    const crownY = currentY - 6; // 与文字垂直居中对齐
    drawCanvasCrown(ctx, crownX, crownY, 10, skin.accentColor || '#fbbf24');
    
    ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('桌长', CARD_PIXEL_WIDTH / 2 - 30, currentY);
    
    ctx.font = 'bold 14px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = skin.textColor;
    ctx.fillText(tableLeader.name, CARD_PIXEL_WIDTH / 2 + 5, currentY);
    
    if (tableLeader.company) {
      const companyShort = tableLeader.companyShort || extractCompanyShortName(tableLeader.company);
      ctx.font = '10px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`· ${companyShort}`, CARD_PIXEL_WIDTH / 2 + 50, currentY);
    }
    currentY += 20;
  }
  
  // 9. 座位列表
  const capacity = table.capacity;
  const startFromLeader = capacity % 2 === 0;
  const seatLabelPersons = startFromLeader ? table.persons : table.persons.slice(1);
  const startNumber = startFromLeader ? 1 : 2;
  
  if (seatLabelPersons.length > 0) {
    const cardMargin = 20;
    const cardGap = 8;
    const cardWidth = (CARD_PIXEL_WIDTH - cardMargin * 2 - cardGap) / 2;
    const cardHeight = 48;
    const cols = 2;
    const seatCardRadius = 8; // 座位卡片圆角
    
    seatLabelPersons.forEach((person, index) => {
      const seatNumber = startNumber + index;
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const x = cardMargin + col * (cardWidth + cardGap);
      const y = currentY + row * (cardHeight + 6);
      
      if (y + cardHeight > CARD_PIXEL_HEIGHT - 60) return;
      
      const isLeader = seatNumber === 1;
      
      // 座位卡片背景 - 透明，只保留边框
      drawCanvasRoundedRect(
        ctx,
        x,
        y,
        cardWidth,
        cardHeight,
        seatCardRadius,
        undefined, // 不填充背景
        skin.accentColor || skin.primaryColor,
        0.5
      );
      
      // 座位号区域 - 左侧圆角，右侧直角
      const seatNumWidth = 28;
      // 桌长座位号使用主色，其他座位号使用浅色背景
      let seatNumBg: string;
      if (isLeader) {
        seatNumBg = skin.primaryColor;
      } else {
        // 非桌长座位号使用更明显的浅色背景
        // 根据皮肤主色调生成对应的浅色背景
        if (skin.primaryColor === '#2563eb') {
          seatNumBg = '#dbeafe'; // blue-100
        } else if (skin.primaryColor === '#7c3aed') {
          seatNumBg = '#ede9fe'; // violet-100
        } else if (skin.primaryColor === '#d97706') {
          seatNumBg = '#fef3c7'; // amber-100
        } else {
          seatNumBg = '#fce7f3'; // pink-100
        }
      }
      drawCanvasLeftRoundedRect(
        ctx,
        x,
        y,
        seatNumWidth,
        cardHeight,
        seatCardRadius, // 与座位卡片圆角一致
        seatNumBg
      );
      
      // 桌长座位号显示皇冠
      if (isLeader) {
        drawCanvasCrown(ctx, x + 8, y + 10, 8, '#fbbf24');
      }
      
      // 座位号文字
      ctx.font = 'bold 14px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = isLeader ? '#ffffff' : (skin.seatNumberColor || '#3b82f6');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(seatNumber), x + seatNumWidth / 2, y + cardHeight / 2 + (isLeader ? 6 : 0));
      
      // 姓名和公司 - 居中对齐
      const nameAreaX = x + seatNumWidth;
      const nameAreaWidth = cardWidth - seatNumWidth - (person.tags.length > 0 ? 20 : 0);
      const nameCenterX = nameAreaX + nameAreaWidth / 2;
      
      // 姓名 - 居中（超过3个字使用较小字号）
      const nameFontSize = person.name.length > 3 ? 11 : 13;
      ctx.font = `bold ${nameFontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = isLeader ? '#d97706' : skin.textColor;
      ctx.textAlign = 'center';
      ctx.fillText(person.name.substring(0, 5), nameCenterX, y + 18);
      
      // 公司简称 - 居中
      if (person.company) {
        const companyShort = person.companyShort || extractCompanyShortName(person.company);
        ctx.font = '10px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(companyShort.substring(0, 8), nameCenterX, y + 34);
      }
      
      // 标签（如果有）
      if (person.tags.length > 0) {
        const tagInfo = formatTagForDisplay(person.tags[0]);
        if (tagInfo) {
          const tagX = x + cardWidth - 20;
          
          ctx.strokeStyle = skin.accentColor || skin.primaryColor;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(tagX, y + 4);
          ctx.lineTo(tagX, y + cardHeight - 4);
          ctx.stroke();
          
          ctx.fillStyle = skin.primaryColor;
          ctx.textAlign = 'center';
          
          if (tagInfo.isVertical) {
            // 英文标签整体旋转90度
            ctx.save();
            ctx.translate(tagX + 8, y + cardHeight / 2);
            ctx.rotate(Math.PI / 2);
            ctx.font = 'bold 9px "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.fillText(tagInfo.text, 0, 0);
            ctx.restore();
          } else {
            // 中文标签竖向排列（紧凑）
            ctx.font = '9px "PingFang SC", "Microsoft YaHei", sans-serif';
            tagInfo.text.split('').forEach((char, i) => {
              ctx.fillText(char, tagX + 8, y + 14 + i * 10);
            });
          }
        }
      }
    });
  }
  
  // 10. 底部信息
  if (config.footer) {
    const footerY = CARD_PIXEL_HEIGHT - 30;
    const footerWidth = ctx.measureText(config.footer).width + 40;
    const footerHeight = 20;
    const footerRadius = 16; // 圆角
    
    // 底部背景 - 最大圆角
    drawCanvasRoundedRect(
      ctx,
      (CARD_PIXEL_WIDTH - footerWidth) / 2,
      footerY - footerHeight / 2,
      footerWidth,
      footerHeight,
      footerRadius,
      skin.seatBg || '#dbeafe',
      skin.accentColor || skin.primaryColor,
      0.5
    );
    
    // 底部文字
    ctx.font = '10px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.footer, CARD_PIXEL_WIDTH / 2, footerY);
  }
};

// 异步绘制桌位牌（支持Logo加载）
const drawTableCardToCanvasAsync = async (
  canvas: HTMLCanvasElement,
  table: Table,
  config: CardConfig,
  skin: typeof SKINS['tech-blue'],
  logoUrl: string,
  activityName: string
): Promise<void> => {
  // 如果有Logo，先加载
  if (logoUrl) {
    try {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // Logo加载完成后绘制
          drawTableCardToCanvasWithLogo(canvas, table, config, skin, img, activityName);
          resolve();
        };
        img.onerror = () => {
          // Logo加载失败，不带Logo绘制
          drawTableCardToCanvas(canvas, table, config, skin, '', activityName);
          resolve();
        };
        img.src = logoUrl;
      });
    } catch (e) {
      drawTableCardToCanvas(canvas, table, config, skin, '', activityName);
    }
  } else {
    drawTableCardToCanvas(canvas, table, config, skin, '', activityName);
  }
};

// 带Logo的绘制
const drawTableCardToCanvasWithLogo = (
  canvas: HTMLCanvasElement,
  table: Table,
  config: CardConfig,
  skin: typeof SKINS['tech-blue'],
  logoImg: HTMLImageElement,
  activityName: string
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const scale = CARD_SCALE;
  const width = CARD_PIXEL_WIDTH * scale;
  const height = CARD_PIXEL_HEIGHT * scale;
  
  canvas.width = width;
  canvas.height = height;
  
  // 缩放上下文
  ctx.scale(scale, scale);
  
  // 1. 绘制渐变背景
  drawCanvasGradientBackground(ctx, skin, CARD_PIXEL_WIDTH, CARD_PIXEL_HEIGHT);
  
  // 2. 绘制边框装饰
  drawCanvasBorder(ctx, skin, CARD_PIXEL_WIDTH, CARD_PIXEL_HEIGHT);
  
  let currentY = 30;
  
  // 3. Logo - 保持原始比例
  const maxLogoHeight = 32; // 放大
  const maxLogoWidth = 100; // 放大
  const logoImgWidth = logoImg.width;
  const logoImgHeight = logoImg.height;
  
  // 计算保持比例的实际尺寸
  let logoWidth, logoHeight;
  if (logoImgWidth / logoImgHeight > maxLogoWidth / maxLogoHeight) {
    // 宽度受限
    logoWidth = Math.min(logoImgWidth, maxLogoWidth);
    logoHeight = logoWidth * (logoImgHeight / logoImgWidth);
  } else {
    // 高度受限
    logoHeight = Math.min(logoImgHeight, maxLogoHeight);
    logoWidth = logoHeight * (logoImgWidth / logoImgHeight);
  }
  
  const logoX = (CARD_PIXEL_WIDTH - logoWidth) / 2;
  ctx.drawImage(logoImg, logoX, currentY, logoWidth, logoHeight);
  currentY += logoHeight + 12;
  
  // 4. 活动主题
  ctx.font = 'bold 20px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = skin.textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const theme = config.theme || activityName;
  ctx.fillText(theme, CARD_PIXEL_WIDTH / 2, currentY);
  currentY += 28;
  
  // 5. 副标题
  if (config.subtitle) {
    ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(config.subtitle, CARD_PIXEL_WIDTH / 2, currentY);
    currentY += 20;
  }
  
  // 6. 桌号徽章 - 最大圆角
  currentY += 10;
  const badgeWidth = 100;
  const badgeHeight = 36;
  const badgeX = (CARD_PIXEL_WIDTH - badgeWidth) / 2;
  const badgeRadius = badgeHeight / 2;
  
  drawCanvasRoundedRect(
    ctx, 
    badgeX, 
    currentY, 
    badgeWidth, 
    badgeHeight, 
    badgeRadius,
    skin.primaryColor
  );
  
  ctx.font = 'bold 24px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(table.name, CARD_PIXEL_WIDTH / 2, currentY + badgeHeight / 2);
  currentY += badgeHeight + 16;
  
  // 7. 分隔线
  ctx.strokeStyle = skin.primaryColor;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(40, currentY);
  ctx.lineTo(CARD_PIXEL_WIDTH - 40, currentY);
  ctx.stroke();
  ctx.globalAlpha = 1;
  currentY += 16;
  
  // 8. 桌长信息
  const tableLeader = table.persons.length > 0 ? table.persons[0] : null;
  if (tableLeader) {
    // 绘制皇冠图标 - 与文字水平对齐
    const crownX = CARD_PIXEL_WIDTH / 2 - 65; // 往左移动
    const crownY = currentY - 6; // 与文字垂直居中对齐
    drawCanvasCrown(ctx, crownX, crownY, 10, skin.accentColor || '#fbbf24');
    
    ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('桌长', CARD_PIXEL_WIDTH / 2 - 30, currentY);
    
    ctx.font = 'bold 14px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = skin.textColor;
    ctx.fillText(tableLeader.name, CARD_PIXEL_WIDTH / 2 + 5, currentY);
    
    if (tableLeader.company) {
      const companyShort = tableLeader.companyShort || extractCompanyShortName(tableLeader.company);
      ctx.font = '10px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`· ${companyShort}`, CARD_PIXEL_WIDTH / 2 + 50, currentY);
    }
    currentY += 20;
  }
  
  // 9. 座位列表
  const capacity = table.capacity;
  const startFromLeader = capacity % 2 === 0;
  const seatLabelPersons = startFromLeader ? table.persons : table.persons.slice(1);
  const startNumber = startFromLeader ? 1 : 2;
  
  if (seatLabelPersons.length > 0) {
    const cardMargin = 20;
    const cardGap = 8;
    const cardWidth = (CARD_PIXEL_WIDTH - cardMargin * 2 - cardGap) / 2;
    const cardHeight = 48;
    const cols = 2;
    const seatCardRadius = 8; // 座位卡片圆角
    
    seatLabelPersons.forEach((person, index) => {
      const seatNumber = startNumber + index;
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const x = cardMargin + col * (cardWidth + cardGap);
      const y = currentY + row * (cardHeight + 6);
      
      if (y + cardHeight > CARD_PIXEL_HEIGHT - 60) return;
      
      const isLeader = seatNumber === 1;
      
      // 座位卡片背景 - 透明，只保留边框
      drawCanvasRoundedRect(
        ctx,
        x,
        y,
        cardWidth,
        cardHeight,
        seatCardRadius,
        undefined, // 不填充背景
        skin.accentColor || skin.primaryColor,
        0.5
      );
      
      // 座位号区域 - 左侧圆角，右侧直角
      const seatNumWidth = 28;
      // 桌长座位号使用主色，其他座位号使用浅色背景
      let seatNumBg: string;
      if (isLeader) {
        seatNumBg = skin.primaryColor;
      } else {
        // 非桌长座位号使用更明显的浅色背景
        // 根据皮肤主色调生成对应的浅色背景
        if (skin.primaryColor === '#2563eb') {
          seatNumBg = '#dbeafe'; // blue-100
        } else if (skin.primaryColor === '#7c3aed') {
          seatNumBg = '#ede9fe'; // violet-100
        } else if (skin.primaryColor === '#d97706') {
          seatNumBg = '#fef3c7'; // amber-100
        } else {
          seatNumBg = '#fce7f3'; // pink-100
        }
      }
      drawCanvasLeftRoundedRect(
        ctx,
        x,
        y,
        seatNumWidth,
        cardHeight,
        seatCardRadius, // 与座位卡片圆角一致
        seatNumBg
      );
      
      // 桌长座位号显示皇冠
      if (isLeader) {
        drawCanvasCrown(ctx, x + 8, y + 10, 8, '#fbbf24');
      }
      
      ctx.font = 'bold 14px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = isLeader ? '#ffffff' : (skin.seatNumberColor || '#3b82f6');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(seatNumber), x + seatNumWidth / 2, y + cardHeight / 2 + (isLeader ? 6 : 0));
      
      // 姓名和公司 - 居中对齐
      const nameAreaX = x + seatNumWidth;
      const nameAreaWidth = cardWidth - seatNumWidth - (person.tags.length > 0 ? 20 : 0);
      const nameCenterX = nameAreaX + nameAreaWidth / 2;
      
      // 姓名 - 居中
      ctx.font = 'bold 13px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = isLeader ? '#d97706' : skin.textColor;
      ctx.textAlign = 'center';
      ctx.fillText(person.name.substring(0, 5), nameCenterX, y + 18);
      
      if (person.company) {
        const companyShort = person.companyShort || extractCompanyShortName(person.company);
        ctx.font = '10px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(companyShort.substring(0, 8), nameCenterX, y + 34);
      }
      
      if (person.tags.length > 0) {
        const tagInfo = formatTagForDisplay(person.tags[0]);
        if (tagInfo) {
          const tagX = x + cardWidth - 20;
          
          ctx.strokeStyle = skin.accentColor || skin.primaryColor;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(tagX, y + 4);
          ctx.lineTo(tagX, y + cardHeight - 4);
          ctx.stroke();
          
          ctx.fillStyle = skin.primaryColor;
          ctx.textAlign = 'center';
          
          if (tagInfo.isVertical) {
            // 英文标签整体旋转90度
            ctx.save();
            ctx.translate(tagX + 8, y + cardHeight / 2);
            ctx.rotate(Math.PI / 2);
            ctx.font = 'bold 9px "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.fillText(tagInfo.text, 0, 0);
            ctx.restore();
          } else {
            // 中文标签竖向排列（紧凑）
            ctx.font = '9px "PingFang SC", "Microsoft YaHei", sans-serif';
            tagInfo.text.split('').forEach((char, i) => {
              ctx.fillText(char, tagX + 8, y + 14 + i * 10);
            });
          }
        }
      }
    });
  }
  
  // 10. 底部信息
  if (config.footer) {
    const footerY = CARD_PIXEL_HEIGHT - 30;
    const footerWidth = ctx.measureText(config.footer).width + 40;
    const footerHeight = 20;
    const footerRadius = 16; // 圆角
    
    drawCanvasRoundedRect(
      ctx,
      (CARD_PIXEL_WIDTH - footerWidth) / 2,
      footerY - footerHeight / 2,
      footerWidth,
      footerHeight,
      footerRadius,
      skin.seatBg || '#dbeafe',
      skin.accentColor || skin.primaryColor,
      0.5
    );
    
    ctx.font = '10px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.footer, CARD_PIXEL_WIDTH / 2, footerY);
  }
};

export const TableCardGenerator: React.FC<TableCardGeneratorProps> = ({
  isOpen,
  onClose,
  activityName,
  tables,
}) => {
  const [selectedTable, setSelectedTable] = useState<Table | null>(
    tables.length > 0 ? tables[0] : null
  );
  const [showConfig, setShowConfig] = useState(true);
  const [selectedSkin, setSelectedSkin] = useState<SkinKey>('tech-blue');
  const [config, setConfig] = useState<CardConfig>({
    theme: 'IC豫商会2026春茗盛典',
    subtitle: '凝芯聚力 豫见未来',
    footer: '中国·深圳 | 大中华喜来登国际酒店',
  });
  const [logoUrl, setLogoUrl] = useState<string>(() => getCachedLogo());
  const cardRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // 处理LOGO上传
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setLogoUrl(url);
        cacheLogo(url); // 缓存LOGO
      };
      reader.readAsDataURL(file);
    }
  };

  // 清除LOGO
  const handleClearLogo = () => {
    setLogoUrl('');
    cacheLogo(''); // 清除缓存
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  // 获取桌长（第一个入座的人）
  const getTableLeader = (table: Table | null): Person | null => {
    if (!table || table.persons.length === 0) return null;
    return table.persons[0];
  };

  // 获取座位标签人员（根据座位数奇偶性决定）
  const getSeatLabelPersons = (table: Table | null): Person[] => {
    if (!table || table.persons.length === 0) return [];
    
    const capacity = table.capacity;
    
    // 偶数座位：桌长也显示在座位标签上，从1开始
    if (capacity % 2 === 0) {
      return table.persons; // 包含桌长，从索引0开始
    }
    
    // 奇数座位：桌长不显示在座位标签上，从2开始
    return table.persons.slice(1);
  };

  // 获取座位标签的起始编号
  const getSeatStartNumber = (table: Table | null): number => {
    if (!table) return 1;
    // 偶数座位从1开始，奇数座位从2开始
    return table.capacity % 2 === 0 ? 1 : 2;
  };

  if (!isOpen) return null;

  const skin = SKINS[selectedSkin];

  const handleDownload = async () => {
    if (!selectedTable) return;

    try {
      const skin = SKINS[selectedSkin];
      
      // 创建离屏Canvas
      const canvas = document.createElement('canvas');
      
      // 使用Canvas绘制桌位牌（支持中文）
      await drawTableCardToCanvasAsync(canvas, selectedTable, config, skin, logoUrl, activityName);
      
      // 下载PNG
      const link = document.createElement('a');
      link.download = `桌位牌_${selectedTable.name}_${skin.name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('生成桌位牌失败:', error);
    }
  };

  const handleDownloadAll = async () => {
    const skin = SKINS[selectedSkin];
    
    for (const table of tables) {
      try {
        // 创建离屏Canvas
        const canvas = document.createElement('canvas');
        
        // 使用Canvas绘制桌位牌
        await drawTableCardToCanvasAsync(canvas, table, config, skin, logoUrl, activityName);
        
        // 下载PNG
        const link = document.createElement('a');
        link.download = `桌位牌_${table.name}_${skin.name}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`生成桌位牌 ${table.name} 失败:`, error);
      }
    }
  };

  // PDF导出当前桌位牌（使用Canvas绘制中文）
  const handleExportPDF = async () => {
    if (!selectedTable) return;

    try {
      const skin = SKINS[selectedSkin];
      
      // 创建离屏Canvas
      const canvas = document.createElement('canvas');
      
      // 使用Canvas绘制桌位牌（支持中文）
      await drawTableCardToCanvasAsync(canvas, selectedTable, config, skin, logoUrl, activityName);
      
      // 创建PDF文档，使用卡片尺寸
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [CARD_WIDTH, CARD_HEIGHT],
      });

      // 将Canvas转为图片添加到PDF
      const imgData = canvas.toDataURL('image/png', 1.0);
      doc.addImage(imgData, 'PNG', 0, 0, CARD_WIDTH, CARD_HEIGHT);

      // 保存PDF
      doc.save(`桌位牌_${selectedTable.name}_${skin.name}.pdf`);
    } catch (error) {
      console.error('生成PDF失败:', error);
    }
  };

  // PDF导出全部桌位牌（使用Canvas绘制中文）
  const handleExportAllPDF = async () => {
    if (tables.length === 0) return;

    try {
      const skin = SKINS[selectedSkin];
      
      // 创建PDF文档，每页一个桌位牌
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [CARD_WIDTH, CARD_HEIGHT],
      });

      // 创建离屏Canvas
      const canvas = document.createElement('canvas');

      for (let index = 0; index < tables.length; index++) {
        const table = tables[index];
        
        if (index > 0) {
          doc.addPage([CARD_WIDTH, CARD_HEIGHT], 'portrait');
        }
        
        // 使用Canvas绘制每个桌位牌
        await drawTableCardToCanvasAsync(canvas, table, config, skin, logoUrl, activityName);
        
        // 将Canvas转为图片添加到PDF
        const imgData = canvas.toDataURL('image/png', 1.0);
        doc.addImage(imgData, 'PNG', 0, 0, CARD_WIDTH, CARD_HEIGHT);
      }

      // 保存PDF
      doc.save(`桌位牌_全部_${skin.name}.pdf`);
    } catch (error) {
      console.error('生成PDF失败:', error);
    }
  };

  const tableLeader = getTableLeader(selectedTable);
  const seatLabelPersons = getSeatLabelPersons(selectedTable);
  const seatStartNumber = getSeatStartNumber(selectedTable);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">生成桌位牌</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                showConfig ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Settings size={16} />
              配置面板
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(95vh-130px)]">
          {/* Left: Configuration Panel */}
          {showConfig && (
            <div className="w-80 border-r border-slate-700 p-4 overflow-y-auto">
              {/* Skin Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Palette size={16} />
                  选择皮肤
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(SKINS) as SkinKey[]).map((key) => {
                    const s = SKINS[key];
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedSkin(key)}
                        className={`px-3 py-2 rounded-lg transition-all text-sm flex items-center gap-2 ${
                          selectedSkin === key
                            ? 'ring-2 ring-blue-500 bg-slate-600'
                            : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      >
                        <div 
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ background: s.primaryGradient }}
                        />
                        <span className="text-white">{s.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logo Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <ImagePlus size={16} />
                  LOGO
                </label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <ImagePlus size={16} />
                    上传LOGO
                  </button>
                  {logoUrl && (
                    <button
                      onClick={handleClearLogo}
                      className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                {logoUrl && (
                  <div className="mt-2 p-2 bg-slate-700/50 rounded-lg">
                    <img src={logoUrl} alt="Logo预览" className="h-12 mx-auto object-contain" />
                  </div>
                )}
              </div>

              {/* Table Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  选择桌位
                </label>
                <div className="flex flex-wrap gap-2">
                  {tables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => setSelectedTable(table)}
                      className={`px-3 py-1.5 rounded-lg transition-all text-sm ${
                        selectedTable?.id === table.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {table.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Config Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    活动主题
                  </label>
                  <input
                    type="text"
                    value={config.theme}
                    onChange={(e) => setConfig({ ...config, theme: e.target.value })}
                    placeholder="例如：2024年度商会年会"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    副标题
                  </label>
                  <input
                    type="text"
                    value={config.subtitle}
                    onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                    placeholder="例如：VIP嘉宾专席"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    底部信息
                  </label>
                  <input
                    type="text"
                    value={config.footer}
                    onChange={(e) => setConfig({ ...config, footer: e.target.value })}
                    placeholder="例如：主办单位名称"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Preview Info */}
              {selectedTable && (
                <div className="mt-6 p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-slate-400 text-xs mb-1">当前桌位信息</p>
                  <p className="text-white text-sm mb-2">
                    {selectedTable.name} - {selectedTable.persons.length}/{selectedTable.capacity} 人
                  </p>
                  {tableLeader && (
                    <div className="flex items-center gap-2 text-sm">
                      <Crown className="text-amber-400" size={14} />
                      <span className="text-slate-300">桌长：</span>
                      <span className="text-white font-medium">{tableLeader.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Right: Card Preview */}
          <div className="flex-1 p-6 overflow-y-auto flex justify-center items-start">
            {selectedTable && (
              <div
                ref={cardRef}
                className="relative rounded-2xl overflow-hidden shadow-2xl"
                style={{ 
                  width: '300px', 
                  height: '660px',
                  background: skin.gradient,
                }}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-15">
                  <svg width="100%" height="100%" className="absolute inset-0">
                    <defs>
                      <linearGradient id={`techLine-${selectedSkin}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={skin.primaryColor} stopOpacity="0" />
                        <stop offset="50%" stopColor={skin.primaryColor} stopOpacity="0.6" />
                        <stop offset="100%" stopColor={skin.primaryColor} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="60" x2="100%" y2="60" stroke={`url(#techLine-${selectedSkin})`} strokeWidth="0.5" />
                    <line x1="0" y1="120" x2="100%" y2="120" stroke={`url(#techLine-${selectedSkin})`} strokeWidth="0.3" />
                    <line x1="0" y1="180" x2="100%" y2="180" stroke={`url(#techLine-${selectedSkin})`} strokeWidth="0.5" />
                    <line x1="30" y1="0" x2="30" y2="100%" stroke={`url(#techLine-${selectedSkin})`} strokeWidth="0.3" />
                    <line x1="270" y1="0" x2="270" y2="100%" stroke={`url(#techLine-${selectedSkin})`} strokeWidth="0.3" />
                  </svg>
                </div>

                {/* Corner Decorations */}
                <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2" style={{ borderColor: `${skin.primaryColor}60` }} />
                <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2" style={{ borderColor: `${skin.primaryColor}60` }} />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2" style={{ borderColor: `${skin.primaryColor}60` }} />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2" style={{ borderColor: `${skin.primaryColor}60` }} />

                {/* Content */}
                <div className="relative h-full flex flex-col p-5 pb-6 overflow-hidden">
                  {/* Logo */}
                  {logoUrl && (
                    <div className="flex justify-center mb-1">
                      <img 
                        src={logoUrl} 
                        alt="Logo" 
                        className="h-8 object-contain"
                        crossOrigin="anonymous"
                      />
                    </div>
                  )}

                  {/* Theme */}
                  <div className="text-center mb-0.5">
                    {config.theme ? (
                      <p 
                        className="text-base font-bold tracking-wide"
                        style={{ color: skin.textColor, textShadow: `0 0 20px ${skin.glowColor}` }}
                      >
                        {config.theme}
                      </p>
                    ) : (
                      <p 
                        className="text-base font-bold tracking-wide opacity-60"
                        style={{ color: skin.textColor }}
                      >
                        {activityName}
                      </p>
                    )}
                  </div>

                  {/* Subtitle */}
                  {config.subtitle && (
                    <div className="text-center mb-0.5">
                      <p className="text-slate-500 text-xs tracking-wider">
                        {config.subtitle}
                      </p>
                    </div>
                  )}

                  {/* Table Number */}
                  <div className="flex justify-center mb-2 mt-1">
                    <div 
                      className="px-6 py-1.5 rounded-2xl"
                      style={{ 
                        background: skin.primaryGradient,
                        boxShadow: `0 4px 20px ${skin.glowColor}`
                      }}
                    >
                      <p 
                        className="text-white text-3xl font-bold tracking-wider"
                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                      >
                        {selectedTable.name}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-2 mb-1.5 px-4">
                    <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${skin.primaryColor}60, transparent)` }} />
                  </div>

                  {/* Table Leader - 始终显示独立区域 */}
                  {tableLeader && (
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      <Crown style={{ color: skin.accentColor }} size={12} />
                      <span className="text-slate-500 text-xs">桌长</span>
                      <span className="font-bold text-sm" style={{ color: skin.textColor }}>{tableLeader.name}</span>
                      {tableLeader.company && (
                        <span className="text-slate-400 text-[10px]">
                          · {tableLeader.companyShort || extractCompanyShortName(tableLeader.company)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Seat Labels */}
                  <div className="flex-1 overflow-hidden" style={{ maxHeight: '480px' }}>
                    {seatLabelPersons.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        {seatLabelPersons.map((person, index) => {
                          // 获取标签（简化处理，支持英文竖向）
                          const tagInfo = person.tags.length > 0 ? formatTagForDisplay(person.tags[0]) : null;
                          const seatNumber = seatStartNumber + index; // 根据奇偶座位决定起始编号
                          const companyShort = person.companyShort || extractCompanyShortName(person.company || '');
                          // 判断是否为桌长（座位号为1）
                          const isLeader = seatNumber === 1;
                          
                          return (
                            <div
                              key={person.id}
                              className="flex items-center rounded-lg overflow-hidden border"
                              style={{ 
                                borderColor: skin.seatBorder,
                                height: '46px'
                              }}
                            >
                              {/* 左侧：座位号 */}
                              <div 
                                className="w-7 h-11 flex flex-col items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ 
                                  background: isLeader ? skin.primaryGradient : skin.seatNumberBg,
                                  color: isLeader ? '#ffffff' : skin.seatNumberColor
                                }}
                              >
                                {isLeader && <Crown size={8} style={{ color: '#fbbf24' }} />}
                                <span>{seatNumber}</span>
                              </div>
                              
                              {/* 中间：姓名 + 公司简称（横向） */}
                              <div className="flex-1 px-0.5 py-1.5 flex flex-col items-center justify-center min-w-0">
                                <p 
                                  className={`text-sm font-semibold text-center leading-tight w-full truncate ${isLeader ? 'text-amber-600' : ''}`}
                                  style={isLeader ? {} : { color: skin.textColor }}
                                >
                                  {person.name}
                                </p>
                                {companyShort && (
                                  <p className="text-slate-400 text-[10px] text-center truncate w-full mt-0.5">
                                    {companyShort}
                                  </p>
                                )}
                              </div>
                              
                              {/* 右侧：身份标签（竖向） */}
                              {tagInfo ? (
                                <div 
                                  className="w-7 h-11 flex flex-col items-center justify-center text-[10px] font-medium flex-shrink-0 border-l overflow-hidden"
                                  style={{ 
                                    borderColor: skin.seatBorder,
                                    color: skin.primaryColor
                                  }}
                                >
                                  {tagInfo.isVertical ? (
                                    // 英文标签整体旋转90度显示
                                    <span 
                                      className="font-semibold"
                                      style={{ 
                                        writingMode: 'vertical-rl',
                                        textOrientation: 'mixed',
                                        letterSpacing: '1px'
                                      }}
                                    >
                                      {tagInfo.text}
                                    </span>
                                  ) : (
                                    // 中文标签竖向排列（紧凑）
                                    tagInfo.text.split('').map((char, i) => (
                                      <span key={i} className="leading-none" style={{ lineHeight: '11px' }}>{char}</span>
                                    ))
                                  )}
                                </div>
                              ) : (
                                <div 
                                  className="w-6 h-11 flex items-center justify-center flex-shrink-0 border-l"
                                  style={{ borderColor: skin.seatBorder }}
                                >
                                  <span className="text-slate-300 text-[10px]">-</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-slate-400">
                          <Users className="mx-auto mb-2 opacity-50" size={32} />
                          <p className="text-sm">{selectedTable.persons.length > 0 ? '仅桌长一人' : '暂无入座人员'}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {config.footer && (
                    <div className="mt-3 text-center">
                      <div 
                        className="inline-block px-4 py-1.5 rounded-full border"
                        style={{ 
                          background: skin.seatBg,
                          borderColor: skin.seatBorder
                        }}
                      >
                        <p className="text-slate-400 text-xs">{config.footer}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            关闭
          </button>
          <button
            onClick={handleDownload}
            disabled={!selectedTable}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            下载当前
          </button>
          <button
            onClick={handleDownloadAll}
            disabled={tables.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            下载全部
          </button>
          <button
            onClick={handleExportPDF}
            disabled={!selectedTable}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={18} />
            导出PDF当前
          </button>
          <button
            onClick={handleExportAllPDF}
            disabled={tables.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={18} />
            导出PDF全部
          </button>
        </div>
      </div>
    </div>
  );
};
