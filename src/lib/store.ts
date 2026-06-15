import { AppData, Position, TargetCompany, Candidate, InterviewFeedback } from "./types";
import { samplePositions, sampleCompanies, sampleCandidates, sampleFeedbacks } from "./sampleData";
import { supabase, isSupabaseConfigured } from "./supabase";

// ============================================================
// 状态
// ============================================================
let data: AppData = {
  positions: samplePositions,
  companies: sampleCompanies,
  candidates: sampleCandidates,
  feedbacks: sampleFeedbacks,
};
let isLoading = true;
let error: string | null = null;
let listeners: (() => void)[] = [];

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("mapping_tool_data", JSON.stringify(data));
  } catch { /* ignore */ }
}

function notify() {
  listeners.forEach((fn) => fn());
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ============================================================
// Supabase ↔ camelCase 列名转换
// ============================================================

function toPosition(row: Record<string, unknown>): Position {
  return {
    id: row.id as string,
    name: row.name as string,
    department: row.department as string,
    type: row.type as Position["type"],
    priority: row.priority as Position["priority"],
    hiringManager: row.hiring_manager as string,
    targetCount: row.target_count as number,
    expectedDate: row.expected_date as string,
    salaryRange: row.salary_range as string,
    city: row.city as string,
    keywords: row.keywords as string,
    coreRequirements: row.core_requirements as string,
    industryRequirement: row.industry_requirement as string,
    status: row.status as Position["status"],
    risk: row.risk as string,
    notes: row.notes as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function fromPosition(p: Position): Record<string, unknown> {
  return {
    id: p.id, name: p.name, department: p.department, type: p.type,
    priority: p.priority, hiring_manager: p.hiringManager, target_count: p.targetCount,
    expected_date: p.expectedDate, salary_range: p.salaryRange, city: p.city,
    keywords: p.keywords, core_requirements: p.coreRequirements,
    industry_requirement: p.industryRequirement, status: p.status,
    risk: p.risk, notes: p.notes, created_at: p.createdAt, updated_at: p.updatedAt,
  };
}

function toCompany(row: Record<string, unknown>): TargetCompany {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as TargetCompany["type"],
    industryTags: row.industry_tags as string,
    region: row.region as string,
    city: row.city as string,
    linkedPositions: (row.linked_positions as string[]) || [],
    talentQuality: row.talent_quality as TargetCompany["talentQuality"],
    huntPriority: row.hunt_priority as TargetCompany["huntPriority"],
    identifiedCandidates: row.identified_candidates as number,
    notes: row.notes as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function fromCompany(c: TargetCompany): Record<string, unknown> {
  return {
    id: c.id, name: c.name, type: c.type, industry_tags: c.industryTags,
    region: c.region, city: c.city, linked_positions: c.linkedPositions,
    talent_quality: c.talentQuality, hunt_priority: c.huntPriority,
    identified_candidates: c.identifiedCandidates, notes: c.notes,
    created_at: c.createdAt, updated_at: c.updatedAt,
  };
}

function toCandidate(row: Record<string, unknown>): Candidate {
  const scores = (row.scores || {}) as Candidate["scores"];
  return {
    id: row.id as string,
    name: row.name as string,
    currentCompany: row.current_company as string,
    currentPosition: row.current_position as string,
    city: row.city as string,
    contact: row.contact as string,
    source: row.source as Candidate["source"],
    linkedPositionId: row.linked_position_id as string,
    linkedCompanyId: row.linked_company_id as string,
    experienceYears: row.experience_years as number,
    currentSalary: row.current_salary as string,
    expectedSalary: row.expected_salary as string,
    hasManagementExp: row.has_management_exp as boolean,
    managementCount: row.management_count as number,
    englishLevel: row.english_level as string,
    industryTags: row.industry_tags as string,
    skillTags: row.skill_tags as string,
    positionTendency: row.position_tendency as Candidate["positionTendency"],
    status: row.status as Candidate["status"],
    matchLevel: row.match_level as Candidate["matchLevel"],
    riskPoints: row.risk_points as string,
    notes: row.notes as string,
    scores,
    totalScore: row.total_score as number,
    candidateLevel: row.candidate_level as Candidate["candidateLevel"],
    manualJudgment: row.manual_judgment as Candidate["manualJudgment"],
    lastFollowUp: row.last_follow_up as string,
    nextAction: row.next_action as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function fromCandidate(c: Candidate): Record<string, unknown> {
  return {
    id: c.id, name: c.name, current_company: c.currentCompany,
    current_position: c.currentPosition, city: c.city, contact: c.contact,
    source: c.source, linked_position_id: c.linkedPositionId,
    linked_company_id: c.linkedCompanyId, experience_years: c.experienceYears,
    current_salary: c.currentSalary, expected_salary: c.expectedSalary,
    has_management_exp: c.hasManagementExp, management_count: c.managementCount,
    english_level: c.englishLevel, industry_tags: c.industryTags,
    skill_tags: c.skillTags, position_tendency: c.positionTendency,
    status: c.status, match_level: c.matchLevel, risk_points: c.riskPoints,
    notes: c.notes, scores: c.scores, total_score: c.totalScore,
    candidate_level: c.candidateLevel, manual_judgment: c.manualJudgment,
    last_follow_up: c.lastFollowUp, next_action: c.nextAction,
    created_at: c.createdAt, updated_at: c.updatedAt,
  };
}

function toFeedback(row: Record<string, unknown>): InterviewFeedback {
  return {
    id: row.id as string,
    candidateId: row.candidate_id as string,
    positionId: row.position_id as string,
    round: row.round as InterviewFeedback["round"],
    interviewer: row.interviewer as string,
    interviewTime: row.interview_time as string,
    result: row.result as InterviewFeedback["result"],
    highlights: row.highlights as string,
    risks: row.risks as string,
    fitJudgment: row.fit_judgment as string,
    suggestion: row.suggestion as InterviewFeedback["suggestion"],
    addToTalentPool: row.add_to_talent_pool as boolean,
    followUp: row.follow_up as string,
    detailedEvaluation: row.detailed_evaluation as string,
    createdAt: row.created_at as string,
  };
}

function fromFeedback(f: InterviewFeedback): Record<string, unknown> {
  return {
    id: f.id, candidate_id: f.candidateId, position_id: f.positionId,
    round: f.round, interviewer: f.interviewer, interview_time: f.interviewTime,
    result: f.result, highlights: f.highlights, risks: f.risks,
    fit_judgment: f.fitJudgment, suggestion: f.suggestion,
    add_to_talent_pool: f.addToTalentPool, follow_up: f.followUp,
    detailed_evaluation: f.detailedEvaluation, created_at: f.createdAt,
  };
}

// ============================================================
// 数据加载
// ============================================================

export async function loadData(): Promise<void> {
  isLoading = true;
  error = null;

  // 先从 localStorage 读取缓存
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("mapping_tool_data");
      if (raw) {
        const cached = JSON.parse(raw) as AppData;
        if (cached.positions?.length) {
          data = cached;
        }
      }
    }
  } catch { /* ignore */ }

  if (!isSupabaseConfigured()) {
    isLoading = false;
    notify();
    return;
  }

  try {
    const [posRes, compRes, candRes, fbRes] = await Promise.all([
      supabase.from("positions").select("*").order("created_at", { ascending: false }),
      supabase.from("companies").select("*").order("created_at", { ascending: false }),
      supabase.from("candidates").select("*").order("created_at", { ascending: false }),
      supabase.from("feedbacks").select("*").order("created_at", { ascending: false }),
    ]);

    if (posRes.error) throw posRes.error;
    if (compRes.error) throw compRes.error;
    if (candRes.error) throw candRes.error;
    if (fbRes.error) throw fbRes.error;

    data = {
      positions: (posRes.data || []).map(toPosition),
      companies: (compRes.data || []).map(toCompany),
      candidates: (candRes.data || []).map(toCandidate),
      feedbacks: (fbRes.data || []).map(toFeedback),
    };
    persist();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    error = `加载云端数据失败: ${msg}`;
    console.error("[store] loadData error:", e);
    // 保留 localStorage 缓存数据，不清空
  }

  isLoading = false;
  notify();
}

// 模块初始化时自动加载
loadData();

// ============================================================
// 公共 API
// ============================================================

export function subscribe(fn: () => void) {
  listeners.push(fn);
  return () => { listeners = listeners.filter((l) => l !== fn); };
}

export function getData(): AppData {
  return data;
}

export function getIsLoading(): boolean {
  return isLoading;
}

export function getError(): string | null {
  return error;
}

// ---- Positions ----

export function getPositions(): Position[] { return data.positions; }

export async function addPosition(p: Omit<Position, "id" | "createdAt" | "updatedAt">): Promise<Position> {
  const now = new Date().toISOString();
  const np: Position = { ...p, id: genId(), createdAt: now, updatedAt: now };
  data.positions.push(np);
  persist();
  notify();

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("positions").insert(fromPosition(np)).select().single();
    } catch (e) {
      console.error("[store] addPosition sync error:", e);
    }
  }
  return np;
}

export async function updatePosition(id: string, updates: Partial<Position>) {
  const idx = data.positions.findIndex((p) => p.id === id);
  if (idx < 0) return;
  const updated = { ...data.positions[idx], ...updates, updatedAt: new Date().toISOString() };
  data.positions[idx] = updated;
  persist();
  notify();

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("positions").update(fromPosition(updated)).eq("id", id);
    } catch (e) {
      console.error("[store] updatePosition sync error:", e);
    }
  }
}

