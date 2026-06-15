import { Position, TargetCompany, Candidate, InterviewFeedback } from "./types";

export const samplePositions: Position[] = [
  {
    id: "pos1", name: "SEO专家", department: "增长部", type: "专家岗", priority: "P0",
    hiringManager: "张伟", targetCount: 2, expectedDate: "2026-09-01",
    salaryRange: "40-60K", city: "深圳", keywords: "SEO,Google,国际站,货代",
    coreRequirements: "5年以上B2B行业SEO经验，精通Google算法，有国际站优化成功案例",
    industryRequirement: "B2B平台或物流/货代行业优先",
    status: "触达中", risk: "人才稀缺，竞争激烈", notes: "已联系3位候选人",
    createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-06-10T00:00:00Z"
  },
  {
    id: "pos2", name: "SEM投放专家", department: "增长部", type: "专家岗", priority: "P0",
    hiringManager: "张伟", targetCount: 2, expectedDate: "2026-08-15",
    salaryRange: "35-55K", city: "深圳", keywords: "SEM,Google Ads,ROI,B2B",
    coreRequirements: "精通Google Ads和Meta Ads，有B2B行业SEM投放经验，年预算管理千万级以上",
    industryRequirement: "B2B/SaaS行业",
    status: "Mapping中", risk: "暂无风险", notes: "",
    createdAt: "2026-05-10T00:00:00Z", updatedAt: "2026-06-12T00:00:00Z"
  },
  {
    id: "pos3", name: "平台运营经理", department: "运营部", type: "管理岗", priority: "P1",
    hiringManager: "李娜", targetCount: 1, expectedDate: "2026-10-01",
    salaryRange: "30-50K", city: "深圳", keywords: "平台运营,B2B,用户增长,数据分析",
    coreRequirements: "3年以上B2B平台运营经验，擅长数据驱动增长，有团队管理经验",
    industryRequirement: "B2B/电商平台",
    status: "面试中", risk: "候选人薪资预期偏高", notes: "已有1位A类候选人进入终面",
    createdAt: "2026-05-15T00:00:00Z", updatedAt: "2026-06-08T00:00:00Z"
  },
  {
    id: "pos4", name: "社群运营", department: "运营部", type: "一线执行岗", priority: "P1",
    hiringManager: "李娜", targetCount: 1, expectedDate: "2026-09-01",
    salaryRange: "20-35K", city: "深圳", keywords: "社群运营,私域,B2B,货代行业",
    coreRequirements: "2年以上B2B社群运营经验，熟悉企业微信/WhatsApp社群管理",
    industryRequirement: "B2B行业",
    status: "Mapping中", risk: "暂无风险", notes: "",
    createdAt: "2026-06-01T00:00:00Z", updatedAt: "2026-06-01T00:00:00Z"
  },
  {
    id: "pos5", name: "风控专家", department: "风控部", type: "专家岗", priority: "P0",
    hiringManager: "王磊", targetCount: 1, expectedDate: "2026-08-01",
    salaryRange: "45-70K", city: "深圳", keywords: "风控,反欺诈,跨境支付,物流",
    coreRequirements: "5年以上跨境支付/物流风控经验，熟悉国际制裁合规",
    industryRequirement: "跨境支付/物流/金融",
    status: "触达中", risk: "人才极度稀缺", notes: "考虑Remote或猎头渠道",
    createdAt: "2026-05-20T00:00:00Z", updatedAt: "2026-06-05T00:00:00Z"
  },
  {
    id: "pos6", name: "商业化产品经理", department: "产品部", type: "专家岗", priority: "P1",
    hiringManager: "陈明", targetCount: 1, expectedDate: "2026-11-01",
    salaryRange: "40-60K", city: "深圳", keywords: "商业化,B2B,SaaS,定价策略",
    coreRequirements: "3年以上B2B SaaS商业化经验，有定价模型设计经验",
    industryRequirement: "B2B SaaS",
    status: "Mapping中", risk: "暂无风险", notes: "",
    createdAt: "2026-06-05T00:00:00Z", updatedAt: "2026-06-05T00:00:00Z"
  },
  {
    id: "pos7", name: "会议运营专家", department: "市场部", type: "专家岗", priority: "P2",
    hiringManager: "赵欣", targetCount: 1, expectedDate: "2026-12-01",
    salaryRange: "25-40K", city: "深圳", keywords: "行业会议,活动策划,B2B,物流",
    coreRequirements: "3年以上B2B行业会议策划执行经验",
    industryRequirement: "B2B/物流/展会",
    status: "Mapping中", risk: "暂无风险", notes: "非紧急岗位",
    createdAt: "2026-06-10T00:00:00Z", updatedAt: "2026-06-10T00:00:00Z"
  },
];

