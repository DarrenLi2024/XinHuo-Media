import { v4 as uuidv4 } from 'uuid';
import { Person, Table, Activity, SeatingData, ImportResult } from '@/types/seating';

// 生成唯一ID
export const generateId = (): string => uuidv4();

// ============ 公司简称智能解析算法 ============

// 公司名称后缀（从长到短排序）
const COMPANY_SUFFIXES = [
  '股份有限公司',
  '有限责任公司',
  '集团有限公司',
  '控股有限公司',
  '投资有限公司',
  '发展有限公司',
  '科技有限公司',
  '实业有限公司',
  '有限公司',
  '集团',
  '公司',
];

// 地域前缀
const REGION_PREFIXES = [
  '中国', '北京市', '北京', '上海市', '上海', '深圳市', '深圳',
  '广州市', '广州', '杭州市', '杭州', '南京市', '南京',
  '天津市', '天津', '重庆市', '重庆', '成都市', '成都',
  '武汉市', '武汉', '西安市', '西安', '苏州市', '苏州',
  '东莞市', '东莞', '佛山市', '佛山', '青岛市', '青岛',
  '山东省', '山东', '江苏省', '江苏', '浙江省', '浙江',
  '广东省', '广东', '福建省', '福建', '四川省', '四川',
];

// 行业描述词（特色行业词，长度>6时删除）
const INDUSTRY_WORDS = [
  '科技', '技术', '网络', '信息', '电子', '软件', '数字', '智能', '数据',
  '健康', '酒业', '供应链', '医药', '医疗', '教育', '金融', '保险',
  '物流', '能源', '环保', '新材料', '新能源', '汽车', '房产', '建筑',
  '通信', '互联网', '物联网', '人工智能', '大数据', '云计算',
  '咨询',  // 咨询也是行业词，长度>6时才删除
];

// 通用后缀词（始终删除，不保留）
const COMMON_SUFFIXES = [
  '管理', '服务', '文化', '传媒', '控股', '投资',
  '发展', '实业', '产业', '贸易', '销售', '商贸', '商业',
  '零售', '批发', '进出口', '制造', '工程',
];

// 品牌词典（按优先级排序，短词优先）
const BRAND_DICT = [
  '腾讯', '阿里', '阿里巴巴', '华为', '京东', '字节', '字节跳动',
  '美团', '小米', '百度', '网易', '拼多多', '米哈游',
  '滴滴', '快手', '哔哩哔哩', 'B站', '新浪', '搜狐',
  '格力', '美的', '海尔', '联想', '中兴', 'OPPO', 'VIVO',
  '比亚迪', '蔚来', '小鹏', '理想', '宁德时代',
  '中国移动', '中国联通', '中国电信',
];

// 1. 文本标准化
const normalize = (name: string): string => {
  return name
    .replace(/\s+/g, '')                    // 删除所有空格
    .replace(/[（）()（）]/g, '')           // 删除所有括号
    .trim();
};

// 2. 删除公司类型后缀
const removeSuffix = (name: string): string => {
  for (const suffix of COMPANY_SUFFIXES) {
    if (name.endsWith(suffix)) {
      return name.slice(0, -suffix.length);
    }
  }
  return name;
};

// 3. 删除地域前缀
const removeRegion = (name: string): string => {
  for (const region of REGION_PREFIXES) {
    if (name.startsWith(region)) {
      return name.slice(region.length);
    }
  }
  return name;
};

// 4. 删除通用后缀词（优先删除）
const removeCommonSuffix = (name: string): string => {
  for (const suffix of COMMON_SUFFIXES) {
    if (name.endsWith(suffix)) {
      return name.slice(0, -suffix.length);
    }
  }
  return name;
};

// 5. 删除特色行业词
const removeIndustry = (name: string): string => {
  for (const industry of INDUSTRY_WORDS) {
    if (name.endsWith(industry)) {
      return name.slice(0, -industry.length);
    }
  }
  return name;
};

// 5. 品牌词典匹配（优先返回最短匹配）
const matchBrand = (name: string): string | null => {
  let shortestMatch: string | null = null;
  
  for (const brand of BRAND_DICT) {
    if (name.includes(brand)) {
      // 找最短的品牌匹配
      if (!shortestMatch || brand.length < shortestMatch.length) {
        shortestMatch = brand;
      }
    }
  }
  
  return shortestMatch;
};

// 8. 删除行业词（先尝试删除一个，如果结果>=3字则接受，否则不删）
const removeIndustryIteratively = (name: string): string => {
  let result = name;
  
  // 先尝试删除一个行业词
  const afterOne = removeIndustry(result);
  if (afterOne !== result && afterOne.length >= 3) {
    result = afterOne;
  }
  
  // 如果仍然>6，继续删除
  while (result.length > 6) {
    const before = result.length;
    result = removeIndustry(result);
    if (result.length === before) break;
  }
  
  return result;
};

// 9. 循环删除通用后缀词（maxLen=0表示删除所有）
const removeCommonSuffixIteratively = (name: string, maxLen: number = 6): string => {
  let result = name;
  
  while (maxLen === 0 ? true : result.length > maxLen) {
    const before = result.length;
    result = removeCommonSuffix(result);
    if (result.length === before) break;
  }
  
  return result;
};

// 9. 最终长度处理
const finalizeLength = (name: string): string => {
  if (name.length <= 6) return name;
  return name.slice(0, 4);
};