export async function deletePosition(id: string) {
  const existed = data.positions.find((p) => p.id === id);
  data.positions = data.positions.filter((p) => p.id !== id);
  persist();
  notify();

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("positions").delete().eq("id", id);
    } catch (e) {
      // 回滚
      if (existed) data.positions.push(existed);
      console.error("[store] deletePosition sync error:", e);
    }
  }
}

// ---- Companies ----

export function getCompanies(): TargetCompany[] { return data.companies; }

export async function addCompany(c: Omit<TargetCompany, "id" | "createdAt" | "updatedAt">): Promise<TargetCompany> {
  const now = new Date().toISOString();
  const nc: TargetCompany = { ...c, id: genId(), createdAt: now, updatedAt: now };
  data.companies.push(nc);
  persist();
  notify();

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("companies").insert(fromCompany(nc)).select().single();
    } catch (e) {
      console.error("[store] addCompany sync error:", e);
    }
  }
  return nc;
}

export async function updateCompany(id: string, updates: Partial<TargetCompany>) {
  const idx = data.companies.findIndex((c) => c.id === id);
  if (idx < 0) return;
  const updated = { ...data.companies[idx], ...updates, updatedAt: new Date().toISOString() };
  data.companies[idx] = updated;
  persist();
  notify();

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("companies").update(fromCompany(updated)).eq("id", id);
    } catch (e) {
      console.error("[store] updateCompany sync error:", e);
    }
  }
}