export const sampleCompanies: TargetCompany[] = [
  { id: "co1", name: "Flexport", type: "竞品", industryTags: "货代,物流,科技", region: "海外", city: "旧金山", linkedPositions: ["pos1", "pos2", "pos5"], talentQuality: "高", huntPriority: "A", identifiedCandidates: 5, notes: "行业标杆，人才质量高", createdAt: "2026-05-01T00:00:00Z", updatedAt: "2026-05-01T00:00:00Z" },
  { id: "co2", name: "Freightos", type: "竞品", industryTags: "货代,平台", region: "海外", city: "耶路撒冷", linkedPositions: ["pos1", "pos6"], talentQuality: "高", huntPriority: "B", identifiedCandidates: 2, notes: "在线货代平台", createdAt: "2026-05-02T00:00:00Z", updatedAt: "2026-05-02T00:00:00Z" },
  { id: "co3", name: "运去哪", type: "竞品", industryTags: "货代,物流,平台", region: "华东", city: "上海", linkedPositions: ["pos2", "pos3", "pos4"], talentQuality: "高", huntPriority: "A", identifiedCandidates: 8, notes: "国内最大竞品", createdAt: "2026-05-03T00:00:00Z", updatedAt: "2026-05-03T00:00:00Z" },
  { id: "co4", name: "阿里巴巴国际站", type: "平台型公司", industryTags: "B2B,电商,跨境", region: "华东", city: "杭州", linkedPositions: ["pos1", "pos2", "pos3"], talentQuality: "高", huntPriority: "A", identifiedCandidates: 10, notes: "B2B人才主要来源", createdAt: "2026-05-04T00:00:00Z", updatedAt: "2026-05-04T00:00:00Z" },
  { id: "co5", name: "Salesforce", type: "SaaS公司", industryTags: "SaaS,CRM,B2B", region: "海外", city: "旧金山", linkedPositions: ["pos6"], talentQuality: "高", huntPriority: "B", identifiedCandidates: 3, notes: "商业化产品人才", createdAt: "2026-05-05T00:00:00Z", updatedAt: "2026-05-05T00:00:00Z" },
  { id: "co6", name: "Shopify Logistics", type: "平台型公司", industryTags: "物流,电商", region: "海外", city: "多伦多", linkedPositions: ["pos3", "pos5"], talentQuality: "中", huntPriority: "B", identifiedCandidates: 1, notes: "物流科技", createdAt: "2026-05-06T00:00:00Z", updatedAt: "2026-05-06T00:00:00Z" },
  { id: "co7", name: "马士基", type: "物流公司", industryTags: "航运,物流,供应链", region: "海外", city: "哥本哈根", linkedPositions: ["pos5"], talentQuality: "高", huntPriority: "C", identifiedCandidates: 2, notes: "传统物流巨头", createdAt: "2026-05-07T00:00:00Z", updatedAt: "2026-05-07T00:00:00Z" },
  { id: "co8", name: "纵腾集团", type: "跨境电商公司", industryTags: "跨境,物流,电商", region: "华南", city: "深圳", linkedPositions: ["pos1", "pos3", "pos5"], talentQuality: "中", huntPriority: "A", identifiedCandidates: 6, notes: "深圳本地，人才流动方便", createdAt: "2026-05-08T00:00:00Z", updatedAt: "2026-05-08T00:00:00Z" },
  { id: "co9", name: "递四方", type: "物流公司", industryTags: "跨境物流,货代", region: "华南", city: "深圳", linkedPositions: ["pos3", "pos5"], talentQuality: "中", huntPriority: "B", identifiedCandidates: 4, notes: "", createdAt: "2026-05-09T00:00:00Z", updatedAt: "2026-05-09T00:00:00Z" },
  { id: "co10", name: "HubSpot", type: "SaaS公司", industryTags: "SaaS,营销,B2B", region: "海外", city: "剑桥", linkedPositions: ["pos2", "pos6"], talentQuality: "高", huntPriority: "B", identifiedCandidates: 2, notes: "营销SaaS标杆", createdAt: "2026-05-10T00:00:00Z", updatedAt: "2026-05-10T00:00:00Z" },
];

