# 供应商管理系统 - 功能模块详细设计

> **模块编号**：M07  
> **优先级**：P1  
> **负责人**：前后端开发工程师  
> **创建日期**：2025-01-15

---

## 一、模块概述

### 1.1 功能定位

供应商管理系统用于管理活动物料供应商信息，包括供应商档案管理、服务质量评价、采购订单管理等，确保供应商选择合理、服务质量可控、采购流程规范。

### 1.2 核心价值

| 价值点 | 描述 |
|--------|------|
| **供应商沉淀** | 建立供应商资源库，方便复用 |
| **质量把控** | 服务评价机制，筛选优质供应商 |
| **采购规范** | 采购流程标准化，避免混乱 |
| **成本优化** | 对比供应商报价，优化采购成本 |

---

## 二、功能清单

### 2.1 供应商档案管理

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S07-01 | 供应商创建 | 创建供应商档案 | P0 |
| S07-02 | 供应商编辑 | 编辑供应商信息 | P0 |
| S07-03 | 供应商删除 | 删除供应商档案 | P0 |
| S07-04 | 供应商分类 | 按类型分类供应商 | P0 |
| S07-05 | 供应商搜索 | 搜索供应商 | P0 |
| S07-06 | 供应商列表 | 查看供应商列表 | P0 |

### 2.2 供应商信息管理

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S07-07 | 基本信息 | 供应商名称、联系人、联系方式 | P0 |
| S07-08 | 服务项目 | 供应商提供的服务项目列表 | P0 |
| S07-09 | 价格范围 | 各服务项目的价格范围 | P0 |
| S07-10 | 银行信息 | 付款银行账户信息 | P0 |
| S07-11 | 合作记录 | 历史合作记录 | P1 |

### 2.3 供应商评价功能

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S07-12 | 服务评分 | 综合评分（1-5星） | P0 |
| S07-13 | 分项评分 | 质量、服务、价格、时效分项评分 | P0 |
| S07-14 | 评价评论 | 评价文字评论 | P1 |
| S07-15 | 评价列表 | 查看历史评价列表 | P0 |
| S07-16 | 评分统计 | 统计供应商平均评分 | P0 |

### 2.4 物料需求管理

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S07-17 | 物料需求创建 | 创建物料需求 | P0 |
| S07-18 | 物料规格设置 | 设置物料规格、数量 | P0 |
| S07-19 | 需求日期设置 | 设置物料需求日期 | P0 |
| S07-20 | 预算设置 | 设置物料预算 | P0 |
| S07-21 | 物料状态管理 | 管理物料采购状态 | P0 |

### 2.5 采购订单管理

| 功能ID | 功能名称 | 功能描述 | 优先级 |
|--------|----------|----------|--------|
| S07-22 | 订单创建 | 创建采购订单 | P0 |
| S07-23 | 订单编辑 | 编辑采购订单 | P0 |
| S07-24 | 订单状态管理 | 管理订单状态流程 | P0 |
| S07-25 | 付款状态管理 | 管理付款状态 | P0 |
| S07-26 | 订单附件 | 上传合同、发票等附件 | P1 |
| S07-27 | 订单导出 | 导出采购订单 | P0 |

---

## 三、界面设计

### 3.1 供应商列表界面

