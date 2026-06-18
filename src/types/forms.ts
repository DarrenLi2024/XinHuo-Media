// 表单回收模块类型定义

export type FormType = 'registration' | 'sponsor';

export const FORM_TYPE_LABELS: Record<FormType, string> = {
  registration: '报名表单',
  sponsor: '赞助商报名表单',
};

export type FormFieldType = 'text' | 'tel' | 'email' | 'select' | 'textarea' | 'number' | 'checkbox';

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[]; // for select type
  order: number;
}

export interface FormTemplate {
  id: string;
  event_id: string;
  type: FormType;
  title: string;
  description?: string;
  fields: FormField[];
  status: 'draft' | 'published' | 'closed';
  auto_approve: boolean;
  redirect_url?: string;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  event_id: string;
  data: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
}

export const REGISTRATION_FORM_DEFAULTS: FormField[] = [
  { id: 'name', label: '姓名', type: 'text', required: true, placeholder: '请输入姓名', order: 1 },
  { id: 'company', label: '公司', type: 'text', required: true, placeholder: '请输入公司名称', order: 2 },
  { id: 'position', label: '职务', type: 'text', required: false, placeholder: '请输入职务', order: 3 },
  { id: 'phone', label: '手机号', type: 'tel', required: true, placeholder: '请输入手机号', order: 4 },
  { id: 'wechat_id', label: '微信号', type: 'text', required: false, placeholder: '请输入微信号', order: 5 },
  { id: 'email', label: '邮箱', type: 'email', required: false, placeholder: '请输入邮箱', order: 6 },
  { id: 'city', label: '城市', type: 'text', required: false, placeholder: '请输入所在城市', order: 7 },
  { id: 'is_member', label: '是否会员', type: 'select', required: false, options: ['是', '否'], order: 8 },
  { id: 'need_invoice', label: '是否需要发票', type: 'select', required: false, options: ['需要', '不需要'], order: 9 },
  { id: 'attend_dinner', label: '是否参加晚宴', type: 'select', required: false, options: ['参加', '不参加'], order: 10 },
  { id: 'notes', label: '备注', type: 'textarea', required: false, placeholder: '如有特殊需求请说明', order: 11 },
];

export const SPONSOR_FORM_DEFAULTS: FormField[] = [
  { id: 'company_name', label: '企业名称', type: 'text', required: true, placeholder: '请输入企业名称', order: 1 },
  { id: 'contact_name', label: '联系人', type: 'text', required: true, placeholder: '请输入联系人姓名', order: 2 },
  { id: 'contact_position', label: '职务', type: 'text', required: false, placeholder: '请输入职务', order: 3 },
  { id: 'phone', label: '手机号', type: 'tel', required: true, placeholder: '请输入手机号', order: 4 },
  { id: 'wechat_id', label: '微信号', type: 'text', required: false, placeholder: '请输入微信号', order: 5 },
  { id: 'email', label: '邮箱', type: 'email', required: false, placeholder: '请输入邮箱', order: 6 },
  { id: 'sponsor_intent', label: '赞助意向等级', type: 'select', required: true, options: ['总冠名', '联合主办', '钻石赞助', '黄金赞助', '白银赞助', '晚宴赞助', '礼品赞助', '媒体支持'], order: 7 },
  { id: 'sponsor_amount', label: '预计赞助金额', type: 'number', required: false, placeholder: '请输入金额(元)', order: 8 },
  { id: 'need_booth', label: '是否需要展位', type: 'select', required: false, options: ['需要', '不需要'], order: 9 },
  { id: 'has_logo', label: '是否提供Logo', type: 'select', required: false, options: ['已准备好', '稍后提供', '无需提供'], order: 10 },
  { id: 'has_materials', label: '是否提供宣传资料', type: 'select', required: false, options: ['已准备好', '稍后提供', '无需提供'], order: 11 },
  { id: 'notes', label: '备注', type: 'textarea', required: false, placeholder: '其他需求或说明', order: 12 },
];