export async function deleteCompany(id: string) {
  const existed = data.companies.find((c) => c.id === id);
  data.companies = data.companies.filter((c) => c.id !== id);
  persist();
  notify();

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("companies").delete().eq("id", id);
    } catch (e) {
      if (existed) data.companies.push(existed);
      console.error("[store] deleteCompany sync error:", e);
    }
  }
}

// ---- Candidates ----

export function getCandidates(): Candidate[] { return data.candidates; }

export async function addCandidate(c: Omit<Candidate, "id" | "totalScore" | "candidateLevel" | "createdAt" | "updatedAt">): Promise<Candidate> {
  const now = new Date().toISOString();
  const ts = calcTotalScore(c.scores);
  const nc: Candidate = { ...c, id: genId(), totalScore: ts, candidateLevel: calcLevel(ts), createdAt: now, updatedAt: now };
  data.candidates.push(nc);
  persist();
  notify();

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("candidates").insert(fromCandidate(nc)).select().single();
    } catch (e) {
      console.error("[store] addCandidate sync error:", e);
    }
  }
  return nc;
}

export async function updateCandidate(id: string, updates: Partial<Candidate>) {
  const idx = data.candidates.findIndex((c) => c.id === id);
  if (idx < 0) return;
  const updated = { ...data.candidates[idx], ...updates, updatedAt: new Date().toISOString() };
  if (updates.scores) {
    updated.totalScore = calcTotalScore(updated.scores);
    updated.candidateLevel = calcLevel(updated.totalScore);
  }
  data.candidates[idx] = updated;
  persist();
  notify();

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("candidates").update(fromCandidate(updated)).eq("id", id);
    } catch (e) {
      console.error("[store] updateCandidate sync error:", e);
    }
  }
}

export async function deleteCandidate(id: string) {
  const existed = data.candidates.find((c) => c.id === id);
  data.candidates = data.candidates.filter((c) => c.id !== id);
  persist();
  notify();

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("candidates").delete().eq("id", id);
    } catch (e) {
      if (existed) data.candidates.push(existed);
      console.error("[store] deleteCandidate sync error:", e);
    }
  }
}

export function calcTotalScore(scores: Candidate["scores"]): number {
  return scores.industryMatch + scores.positionExp + scores.performanceResults + scores.abilityMatch + scores.growthPotential;
}

export function calcLevel(score: number): "A" | "B" | "C" | "D" {
  if (score >= 22) return "A";
  if (score >= 18) return "B";
  if (score >= 14) return "C";
  return "D";
}

// ---- Feedbacks ----

export function getFeedbacks(): InterviewFeedback[] { return data.feedbacks; }

export async function addFeedback(f: Omit<InterviewFeedback, "id" | "createdAt">): Promise<InterviewFeedback> {
  const nf: InterviewFeedback = { ...f, id: genId(), createdAt: new Date().toISOString() };
  data.feedbacks.push(nf);
  persist();
  notify();

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("feedbacks").insert(fromFeedback(nf)).select().single();
    } catch (e) {
      console.error("[store] addFeedback sync error:", e);
    }
  }
  return nf;
}

export async function updateFeedback(id: string, updates: Partial<InterviewFeedback>) {
  const idx = data.feedbacks.findIndex((f) => f.id === id);
  if (idx < 0) return;
  const updated = { ...data.feedbacks[idx], ...updates };
  data.feedbacks[idx] = updated;
  persist();
  notify();

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("feedbacks").update(fromFeedback(updated)).eq("id", id);
    } catch (e) {
      console.error("[store] updateFeedback sync error:", e);
    }
  }
}

export async function deleteFeedback(id: string) {
  const existed = data.feedbacks.find((f) => f.id === id);
  data.feedbacks = data.feedbacks.filter((f) => f.id !== id);
  persist();
  notify();

  if (isSupabaseConfigured()) {
    try {
      await supabase.from("feedbacks").delete().eq("id", id);
    } catch (e) {
      if (existed) data.feedbacks.push(existed);
      console.error("[store] deleteFeedback sync error:", e);
    }
  }
}

// ============================================================
// 兼容旧接口
// ============================================================

export function reloadFromStorage() {
  loadData();
}
