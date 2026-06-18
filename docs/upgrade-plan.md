# 芯火会务管理系统 - 功能构建与升级方案

> 版本: v1.0.0 | 日期: 2026-06-15 | 基于 platform-blueprint.md + current-status-audit.md

---

## 总体策略

三个阶段，由浅入深，每阶段独立可交付：

```
Phase 1: 数据底座统一 → Phase 2: 业务闭环强化 → Phase 3: 智能化升级
```

---

## Phase 1: 数据底座统一

**目标**: 统一人员主数据模型 + 补全缺失的基础模块

### 1.1 统一人员主数据

**现状**: Guest(events guests表) 与 CheckinGuest(checkin guests表) 两套数据源割裂

**方案**:
- 新建 `src/types/person.ts` — 统一定义 `Person` 类型，合并 Guest + CheckinGuest + seating Person 字段
- Person 支持多身份标签数组 (`roles: PersonRole[]`)
- 签到/排座/抽奖/台本 全部从 Person 主数据读取
- Demo Store 新增 `persons` 全局表，现有 guests/checkin guests/seating persons 迁移到统一 Person

### 1.2 表单回收模块

**目标**: 新建独立模块，支持报名表单 + 赞助商表单

**文件清单**:
- `src/app/(dashboard)/forms/page.tsx` — 表单列表管理页
- `src/app/(dashboard)/forms/[id]/page.tsx` — 表单编辑器(拖拽配置字段)
- `src/app/(dashboard)/forms/submissions/page.tsx` — 提交数据查看/审核
- `src/app/api/forms/route.ts` — 表单 CRUD
- `src/app/api/forms/[id]/submissions/route.ts` — 提交管理
- `src/app/forms/[id]/page.tsx` — 公开填写页(外部可访问)
- `src/types/forms.ts` — 表单类型定义

**核心逻辑**: 表单提交 → 数据校验 → 自动去重(Person主数据) → 写入活动 Person 名单 → 待审核/自动通过

### 1.3 赞助商模块独立

**目标**: 从 EventCustomer.sponsor_profile 提升为独立 Sponsor 实体

**文件清单**:
- `src/app/(dashboard)/events/[id]/sponsors/page.tsx` — 活动赞助商列表
- `src/app/api/events/[id]/sponsors/route.ts` — 赞助商 CRUD
- `src/types/sponsor.ts` — Sponsor 独立类型

---

## Phase 2: 业务闭环强化

**目标**: 完善执行层模块，强化模块间数据互通

### 2.1 嘉宾接待管理

- 嘉宾列表独立视图，区别于普通参会人
- 嘉宾状态面板: 待确认/已确认/已拒绝/已签到
- 接待任务: 接机/酒店/VIP通道/伴手礼
- 嘉宾出席台本关联: 哪个嘉宾在哪个环节出场

### 2.2 赞助商权益管理

- 权益模板: 为每个赞助等级配置权益清单
- 权益履约跟踪: 权益项是否已执行(LOGO是否放到背景板、是否已口播等)
- 赞助商回报报告: 一键生成本次活动为赞助商带来的曝光/权益执行情况

### 2.3 抽奖名单自由组合

- 从 Person 主数据按条件筛选生成抽奖池
- 支持条件组合: 身份标签 + 签到状态 + 是否已获奖 + 自定义标签

---

## Phase 3: 智能化升级

**目标**: AI 能力接入 + 数据沉淀闭环

### 3.1 AI 智能复盘

**能力清单**:
1. 活动数据汇总 → AI 生成活动总结(500-800字)
2. 报名/签到/抽奖/赞助/费用数据 → AI 生成内部复盘报告
3. 赞助商权益执行情况 → AI 生成赞助商回报报告
4. 活动亮点 + 素材 → AI 生成对外宣传稿/新闻通稿

**技术方案**: 调用 LLM API(豆包/DeepSeek)，Prompt 模板 + 结构化 JSON 输出

### 3.2 供应商评价体系

- 供应商合作后评价(品质/交期/沟通/综合)
- 历史评价聚合 → 供应商评分排行榜
- 供应商推荐: 按活动类型推荐高评分供应商

### 3.3 预算费用管理

- 预算明细行: 分类(场地/搭建/餐饮/物料/礼品/人员/交通/其他) + 预算金额 + 实际金额
- 费用录入: 支持关联供应商订单、手动录入
- 预算仪表盘: 预算使用率、超支预警

---

## 实施路线图

```
Week 1: Phase 1.1 统一人员主数据 → Person 类型 + Demo Store 迁移
Week 2: Phase 1.2 表单回收模块 → 表单管理端 + 公开填写页 + API
Week 3: Phase 1.3 赞助商独立 → Sponsor 实体 + 管理页面
Week 4: Phase 2.1 嘉宾接待 + 2.2 赞助权益
Week 5: Phase 2.3 抽奖名单自由组合
Week 6: Phase 3.1 AI 智能复盘
Week 7: Phase 3.2 供应商评价 + 3.3 预算费用
```

---

## 技术约束

- 所有新类型定义在 `src/types/` 下独立文件，由 `index.ts` 统一 re-export
- 所有新页面使用 shadcn/ui 组件库
- 所有 API Route 使用 Zod schema 校验入参
- 遵循 AGENTS.md 编码规范(TypeScript strict/无隐式any/无head标签/pnpm)
- Demo Store 同步新增演示数据，确保离线模式可用