// 主函数：获取公司简称
export const extractCompanyShortName = (fullName: string): string => {
  if (!fullName) return '';
  
  // 1. 文本标准化
  let name = normalize(fullName);
  
  // 2. 删除公司类型后缀
  name = removeSuffix(name);
  
  // 3. 品牌词典匹配（在去地域前优先匹配，避免误删"中国移动"等品牌）
  const brandMatch = matchBrand(name);
  if (brandMatch) {
    return brandMatch;
  }
  
  // 4. 删除地域前缀
  name = removeRegion(name);
  
  // 5. 先删除通用后缀词（管理、销售、服务等，无论长度如何）
  name = removeCommonSuffixIteratively(name, 0);
  
  // 6. 如果删除通用后缀后长度<=4，直接返回（避免删除过多）
  if (name.length <= 4) {
    return name;
  }
  
  // 7. 删除行业词（删除直到结果<=4字或无可删除）
  name = removeIndustryIteratively(name);
  
  // 8. 最终长度处理（超过6字截取前4字）
  name = finalizeLength(name);
  
  // 9. 确保至少有2个字
  if (name.length < 2) {
    return fullName.slice(0, Math.min(4, fullName.length));
  }
  
  return name;
};

// 从文本中提取标签
export const extractTags = (text: string): string[] => {
  const tags: string[] = [];
  
  // 匹配 @VIP 格式
  const atMatches = text.match(/@(\S+)/g);
  if (atMatches) {
    atMatches.forEach(match => {
      tags.push(match.substring(1)); // 去掉 @
    });
  }
  
  // 匹配 #理事 格式
  const hashMatches = text.match(/#(\S+)/g);
  if (hashMatches) {
    hashMatches.forEach(match => {
      tags.push(match.substring(1)); // 去掉 #
    });
  }
  
  // 匹配 【嘉宾】 格式
  const bracketMatches = text.match(/【([^】]+)】/g);
  if (bracketMatches) {
    bracketMatches.forEach(match => {
      tags.push(match.substring(1, match.length - 1)); // 去掉 【】
    });
  }
  
  return tags;
};

// 清理文本中的标签
export const cleanTags = (text: string): string => {
  let cleaned = text;
  cleaned = cleaned.replace(/@(\S+)/g, '');
  cleaned = cleaned.replace(/#(\S+)/g, '');
  cleaned = cleaned.replace(/【([^】]+)】/g, '');
  return cleaned.trim();
};

// ============ 标签简化映射 ============

// 标签简化映射表（超过4个字的标签简化为4个字）
const TAG_SIMPLIFY_MAP: Record<string, string> = {
  // 赞助商等级
  '冠名赞助商': '冠名赞助',
  '至尊赞助商': '至尊赞助',
  '王者赞助商': '王者赞助',
  '荣耀赞助商': '荣耀赞助',
  '钻石赞助商': '钻石赞助',
  '金牌赞助商': '金牌赞助',
  '银牌赞助商': '银牌赞助',
  '铜牌赞助商': '铜牌赞助',
  '战略合作伙伴': '战略合作',
  
  // 嘉宾类型
  '特邀嘉宾': '特邀嘉宾',
  '参会嘉宾': '参会嘉宾',
  '主讲嘉宾': '主讲嘉宾',
  '分享嘉宾': '分享嘉宾',
  '演讲嘉宾': '演讲嘉宾',
  '颁奖嘉宾': '颁奖嘉宾',
  '启动仪式嘉宾': '启动仪式',
  '论坛嘉宾': '论坛嘉宾',
  '对话嘉宾': '对话嘉宾',
  '圆桌嘉宾': '圆桌嘉宾',
  '研讨嘉宾': '研讨嘉宾',
  
  // 会员等级
  '普通会员': '普通会员',
  '高级会员': '高级会员',
  '金牌会员': '金牌会员',
  '白金会员': '白金会员',
  '钻石会员': '钻石会员',
  '终身会员': '终身会员',
  '创始会员': '创始会员',
  '荣誉会员': '荣誉会员',
  '企业会员': '企业会员',
  '个人会员': '个人会员',
  
  // 报名来源
  '活动报名': '活动报名',
  '在线报名': '在线报名',
  '邀请报名': '邀请报名',
  '推荐报名': '推荐报名',
  '自主报名': '自主报名',
  
  // 其他
  '领导力班': '领导力班',
};

// 简化标签（超过4个字的简化）
export const simplifyTag = (tag: string): string => {
  // 先检查映射表
  if (TAG_SIMPLIFY_MAP[tag]) {
    return TAG_SIMPLIFY_MAP[tag];
  }
  // 超过4个字的截取前4个字
  if (tag.length > 4) {
    return tag.substring(0, 4);
  }
  return tag;
};

// 判断是否为纯英文标签
export const isEnglishTag = (text: string): boolean => {
  return /^[A-Za-z]+$/.test(text);
};

// 将英文标签转为竖向排列
export const formatTagVertical = (text: string): string => {
  if (isEnglishTag(text)) {
    return text.split('').join('\n');
  }
  return text;
};

// 正则模式
const PATTERNS = {
  // 手机号：11位数字，1开头
  phone: /1[3-9]\d{9}/g,
  // 中文姓名：2-4个汉字（常见姓氏开头更可靠）
  name: /^[\u4e00-\u9fa5]{2,4}$/,
  // 桌号：A1, B2, VIP1, 1号桌, 桌号1 等格式
  tableNumber: /(?:^|[桌号])([A-Za-z]?\d+)|([A-Za-z]+\d+)(?:号?桌|$)/i,
  // 常见职位关键词
  titleKeywords: [
    '董事长', '总裁', '总经理', '副总经理', '总监', '副总监',
    '经理', '副经理', '主任', '副主任', '部长', '科长',
    'CEO', 'CFO', 'CTO', 'COO', 'CIO', 'VP',
    '合伙人', '创始人', '联合创始人', '执行董事', '董事',
    '教授', '博士', '专家', '顾问', '讲师',
    '代表', '委员', '书记', '主席', '名誉主席',
    // 社会职务（按长度降序排列，优先匹配长词）
    '常务副会长兼秘书长', '执行会长兼秘书长', '会长兼秘书长',
    '常务副会长', '执行会长', '名誉会长', '创会会长',
    '副会长', '会长', '理事长', '副理事长',
    '秘书长', '副秘书长', '执行秘书长', '常务秘书长',
    '理事', '常务理事', '执行理事', '干事', '执委',
    '常委', '名誉顾问', '特邀顾问', '首席顾问'
  ],
  // 社会职务后缀（用于从社会职务中提取组织名称）
  socialTitleSuffixes: [
    '常务副会长兼秘书长', '执行会长兼秘书长', '会长兼秘书长',
    '常务副会长', '执行会长', '名誉会长', '创会会长',
    '副会长', '会长', '理事长', '副理事长',
    '秘书长', '副秘书长', '执行秘书长', '常务秘书长',
    '理事', '常务理事', '执行理事', '干事', '执委',
    '常委', '名誉顾问', '特邀顾问', '首席顾问'
  ],
  // 身份标签关键词
  identityKeywords: [
    // 英文标签（高级优先）
    'VVIP', 'SVIP', 'VIP', 'VIP会员',
    
    // 基础身份
    '嘉宾', '特邀', '贵宾', '核心', '重要',
    '理事', '会员', '高级', '资深', '荣誉',
    
    // 组织机构
    '秘书处', '董事会', '会长', '副会长', '理事长',
    '秘书长', '干事', '执委', '常委',
    
    // 培训班级/社群
    '领导力', '领导力班', '兄弟连', '校友会', '同学会', '联谊会',
    
    // 商会组织（通用匹配）
    '商会', '协会', '客家商会', '川渝商会', '三秦商会', '广西商会', '芯楚会',
    'IC豫商会', 'IC湘会', 'IC川会', 'IC鄂会',
    
    // 赞助商等级（完整版）
    '冠名赞助商', '至尊赞助商', '王者赞助商', '荣耀赞助商',
    '钻石赞助商', '金牌赞助商', '银牌赞助商', '铜牌赞助商',
    '赞助商', '冠名商', '战略合作伙伴', '合作伙伴',
    // 赞助商等级（简化版）
    '冠名赞助', '至尊赞助', '王者赞助', '荣耀赞助',
    '钻石赞助', '金牌赞助', '银牌赞助', '铜牌赞助',
    '赞助',
    
    // 活动身份
    '主办方', '承办方', '协办单位', '支持单位', '指导单位',
    
    // 会员等级
    '普通会员', '高级会员', '金牌会员', '白金会员', '钻石会员',
    '终身会员', '创始会员', '荣誉会员', '企业会员', '个人会员',
    
    // 嘉宾类型
    '特邀嘉宾', '参会嘉宾', '主讲嘉宾', '分享嘉宾', '演讲嘉宾',
    '主持人', '颁奖嘉宾', '启动仪式嘉宾', '论坛嘉宾', '对话嘉宾',
    '主讲人', '圆桌嘉宾', '研讨嘉宾',
    
    // 报名来源
    '活动报名', '在线报名', '邀请报名', '推荐报名', '自主报名',
    
    // 其他身份
    '媒体', '记者', '摄影', '工作人员', '志愿者',
    '代表团', '观察员', '旁听', '列席', '随行',
    
    // 工作组
    '节目组', '后勤组', '现场组', '签到组', '工作组', '招商组', '舞蹈组', '气氛组',
    
    // 特殊身份
    '受邀嘉宾', '嫂子团'
  ],
  // 公司名称关键词（注意：商会、协会通常作为身份标签，不应在此列表）
  companyKeywords: [
    '有限公司', '股份公司', '集团', '公司', '企业',
    '科技', '技术', '投资', '控股', '实业',
    '银行', '保险', '证券', '基金', '资本',
    '咨询', '服务', '贸易', '商业', '产业',
    '研究院', '研究所', '中心', '联合会',
    // 场所类
    '茶馆', '茶楼', '茶室', '餐厅', '饭店', '酒店', '宾馆',
    '会所', '俱乐部', '咖啡', '咖啡馆', '酒吧', '书店',
    '工作室', '工作坊', '设计院', '事务所', '律所'
  ],
  // 常见姓氏（百家姓前100）
  commonSurnames: [
    '赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈',
    '褚', '卫', '蒋', '沈', '韩', '杨', '朱', '秦', '尤', '许',
    '何', '吕', '施', '张', '孔', '曹', '严', '华', '金', '魏',
    '陶', '姜', '戚', '谢', '邹', '喻', '柏', '水', '窦', '章',
    '云', '苏', '潘', '葛', '奚', '范', '彭', '郎', '鲁', '韦',
    '昌', '马', '苗', '凤', '花', '方', '俞', '任', '袁', '柳',
    '酆', '鲍', '史', '唐', '费', '廉', '岑', '薛', '雷', '贺',
    '倪', '汤', '滕', '殷', '罗', '毕', '郝', '邬', '安', '常',
    '乐', '于', '时', '傅', '皮', '卞', '齐', '康', '伍', '余',
    '元', '卜', '顾', '孟', '平', '黄', '和', '穆', '萧', '尹'
  ],
  // 常见复姓
  compoundSurnames: [
    '欧阳', '上官', '诸葛', '司马', '慕容', '公孙', '东方', '令狐',
    '皇甫', '欧阳', '端木', '百里', '轩辕', '长孙', '宇文', '独孤',
    '司空', '司徒', '夏侯', '太史', '闻人', '澹台', '公冶', '宗政',
    '濮阳', '淳于', '单于', '陈林', '巫马', '公羊', '公西', '颛孙',
    '壤驷', '漆雕', '乐正', '拓跋', '夹谷', '宰父', '谷梁', '左丘'
  ]
};

// 判断是否为手机号
const isPhoneNumber = (text: string): boolean => {
  return /^1[3-9]\d{9}$/.test(text);
};

// 判断是否包含公司关键词
const containsCompanyKeyword = (text: string): boolean => {
  return PATTERNS.companyKeywords.some(kw => text.includes(kw));
};

// 判断是否包含职位关键词
const containsTitleKeyword = (text: string): boolean => {
  const upperText = text.toUpperCase();
  return PATTERNS.titleKeywords.some(kw => 
    text.includes(kw) || upperText.includes(kw.toUpperCase())
  );
};

// 判断是否是社会组织职务（如"XX商会会长"、"XX协会秘书长"）
const isSocialTitle = (text: string): boolean => {
  if (!text) return false;
  // 检查是否以社会职务后缀结尾
  for (const suffix of PATTERNS.socialTitleSuffixes) {
    if (text.endsWith(suffix)) {
      // 排除纯职务（如单独的"会长"、"秘书长"）
      const orgPart = text.slice(0, -suffix.length);
      if (orgPart.length >= 2) {
        return true;
      }
    }
  }
  return false;
};

// 从社会职务中提取组织名称（如"山东电子商会会长" -> "山东电子商会"）
const extractOrganizationName = (socialTitle: string): string => {
  if (!socialTitle) return '';
  
  // 去掉社会职务后缀
  let orgName = socialTitle;
  for (const suffix of PATTERNS.socialTitleSuffixes) {
    if (orgName.endsWith(suffix)) {
      orgName = orgName.slice(0, -suffix.length);
      break;
    }
  }
  
  if (!orgName) return socialTitle;
  
  // 优化组织名称：
  // 1. 去掉"市"字（如"深圳市电子商会" -> "深圳电子商会"）
  orgName = orgName.replace(/市/g, '');
  
  // 2. 处理嵌套地域名（如"深圳市河南泌阳商会" -> "深圳泌阳商会"）
  // 省份名 + 市名 的情况，保留最后一个具体地名
  const provinceCityPattern = /^([\u4e00-\u9fa5]{2,3})([\u4e00-\u9fa5]{2,3})(商会|协会|联合会)/;
  const match = orgName.match(provinceCityPattern);
  if (match && match.length === 4) {
    // 如果第一个地名是省份，第二个是城市/地区，可以简化
    // 但保留第二个地名作为代表
    // 例如 "深圳河南泌阳商会" -> 保留"深圳"和"泌阳"
  }
  
  // 3. 如果名称超过6个字，尝试进一步简化
  if (orgName.length > 6) {
    // 去掉省份前缀（如"山东"、"陕西"等）
    const provinces = ['山东', '山西', '陕西', '河南', '河北', '湖南', '湖北', 
                       '广东', '广西', '四川', '云南', '贵州', '浙江', '江苏',
                       '安徽', '福建', '江西', '辽宁', '吉林', '黑龙江'];
    for (const province of provinces) {
      if (orgName.startsWith(province)) {
        const remaining = orgName.slice(province.length);
        // 确保去掉省份后仍有意义
        if (remaining.length >= 4) {
          orgName = remaining;
          break;
        }
      }
    }
  }
  
  return orgName;
};

// 判断是否包含身份标签关键词
const containsIdentityKeyword = (text: string): boolean => {
  const upperText = text.toUpperCase();
  return PATTERNS.identityKeywords.some(kw => 
    text.includes(kw) || upperText.includes(kw.toUpperCase())
  );
};

// 判断是否可能是姓名（2-4个汉字，且不是身份标签或公司）
const isPossibleName = (text: string): boolean => {
  if (!text) return false;
  // 排除已知的身份标签关键词
  if (containsIdentityKeyword(text)) return false;
  // 排除包含公司关键词的文本
  if (containsCompanyKeyword(text)) return false;
  // 2-4个汉字
  if (/^[\u4e00-\u9fa5]{2,4}$/.test(text)) return true;
  // 或是中文+英文名格式 如 "张三 Sam"
  if (/^[\u4e00-\u9fa5]{2,4}\s+[A-Za-z]+$/.test(text)) return true;
  return false;
};

// 判断是否更可能是姓名（以常见姓氏或复姓开头）
const isLikelyName = (text: string): boolean => {
  if (!text || text.length < 2) return false;
  // 先检查复姓（前两个字）
  const firstTwoChars = text.substring(0, 2);
  if (PATTERNS.compoundSurnames.includes(firstTwoChars)) return true;
  // 再检查单字姓氏（第一个字）
  const firstChar = text.charAt(0);
  return PATTERNS.commonSurnames.includes(firstChar);
};

// 提取桌号
const extractTableNumber = (text: string): string | null => {
  // 匹配 "桌号A1", "A1桌", "A1号桌", "1号桌", "VIP1桌" 等
  const patterns = [
    /桌号\s*([A-Za-z]?\d+)/i,
    /桌号\s*([A-Za-z]+\d+)/i,
    /([A-Za-z]+\d+)\s*号?桌/i,
    /([A-Za-z]?\d+)\s*号?桌/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  return null;
};

// 智能解析单行数据
const smartParseLine = (cells: string[]): Partial<Person> & { tableNumber?: string } => {
  const result: Partial<Person> & { tableNumber?: string } = {
    tags: [],
  };
  
  // 清理并收集所有非空单元格
  const cleanCells = cells
    .map(cell => cleanTags(cell?.toString().trim() || ''))
    .filter(cell => cell.length > 0);
  
  // 提取所有标签
  cells.forEach(cell => {
    const tags = extractTags(cell?.toString() || '');
    result.tags!.push(...tags);
  });
  
  // 遍历每个单元格进行分类
  const unassigned: string[] = [];
  
  for (const cell of cleanCells) {
    // 1. 识别手机号
    if (isPhoneNumber(cell)) {
      result.phone = cell;
      continue;
    }
    
    // 2. 识别桌号
    const tableNum = extractTableNumber(cell);
    if (tableNum) {
      result.tableNumber = tableNum;
      continue;
    }
    
    // 3. 识别公司（包含公司关键词）
    if (containsCompanyKeyword(cell)) {
      result.company = cell;
      result.companyShort = extractCompanyShortName(cell);
      continue;
    }
    
    // 4. 识别职位（包含职位关键词）
    if (containsTitleKeyword(cell)) {
      // 判断是否是社会组织职务（如"XX商会会长"）
      if (isSocialTitle(cell)) {
        // 如果没有公司名称，将社会职务作为公司名称
        if (!result.company) {
          result.company = cell;
          result.companyShort = extractOrganizationName(cell);
        } else {
          // 已有公司，则作为职位
          result.title = cell;
        }
      } else {
        // 普通职位
        result.title = cell;
      }
      continue;
    }
    
    // 5. 识别身份标签（作为标签）
    if (containsIdentityKeyword(cell) && !result.tags!.includes(cell)) {
      result.tags!.push(cell);
      continue;
    }
    
    // 6. 剩余的加入待分配列表
    unassigned.push(cell);
  }
  
  // 从未分配的单元格中识别姓名和公司
  // 先收集所有可能是姓名的字段（2-4个汉字）
  const shortFields: { text: string; index: number }[] = [];
  const longFields: string[] = [];
  
  unassigned.forEach((cell, index) => {
    if (isPossibleName(cell)) {
      shortFields.push({ text: cell, index });
    } else {
      longFields.push(cell);
    }
  });
  
  // 智能分配策略
  if (shortFields.length >= 2) {
    // 有多个短字段（2-4个汉字），需要判断哪个是姓名
    // 策略：优先选择以常见姓氏开头的作为姓名
    const nameLikelyFields = shortFields.filter(f => isLikelyName(f.text));
    
    if (nameLikelyFields.length === 1) {
      // 只有一个字段以常见姓氏开头，作为姓名
      result.name = nameLikelyFields[0].text;
      // 另一个作为公司
      const otherFields = shortFields.filter(f => f.text !== result.name);
      if (otherFields.length > 0) {
        result.company = otherFields[0].text;
        result.companyShort = extractCompanyShortName(otherFields[0].text);
      }
    } else if (nameLikelyFields.length >= 2) {
      // 多个字段都以常见姓氏开头，选择最短的作为姓名
      nameLikelyFields.sort((a, b) => {
        const lenDiff = a.text.length - b.text.length;
        if (lenDiff !== 0) return lenDiff;
        return a.index - b.index;
      });
      result.name = nameLikelyFields[0].text;
      result.company = nameLikelyFields[1].text;
      result.companyShort = extractCompanyShortName(nameLikelyFields[1].text);
      // 剩余的加入
      for (let i = 2; i < nameLikelyFields.length; i++) {
        longFields.push(nameLikelyFields[i].text);
      }
    } else {
      // 都不以常见姓氏开头，选择最短或第一个作为姓名
      shortFields.sort((a, b) => {
        const lenDiff = a.text.length - b.text.length;
        if (lenDiff !== 0) return lenDiff;
        return a.index - b.index;
      });
      result.name = shortFields[0].text;
      result.company = shortFields[1].text;
      result.companyShort = extractCompanyShortName(shortFields[1].text);
    }
    
    // 剩余的短字段加入长字段列表
    const usedTexts = [result.name, result.company].filter(Boolean);
    for (const f of shortFields) {
      if (!usedTexts.includes(f.text)) {
        longFields.push(f.text);
      }
    }
  } else if (shortFields.length === 1) {
    // 只有一个短字段，作为姓名
    result.name = shortFields[0].text;
    // 长字段作为公司
    if (longFields.length > 0) {
      result.company = longFields[0];
      result.companyShort = extractCompanyShortName(longFields[0]);
    }
  } else {
    // 没有短字段，第一个长字段作为姓名，第二个作为公司
    if (longFields.length > 0) {
      result.name = longFields[0];
      if (longFields.length > 1) {
        result.company = longFields[1];
        result.companyShort = extractCompanyShortName(longFields[1]);
      }
    }
  }
  
  // 去重标签
  result.tags = [...new Set(result.tags)];
  
  return result;
};

// 智能解析数组数据（Excel/CSV）
const smartParseArrayData = (data: string[][]): Person[] => {
  if (data.length === 0) return [];
  
  const persons: Person[] = [];
  
  // 检测是否有标题行
  const firstRow = data[0];
  let hasHeader = false;
  const headerMap: Record<string, number> = {};
  
  // 尝试识别标题行
  firstRow.forEach((cell, index) => {
    const lowerCell = (cell || '').toString().toLowerCase().trim();
    if (lowerCell.includes('姓名') || lowerCell === 'name') {
      headerMap.name = index;
      hasHeader = true;
    } else if (lowerCell.includes('公司') || lowerCell === 'company') {
      headerMap.company = index;
      hasHeader = true;
    } else if (lowerCell.includes('职位') || lowerCell === 'title' || lowerCell.includes('职务')) {
      headerMap.title = index;
      hasHeader = true;
    } else if (lowerCell.includes('电话') || lowerCell.includes('手机') || lowerCell === 'phone') {
      headerMap.phone = index;
      hasHeader = true;
    } else if (lowerCell.includes('桌') || lowerCell.includes('座位')) {
      headerMap.tableNumber = index;
      hasHeader = true;
    } else if (lowerCell.includes('身份') || lowerCell.includes('标签') || lowerCell.includes('备注')) {
      headerMap.tags = index;
      hasHeader = true;
    }
  });
  
  // 从哪一行开始解析数据
  const startRow = hasHeader ? 1 : 0;
  
  for (let i = startRow; i < data.length; i++) {
    const row = data[i];
    if (row.every(cell => !cell || cell.toString().trim() === '')) continue;
    
    let person: Partial<Person> & { tableNumber?: string };
    
    if (hasHeader && Object.keys(headerMap).length > 0) {
      // 有标题行，按列解析
      person = {
        name: headerMap.name !== undefined ? cleanTags(row[headerMap.name]?.toString() || '') : '',
        company: headerMap.company !== undefined ? row[headerMap.company]?.toString().trim() || '' : '',
        title: headerMap.title !== undefined ? row[headerMap.title]?.toString().trim() || '' : '',
        phone: headerMap.phone !== undefined ? row[headerMap.phone]?.toString().trim() || '' : '',
        tableNumber: headerMap.tableNumber !== undefined ? row[headerMap.tableNumber]?.toString().trim() : undefined,
        tags: [],
      };
      
      // 提取姓名中的标签
      if (person.name) {
        const tags = extractTags(row[headerMap.name]?.toString() || '');
        person.tags = tags;
        person.name = cleanTags(person.name);
      }
      
      // 从身份列提取标签
      if (headerMap.tags !== undefined) {
        const tagStr = row[headerMap.tags]?.toString() || '';
        const extraTags = extractTags(tagStr);
        // 也识别逗号分隔的标签
        const commaTags = tagStr.split(/[,，、]/).map(t => t.trim()).filter(t => t);
        person.tags = [...(person.tags || []), ...extraTags, ...commaTags];
      }
      
      // 提取桌号
      if (person.tableNumber) {
        const extracted = extractTableNumber(person.tableNumber);
        if (extracted) {
          person.tableNumber = extracted;
        }
      }
    } else {
      // 无标题行，使用智能解析
      person = smartParseLine(row);
    }
    
    if (person.name && person.name.length >= 2) {
      persons.push({
        id: generateId(),
        name: person.name,
        company: person.company || '',
        companyShort: person.companyShort || extractCompanyShortName(person.company || ''),
        title: person.title || '',
        phone: person.phone || '',
        tags: person.tags || [],
        tableNumber: person.tableNumber,
      });
    }
  }
  
  return persons;
};

// 解析纯文本数据（智能解析每行）
const smartParseTextData = (text: string): Person[] => {
  const lines = text.split('\n').filter(line => line.trim());
  const persons: Person[] = [];
  
  for (const line of lines) {
    // 支持多种分隔符：制表符、逗号、空格、中文逗号
    let parts: string[] = [];
    
    if (line.includes('\t')) {
      parts = line.split('\t').map(p => p.trim());
    } else if (line.includes('，')) {
      parts = line.split('，').map(p => p.trim());
    } else if (line.includes(',')) {
      parts = line.split(',').map(p => p.trim());
    } else if (line.includes(' ')) {
      parts = line.split(/\s+/).map(p => p.trim());
    } else {
      parts = [line.trim()];
    }
    
    const person = smartParseLine(parts);
    
    if (person.name && person.name.length >= 2) {
      persons.push({
        id: generateId(),
        name: person.name,
        company: person.company || '',
        companyShort: person.companyShort || extractCompanyShortName(person.company || ''),
        title: person.title || '',
        phone: person.phone || '',
        tags: person.tags || [],
        tableNumber: person.tableNumber,
      });
    }
  }
  
  return persons;
};

// ============ 文件解析函数 ============

// 解析 Excel 文件
export const parseExcel = async (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx');
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        
        const persons = smartParseArrayData(jsonData);
        resolve({ success: true, persons, errors: [] });
      } catch (error) {
        resolve({ success: false, persons: [], errors: ['Excel 文件解析失败'] });
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

// 解析 CSV 文件
export const parseCSV = async (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const data = lines.map(line => {
          // 处理逗号分隔，支持引号包裹
          const cells: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (const char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              cells.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          cells.push(current.trim());
          
          return cells;
        });
        
        const persons = smartParseArrayData(data);
        resolve({ success: true, persons, errors: [] });
      } catch (error) {
        resolve({ success: false, persons: [], errors: ['CSV 文件解析失败'] });
      }
    };
    reader.readAsText(file);
  });
};

// 解析 TXT 文件
export const parseTXT = async (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const persons = smartParseTextData(text);
        resolve({ success: true, persons, errors: [] });
      } catch (error) {
        resolve({ success: false, persons: [], errors: ['TXT 文件解析失败'] });
      }
    };
    reader.readAsText(file);
  });
};