```
┌─────────────────────────────────────────────────────────────────────┐
│  供应商管理                              [类型筛选] [搜索] [新增]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  供应商列表                                                    │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 名称        类型      联系人     评分    合作次数  操作  │ │ │
│  │  │ 优质印刷公司 印刷     王经理     ⭐⭐⭐⭐  5次      [详情] │ │ │
│  │  │ 精品礼品店   礼品     李总       ⭐⭐⭐   3次      [详情] │ │ │
│  │  │ 专业摄影团队 摄影     张老师     ⭐⭐⭐⭐⭐ 10次    [详情] │ │ │
│  │  │ 高端音响设备 设备     陈工       ⭐⭐⭐⭐  2次      [详情] │ │ │
│  │  │ ...                                                     │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │  [导出列表]                                                    │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  统计信息                                                      │ │
│  │  总供应商: 25  印刷类: 5  礼品类: 3  设备类: 8  其他: 9       │ │
│  │  优质供应商(≥4星): 12  活跃供应商: 18                        │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 供应商详情界面

```
┌─────────────────────────────────────────────────────────────────────┐
│  供应商详情                              [编辑] [评价] [下单]       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  基本信息                                                    │   │
│  │  名称: 优质印刷公司                                          │   │
│  │  类型: 印刷服务                                              │   │
│  │  联系人: 王经理                                              │   │
│  │  联系电话: 13900139000                                       │   │
│  │  联系邮箱: wang@print.com                                    │   │
│  │  地址: 上海市浦东新区...                                      │   │
│  │  状态: 活跃                                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  服务项目                                                      │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 项目        价格范围        描述                         │ │ │
│  │  │ 海报印刷    ¥10-50/张      A4/A3尺寸，多种材质           │ │ │
│  │  │ 背景板制作  ¥500-2000/块   KT板/布艺材质                 │ │ │
│  │  │ 纪念册印刷  ¥50-100/本     精装/简装多种规格             │ │ │
│  │  │ 名片印刷    ¥50-200/盒     PVC/纸材质                    │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  评分统计                                                      │ │
│  │  综合评分: ⭐⭐⭐⭐ (4.2)                                      │ │
│  │  质量评分: ⭐⭐⭐⭐⭐ (4.5)                                    │ │
│  │  服务评分: ⭐⭐⭐⭐ (4.0)                                      │ │
│  │  价格评分: ⭐⭐⭐⭐ (4.0)                                      │ │
│  │  时效评分: ⭐⭐⭐⭐ (4.0)                                      │ │
│  │  合作次数: 5次                                                │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  历史评价                                                      │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 2025春茗盛典 - ⭐⭐⭐⭐                                    │ │ │
│  │  │ "印刷质量很好，服务态度不错，价格略贵但值得"             │ │ │
│  │  │ 评价人: 张三                                             │ │ │
│  │  │                                                         │ │ │
│  │  │ 2024年度大会 - ⭐⭐⭐⭐                                    │ │ │
│  │  │ "纪念册制作精美，提前一天交付"                           │ │ │
│  │  │ 评价人: 李四                                             │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │  [添加评价]                                                    │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  合作记录                                                      │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 活动        订单金额    订单状态    合作时间             │ │ │
│  │  │ 2025春茗    ¥8,000     已结算      2025-02-15           │ │ │
│  │  │ 2024年度    ¥5,000     已结算      2024-12-20           │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 物料订单界面

```
┌─────────────────────────────────────────────────────────────────────┐
│  物料订单管理                          [活动] [新增物料] [新增订单] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  物料需求列表                                                  │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 物料名称   类别    数量    预算    状态      供应商     │ │ │
│  │  │ 活动背景板 装饰    1块    ¥2,000  已交付    优质印刷    │ │ │
│  │  │ 纪念册     印刷    500本  ¥50,000 已交付    优质印刷    │ │ │
│  │  │ 嘉宾礼品   礼品    100份  ¥10,000 已报价    待选择      │ │ │
│  │  │ 音响设备   设备    1套    ¥5,000  待采购    高端音响    │ │ │
│  │  │ ...                                                     │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  采购订单                                                      │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ 订单号     供应商    金额    状态      付款状态    时间  │ │ │
│  │  │ PO-001    优质印刷   ¥8,000  已结算    已付       02-10 │ │ │
│  │  │ PO-002    专业摄影   ¥3,000  已交付    已付       02-15 │ │ │
│  │  │ PO-003    精品礼品   ¥10,000 已确认    待付       02-12 │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │  统计:                                                       │ │
│  │  总订单: 3  总金额: ¥21,000  已付: ¥11,000  待付: ¥10,000  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 四、数据结构设计

```typescript
interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  contactPerson: string;
  contactPhone: string;
  contactEmail?: string;
  address?: string;
  bankInfo?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  description?: string;
  services: ServiceItem[];
  rating: number;
  cooperationCount: number;
  lastCooperationAt?: Date;
  status: SupplierStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

type SupplierType = 'venue' | 'catering' | 'equipment' | 'printing' | 'gift' | 'photo' | 'video' | 'other';
type SupplierStatus = 'active' | 'inactive' | 'blacklist';

interface ServiceItem {
  name: string;
  description?: string;
  priceRange?: {
    min: number;
    max: number;
    unit: string;
  };
}

interface SupplierReview {
  id: string;
  supplierId: string;
  eventId?: string;
  reviewerId: string;
  rating: number;  // 1-5
  qualityScore?: number;
  serviceScore?: number;
  priceScore?: number;
  punctualityScore?: number;
  comment?: string;
  isAnonymous: boolean;
  createdAt: Date;
}