export const sampleCandidates: Candidate[] = [
  {
    id: "cd1", name: "刘建国", currentCompany: "阿里巴巴国际站", currentPosition: "高级SEO经理", city: "杭州",
    contact: "138****1234", source: "LinkedIn", linkedPositionId: "pos1", linkedCompanyId: "co4",
    experienceYears: 8, currentSalary: "45K", expectedSalary: "55K",
    hasManagementExp: true, managementCount: 5, englishLevel: "流利",
    industryTags: "B2B,电商,国际站", skillTags: "SEO,Google,内容策略,技术SEO",
    positionTendency: "管理岗", status: "面试中", matchLevel: "高",
    riskPoints: "薪资期望偏高，异地需Relocate",
    notes: "曾在Flexport负责亚太区SEO",
    scores: { industryMatch: 5, positionExp: 5, performanceResults: 4, abilityMatch: 5, growthPotential: 4 },
    totalScore: 23, candidateLevel: "A", manualJudgment: "推荐面试",
    lastFollowUp: "2026-06-10", nextAction: "安排终面时间",
    createdAt: "2026-05-15T00:00:00Z", updatedAt: "2026-06-10T00:00:00Z"
  },
  {
    id: "cd2", name: "陈思远", currentCompany: "运去哪", currentPosition: "SEM投放主管", city: "上海",
    contact: "139****5678", source: "猎头", linkedPositionId: "pos2", linkedCompanyId: "co3",
    experienceYears: 6, currentSalary: "38K", expectedSalary: "48K",
    hasManagementExp: true, managementCount: 3, englishLevel: "良好",
    industryTags: "货代,物流", skillTags: "SEM,Google Ads,数据分析,B2B营销",
    positionTendency: "专家岗", status: "已触达", matchLevel: "高",
    riskPoints: "有竞业协议需确认",
    notes: "负责运去哪Google投放，年预算2000万",
    scores: { industryMatch: 5, positionExp: 4, performanceResults: 4, abilityMatch: 5, growthPotential: 4 },
    totalScore: 22, candidateLevel: "A", manualJudgment: "推荐面试",
    lastFollowUp: "2026-06-08", nextAction: "发送JD，确认意向",
    createdAt: "2026-05-20T00:00:00Z", updatedAt: "2026-06-08T00:00:00Z"
  },
  {
    id: "cd3", name: "王欣怡", currentCompany: "纵腾集团", currentPosition: "运营总监", city: "深圳",
    contact: "186****9012", source: "内推", linkedPositionId: "pos3", linkedCompanyId: "co8",
    experienceYears: 10, currentSalary: "42K", expectedSalary: "50K",
    hasManagementExp: true, managementCount: 12, englishLevel: "良好",
    industryTags: "跨境物流,平台运营", skillTags: "运营管理,数据分析,团队管理,增长策略",
    positionTendency: "管理岗", status: "Offer", matchLevel: "高",
    riskPoints: "背调中",
    notes: "已发Offer，等待回复",
    scores: { industryMatch: 4, positionExp: 5, performanceResults: 5, abilityMatch: 5, growthPotential: 4 },
    totalScore: 23, candidateLevel: "A", manualJudgment: "推荐面试",
    lastFollowUp: "2026-06-12", nextAction: "跟进Offer回复",
    createdAt: "2026-05-25T00:00:00Z", updatedAt: "2026-06-12T00:00:00Z"
  },
  {
    id: "cd4", name: "张明", currentCompany: "Flexport", currentPosition: "风控负责人", city: "旧金山",
    contact: "1-415-***", source: "LinkedIn", linkedPositionId: "pos5", linkedCompanyId: "co1",
    experienceYears: 12, currentSalary: "120K USD", expectedSalary: "70K CNY+",
    hasManagementExp: true, managementCount: 8, englishLevel: "母语",
    industryTags: "物流风控,跨境,制裁合规", skillTags: "风控体系,反欺诈,制裁合规,AML",
    positionTendency: "管理岗", status: "未触达", matchLevel: "高",
    riskPoints: "海外华人，回国意愿待确认",
    notes: "行业顶尖人才，需要HRD亲自触达",
    scores: { industryMatch: 5, positionExp: 5, performanceResults: 5, abilityMatch: 5, growthPotential: 5 },
    totalScore: 25, candidateLevel: "A", manualJudgment: "",
    lastFollowUp: "", nextAction: "通过LinkedIn InMail触达",
    createdAt: "2026-06-01T00:00:00Z", updatedAt: "2026-06-01T00:00:00Z"
  },
  {
    id: "cd5", name: "赵晓峰", currentCompany: "递四方", currentPosition: "社群运营经理", city: "深圳",
    contact: "177****3456", source: "Boss", linkedPositionId: "pos4", linkedCompanyId: "co9",
    experienceYears: 4, currentSalary: "25K", expectedSalary: "30K",
    hasManagementExp: false, managementCount: 0, englishLevel: "一般",
    industryTags: "跨境物流,私域运营", skillTags: "私域运营,企业微信,社群管理,内容策划",
    positionTendency: "可培养", status: "有兴趣", matchLevel: "中",
    riskPoints: "经验年限偏少",
    notes: "对货代行业社群运营有热情",
    scores: { industryMatch: 3, positionExp: 3, performanceResults: 3, abilityMatch: 4, growthPotential: 5 },
    totalScore: 18, candidateLevel: "B", manualJudgment: "推荐面试",
    lastFollowUp: "2026-06-05", nextAction: "安排初面",
    createdAt: "2026-05-28T00:00:00Z", updatedAt: "2026-06-05T00:00:00Z"
  },
  {
    id: "cd6", name: "林雨桐", currentCompany: "Shopee", currentPosition: "产品经理", city: "深圳",
    contact: "185****7890", source: "猎聘", linkedPositionId: "pos6", linkedCompanyId: "co6",
    experienceYears: 5, currentSalary: "38K", expectedSalary: "50K",
    hasManagementExp: true, managementCount: 2, englishLevel: "流利",
    industryTags: "电商,跨境,B2B", skillTags: "商业化,定价,数据分析,产品规划",
    positionTendency: "专家岗", status: "已触达", matchLevel: "中",
    riskPoints: "B2B经验偏少，主要是C端",
    notes: "对B2B商业化转型有意愿",
    scores: { industryMatch: 3, positionExp: 3, performanceResults: 4, abilityMatch: 4, growthPotential: 4 },
    totalScore: 18, candidateLevel: "B", manualJudgment: "推荐面试",
    lastFollowUp: "2026-06-03", nextAction: "安排面试",
    createdAt: "2026-06-01T00:00:00Z", updatedAt: "2026-06-03T00:00:00Z"
  },
  {
    id: "cd7", name: "孙浩然", currentCompany: "中国制造网", currentPosition: "会议策划总监", city: "南京",
    contact: "159****2345", source: "推荐", linkedPositionId: "pos7", linkedCompanyId: "co4",
    experienceYears: 9, currentSalary: "32K", expectedSalary: "38K",
    hasManagementExp: true, managementCount: 6, englishLevel: "良好",
    industryTags: "B2B,展会,活动策划", skillTags: "行业会议,活动策划,供应商管理",
    positionTendency: "长期关注", status: "长期关注", matchLevel: "中",
    riskPoints: "需Relocate到深圳",
    notes: "行业会议资源丰富",
    scores: { industryMatch: 4, positionExp: 4, performanceResults: 3, abilityMatch: 4, growthPotential: 3 },
    totalScore: 18, candidateLevel: "B", manualJudgment: "暂缓",
    lastFollowUp: "2026-05-20", nextAction: "Q3再跟进",
    createdAt: "2026-05-10T00:00:00Z", updatedAt: "2026-05-20T00:00:00Z"
  },
  {
    id: "cd8", name: "唐嘉琪", currentCompany: "百度", currentPosition: "高级SEM专家", city: "北京",
    contact: "133****6789", source: "LinkedIn", linkedPositionId: "pos2", linkedCompanyId: "",
    experienceYears: 7, currentSalary: "50K", expectedSalary: "55K",
    hasManagementExp: false, managementCount: 0, englishLevel: "一般",
    industryTags: "搜索营销,广告投放", skillTags: "SEM,百度推广,信息流,数据分析",
    positionTendency: "专家岗", status: "淘汰", matchLevel: "低",
    riskPoints: "主要经验在C端百度生态，B2B经验不足",
    notes: "不匹配行业要求",
    scores: { industryMatch: 1, positionExp: 2, performanceResults: 3, abilityMatch: 2, growthPotential: 2 },
    totalScore: 10, candidateLevel: "D", manualJudgment: "不推荐",
    lastFollowUp: "2026-06-01", nextAction: "不推进",
    createdAt: "2026-05-22T00:00:00Z", updatedAt: "2026-06-01T00:00:00Z"
  },
];