// 解析 JSON 文件
export const parseJSON = async (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data: unknown = JSON.parse(text);

        const str = (value: unknown): string => (typeof value === 'string' ? value : '');
        const toPerson = (raw: Record<string, unknown>, fallbackTable?: string): Person => {
          const company = str(raw.company) || str(raw['公司']);
          return {
            id: str(raw.id) || generateId(),
            name: str(raw.name) || str(raw['姓名']),
            company,
            companyShort: extractCompanyShortName(company),
            title: str(raw.title) || str(raw['职位']),
            phone: str(raw.phone) || str(raw['电话']),
            tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
            tableNumber: fallbackTable ?? (str(raw.tableNumber) || str(raw['桌号']) || undefined),
          };
        };

        const persons: Person[] = [];

        if (Array.isArray(data)) {
          for (const item of data) persons.push(toPerson(item as Record<string, unknown>));
        } else if (data && typeof data === 'object') {
          const obj = data as { persons?: unknown; tables?: unknown };
          if (Array.isArray(obj.persons)) {
            for (const item of obj.persons) persons.push(toPerson(item as Record<string, unknown>));
          } else if (Array.isArray(obj.tables)) {
            for (const table of obj.tables) {
              const t = table as { name?: string; persons?: unknown };
              if (Array.isArray(t.persons)) {
                for (const person of t.persons) persons.push(toPerson(person as Record<string, unknown>, t.name));
              }
            }
          }
        }
        
        resolve({ success: true, persons, errors: [] });
      } catch (error) {
        resolve({ success: false, persons: [], errors: ['JSON 文件解析失败'] });
      }
    };
    reader.readAsText(file);
  });
};

