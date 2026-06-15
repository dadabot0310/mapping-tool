// ---------- 数据模型 ----------

export type Priority = "P0" | "P1" | "P2";
export type PositionType = "管理岗" | "专家岗" | "一线执行岗";
export type RecruitStatus = "Mapping中" | "触达中" | "面试中" | "Offer中" | "已关闭";
export type CompanyType = "竞品" | "平台型公司" | "SaaS公司" | "物流公司" | "跨境电商公司" | "其他";
export type TalentQuality = "高" | "中" | "低";
export type HuntPriority = "A" | "B" | "C";
export type CandidateSource = "LinkedIn" | "Boss" | "猎头" | "内推" | "推荐" | "猎聘" | "其他";
export type CandidateStatus = "未触达" | "已触达" | "有兴趣" | "初筛" | "面试中" | "Offer" | "入职" | "淘汰" | "长期关注";
export type MatchLevel = "高" | "中" | "低";
export type InterviewRound = "初面" | "复面" | "终面";
export type InterviewResult = "通过" | "待定" | "淘汰";
export type Suggestion = "管理岗" | "专家岗" | "中级岗位" | "高级岗位" | "暂不匹配";
export type MarketSupply = "充足" | "一般" | "稀缺";
export type PositionTendency = "管理岗" | "专家岗" | "一线高产" | "可培养" | "长期关注";

// ===== v1 保留类型 =====

export interface Position {
  id: string;
  name: string;
  department: string;
  type: PositionType;
  priority: Priority;
  hiringManager: string;
  targetCount: number;
  expectedDate: string;
  salaryRange: string;
  city: string;
  keywords: string;
  coreRequirements: string;
  industryRequirement: string;
  status: RecruitStatus;
  risk: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TargetCompany {
  id: string;
  name: string;
  type: CompanyType;
  industryTags: string;
  region: string;
  city: string;
  linkedPositions: string[]; // position ids
  talentQuality: TalentQuality;
  huntPriority: HuntPriority;
  identifiedCandidates: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  currentCompany: string;
  currentPosition: string;
  city: string;
  contact: string;
  source: CandidateSource;
  linkedPositionId: string;
  linkedCompanyId: string;
  experienceYears: number;
  currentSalary: string;
  expectedSalary: string;
  hasManagementExp: boolean;
  managementCount: number;
  englishLevel: string;
  industryTags: string;
  skillTags: string;
  positionTendency: PositionTendency;
  status: CandidateStatus;
  matchLevel: MatchLevel;
  riskPoints: string;
  notes: string;
  // 评分维度
  scores: {
    industryMatch: number;
    positionExp: number;
    performanceResults: number;
    abilityMatch: number;
    growthPotential: number;
  };
  totalScore: number;
  candidateLevel: "A" | "B" | "C" | "D";
  manualJudgment: "推荐面试" | "暂缓" | "长期关注" | "不推荐" | "";
  lastFollowUp: string;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewFeedback {
  id: string;
  candidateId: string;
  positionId: string;
  round: InterviewRound;
  interviewer: string;
  interviewTime: string;
  result: InterviewResult;
  highlights: string;
  risks: string;
  fitJudgment: string;
  suggestion: Suggestion;
  addToTalentPool: boolean;
  followUp: string;
  detailedEvaluation: string;
  createdAt: string;
}

// ===== v2 新增类型 =====

export interface RecruitingDemand {
  id: string;
  date: string;
  department: string;
  position: string;
  hr: string;
  priority: string;  // P0/P1/P2/紧急/正常
  targetCompany: string;
  channel: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateApplication {
  id: string;
  demandId: string;
  candidateName: string;
  currentCompany: string;
  currentPosition: string;
  contact: string;
  source: string;
  resumeUrl: string;
  // 初试
  firstInterviewer: string;
  firstInterviewTime: string;
  firstInterviewResult: string;
  // 复试
  secondInterviewer: string;
  secondInterviewTime: string;
  secondInterviewResult: string;
  // 终试
  thirdInterviewer: string;
  thirdInterviewTime: string;
  thirdInterviewResult: string;
  // Offer & 入职
  offerStatus: string;
  offerDate: string;
  onboardingStatus: string;
  onboardingDate: string;
  // 备注
  remarks: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ===== v1 保留类型 =====

export interface MappingReport {
  positionId: string;
  positionName: string;
  department: string;
  priority: Priority;
  targetCount: number;
  mappedCompanies: number;
  identifiedCandidates: number;
  contactedCount: number;
  interestedCount: number;
  interviewingCount: number;
  aLevelCount: number;
  bLevelCount: number;
  mainTalentSources: string[];
  risk: string;
  marketSupply: MarketSupply;
  salaryObservation: string;
  suggestion: string;
  candidateList: string[];
  generatedAt: string;
}

export interface AppData {
  positions: Position[];
  companies: TargetCompany[];
  candidates: Candidate[];
  feedbacks: InterviewFeedback[];
  demands: RecruitingDemand[];
  applications: CandidateApplication[];
}