export const sampleFeedbacks: InterviewFeedback[] = [
  {
    id: "fb1", candidateId: "cd1", positionId: "pos1", round: "复面", interviewer: "张伟", interviewTime: "2026-06-08",
    result: "通过", highlights: "Flexport亚太SEO体系搭建经验非常匹配，对货代SEO理解深刻",
    risks: "薪资预期55K偏高，Relocate意愿需确认", fitJudgment: "高度匹配岗位需求",
    suggestion: "高级岗位", addToTalentPool: true, followUp: "安排终面",
    detailedEvaluation: "候选人具备8年B2B SEO经验，曾在Flexport负责亚太区SEO策略，对国际货代行业理解深刻。技术SEO能力和内容策略能力均衡，有团队管理经验。唯一风险是薪资和Relocate。",
    createdAt: "2026-06-08T00:00:00Z"
  },
  {
    id: "fb2", candidateId: "cd3", positionId: "pos3", round: "终面", interviewer: "李娜", interviewTime: "2026-06-10",
    result: "通过", highlights: "运营管理经验丰富，数据驱动思维强",
    risks: "当前背调阶段，竞品跳槽需关注竞业限制", fitJudgment: "非常适合",
    suggestion: "管理岗", addToTalentPool: true, followUp: "发放Offer",
    detailedEvaluation: "10年运营经验，在纵腾负责平台运营团队，对跨境物流平台运营理解深刻。数据驱动决策能力强，团队管理经验扎实。建议尽快发放Offer锁定。",
    createdAt: "2026-06-10T00:00:00Z"
  },
  {
    id: "fb3", candidateId: "cd5", positionId: "pos4", round: "初面", interviewer: "李娜", interviewTime: "2026-06-05",
    result: "待定", highlights: "对货代行业社群运营有独特见解", risks: "经验偏少，独立负责能力待验证",
    fitJudgment: "中等匹配，可培养", suggestion: "中级岗位", addToTalentPool: true, followUp: "安排复面，由业务部交叉面试",
    detailedEvaluation: "候选人有4年社群运营经验，对B2B私域运营有热情。虽然货代行业经验不深，但学习能力强，建议继续跟进。",
    createdAt: "2026-06-05T00:00:00Z"
  },
];
