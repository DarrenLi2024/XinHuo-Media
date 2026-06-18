# 芯火会务管理系统 - 当前功能实现盘点

> 基于 platform-blueprint.md v2.0 方案对照，盘点 2026-06-15 时刻的项目实现现状

## 盘点结论

**已完成率约 65%**。Phase 1 基础模块已基本可用，Phase 2 现场执行工具齐备，Phase 3 智能复盘尚为空白。

---

## 模块对照表

| 方案模块 | 页面路由 | API路由 | 数据模型 | Demo数据 | 完整度 |
|---------|---------|---------|---------|---------|--------|
| 客户管理 | ✅ customers/ | ✅ 5个 | ✅ Customer + Contact | ✅ | 90% |
| 活动管理 | ✅ events/ | ✅ 5个 | ✅ Event + Settings | ✅ | 85% |
| 名单管理 | ⚠️ 散落各处 | ✅ guests/ | ✅ Guest (缺标签化) | ✅ | 50% |
| 表单回收 | ❌ 无独立模块 | ❌ 无 | ❌ | ❌ | 0% |
| 赞助商管理 | ⚠️ 嵌入EventCustomer | ⚠️ events/customers | ✅ sponsor_profile | ✅ | 55% |
| 嘉宾管理 | ⚠️ 嵌入Guests | ⚠️ guests/ | ⚠️ Guest.guest_role | ✅ | 50% |
| 智能排座 | ✅ seating/ | ✅ 5个 | ✅ Seat/Venue/Table | ✅ | 85% |
| 签到系统 | ✅ checkin/ | ✅ 15个 | ✅ CheckinGuest | ✅ | 90% |
| 抽奖系统 | ✅ lottery/ | ✅ 6个 | ✅ Prize/Winner/Record | ✅ | 90% |
| 流程台本 | ✅ scripts/ | ✅ 1个 | ✅ Script/Segment | ✅ | 85% |
| 供应商管理 | ✅ suppliers/ | ✅ 1个 | ✅ Supplier/Contact | ✅ | 70% |
| 预算费用 | ⚠️ Event字段内 | ❌ 无 | ⚠️ budget/actual_cost | ❌ | 20% |
| 复盘报告 | ✅ reports/ | ✅ 1个 | ✅ Report | ✅ 基础版 | 40% |
| 权限管理 | ⚠️ auth/ | ✅ 4个 | ⚠️ User.role | ⚠️ demo用户 | 60% |

---

## 缺失/待建设清单

### 🔴 需要新建 (0%)

1. **表单回收模块** — 报名表单、赞助商报名表单的独立管理界面、表单配置、数据回收页面
2. **预算费用管理** — 独立模块，预算录入、费用跟踪、差异分析
3. **AI智能复盘** — AI调用能力，自动生成活动总结/宣传稿/赞助回报/客户交付报告

### 🟡 需要升级改造 (20-55%)

4. **名单管理 → 统一人员主数据** — 当前 Guest 分散在 guests/、checkin/guests/、seating/guests/ 三套不同数据源中，需要统一为单一主数据表 + 标签化身份
5. **赞助商 → 独立模块** — 当前赞助商信息是 EventCustomer 的一个子属性，需要独立页面、独立列表、权益管理
6. **嘉宾管理 → 独立模块** — 当前嘉宾是 Guest 的一个 role 标签，需要独立视图、接待状态跟踪
7. **供应商 → 评价体系** — 当前缺少供应商评价、历史合作数据沉淀

### 🟢 可用但需增强 (85-90%)

8. **抽奖系统** — 当前抽奖名单基于 checkin guests，缺少从人员主数据"自由组合抽奖池"的能力
9. **复盘报告** — 当前仅有基础 CRUD，缺少 AI 生成、赞助商回报、客户交付等多类型报告

---

## API 路由对照

### 已有 46 条 API 路由

| 模块 | 路由 | 数量 |
|------|------|------|
| Auth | login/logout/me/register | 4 |
| Customers | CRUD + contacts + events | 5 |
| Events | CRUD + customers | 5 |
| Guests | CRUD + batch | 2 |
| Checkin | 签到核心 + 导入导出 + 统计 + 备份 | 15 |
| Lottery | 抽奖 + prizes + draw + history + participants | 6 |
| Seating | 排座 + tables + auto-arrange + guests | 5 |
| Scripts | CRUD | 1 |
| Reports | CRUD | 1 |
| Suppliers | CRUD | 1 |
| Tasks | CRUD | 1 |
| Users | CRUD | 1 |
| **总计** | | **46** |

### 需要新增的 API

| 模块 | 建议新增 | 说明 |
|------|---------|------|
| Forms | /api/forms, /api/forms/submissions | 表单管理+提交 |
| Budget | /api/budget | 预算费用 CRUD |
| AI | /api/ai/generate-report, /api/ai/generate-summary | AI 生成端点 |
| Sponsor权益 | /api/events/:id/sponsors/benefits | 赞助商独立 CRUD |

---

## 数据模型分析

当前 `src/types/index.ts` 已定义绝大部分类型，但与平台方案对照仍有差距：

| 方案概念 | 当前类型 | 差距 |
|---------|---------|------|
| 统一人员主数据 | Guest + CheckinGuest (两套) | 需合并为一套核心 Person 类型 + 多身份标签 |
| 赞助商独立实体 | EventCustomer.sponsor_profile | 需提升为独立 Sponsor 实体 |
| 表单定义 | 无 | 需新增 FormTemplate + FormSubmission |
| 预算跟踪 | Event.budget/actual_cost | 需新增 BudgetLine + ExpenseEntry |
| 供应商评价 | SupplierReview (已定义但未用) | 需要在 UI 中激活 |
END OF FILE