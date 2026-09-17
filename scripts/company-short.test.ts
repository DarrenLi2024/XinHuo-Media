import assert from 'node:assert/strict';
import {
  extractCompanyShortName,
  isCompanyShortNameTruncation,
  resolveCompanyShortName,
} from '@/lib/seating/helpers';

const changedCases = [
  ['信芯诺电子（深圳）有限公司', '信芯诺电', '信芯诺'],
  ['嘉鹏微电子商务有限公司', '嘉鹏微电', '嘉鹏微'],
  ['阿尔法智慧系统有限公司', '阿尔法智', '阿尔法智慧'],
  ['科伟奇电子(北京）有限公司', '科伟奇电', '科伟奇'],
  ['芯能王电子（深圳）有限公司', '芯能王电', '芯能王'],
  ['信芯诺电子（深圳）有限公司（彭敏波，同公司）', '信芯诺电', '信芯诺'],
] as const;

for (const [company, oldShort, expected] of changedCases) {
  assert.equal(resolveCompanyShortName(company, oldShort), expected, company);
}

const preservedCases = [
  ['深圳市芯皓电子有限公司', '芯皓电子'],
  ['招商银行福田支行营业部', '招商银行'],
  ['福田银座村镇银行坂田支行', '福田银座'],
  ['芯时光文化传媒有限公司', '芯时光'],
  ['艾朗特思电子深圳有限公司', '艾朗特思'],
  ['京玺科技（深圳）企业', '京玺科技'],
  ['酒好多国际酒业有限公司', '酒好多国际'],
  ['芯语服务发展有限公司', '芯语'],
  ['海德國際科技有限公司', '海德國際'],
  ['香港心联芯实业有限公司', '心联芯'],
  ['深圳匯众鼎泰科技有限公司', '匯众鼎泰'],
  ['美满电子科技有限公司', '美满电子'],
  ['英丹电子有限公司', '英丹电子'],
  ['广赢电子有限公司', '广赢电子'],
] as const;

const regionAndBrandCases = [
  ['深圳市尚善电子有限公司', '尚善电子'],
  ['深圳市瑞利通半导体有限公司', '瑞利通'],
  ['深圳市芯火传媒有限公司', '芯火传媒'],
  ['中国平安科技有限公司', '平安科技'],
  ['小米半导体有限公司', '小米半导体'],
  ['芯息壤传媒有限公司', '芯息壤'],
] as const;

for (const [company, expected] of preservedCases) {
  assert.equal(extractCompanyShortName(company), expected, company);
}

for (const [company, expected] of regionAndBrandCases) {
  assert.equal(extractCompanyShortName(company), expected, company);
}

assert.equal(resolveCompanyShortName('深圳市尚善电子有限公司', '深圳市尚善电子'), '尚善电子');
assert.equal(resolveCompanyShortName('深圳市瑞利通半导体有限公司', '深圳市瑞利通半导体'), '瑞利通');
assert.equal(resolveCompanyShortName('招商银行福田支行营业部', '招商银行'), '招商银行');

assert.equal(extractCompanyShortName(''), '');
assert.equal(isCompanyShortNameTruncation('信芯诺电', '信芯诺电子'), true);
assert.equal(isCompanyShortNameTruncation('招商银行', '招商银行福田支行营业部'), false);
assert.equal(isCompanyShortNameTruncation('福田银座', '福田银座村镇银行坂田支行'), false);

console.log(`company-short regression: ${changedCases.length + preservedCases.length + regionAndBrandCases.length + 7} assertions passed`);