// 解析文本粘贴数据
export const parseTextPaste = (text: string): ImportResult => {
  try {
    const persons = smartParseTextData(text);
    return { success: true, persons, errors: [] };
  } catch (error) {
    return { success: false, persons: [], errors: ['文本解析失败'] };
  }
};

// ============ 导出函数 ============

// 导出为 JSON
export const exportToJSON = (activity: Activity): string => {
  const data: SeatingData = {
    activity: activity.name,
    tables: activity.tables.map(table => ({
      name: table.name,
      capacity: table.capacity,
      persons: table.persons,
    })),
  };
  return JSON.stringify(data, null, 2);
};

// 导出为 TXT
export const exportToTXT = (activity: Activity): string => {
  let text = `活动名称：${activity.name}\n`;
  text += `生成时间：${new Date().toLocaleString()}\n`;
  text += `${'='.repeat(50)}\n\n`;
  
  activity.tables.forEach(table => {
    const tableLeader = table.persons.length > 0 ? table.persons[0].name : '无';
    text += `${table.name}（${table.persons.length}/${table.capacity}人）| 桌长：${tableLeader}\n`;
    text += `${'-'.repeat(30)}\n`;
    table.persons.forEach((person, index) => {
      text += `${index + 1}. ${person.name}`;
      if (person.company) text += ` - ${person.company}`;
      if (person.title) text += ` - ${person.title}`;
      if (person.tags.length > 0) text += ` [${person.tags.join(', ')}]`;
      text += '\n';
    });
    text += '\n';
  });
  
  text += `未分配人员（${activity.persons.length}人）\n`;
  text += `${'-'.repeat(30)}\n`;
  activity.persons.forEach((person, index) => {
    text += `${index + 1}. ${person.name}`;
    if (person.company) text += ` - ${person.company}`;
    text += '\n';
  });
  
  return text;
};

