# 大型活动现场智能抽奖管理系统

> 支持 500-1000 人规模的大型活动现场抽奖，完全离线运行，炫酷动态视觉效果

## 项目概述

本系统是一套完整的智能抽奖管理平台，专为大型活动现场设计。支持浏览器独立运行（无需外部数据库），具备后台管理、名单导入、奖项设置、可控中奖逻辑、炫酷动态视觉效果及大屏展示功能。

### 核心特性

- **完全离线运行**：基于 IndexedDB 存储，无需外部数据库依赖
- **大规模支持**：500-1000 人参会规模实测通过
- **可控中奖逻辑**：锁定中奖人员、黑名单、围栏保护机制
- **炫酷视觉效果**：3D 地球仪粒子动画、烟花特效、卡牌碎裂
- **多角色权限**：超级管理员、管理员、操作员、观察员四级权限
- **实时同步**：多端数据同步支持（可选）

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 生产构建

```bash
pnpm build
pnpm start
```

### 类型检查

```bash
pnpm ts-check
```

### 代码规范检查

```bash
pnpm lint
```

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 16.x |
| 核心 | React | 19.x |
| 语言 | TypeScript | 5.x |
| UI组件 | shadcn/ui (Radix UI) | latest |
| 样式 | Tailwind CSS | 4.x |
| 动画 | Framer Motion | 12.x |
| 数据存储 | IndexedDB (idb) | 8.x |
| 粒子特效 | Canvas API | - |
| 音效 | Web Audio API | - |

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── admin/              # 后台管理页面
│   │   ├── attendees/      # 参会人员管理
│   │   ├── prizes/         # 奖项管理
│   │   ├── records/        # 抽奖记录
│   │   ├── locked-winners/ # 锁定中奖人员
│   │   ├── event-info/     # 活动信息配置
│   │   ├── settings/       # 系统设置
│   │   └── super-admin/    # 超级管理员专属
│   ├── screen/             # 大屏抽奖展示页面
│   ├── login/              # 登录页面
│   └── api/                # API 路由（同步接口）
│   └── layout.tsx          # 根布局
│   └── page.tsx            # 首页
├── components/             # 组件
│   ├── ui/                 # shadcn/ui 组件库
│   ├── ParticleSphere.tsx  # 3D 地球仪粒子组件
│   ├── PrizeSidebar.tsx    # 奖项侧边栏
│   └── ShatterCard.tsx     # 卡牌碎裂特效组件
├── contexts/               # React Context
│   └── AppContext.tsx      # 应用全局状态
├── hooks/                  # 自定义 Hooks
│   └── use-mobile.ts       # 移动端检测
├── lib/                    # 核心库
│   ├── db/                 # 数据库模块
│   │   ├── index.ts        # IndexedDB 操作封装
│   │   └── types.ts        # 类型定义
│   ├── draw-engine.ts      # 抽奖引擎核心逻辑
│   ├── audio.ts            # 音效管理（Web Audio API）
│   ├── fireworks.ts        # 烟花特效
│   ├── theme.ts            # 主题配置
│   └── sync/               # 数据同步模块
│   └── utils/              # 工具函数
```

## 用户角色与权限

| 角色 | 权限说明 |
|------|----------|
| superadmin | 超级管理员：全部功能，包括锁定中奖、系统生效时间设置 |
| admin | 管理员：参会人员、奖项、抽奖操作、记录导出 |
| operator | 操作员：抽奖操作、记录查看 |
| viewer | 观察员：仅查看大屏展示 |

### 默认账户

| 用户名 | 密码 | 角色 |
|--------|------|------|
| superadmin | dongzai8054 | 超级管理员 |
| admin | admin123 | 管理员 |
| user | user123 | 操作员 |

## 核心功能说明

### 1. 参会人员管理
- Excel 导入/导出
- 支持姓名、公司、桌号等字段
- 规模上限控制（超级管理员设置）

### 2. 奖项管理
- 奖项等级、名称、数量配置
- 单次抽取人数设置
- 是否允许重复中奖
- 奖品图片、赞助商信息

### 3. 锁定中奖机制
- **锁定名单**：指定人员必中某奖项
- **生效时间**：锁定仅在指定时间范围内生效
- **围栏保护**：锁定人员不参与常规抽奖池
- **黑名单**：黑名单人员永远不中奖

### 4. 抽奖逻辑
- Fisher-Yates 洗牌算法保证公平
- 自动排除已中奖人员
- 支持按桌号抽奖
- 弃奖后自动重抽

### 5. 视觉特效
- 3D 地球仪粒子动画（斐波那契球面分布）
- 烟花绽放特效
- 卡牌碎裂动画（弃奖时）
- 滚动名字动态效果

### 6. 音效系统
- 滚动音效（预生成 AudioBuffer 复用）
- 中奖欢呼音效
- 烟花爆炸音效
- 卡牌碎裂音效

## 数据存储

所有数据存储在浏览器 IndexedDB 中，数据表包括：

| 表名 | 说明 |
|------|------|
| users | 用户账户 |
| attendees | 参会人员 |
| prizes | 奖项配置 |
| drawRecords | 抽奖记录 |
| lockedWinners | 锁定中奖名单 |
| systemSettings | 系统设置 |
| eventInfo | 活动信息 |

## 部署说明

### 环境变量

| 变量名 | 说明 |
|--------|------|
| COZE_WORKSPACE_PATH | 工作目录路径 |
| COZE_PROJECT_DOMAIN_DEFAULT | 对外访问域名 |
| DEPLOY_RUN_PORT | 服务监听端口 |
| COZE_PROJECT_ENV | 环境标识 (DEV/PROD) |

### 构建与运行

```bash
# 构建
pnpm build

# 启动生产服务
pnpm start
```

## 常见问题

### Q: 如何清空数据进行重新抽奖？
A: 超级管理员可在「系统设置」页面清空所有数据。

### Q: 锁定中奖人员未生效？
A: 检查生效时间是否正确设置，确保系统生效时间范围包含当前时间。

### Q: 参会人员导入超过上限？
A: 超级管理员可在「系统设置」调整参会人员规模上限。

## 许可证

本项目仅供内部活动使用，未经授权不得对外分发。

## 联系方式

如有问题，请联系系统管理员。