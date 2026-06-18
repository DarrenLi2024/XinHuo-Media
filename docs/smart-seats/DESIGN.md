# DESIGN.md - 智能排座系统设计规范

> 本文档记录项目的视觉、品牌、布局、交互、体验偏好，确保多轮对话后设计一致性。

## 1. 项目与用户画像

### 1.1 目标用户
- 活动策划人员
- 会议组织者
- 宴会负责人
- 企业行政人员

### 1.2 使用场景
- 年会、晚宴排座
- 会议座位安排
- 婚宴桌位规划
- 商务活动座次

## 2. 品牌与视觉方向

### 2.1 设计风格
- **主题**: 深色科技风
- **定位**: 专业、高效、现代
- **情感**: 稳重、可信赖

### 2.2 视觉层次
1. 主背景: `bg-slate-900` (#0f172a)
2. 卡片背景: `bg-slate-800` (#1e293b)
3. 卡片边框: `border-slate-700` (#334155)
4. 文字主色: `text-white` (#ffffff)
5. 文字次要: `text-slate-400` (#94a3b8)

## 3. Design Tokens

### 3.1 色彩

#### 主色板
| Token | 值 | 用途 |
|-------|-----|------|
| `primary` | `blue-500` (#3b82f6) | 主按钮、链接、强调 |
| `primary-hover` | `blue-600` (#2563eb) | 主按钮悬停 |
| `primary-light` | `blue-500/20` | 标签背景、高亮 |

#### 语义色
| Token | 值 | 用途 |
|-------|-----|------|
| `success` | `green-500` (#22c55e) | 成功状态、已入座 |
| `warning` | `yellow-500` (#eab308) | 警告状态 |
| `danger` | `red-500` (#ef4444) | 删除、危险操作 |
| `info` | `cyan-500` (#06b6d4) | 信息提示 |

#### 功能色
| Token | 值 | 用途 |
|-------|-----|------|
| `locked` | `amber-500` (#f59e0b) | 锁定状态标识 |
| `highlight` | `lime-400` (#a3e635) | 搜索高亮 |
| `tag-vip` | `purple-500` (#a855f7) | VIP 标签 |
| `tag-default` | `slate-500` (#64748b) | 默认标签 |

### 3.2 字体

#### 字体族
```css
font-family: 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
```

#### 字号规范
| Token | Tailwind | 尺寸 | 用途 |
|-------|----------|------|------|
| `xs` | `text-xs` | 12px | 辅助文字、标签 |
| `sm` | `text-sm` | 14px | 次要文字 |
| `base` | `text-base` | 16px | 正文 |
| `lg` | `text-lg` | 18px | 小标题 |
| `xl` | `text-xl` | 20px | 大标题 |
| `2xl` | `text-2xl` | 24px | 页面标题 |

#### 字重
| Token | Tailwind | 值 | 用途 |
|-------|----------|-----|------|
| `normal` | `font-normal` | 400 | 正文 |
| `medium` | `font-medium` | 500 | 标签、按钮 |
| `semibold` | `font-semibold` | 600 | 标题 |
| `bold` | `font-bold` | 700 | 重要标题 |

### 3.3 间距

| Token | Tailwind | 值 | 用途 |
|-------|----------|-----|------|
| `space-xs` | `gap-1` | 4px | 紧凑间距 |
| `space-sm` | `gap-2` | 8px | 元素间距 |
| `space-md` | `gap-3` | 12px | 卡片内间距 |
| `space-lg` | `gap-4` | 16px | 区块间距 |
| `space-xl` | `gap-6` | 24px | 大区块间距 |

### 3.4 圆角

| Token | Tailwind | 值 | 用途 |
|-------|----------|-----|------|
| `radius-sm` | `rounded` | 4px | 小元素 |
| `radius-md` | `rounded-lg` | 8px | 卡片 |
| `radius-lg` | `rounded-xl` | 12px | 大卡片、弹窗 |
| `radius-full` | `rounded-full` | 9999px | 圆形头像、徽章 |

### 3.5 阴影

| Token | Tailwind | 用途 |
|-------|----------|------|
| `shadow-sm` | `shadow-sm` | 卡片阴影 |
| `shadow-md` | `shadow-md` | 弹窗阴影 |
| `shadow-lg` | `shadow-lg` | 浮层阴影 |
| `shadow-glow` | `shadow-blue-500/50` | 聚焦发光 |

## 4. 布局与响应式

### 4.1 整体布局
```
┌─────────────────────────────────────────────────────────┐
│                      Toolbar (顶部工具栏)                 │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  PersonPool  │              桌位区域                     │
│  (未分配人员) │          (TableCard 网格)                │
│   w-80px    │                                          │
│             │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### 4.2 组件尺寸
| 组件 | 宽度 | 高度 |
|------|------|------|
| PersonPool | 320px (w-80) | flex-1 |
| TableCard | min 200px | auto |
| 人员卡片 | 100% | auto |

### 4.3 响应式断点
| 断点 | Tailwind | 宽度 |
|------|----------|------|
| sm | `sm:` | 640px |
| md | `md:` | 768px |
| lg | `lg:` | 1024px |
| xl | `xl:` | 1280px |
| 2xl | `2xl:` | 1536px |

## 5. 组件规范

### 5.1 TableCard 桌位卡片

#### 结构
```
┌─────────────────────────────┐
│ 🪑 A1 (6/8) [🔒] [🔄] [×]   │ ← 标题栏
├─────────────────────────────┤
│ 👤 张三 腾讯 CEO [↑][↓]     │ ← 人员卡片
│ 👤 李四 阿里 CTO [↑][↓]     │
│ ...                         │
└─────────────────────────────┘
```

#### 状态样式
| 状态 | 样式 |
|------|------|
| 正常 | `bg-slate-800 border-slate-700` |
| 悬停 | `border-slate-600` |
| 拖拽经过 | `border-blue-500 bg-blue-500/10` |
| 锁定 | `border-amber-500/50` |
| 已满 | `opacity-60` |

### 5.2 PersonCard 人员卡片

#### 结构
```
┌───────────────────────────────────┐
│ 👤 姓名                            │
│ 🏢 公司简称                        │
│ 🏷️ 标签1 | 标签2                  │
└───────────────────────────────────┘
```

#### 状态样式
| 状态 | 样式 |
|------|------|
| 正常 | `bg-slate-700` |
| 悬停 | `bg-slate-600` |
| 拖拽中 | `opacity-50` |
| 锁定 | `cursor-pointer border-amber-500` |

### 5.3 标签样式

#### 颜色映射
```typescript
const TAG_COLORS: Record<string, string> = {
  'VIP': 'bg-purple-500 text-white',
  '理事': 'bg-blue-500 text-white',
  '嘉宾': 'bg-green-500 text-white',
  '赞助商': 'bg-amber-500 text-white',
  'default': 'bg-slate-500 text-white',
};
```

#### 标签简化
- 超过 4 个字的标签自动简化
- 英文标签竖向排列

### 5.4 弹窗规范

#### 基础弹窗
```jsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700">
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-white">标题</h3>
      <button className="text-slate-400 hover:text-white">×</button>
    </div>
    {/* Content */}
    {/* Footer */}
    <div className="flex justify-end gap-2 mt-6">
      <button className="px-4 py-2 bg-slate-700 rounded-lg">取消</button>
      <button className="px-4 py-2 bg-blue-500 rounded-lg">确认</button>
    </div>
  </div>
</div>
```

## 6. 交互与状态

### 6.1 拖拽交互

#### 视觉反馈
1. **开始拖拽**: 被拖拽元素降低透明度 (`opacity-50`)
2. **拖拽经过**: 目标区域高亮 (`border-blue-500 bg-blue-500/10`)
3. **放置成功**: 动画过渡，元素归位

#### 拖拽约束
- 人员卡片只能在桌位和未分配池之间移动
- 锁定的人员不能拖拽
- 已满的桌位不接受新人员

### 6.2 按钮状态

| 状态 | 样式 |
|------|------|
| 默认 | `bg-blue-500 text-white` |
| 悬停 | `bg-blue-600` |
| 点击 | `bg-blue-700` |
| 禁用 | `bg-slate-600 opacity-50 cursor-not-allowed` |

### 6.3 输入框状态

| 状态 | 样式 |
|------|------|
| 默认 | `bg-slate-700 border-slate-600` |
| 聚焦 | `border-blue-500 ring-1 ring-blue-500` |
| 错误 | `border-red-500` |
| 禁用 | `bg-slate-800 opacity-50` |

### 6.4 加载状态
```jsx
<div className="flex items-center gap-2 text-slate-400">
  <Loader2 className="w-4 h-4 animate-spin" />
  <span>加载中...</span>
</div>
```

## 7. 动效规范

### 7.1 过渡时长
| Token | 值 | 用途 |
|-------|-----|------|
| `fast` | 150ms | 按钮状态 |
| `normal` | 200ms | 卡片悬停 |
| `slow` | 300ms | 弹窗出现 |

### 7.2 动画类
```css
/* 淡入 */
.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}

/* 弹窗缩放 */
.animate-scaleIn {
  animation: scaleIn 0.2s ease-out;
}

/* 拖拽指示 */
.animate-pulse {
  animation: pulse 2s infinite;
}
```

## 8. 可访问性

### 8.1 键盘导航
- `Tab`: 切换焦点
- `Enter`: 确认操作
- `Escape`: 关闭弹窗
- `Space`: 切换复选框

### 8.2 焦点样式
```css
:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

### 8.3 对比度
- 文字与背景对比度 ≥ 4.5:1
- 大标题对比度 ≥ 3:1

## 9. 图标使用规范

### 9.1 图标库
使用 `lucide-react`，统一尺寸：
- 小图标: 16px (`size={16}`)
- 默认图标: 20px (`size={20}`)
- 大图标: 24px (`size={24}`)

### 9.2 常用图标映射
| 功能 | 图标 |
|------|------|
| 人员 | `User` |
| 桌位 | `Users` |
| 锁定 | `Lock` |
| 解锁 | `Unlock` |
| 搜索 | `Search` |
| 导入 | `Upload` |
| 导出 | `Download` |
| 删除 | `Trash2` |
| 移动 | `ArrowRightLeft` |
| 清空 | `UserX` |
| 设置 | `Settings` |
| 关闭 | `X` |

## 10. 素材与实现备注

### 10.1 默认头像
- 使用 `User` 图标作为默认头像
- 背景色: `bg-slate-600`
- 图标色: `text-slate-400`

### 10.2 Canvas 绘制字体
```css
font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif;
```
确保中文在 Canvas 中正确显示。

### 10.3 打印样式
- PDF 导出使用 A4 纸张
- 边距: 10mm
- 字体大小: 12-14pt