// 导出为 Excel
export const exportToExcel = async (activity: Activity): Promise<void> => {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  
  // 汇总表 - 所有人员统一导出
  // 字段顺序：姓名 > 手机号 > 公司全称 > 公司简称 > 桌号 > 座位号 > 参会身份
  const summaryData: (string | number)[][] = [
    ['姓名', '手机号', '公司全称', '公司简称', '桌号', '座位号', '参会身份'],
  ];
  
  // 收集已排座人员
  activity.tables.forEach(table => {
    table.persons.forEach((person, index) => {
      const seatNumber = index + 1;
      summaryData.push([
        person.name,
        person.phone || '',
        person.company || '',
        person.companyShort || extractCompanyShortName(person.company || ''),
        table.name,
        seatNumber,
        person.tags.join(', '),
      ]);
    });
  });
  
  // 收集未排座人员
  activity.persons.forEach(person => {
    summaryData.push([
      person.name,
      person.phone || '',
      person.company || '',
      person.companyShort || extractCompanyShortName(person.company || ''),
      '', // 未排座无桌号
      '', // 未排座无座位号
      person.tags.join(', '),
    ]);
  });
  
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  
  // 设置列宽
  summaryWs['!cols'] = [
    { wch: 10 },  // 姓名
    { wch: 15 },  // 手机号
    { wch: 30 },  // 公司全称
    { wch: 12 },  // 公司简称
    { wch: 10 },  // 桌号
    { wch: 8 },   // 座位号
    { wch: 15 },  // 参会身份
  ];
  
  XLSX.utils.book_append_sheet(wb, summaryWs, '人员名单汇总');
  
  // 保留原有的分桌详情表（可选）
  activity.tables.forEach(table => {
    const tableLeader = table.persons.length > 0 ? table.persons[0].name : '无';
    const data: (string | number)[][] = [
      ['桌位', table.name],
      ['容量', table.capacity],
      ['已入座', table.persons.length],
      ['桌长', tableLeader],
      [],
      ['姓名', '手机号', '公司全称', '公司简称', '座位号', '参会身份'],
    ];
    
    table.persons.forEach((person, index) => {
      data.push([
        person.name,
        person.phone || '',
        person.company || '',
        person.companyShort || extractCompanyShortName(person.company || ''),
        index + 1,
        person.tags.join(', '),
      ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, table.name.substring(0, 31)); // Excel sheet名最多31字符
  });
  
  // 未排座人员表
  if (activity.persons.length > 0) {
    const unseatedData: (string | number)[][] = [
      ['姓名', '手机号', '公司全称', '公司简称', '参会身份'],
    ];
    
    activity.persons.forEach(person => {
      unseatedData.push([
        person.name,
        person.phone || '',
        person.company || '',
        person.companyShort || extractCompanyShortName(person.company || ''),
        person.tags.join(', '),
      ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(unseatedData);
    XLSX.utils.book_append_sheet(wb, ws, '未排座人员');
  }
  
  XLSX.writeFile(wb, `排座表_${activity.name}_${new Date().toLocaleDateString()}.xlsx`);
};

// 自动排座（保留已排座人员，只填充未满且未锁定的桌位）
export const autoSeat = (unseatedPersons: Person[], tables: Table[]): Table[] => {
  // 保留已有桌位的人员，不清空
  const result = tables.map(table => ({
    ...table,
    persons: [...table.persons] as Person[],
  }));
  
  // 按导入顺序处理未排座人员
  unseatedPersons.forEach(person => {
    // 优先按预设桌号排座
    if (person.tableNumber) {
      const targetTable = result.find(t => 
        t.name.toLowerCase() === person.tableNumber!.toLowerCase()
      );
      // 检查桌位未锁定且有剩余容量
      if (targetTable && 
          !targetTable.seatLock && 
          targetTable.persons.length < targetTable.capacity) {
        targetTable.persons.push(person);
        return;
      }
    }
    
    // 找到第一个未满且未锁定的桌位（从靠前的桌位开始）
    for (let i = 0; i < result.length; i++) {
      // 跳过桌员锁定的桌位
      if (result[i].seatLock) continue;
      
      if (result[i].persons.length < result[i].capacity) {
        result[i].persons.push(person);
        return;
      }
    }
  });
  
  return result;
};

// 保存到 localStorage
export const saveToStorage = (key: string, data: unknown): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// 从 localStorage 读取
export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored) as T;
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
};

// 智能去重结果
export interface DeduplicateResult {
  unique: Person[];           // 去重后的唯一人员
  duplicates: Person[];       // 完全重复的人员
  conflicts: Person[];        // 同名冲突（同名不同人）
  existing: Person[];         // 已存在于名单中的人员
  stats: {
    total: number;            // 原始总数
    uniqueCount: number;      // 唯一数量
    duplicateCount: number;   // 完全重复数量
    conflictCount: number;    // 同名冲突数量
    existingCount: number;    // 已存在数量
  };
}

// 生成人员唯一标识（用于判断是否完全重复）
const getPersonKey = (person: Person): string => {
  // 姓名作为主要标识（手机号可能为空）
  const name = (person.name || '').trim().toLowerCase();
  const phone = (person.phone || '').trim();
  // 如果有手机号，使用姓名+手机号；否则只用姓名
  return phone ? `${name}|${phone}` : name;
};

// 智能去重函数
export const deduplicatePersons = (
  newPersons: Person[], 
  existingPersons: Person[] = [],
  options: { keepConflicts?: boolean } = {}
): DeduplicateResult => {
  const { keepConflicts = true } = options;
  
  console.log('[deduplicatePersons] 开始去重');
  console.log('[deduplicatePersons] 新导入人员:', newPersons.length);
  console.log('[deduplicatePersons] 现有人员:', existingPersons.length);
  
  const result: DeduplicateResult = {
    unique: [],
    duplicates: [],
    conflicts: [],
    existing: [],
    stats: {
      total: newPersons.length,
      uniqueCount: 0,
      duplicateCount: 0,
      conflictCount: 0,
      existingCount: 0,
    },
  };
  
  // 构建已存在人员的标识集合
  const existingKeys = new Set<string>();
  const existingNames = new Map<string, Person>();
  existingPersons.forEach(p => {
    const key = getPersonKey(p);
    const name = (p.name || '').trim().toLowerCase();
    existingKeys.add(key);
    existingNames.set(name, p);
    console.log('[deduplicatePersons] 现有人员:', p.name, 'key:', key);
  });
  
  console.log('[deduplicatePersons] existingKeys:', Array.from(existingKeys));
  
  // 用于检测内部重复
  const seenKeys = new Set<string>();
  const seenNames = new Map<string, Person>();
  
  // 遍历新导入的人员
  newPersons.forEach(person => {
    const key = getPersonKey(person);
    const name = (person.name || '').trim().toLowerCase();
    
    console.log('[deduplicatePersons] 检查人员:', person.name, 'key:', key);
    
    // 1. 检查是否已存在于名单中（最优先）
    if (existingKeys.has(key)) {
      console.log('[deduplicatePersons] -> 已存在（完全匹配）');
      result.existing.push(person);
      result.stats.existingCount++;
      return;
    }
    
    // 2. 检查是否与本次导入的其他人员完全重复
    if (seenKeys.has(key)) {
      console.log('[deduplicatePersons] -> 内部重复');
      result.duplicates.push(person);
      result.stats.duplicateCount++;
      return;
    }
    
    // 3. 检查同名冲突（姓名相同但手机号不同）
    if (seenNames.has(name)) {
      // 与本次导入的其他人员同名
      console.log('[deduplicatePersons] -> 同名冲突（内部）');
      result.conflicts.push(person);
      result.stats.conflictCount++;
      if (keepConflicts) {
        seenKeys.add(key);
        seenNames.set(name, person);
        result.unique.push(person);
        result.stats.uniqueCount++;
      }
      return;
    }
    
    // 检查是否与已存在名单中的人员同名
    if (existingNames.has(name)) {
      const existingPerson = existingNames.get(name)!;
      // 如果手机号不同，算作同名冲突
      const existingPhone = (existingPerson.phone || '').trim();
      const newPhone = (person.phone || '').trim();
      if (existingPhone !== newPhone) {
        console.log('[deduplicatePersons] -> 同名冲突（与现有）');
        result.conflicts.push(person);
        result.stats.conflictCount++;
        if (keepConflicts) {
          seenKeys.add(key);
          seenNames.set(name, person);
          result.unique.push(person);
          result.stats.uniqueCount++;
        }
        return;
      }
      // 手机号也相同，算作已存在
      console.log('[deduplicatePersons] -> 已存在（同名同手机）');
      result.existing.push(person);
      result.stats.existingCount++;
      return;
    }
    
    // 4. 唯一人员，添加到结果
    console.log('[deduplicatePersons] -> 唯一新人员');
    seenKeys.add(key);
    seenNames.set(name, person);
    result.unique.push(person);
    result.stats.uniqueCount++;
  });
  
  console.log('[deduplicatePersons] 去重结果:', result.stats);
  return result;
};