interface Material {
  id: string;
  eventId: string;
  name: string;
  category: MaterialCategory;
  specification?: string;
  quantity: number;
  unit: string;
  budgetUnitPrice?: number;
  budgetTotalPrice?: number;
  actualUnitPrice?: number;
  actualTotalPrice?: number;
  supplierId?: string;
  status: MaterialStatus;
  requirementDate?: Date;
  deliveryDate?: Date;
  actualDeliveryDate?: Date;
  qualityCheck?: 'pending' | 'passed' | 'failed';
  qualityNotes?: string;
  attachments?: Attachment[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

type MaterialCategory = 'decoration' | 'printed' | 'gift' | 'equipment' | 'catering' | 'other';
type MaterialStatus = 'pending' | 'quoted' | 'ordered' | 'in_production' | 'delivered' | 'settled';

interface PurchaseOrder {
  id: string;
  eventId: string;
  supplierId: string;
  orderNumber: string;
  totalAmount: number;
  status: OrderStatus;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  paymentStatus: PaymentStatus;
  paymentAmount?: number;
  paymentDate?: Date;
  items: OrderItem[];
  notes?: string;
  attachments?: Attachment[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'shipped' | 'delivered' | 'settled' | 'cancelled';
type PaymentStatus = 'unpaid' | 'partial' | 'paid';

interface OrderItem {
  materialId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
```

---

## 五、状态管理

```typescript
// Zustand 状态管理
import { create } from 'zustand';

interface SupplierState {
  suppliers: Supplier[];
  currentSupplier: Supplier | null;
  reviews: SupplierReview[];
  
  materials: Material[];
  orders: PurchaseOrder[];
  
  // Actions
  fetchSuppliers: (filters?: SupplierFilters) => Promise<void>;
  createSupplier: (data: Partial<Supplier>) => Promise<void>;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  
  addReview: (supplierId: string, review: Partial<SupplierReview>) => void;
  
  fetchMaterials: (eventId: string) => Promise<void>;
  createMaterial: (eventId: string, data: Partial<Material>) => void;
  updateMaterial: (id: string, data: Partial<Material>) => void;
  
  createOrder: (eventId: string, data: Partial<PurchaseOrder>) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
}

const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  currentSupplier: null,
  reviews: [],
  materials: [],
  orders: [],
  
  fetchSuppliers: async (filters) => {
    const suppliers = await supplierService.list(filters);
    set({ suppliers });
  },
  
  createSupplier: async (data) => {
    const supplier = await supplierService.create(data);
    set({ suppliers: [...get().suppliers, supplier] });
  },
  
  updateSupplier: (id, data) => {
    set({
      suppliers: get().suppliers.map(s => 
        s.id === id ? { ...s, ...data } : s
      )
    });
  },
  
  addReview: (supplierId, review) => {
    const newReview: SupplierReview = {
      id: uuid(),
      supplierId,
      reviewerId: currentUserId,
      rating: review.rating || 3,
      qualityScore: review.qualityScore,
      serviceScore: review.serviceScore,
      priceScore: review.priceScore,
      punctualityScore: review.punctualityScore,
      comment: review.comment,
      isAnonymous: review.isAnonymous || false,
      createdAt: new Date()
    };
    
    // 更新供应商评分
    const supplier = get().suppliers.find(s => s.id === supplierId);
    if (supplier) {
      const reviews = [...get().reviews.filter(r => r.supplierId === supplierId), newReview];
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      
      set({
        reviews: [...get().reviews, newReview],
        suppliers: get().suppliers.map(s => 
          s.id === supplierId ? { ...s, rating: avgRating, cooperationCount: s.cooperationCount + 1 } : s
        )
      });
    }
  },
  
  createMaterial: (eventId, data) => {
    const material: Material = {
      id: uuid(),
      eventId,
      name: data.name!,
      category: data.category!,
      quantity: data.quantity!,
      unit: data.unit!,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: currentUserId
    };
    
    set({ materials: [...get().materials, material] });
  },
  
  createOrder: (eventId, data) => {
    const order: PurchaseOrder = {
      id: uuid(),
      eventId,
      supplierId: data.supplierId!,
      orderNumber: generateOrderNumber(),
      totalAmount: data.totalAmount!,
      status: 'pending',
      paymentStatus: 'unpaid',
      items: data.items || [],
      orderDate: new Date(),
      createdBy: currentUserId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    set({ orders: [...get().orders, order] });
  },
  
  updateOrderStatus: (orderId, status) => {
    set({
      orders: get().orders.map(o => 
        o.id === orderId ? { ...o, status, updatedAt: new Date() } : o
      )
    });
  },
  
  updatePaymentStatus: (orderId, status) => {
    set({
      orders: get().orders.map(o => 
        o.id === orderId ? { ...o, paymentStatus: status, updatedAt: new Date() } : o
      )
    });
  }
}));
```

---

## 六、测试要点

### 6.1 功能测试

| 测试场景 | 验证点 |
|----------|--------|
| 供应商创建 | 各字段正确保存 |
| 供应商评价 | 评分正确计算 |
| 物料需求创建 | 物料信息正确 |
| 采购订单流程 | 状态流转正确 |

---

> **模块负责人**：前后端开发工程师  
> **最后更新**：2025-01-15