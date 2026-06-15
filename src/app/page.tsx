"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Position, TargetCompany, Candidate, InterviewFeedback, AppData,
  Priority, PositionType, RecruitStatus, CompanyType, TalentQuality, HuntPriority,
  CandidateSource, CandidateStatus, MatchLevel, InterviewRound, InterviewResult,
  Suggestion, PositionTendency,
  RecruitingDemand, CandidateApplication,
} from "@/lib/types";
import {
  getData, getIsLoading, getError, subscribe,
  addPosition, updatePosition, deletePosition,
  addCompany, updateCompany, deleteCompany,
  addCandidate, updateCandidate, deleteCandidate, calcTotalScore, calcLevel,
  addFeedback, updateFeedback, deleteFeedback,
  getDemands, addDemand, updateDemand, deleteDemand,
  getApplications, addApplication, updateApplication, deleteApplication,
} from "@/lib/store";
import { parseResume } from "@/lib/resumeParser";

type Tab = "dashboard" | "positions" | "companies" | "candidates" | "kanban" | "report" | "demands" | "applications";

// ---------- 通用组件 ----------

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="card">
      <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, title, message }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button className="btn-secondary btn-sm" onClick={onClose}>取消</button>
          <button className="btn-danger btn-sm" onClick={onConfirm}>确认删除</button>
        </div>
      </div>
    </div>
  );
}

function PriorityTag({ p }: { p: Priority }) {
  const colors: Record<Priority, string> = { P0: "bg-red-100 text-red-700", P1: "bg-orange-100 text-orange-700", P2: "bg-blue-100 text-blue-700" };
  return <span className={`tag ${colors[p]}`}>{p}</span>;
}

function LevelTag({ level }: { level: string }) {
  const colors: Record<string, string> = { A: "bg-green-100 text-green-700", B: "bg-blue-100 text-blue-700", C: "bg-yellow-100 text-yellow-700", D: "bg-gray-100 text-gray-500" };
  return <span className={`tag ${colors[level] || "bg-gray-100 text-gray-600"}`}>{level}类</span>;
}

function StatusTag({ s }: { s: RecruitStatus | CandidateStatus }) {
  const colors: Record<string, string> = {
    "Mapping中": "bg-purple-100 text-purple-700", "触达中": "bg-indigo-100 text-indigo-700",
    "面试中": "bg-blue-100 text-blue-700", "Offer中": "bg-green-100 text-green-700", "已关闭": "bg-gray-100 text-gray-500",
    "未触达": "bg-gray-100 text-gray-600", "已触达": "bg-indigo-100 text-indigo-700",
    "有兴趣": "bg-teal-100 text-teal-700", "初筛": "bg-cyan-100 text-cyan-700",
    "Offer": "bg-green-100 text-green-700", "入职": "bg-emerald-100 text-emerald-700",
    "淘汰": "bg-red-100 text-red-500", "长期关注": "bg-yellow-100 text-yellow-700",
  };
  return <span className={`tag ${colors[s] || "bg-gray-100 text-gray-600"}`}>{s}</span>;
}

function formatDate(d: string) { if (!d) return "-"; return new Date(d).toLocaleDateString("zh-CN"); }

function maskContact(c: string) {
  if (!c) return "";
  if (c.length <= 4) return "***";
  return c.slice(0, 3) + "****" + c.slice(-4);
}

// ---------- Sidebar ----------

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "positions", label: "岗位管理", icon: "📋" },
  { key: "companies", label: "目标公司", icon: "🏢" },
  { key: "candidates", label: "候选人库", icon: "👤" },
  { key: "demands", label: "招聘需求", icon: "📝" },
  { key: "applications", label: "候选人跟进", icon: "🔄" },
  { key: "kanban", label: "跟进看板", icon: "📌" },
  { key: "report", label: "Mapping报告", icon: "📄" },
];

// ---------- 模块: Dashboard ----------

function Dashboard({ data }: { data: AppData }) {
  const positions = data.positions;
  const candidates = data.candidates;
  const demands = data.demands;
  const applications = data.applications;
  const p0 = positions.filter((p) => p.priority === "P0").length;
  const p1 = positions.filter((p) => p.priority === "P1").length;
  const p2 = positions.filter((p) => p.priority === "P2").length;
  const aCount = candidates.filter((c) => c.candidateLevel === "A").length;
  const interviewing = candidates.filter((c) => c.status === "面试中").length;
  const offerCount = candidates.filter((c) => c.status === "Offer").length;
  const riskPositions = positions.filter((p) => p.risk && p.risk !== "暂无风险").length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="招聘岗位总数" value={positions.length} sub={`P0:${p0} P1:${p1} P2:${p2}`} />
        <StatCard label="候选人总数" value={candidates.length} sub={`A类: ${aCount}`} />
        <StatCard label="面试中" value={interviewing} />
        <StatCard label="Offer阶段" value={offerCount} sub={`风险岗位: ${riskPositions}`} />
        <StatCard label="招聘需求" value={demands.length} />
        <StatCard label="候选人跟进" value={applications.length} />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">岗位Mapping进度表</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 pr-4">岗位名称</th>
                <th className="pb-3 pr-4">部门</th>
                <th className="pb-3 pr-4">优先级</th>
                <th className="pb-3 pr-4">目标人数</th>
                <th className="pb-3 pr-4">目标公司</th>
                <th className="pb-3 pr-4">候选人</th>
                <th className="pb-3 pr-4">已触达</th>
                <th className="pb-3 pr-4">有兴趣</th>
                <th className="pb-3 pr-4">面试中</th>
                <th className="pb-3 pr-4">A类</th>
                <th className="pb-3 pr-4">风险</th>
                <th className="pb-3 pr-4">状态</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => {
                const posCands = candidates.filter((c) => c.linkedPositionId === pos.id);
                const posCompanies = data.companies.filter((co) => co.linkedPositions.includes(pos.id));
                const contacted = posCands.filter((c) => c.status !== "未触达").length;
                const interested = posCands.filter((c) => c.status === "有兴趣" || c.status === "初筛" || c.status === "面试中" || c.status === "Offer").length;
                const interviewingC = posCands.filter((c) => c.status === "面试中").length;
                const aC = posCands.filter((c) => c.candidateLevel === "A").length;
                return (
                  <tr key={pos.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium">{pos.name}</td>
                    <td className="py-3 pr-4 text-gray-500">{pos.department}</td>
                    <td className="py-3 pr-4"><PriorityTag p={pos.priority} /></td>
                    <td className="py-3 pr-4">{pos.targetCount}</td>
                    <td className="py-3 pr-4">{posCompanies.length}</td>
                    <td className="py-3 pr-4">{posCands.length}</td>
                    <td className="py-3 pr-4">{contacted}</td>
                    <td className="py-3 pr-4">{interested}</td>
                    <td className="py-3 pr-4">{interviewingC}</td>
                    <td className="py-3 pr-4">{aC}</td>
                    <td className="py-3 pr-4 text-xs text-red-600">{pos.risk || "-"}</td>
                    <td className="py-3 pr-4"><StatusTag s={pos.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------- 模块: 岗位管理 ----------

function PositionsModule() {
  const [data, setData] = useState(getData());
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Position | null>(null);
  const [search, setSearch] = useState("");
  const [filterPri, setFilterPri] = useState<string>("");
  const [filterDept, setFilterDept] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  useEffect(() => subscribe(() => setData(getData())), []);

  const [form, setForm] = useState<Partial<Position>>({});
  const openNew = () => { setEditItem(null); setForm({}); setModalOpen(true); };
  const openEdit = (p: Position) => { setEditItem(p); setForm({ ...p }); setModalOpen(true); };
  const handleSave = () => {
    if (!form.name || !form.department) return;
    if (editItem) updatePosition(editItem.id, form);
    else addPosition(form as any);
    setModalOpen(false);
  };

  const departments = Array.from(new Set(data.positions.map((p) => p.department)));

  let list = data.positions;
  if (search) list = list.filter((p) => p.name.includes(search) || p.department.includes(search) || p.keywords.includes(search));
  if (filterPri) list = list.filter((p) => p.priority === filterPri);
  if (filterDept) list = list.filter((p) => p.department === filterDept);
  if (filterStatus) list = list.filter((p) => p.status === filterStatus);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">岗位Mapping项目管理</h1>
        <button className="btn-primary" onClick={openNew}>+ 新增岗位</button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input className="input-field w-64" placeholder="搜索岗位名称/部门/关键词..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select-field w-32" value={filterPri} onChange={(e) => setFilterPri(e.target.value)}><option value="">全部优先级</option><option>P0</option><option>P1</option><option>P2</option></select>
        <select className="select-field w-36" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}><option value="">全部部门</option>{departments.map((d) => <option key={d}>{d}</option>)}</select>
        <select className="select-field w-36" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="">全部状态</option><option>Mapping中</option><option>触达中</option><option>面试中</option><option>Offer中</option><option>已关闭</option></select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 pr-4">岗位名称</th><th className="pb-3 pr-4">部门</th><th className="pb-3 pr-4">类型</th><th className="pb-3 pr-4">优先级</th><th className="pb-3 pr-4">用人负责人</th><th className="pb-3 pr-4">目标人数</th><th className="pb-3 pr-4">城市</th><th className="pb-3 pr-4">状态</th><th className="pb-3 pr-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((pos) => (
              <tr key={pos.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-3 pr-4 font-medium">{pos.name}</td>
                <td className="py-3 pr-4 text-gray-500">{pos.department}</td>
                <td className="py-3 pr-4">{pos.type}</td>
                <td className="py-3 pr-4"><PriorityTag p={pos.priority} /></td>
                <td className="py-3 pr-4">{pos.hiringManager}</td>
                <td className="py-3 pr-4">{pos.targetCount}</td>
                <td className="py-3 pr-4">{pos.city}</td>
                <td className="py-3 pr-4"><StatusTag s={pos.status} /></td>
                <td className="py-3 pr-4">
                  <button className="text-blue-600 hover:underline text-xs mr-2" onClick={() => openEdit(pos)}>编辑</button>
                  <button className="text-red-500 hover:underline text-xs" onClick={() => { if (confirm("确认删除该岗位？")) deletePosition(pos.id); }}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "编辑岗位" : "新增岗位"}>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-gray-500 mb-1">岗位名称 *</label><input className="input-field" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">所属部门 *</label><input className="input-field" value={form.department || ""} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">岗位类型</label><select className="select-field" value={form.type || ""} onChange={(e) => setForm({ ...form, type: e.target.value as PositionType })}><option value="">选择</option><option>管理岗</option><option>专家岗</option><option>一线执行岗</option></select></div>
          <div><label className="block text-xs text-gray-500 mb-1">招聘优先级</label><select className="select-field" value={form.priority || ""} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}><option value="">选择</option><option>P0</option><option>P1</option><option>P2</option></select></div>
          <div><label className="block text-xs text-gray-500 mb-1">用人负责人</label><input className="input-field" value={form.hiringManager || ""} onChange={(e) => setForm({ ...form, hiringManager: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">目标人数</label><input className="input-field" type="number" value={form.targetCount || ""} onChange={(e) => setForm({ ...form, targetCount: Number(e.target.value) })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">期望到岗日期</label><input className="input-field" type="date" value={form.expectedDate || ""} onChange={(e) => setForm({ ...form, expectedDate: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">工作城市</label><input className="input-field" value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">薪资范围</label><input className="input-field" value={form.salaryRange || ""} onChange={(e) => setForm({ ...form, salaryRange: e.target.value })} placeholder="如: 40-60K" /></div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">岗位关键词</label><input className="input-field" value={form.keywords || ""} onChange={(e) => setForm({ ...form, keywords: e.target.value })} /></div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">核心能力要求</label><textarea className="input-field" rows={2} value={form.coreRequirements || ""} onChange={(e) => setForm({ ...form, coreRequirements: e.target.value })} /></div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">行业经验要求</label><input className="input-field" value={form.industryRequirement || ""} onChange={(e) => setForm({ ...form, industryRequirement: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">招聘状态</label><select className="select-field" value={form.status || ""} onChange={(e) => setForm({ ...form, status: e.target.value as RecruitStatus })}><option value="">选择</option><option>Mapping中</option><option>触达中</option><option>面试中</option><option>Offer中</option><option>已关闭</option></select></div>
          <div><label className="block text-xs text-gray-500 mb-1">风险</label><input className="input-field" value={form.risk || ""} onChange={(e) => setForm({ ...form, risk: e.target.value })} /></div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">备注</label><textarea className="input-field" rows={2} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>取消</button>
          <button className="btn-primary" onClick={handleSave}>保存</button>
        </div>
      </Modal>
    </div>
  );
}

// ---------- 模块: 目标公司库 ----------

function CompaniesModule() {
  const [data, setData] = useState(getData());
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<TargetCompany | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterPri, setFilterPri] = useState("");

  useEffect(() => subscribe(() => setData(getData())), []);

  const [form, setForm] = useState<Partial<TargetCompany>>({ linkedPositions: [] });
  const openNew = () => { setEditItem(null); setForm({ linkedPositions: [] }); setModalOpen(true); };
  const openEdit = (c: TargetCompany) => { setEditItem(c); setForm({ ...c }); setModalOpen(true); };
  const handleSave = () => {
    if (!form.name) return;
    if (editItem) updateCompany(editItem.id, form);
    else addCompany(form as any);
    setModalOpen(false);
  };
  const togglePos = (pid: string) => {
    const cur = form.linkedPositions || [];
    setForm({ ...form, linkedPositions: cur.includes(pid) ? cur.filter((id) => id !== pid) : [...cur, pid] });
  };

  let list = data.companies;
  if (search) list = list.filter((c) => c.name.includes(search) || c.industryTags.includes(search) || c.city.includes(search));
  if (filterType) list = list.filter((c) => c.type === filterType);
  if (filterPri) list = list.filter((c) => c.huntPriority === filterPri);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">目标公司库</h1>
        <button className="btn-primary" onClick={openNew}>+ 新增公司</button>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <input className="input-field w-64" placeholder="搜索公司名称/行业/城市..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select-field w-40" value={filterType} onChange={(e) => setFilterType(e.target.value)}><option value="">全部类型</option><option>竞品</option><option>平台型公司</option><option>SaaS公司</option><option>物流公司</option><option>跨境电商公司</option><option>其他</option></select>
        <select className="select-field w-32" value={filterPri} onChange={(e) => setFilterPri(e.target.value)}><option value="">全部优先级</option><option>A</option><option>B</option><option>C</option></select>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 pr-4">公司名称</th><th className="pb-3 pr-4">类型</th><th className="pb-3 pr-4">行业标签</th><th className="pb-3 pr-4">地区/城市</th><th className="pb-3 pr-4">适配岗位</th><th className="pb-3 pr-4">人才质量</th><th className="pb-3 pr-4">挖人优先级</th><th className="pb-3 pr-4">已识别候选人</th><th className="pb-3 pr-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((co) => (
              <tr key={co.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-3 pr-4 font-medium">{co.name}</td>
                <td className="py-3 pr-4">{co.type}</td>
                <td className="py-3 pr-4">{co.industryTags}</td>
                <td className="py-3 pr-4 text-gray-500">{co.region} / {co.city}</td>
                <td className="py-3 pr-4">{co.linkedPositions.map((pid) => data.positions.find((p) => p.id === pid)?.name || pid).join(", ")}</td>
                <td className="py-3 pr-4">{co.talentQuality}</td>
                <td className="py-3 pr-4"><PriorityTag p={co.huntPriority as any} /></td>
                <td className="py-3 pr-4">{co.identifiedCandidates}</td>
                <td className="py-3 pr-4">
                  <button className="text-blue-600 hover:underline text-xs mr-2" onClick={() => openEdit(co)}>编辑</button>
                  <button className="text-red-500 hover:underline text-xs" onClick={() => { if (confirm("确认删除该公司？")) deleteCompany(co.id); }}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "编辑目标公司" : "新增目标公司"}>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-gray-500 mb-1">公司名称 *</label><input className="input-field" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">公司类型</label><select className="select-field" value={form.type || ""} onChange={(e) => setForm({ ...form, type: e.target.value as CompanyType })}><option value="">选择</option><option>竞品</option><option>平台型公司</option><option>SaaS公司</option><option>物流公司</option><option>跨境电商公司</option><option>其他</option></select></div>
          <div><label className="block text-xs text-gray-500 mb-1">行业标签</label><input className="input-field" value={form.industryTags || ""} onChange={(e) => setForm({ ...form, industryTags: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">地区</label><input className="input-field" value={form.region || ""} onChange={(e) => setForm({ ...form, region: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">城市</label><input className="input-field" value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">人才质量</label><select className="select-field" value={form.talentQuality || ""} onChange={(e) => setForm({ ...form, talentQuality: e.target.value as TalentQuality })}><option value="">选择</option><option>高</option><option>中</option><option>低</option></select></div>
          <div><label className="block text-xs text-gray-500 mb-1">挖人优先级</label><select className="select-field" value={form.huntPriority || ""} onChange={(e) => setForm({ ...form, huntPriority: e.target.value as HuntPriority })}><option value="">选择</option><option>A</option><option>B</option><option>C</option></select></div>
          <div><label className="block text-xs text-gray-500 mb-1">已识别候选人数</label><input className="input-field" type="number" value={form.identifiedCandidates || 0} onChange={(e) => setForm({ ...form, identifiedCandidates: Number(e.target.value) })} /></div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">适配岗位（可多选）</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border rounded-lg p-2">
              {data.positions.map((pos) => (
                <label key={pos.id} className="flex items-center gap-1 text-xs cursor-pointer">
                  <input type="checkbox" checked={(form.linkedPositions || []).includes(pos.id)} onChange={() => togglePos(pos.id)} />
                  {pos.name}
                </label>
              ))}
              {data.positions.length === 0 && <span className="text-xs text-gray-400">暂无岗位</span>}
            </div>
          </div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">备注</label><textarea className="input-field" rows={2} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>取消</button>
          <button className="btn-primary" onClick={handleSave}>保存</button>
        </div>
      </Modal>
    </div>
  );
}

// ---------- 模块: 候选人库 ----------

function CandidatesModule() {
  const [data, setData] = useState(getData());
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editItem, setEditItem] = useState<Candidate | null>(null);
  const [detailItem, setDetailItem] = useState<Candidate | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterPos, setFilterPos] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => subscribe(() => setData(getData())), []);

  const [form, setForm] = useState<Partial<Candidate>>({
    scores: { industryMatch: 3, positionExp: 3, performanceResults: 3, abilityMatch: 3, growthPotential: 3 },
    hasManagementExp: false, managementCount: 0,
  });
  const openNew = () => { setEditItem(null); setForm({ scores: { industryMatch: 3, positionExp: 3, performanceResults: 3, abilityMatch: 3, growthPotential: 3 }, hasManagementExp: false, managementCount: 0 }); setParseMessage(""); setModalOpen(true); };
  const openEdit = (c: Candidate) => { setEditItem(c); setForm({ ...c }); setParseMessage(""); setModalOpen(true); };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setParseMessage("正在解析简历...");
    const result = await parseResume(file);
    setIsParsing(false);
    if (result.success) {
      // 将解析字段自动填入表单（保留已有的 scores 和表单结构）
      setForm((prev) => ({
        ...prev,
        name: result.fields.name || prev.name,
        currentCompany: result.fields.currentCompany || prev.currentCompany,
        currentPosition: result.fields.currentPosition || prev.currentPosition,
        contact: result.fields.contact || prev.contact,
        experienceYears: result.fields.experienceYears || prev.experienceYears,
        skillTags: result.fields.skillTags || prev.skillTags,
        notes: result.fields.notes || prev.notes,
      }));
      const filledFields = [];
      if (result.fields.name) filledFields.push("姓名");
      if (result.fields.currentCompany) filledFields.push("公司");
      if (result.fields.currentPosition) filledFields.push("职位");
      if (result.fields.contact) filledFields.push("联系方式");
      if (result.fields.experienceYears) filledFields.push("工作年限");
      if (result.fields.skillTags) filledFields.push("技能");
      setParseMessage(filledFields.length > 0
        ? `已自动填入: ${filledFields.join("、")}`
        : "解析完成，但未能识别到可填入字段，请手动填写");
    } else {
      setParseMessage(result.error || "解析失败");
    }
  };
  const handleSave = () => {
    if (!form.name) return;
    if (editItem) updateCandidate(editItem.id, form);
    else addCandidate(form as any);
    setModalOpen(false);
  };

  let list = data.candidates;
  if (search) list = list.filter((c) => c.name.includes(search) || c.currentCompany.includes(search) || c.currentPosition.includes(search) || c.skillTags.includes(search));
  if (filterStatus) list = list.filter((c) => c.status === filterStatus);
  if (filterLevel) list = list.filter((c) => c.candidateLevel === filterLevel);
  if (filterPos) list = list.filter((c) => c.linkedPositionId === filterPos);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">候选人库</h1>
        <button className="btn-primary" onClick={openNew}>+ 新增候选人</button>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <input className="input-field w-64" placeholder="搜索姓名/公司/职位/技能..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select-field w-36" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="">全部状态</option><option>未触达</option><option>已触达</option><option>有兴趣</option><option>初筛</option><option>面试中</option><option>Offer</option><option>入职</option><option>淘汰</option><option>长期关注</option></select>
        <select className="select-field w-28" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}><option value="">全部等级</option><option>A</option><option>B</option><option>C</option><option>D</option></select>
        <select className="select-field w-40" value={filterPos} onChange={(e) => setFilterPos(e.target.value)}><option value="">全部岗位</option>{data.positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <button className="btn-secondary btn-sm" onClick={() => { const csv = "姓名,公司,职位,城市,状态,等级\n" + list.map((c) => [c.name, c.currentCompany, c.currentPosition, c.city, c.status, c.candidateLevel].join(",")).join("\n"); const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "候选人导出.csv"; a.click(); }}>导出CSV</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 pr-4">姓名</th><th className="pb-3 pr-4">当前公司</th><th className="pb-3 pr-4">当前职位</th><th className="pb-3 pr-4">城市</th><th className="pb-3 pr-4">关联岗位</th><th className="pb-3 pr-4">状态</th><th className="pb-3 pr-4">匹配度</th><th className="pb-3 pr-4">等级</th><th className="pb-3 pr-4">评分</th><th className="pb-3 pr-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-3 pr-4 font-medium cursor-pointer text-blue-600 hover:underline" onClick={() => { setDetailItem(c); setDetailOpen(true); }}>{c.name}</td>
                <td className="py-3 pr-4">{c.currentCompany}</td>
                <td className="py-3 pr-4">{c.currentPosition}</td>
                <td className="py-3 pr-4 text-gray-500">{c.city}</td>
                <td className="py-3 pr-4">{data.positions.find((p) => p.id === c.linkedPositionId)?.name || "-"}</td>
                <td className="py-3 pr-4"><StatusTag s={c.status} /></td>
                <td className="py-3 pr-4">{c.matchLevel}</td>
                <td className="py-3 pr-4"><LevelTag level={c.candidateLevel} /></td>
                <td className="py-3 pr-4">{c.totalScore}</td>
                <td className="py-3 pr-4">
                  <button className="text-blue-600 hover:underline text-xs mr-2" onClick={() => openEdit(c)}>编辑</button>
                  <button className="text-red-500 hover:underline text-xs" onClick={() => { if (confirm("确认删除该候选人？")) deleteCandidate(c.id); }}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 候选人表单 Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "编辑候选人" : "新增候选人"}>
        {/* 简历上传 */}
        {!editItem && (
          <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleResumeUpload}
            />
            {isParsing ? (
              <div className="py-4 text-blue-600">
                <div className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2 align-middle"></div>
                <span className="text-sm">正在解析简历...</span>
              </div>
            ) : (
              <div
                className="py-4 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-gray-400 text-2xl mb-1">📄</div>
                <p className="text-sm text-gray-500">上传简历自动填充</p>
                <p className="text-xs text-gray-400 mt-1">支持 PDF / DOCX 格式</p>
              </div>
            )}
            {parseMessage && (
              <p className={`text-xs mt-2 ${parseMessage.includes("失败") || parseMessage.includes("未能") ? "text-red-500" : "text-green-600"}`}>
                {parseMessage}
              </p>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-gray-500 mb-1">姓名 *</label><input className="input-field" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">当前公司</label><input className="input-field" value={form.currentCompany || ""} onChange={(e) => setForm({ ...form, currentCompany: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">当前职位</label><input className="input-field" value={form.currentPosition || ""} onChange={(e) => setForm({ ...form, currentPosition: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">所在城市</label><input className="input-field" value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">联系方式</label><input className="input-field" value={form.contact || ""} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">来源渠道</label><select className="select-field" value={form.source || ""} onChange={(e) => setForm({ ...form, source: e.target.value as CandidateSource })}><option value="">选择</option><option>LinkedIn</option><option>Boss</option><option>猎头</option><option>内推</option><option>推荐</option><option>猎聘</option><option>其他</option></select></div>
          <div><label className="block text-xs text-gray-500 mb-1">关联岗位</label><select className="select-field" value={form.linkedPositionId || ""} onChange={(e) => setForm({ ...form, linkedPositionId: e.target.value })}><option value="">选择</option>{data.positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="block text-xs text-gray-500 mb-1">关联目标公司</label><select className="select-field" value={form.linkedCompanyId || ""} onChange={(e) => setForm({ ...form, linkedCompanyId: e.target.value })}><option value="">选择</option>{data.companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="block text-xs text-gray-500 mb-1">经验年限</label><input className="input-field" type="number" value={form.experienceYears || 0} onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">当前/预估薪资</label><input className="input-field" value={form.currentSalary || ""} onChange={(e) => setForm({ ...form, currentSalary: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">期望薪资</label><input className="input-field" value={form.expectedSalary || ""} onChange={(e) => setForm({ ...form, expectedSalary: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">英文能力</label><input className="input-field" value={form.englishLevel || ""} onChange={(e) => setForm({ ...form, englishLevel: e.target.value })} /></div>
          <div className="flex items-center gap-2"><input type="checkbox" checked={form.hasManagementExp || false} onChange={(e) => setForm({ ...form, hasManagementExp: e.target.checked })} /><span className="text-sm">有管理经验</span></div>
          {form.hasManagementExp && <div><label className="block text-xs text-gray-500 mb-1">管理人数</label><input className="input-field" type="number" value={form.managementCount || 0} onChange={(e) => setForm({ ...form, managementCount: Number(e.target.value) })} /></div>}
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">行业标签</label><input className="input-field" value={form.industryTags || ""} onChange={(e) => setForm({ ...form, industryTags: e.target.value })} /></div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">能力标签</label><input className="input-field" value={form.skillTags || ""} onChange={(e) => setForm({ ...form, skillTags: e.target.value })} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">岗位倾向</label><select className="select-field" value={form.positionTendency || ""} onChange={(e) => setForm({ ...form, positionTendency: e.target.value as PositionTendency })}><option value="">选择</option><option>管理岗</option><option>专家岗</option><option>一线高产</option><option>可培养</option><option>长期关注</option></select></div>
          <div><label className="block text-xs text-gray-500 mb-1">当前状态</label><select className="select-field" value={form.status || ""} onChange={(e) => setForm({ ...form, status: e.target.value as CandidateStatus })}><option value="">选择</option><option>未触达</option><option>已触达</option><option>有兴趣</option><option>初筛</option><option>面试中</option><option>Offer</option><option>入职</option><option>淘汰</option><option>长期关注</option></select></div>
          <div><label className="block text-xs text-gray-500 mb-1">匹配度</label><select className="select-field" value={form.matchLevel || ""} onChange={(e) => setForm({ ...form, matchLevel: e.target.value as MatchLevel })}><option value="">选择</option><option>高</option><option>中</option><option>低</option></select></div>
          <div><label className="block text-xs text-gray-500 mb-1">人工判断</label><select className="select-field" value={form.manualJudgment || ""} onChange={(e) => setForm({ ...form, manualJudgment: e.target.value as any })}><option value="">选择</option><option>推荐面试</option><option>暂缓</option><option>长期关注</option><option>不推荐</option></select></div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">最近跟进时间</label><input className="input-field" type="date" value={form.lastFollowUp || ""} onChange={(e) => setForm({ ...form, lastFollowUp: e.target.value })} /></div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">下一步动作</label><input className="input-field" value={form.nextAction || ""} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} /></div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">风险点</label><input className="input-field" value={form.riskPoints || ""} onChange={(e) => setForm({ ...form, riskPoints: e.target.value })} /></div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-2">评分维度（1-5分）</label>
            <div className="grid grid-cols-5 gap-2">
              {(["industryMatch", "positionExp", "performanceResults", "abilityMatch", "growthPotential"] as const).map((key, i) => {
                const defaultScores = form.scores || { industryMatch: 3, positionExp: 3, performanceResults: 3, abilityMatch: 3, growthPotential: 3 };
                return (
                <div key={key}>
                  <label className="text-xs text-gray-400">{["行业匹配", "岗位经验", "业绩结果", "能力匹配", "发展潜力"][i]}</label>
                  <select className="select-field mt-1" value={defaultScores[key]} onChange={(e) => setForm({ ...form, scores: { ...defaultScores, [key]: Number(e.target.value) } })}>
                    {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              );
              })}
            </div>
            {form.scores && <div className="mt-2 text-sm text-gray-500">总分: {calcTotalScore(form.scores)} → {calcLevel(calcTotalScore(form.scores))}类</div>}
          </div>
          <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">备注</label><textarea className="input-field" rows={2} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>取消</button>
          <button className="btn-primary" onClick={handleSave}>保存</button>
        </div>
      </Modal>

      {/* 候选人详情 Modal */}
      {detailItem && (
        <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={`候选人详情: ${detailItem.name}`}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-400">当前公司:</span> {detailItem.currentCompany}</div>
            <div><span className="text-gray-400">当前职位:</span> {detailItem.currentPosition}</div>
            <div><span className="text-gray-400">城市:</span> {detailItem.city}</div>
            <div><span className="text-gray-400">联系方式:</span> {maskContact(detailItem.contact)}</div>
            <div><span className="text-gray-400">来源:</span> {detailItem.source}</div>
            <div><span className="text-gray-400">经验年限:</span> {detailItem.experienceYears}年</div>
            <div><span className="text-gray-400">当前薪资:</span> {detailItem.currentSalary}</div>
            <div><span className="text-gray-400">期望薪资:</span> {detailItem.expectedSalary}</div>
            <div><span className="text-gray-400">英文能力:</span> {detailItem.englishLevel}</div>
            <div><span className="text-gray-400">管理经验:</span> {detailItem.hasManagementExp ? `是 (${detailItem.managementCount}人)` : "否"}</div>
            <div><span className="text-gray-400">行业标签:</span> {detailItem.industryTags}</div>
            <div><span className="text-gray-400">能力标签:</span> {detailItem.skillTags}</div>
            <div><span className="text-gray-400">岗位倾向:</span> {detailItem.positionTendency}</div>
            <div><span className="text-gray-400">状态:</span> <StatusTag s={detailItem.status} /></div>
            <div><span className="text-gray-400">匹配度:</span> {detailItem.matchLevel}</div>
            <div><span className="text-gray-400">等级:</span> <LevelTag level={detailItem.candidateLevel} /></div>
            <div><span className="text-gray-400">总分:</span> {detailItem.totalScore}</div>
            <div><span className="text-gray-400">人工判断:</span> {detailItem.manualJudgment || "-"}</div>
            <div><span className="text-gray-400">评分明细:</span> 行业匹配{detailItem.scores.industryMatch} / 岗位经验{detailItem.scores.positionExp} / 业绩{detailItem.scores.performanceResults} / 能力{detailItem.scores.abilityMatch} / 潜力{detailItem.scores.growthPotential}</div>
            <div className="col-span-2"><span className="text-gray-400">风险点:</span> {detailItem.riskPoints || "-"}</div>
            <div className="col-span-2"><span className="text-gray-400">最近跟进:</span> {detailItem.lastFollowUp || "-"}</div>
            <div className="col-span-2"><span className="text-gray-400">下一步动作:</span> {detailItem.nextAction || "-"}</div>
            <div className="col-span-2"><span className="text-gray-400">备注:</span> {detailItem.notes || "-"}</div>
          </div>
          {/* 面试反馈 */}
          <div className="mt-6 border-t pt-4">
            <h3 className="font-semibold mb-3">面试反馈记录</h3>
            <InterviewFeedbackSection candidateId={detailItem.id} />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------- 面试反馈组件 ----------

function InterviewFeedbackSection({ candidateId }: { candidateId: string }) {
  const [data, setData] = useState(getData());
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<Partial<InterviewFeedback>>({ candidateId, result: "待定" as InterviewResult, round: "初面" as InterviewRound });

  useEffect(() => subscribe(() => setData(getData())), []);
  const feedbacks = data.feedbacks.filter((f) => f.candidateId === candidateId);

  const handleAdd = () => {
    if (!form.positionId) return;
    addFeedback(form as any);
    setAddOpen(false);
    setForm({ candidateId, result: "待定", round: "初面" });
  };

  return (
    <div>
      {feedbacks.length === 0 && <p className="text-sm text-gray-400 mb-3">暂无面试反馈</p>}
      {feedbacks.map((fb) => (
        <div key={fb.id} className="border rounded-lg p-3 mb-2 text-sm">
          <div className="flex gap-2 mb-1">
            <span className="font-medium">{fb.round}</span>
            <span className="text-gray-400">|</span>
            <span>{fb.interviewer}</span>
            <span className="text-gray-400">|</span>
            <span>{fb.interviewTime}</span>
            <span className={`tag ml-auto ${fb.result === "通过" ? "bg-green-100 text-green-700" : fb.result === "淘汰" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"}`}>{fb.result}</span>
          </div>
          <p className="text-gray-600 text-xs">亮点: {fb.highlights}</p>
          <p className="text-gray-600 text-xs">风险: {fb.risks}</p>
          <p className="text-gray-600 text-xs">建议: {fb.suggestion} | {fb.followUp}</p>
          {fb.detailedEvaluation && <p className="text-gray-500 text-xs mt-1 border-t pt-1">{fb.detailedEvaluation}</p>}
        </div>
      ))}
      {!addOpen ? (
        <button className="btn-secondary btn-sm mt-2" onClick={() => setAddOpen(true)}>+ 添加面试反馈</button>
      ) : (
        <div className="border rounded-lg p-4 mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500">面试岗位</label><select className="select-field" value={form.positionId || ""} onChange={(e) => setForm({ ...form, positionId: e.target.value })}><option value="">选择</option>{data.positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="text-xs text-gray-500">面试轮次</label><select className="select-field" value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value as InterviewRound })}><option>初面</option><option>复面</option><option>终面</option></select></div>
            <div><label className="text-xs text-gray-500">面试官</label><input className="input-field" value={form.interviewer || ""} onChange={(e) => setForm({ ...form, interviewer: e.target.value })} /></div>
            <div><label className="text-xs text-gray-500">面试时间</label><input className="input-field" type="date" value={form.interviewTime || ""} onChange={(e) => setForm({ ...form, interviewTime: e.target.value })} /></div>
            <div><label className="text-xs text-gray-500">面试结果</label><select className="select-field" value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value as InterviewResult })}><option>通过</option><option>待定</option><option>淘汰</option></select></div>
            <div><label className="text-xs text-gray-500">建议定位</label><select className="select-field" value={form.suggestion || ""} onChange={(e) => setForm({ ...form, suggestion: e.target.value as Suggestion })}><option value="">选择</option><option>管理岗</option><option>专家岗</option><option>中级岗位</option><option>高级岗位</option><option>暂不匹配</option></select></div>
          </div>
          <div><label className="text-xs text-gray-500">候选人亮点</label><input className="input-field" value={form.highlights || ""} onChange={(e) => setForm({ ...form, highlights: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">候选人风险</label><input className="input-field" value={form.risks || ""} onChange={(e) => setForm({ ...form, risks: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">岗位适配判断</label><input className="input-field" value={form.fitJudgment || ""} onChange={(e) => setForm({ ...form, fitJudgment: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">后续动作</label><input className="input-field" value={form.followUp || ""} onChange={(e) => setForm({ ...form, followUp: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">详细评价</label><textarea className="input-field" rows={3} value={form.detailedEvaluation || ""} onChange={(e) => setForm({ ...form, detailedEvaluation: e.target.value })} /></div>
          <div className="flex gap-2">
            <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={form.addToTalentPool || false} onChange={(e) => setForm({ ...form, addToTalentPool: e.target.checked })} />加入人才库</label>
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn-sm" onClick={() => setAddOpen(false)}>取消</button>
            <button className="btn-primary btn-sm" onClick={handleAdd}>保存</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- 模块: 跟进看板 ----------

function KanbanModule() {
  const [data, setData] = useState(getData());
  useEffect(() => subscribe(() => setData(getData())), []);

  const columns: { status: CandidateStatus; label: string; color: string }[] = [
    { status: "未触达", label: "未触达", color: "bg-gray-100" },
    { status: "已触达", label: "已触达", color: "bg-indigo-50" },
    { status: "有兴趣", label: "有兴趣", color: "bg-teal-50" },
    { status: "初筛", label: "初筛", color: "bg-cyan-50" },
    { status: "面试中", label: "面试中", color: "bg-blue-50" },
    { status: "Offer", label: "Offer", color: "bg-green-50" },
    { status: "入职", label: "入职", color: "bg-emerald-50" },
    { status: "淘汰", label: "淘汰", color: "bg-red-50" },
    { status: "长期关注", label: "长期关注", color: "bg-yellow-50" },
  ];

  const [dragOverStatus, setDragOverStatus] = useState<string>("");

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("candidateId", id);
    (e.target as HTMLElement).style.opacity = "0.5";
  };
  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
  };
  const handleDrop = (e: React.DragEvent, status: CandidateStatus) => {
    e.preventDefault();
    setDragOverStatus("");
    const id = e.dataTransfer.getData("candidateId");
    if (id) updateCandidate(id, { status });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">候选人跟进看板</h1>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
        {columns.map((col) => {
          const cards = data.candidates.filter((c) => c.status === col.status);
          return (
            <div
              key={col.status}
              className={`flex-shrink-0 w-64 rounded-xl ${col.color} p-3 border ${dragOverStatus === col.status ? "border-blue-400 bg-blue-50" : "border-gray-200"}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverStatus(col.status); }}
              onDragLeave={() => setDragOverStatus("")}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">{col.label}</span>
                <span className="text-xs bg-white rounded-full px-2 py-0.5 shadow-sm">{cards.length}</span>
              </div>
              <div className="space-y-2">
                {cards.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => handleDragStart(e, c.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{c.name}</span>
                      <LevelTag level={c.candidateLevel} />
                    </div>
                    <p className="text-xs text-gray-500">{c.currentCompany} · {c.currentPosition}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {data.positions.find((p) => p.id === c.linkedPositionId)?.name || ""}
                      <span className="ml-2">匹配: {c.matchLevel}</span>
                    </p>
                    {c.lastFollowUp && <p className="text-xs text-gray-300 mt-1">跟进: {c.lastFollowUp}</p>}
                    {c.nextAction && <p className="text-xs text-blue-500 mt-1">{c.nextAction}</p>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- 模块: 招聘需求 (Demands) ----------

function DemandsModule() {
  const [data, setData] = useState(getData());
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<RecruitingDemand>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [demands, setDemands] = useState<RecruitingDemand[]>([]);
  useEffect(() => { const refresh = () => { const d = getData(); setData(d); setDemands(d.demands); }; refresh(); return subscribe(refresh); }, []);

  const resetForm = () => { setForm({}); setEditId(null); setShowAdd(false); };
  const startEdit = (d: RecruitingDemand) => { setForm({ ...d }); setEditId(d.id); setShowAdd(true); };

  const handleSave = async () => {
    if (!form.department || !form.position) return alert("请填写部门、岗位");
    if (editId) { await updateDemand(editId, form); } else { await addDemand(form as any); }
    resetForm();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">招聘需求</h2>
        <button className="btn-primary btn-sm" onClick={() => { resetForm(); setShowAdd(true); }}>+ 新增需求</button>
      </div>

      {showAdd && (
        <div className="card mb-4">
          <h3 className="font-semibold mb-3">{editId ? "编辑需求" : "新增需求"}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div><label className="block text-xs text-gray-500 mb-1">日期</label><input className="input-field" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} type="date" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">部门 *</label><input className="input-field" value={form.department || ""} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="如: 产品部" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">岗位 *</label><input className="input-field" value={form.position || ""} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="如: 高级产品经理" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">HR</label><input className="input-field" value={form.hr || ""} onChange={(e) => setForm({ ...form, hr: e.target.value })} placeholder="如: 张伟" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">紧急程度</label><select className="select-field" value={form.priority || "P1"} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="P0">P0 紧急</option><option value="P1">P1 正常</option><option value="P2">P2 储备</option></select></div>
            <div><label className="block text-xs text-gray-500 mb-1">目标公司</label><input className="input-field" value={form.targetCompany || ""} onChange={(e) => setForm({ ...form, targetCompany: e.target.value })} placeholder="如: 阿里巴巴" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">渠道</label><input className="input-field" value={form.channel || ""} onChange={(e) => setForm({ ...form, channel: e.target.value })} placeholder="如: Boss直聘/LinkedIn" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">备注</label><input className="input-field" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div className="flex gap-2"><button className="btn-primary btn-sm" onClick={handleSave}>保存</button><button className="btn-secondary btn-sm" onClick={resetForm}>取消</button></div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left">{["日期","部门","岗位","HR","优先级","目标公司","渠道","备注"].map((h) => <th key={h} className="p-2 font-medium text-gray-500 whitespace-nowrap">{h}</th>)}<th className="p-2"></th></tr></thead>
          <tbody>
            {demands.map((d) => (
              <tr key={d.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => startEdit(d)}>
                <td className="p-2 whitespace-nowrap">{d.date ? d.date.slice(0, 10) : "-"}</td>
                <td className="p-2">{d.department}</td>
                <td className="p-2 font-medium">{d.position}</td>
                <td className="p-2">{d.hr || "-"}</td>
                <td className="p-2"><span className={`tag ${d.priority === "P0" ? "bg-red-100 text-red-700" : d.priority === "P2" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>{d.priority || "P1"}</span></td>
                <td className="p-2">{d.targetCompany || "-"}</td>
                <td className="p-2">{d.channel || "-"}</td>
                <td className="p-2 text-gray-400 max-w-[200px] truncate">{d.notes || "-"}</td>
                <td className="p-2"><button className="text-red-400 hover:text-red-600 text-xs" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(d.id); }}>删除</button></td>
              </tr>
            ))}
            {demands.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-gray-400">暂无招聘需求，点击"新增需求"开始</td></tr>}
          </tbody>
        </table>
      </div>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => { if (deleteConfirm) { deleteDemand(deleteConfirm); setDeleteConfirm(null); } }} title="删除招聘需求" message="确认删除？" />
    </div>
  );
}

// ---------- 模块: 候选人跟进 (Applications) ----------

function AppTag({ label }: { label: string }) {
  if (!label) return <span className="text-gray-300">-</span>;
  const green = ["通过", "已发Offer", "已接受", "已入职"];
  const red = ["淘汰", "不通过", "放弃"];
  const yellow = ["待定", "待安排", "进行中", "等待中"];
  const blue = ["offer中", "背调中"];
  const cls = green.some((k) => label.includes(k)) ? "bg-green-100 text-green-700" :
    red.some((k) => label.includes(k)) ? "bg-red-100 text-red-700" :
    yellow.some((k) => label.includes(k)) ? "bg-yellow-100 text-yellow-700" :
    blue.some((k) => label.includes(k)) ? "bg-blue-100 text-blue-700" :
    "bg-gray-100 text-gray-600";
  return <span className={`tag ${cls}`}>{label}</span>;
}

function ApplicationsModule() {
  const [data, setData] = useState(getData());
  const [showAdd, setShowAdd] = useState(false);
  const [detailApp, setDetailApp] = useState<CandidateApplication | null>(null);
  const [editForm, setEditForm] = useState<Partial<CandidateApplication>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  useEffect(() => { const refresh = () => { const d = getData(); setData(d); setApplications(d.applications); }; refresh(); return subscribe(refresh); }, []);

  const getDemandInfo = (demandId: string) => data.demands.find((d) => d.id === demandId);

  const initAdd = () => { setEditForm({}); setShowAdd(true); };

  const handleSave = async () => {
    if (!editForm.candidateName || !editForm.demandId) return alert("请选择招聘需求并填写候选人姓名");
    if (editForm.id) { await updateApplication(editForm.id, editForm); } else { await addApplication(editForm as any); }
    setShowAdd(false); setEditForm({}); setDetailApp(null);
  };

  const openDetail = (a: CandidateApplication) => { setDetailApp(a); setEditForm({ ...a }); };

  const filtered = applications.filter((a) => {
    const demand = getDemandInfo(a.demandId);
    if (filterDept && demand && !demand.department.includes(filterDept)) return false;
    if (filterStatus) {
      const hasStatus = [a.firstInterviewResult, a.secondInterviewResult, a.thirdInterviewResult, a.offerStatus, a.onboardingStatus].some((s) => s && s.includes(filterStatus));
      if (!hasStatus) return false;
    }
    return true;
  });

  const departments = Array.from(new Set(applications.map((a) => getDemandInfo(a.demandId)?.department).filter(Boolean))) as string[];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">候选人跟进</h2>
        <button className="btn-primary btn-sm" onClick={initAdd}>+ 新增跟进记录</button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <select className="select-field w-40" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
          <option value="">全部部门</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="select-field w-40" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">全部状态</option>
          <option value="通过">通过</option>
          <option value="待定">待定</option>
          <option value="淘汰">淘汰</option>
          <option value="已发Offer">已发Offer</option>
          <option value="已入职">已入职</option>
        </select>
        <span className="text-sm text-gray-400 self-center ml-auto">共 {filtered.length} 条</span>
      </div>

      {(showAdd || detailApp) && (
        <div className="card mb-4">
          <h3 className="font-semibold mb-3">{editForm.id ? "编辑跟进记录" : "新增跟进记录"}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div><label className="block text-xs text-gray-500 mb-1">招聘需求 *</label>
              <select className="select-field" value={editForm.demandId || ""} onChange={(e) => setEditForm({ ...editForm, demandId: e.target.value })}>
                <option value="">请选择</option>
                {data.demands.map((d) => <option key={d.id} value={d.id}>{d.department} - {d.position} ({d.hr})</option>)}
              </select></div>
            <div><label className="block text-xs text-gray-500 mb-1">候选人姓名 *</label><input className="input-field" value={editForm.candidateName || ""} onChange={(e) => setEditForm({ ...editForm, candidateName: e.target.value })} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">当前公司</label><input className="input-field" value={editForm.currentCompany || ""} onChange={(e) => setEditForm({ ...editForm, currentCompany: e.target.value })} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">当前职位</label><input className="input-field" value={editForm.currentPosition || ""} onChange={(e) => setEditForm({ ...editForm, currentPosition: e.target.value })} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">联系方式</label><input className="input-field" value={editForm.contact || ""} onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">来源渠道</label><input className="input-field" value={editForm.source || ""} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} placeholder="Boss/LinkedIn/内推" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">简历链接</label><input className="input-field" value={editForm.resumeUrl || ""} onChange={(e) => setEditForm({ ...editForm, resumeUrl: e.target.value })} /></div>
          </div>
          <div className="border-t pt-3 mt-2">
            <h4 className="text-sm font-medium mb-2 text-gray-600">面试流程</h4>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-400 mb-1">初试</div>
                <input className="input-field mb-1 text-xs" placeholder="面试官" value={editForm.firstInterviewer || ""} onChange={(e) => setEditForm({ ...editForm, firstInterviewer: e.target.value })} />
                <input className="input-field mb-1 text-xs" type="date" value={editForm.firstInterviewTime ? editForm.firstInterviewTime.slice(0, 10) : ""} onChange={(e) => setEditForm({ ...editForm, firstInterviewTime: e.target.value })} />
                <select className="select-field text-xs" value={editForm.firstInterviewResult || ""} onChange={(e) => setEditForm({ ...editForm, firstInterviewResult: e.target.value })}>
                  <option value="">待定</option><option value="通过">通过</option><option value="待定-二面">待定（二面）</option><option value="淘汰">淘汰</option>
                </select>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-400 mb-1">复试</div>
                <input className="input-field mb-1 text-xs" placeholder="面试官" value={editForm.secondInterviewer || ""} onChange={(e) => setEditForm({ ...editForm, secondInterviewer: e.target.value })} />
                <input className="input-field mb-1 text-xs" type="date" value={editForm.secondInterviewTime ? editForm.secondInterviewTime.slice(0, 10) : ""} onChange={(e) => setEditForm({ ...editForm, secondInterviewTime: e.target.value })} />
                <select className="select-field text-xs" value={editForm.secondInterviewResult || ""} onChange={(e) => setEditForm({ ...editForm, secondInterviewResult: e.target.value })}>
                  <option value="">待定</option><option value="通过">通过</option><option value="淘汰">淘汰</option>
                </select>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-400 mb-1">终试</div>
                <input className="input-field mb-1 text-xs" placeholder="面试官" value={editForm.thirdInterviewer || ""} onChange={(e) => setEditForm({ ...editForm, thirdInterviewer: e.target.value })} />
                <input className="input-field mb-1 text-xs" type="date" value={editForm.thirdInterviewTime ? editForm.thirdInterviewTime.slice(0, 10) : ""} onChange={(e) => setEditForm({ ...editForm, thirdInterviewTime: e.target.value })} />
                <select className="select-field text-xs" value={editForm.thirdInterviewResult || ""} onChange={(e) => setEditForm({ ...editForm, thirdInterviewResult: e.target.value })}>
                  <option value="">待定</option><option value="通过">通过</option><option value="淘汰">淘汰</option>
                </select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Offer状态</label>
              <select className="select-field" value={editForm.offerStatus || ""} onChange={(e) => setEditForm({ ...editForm, offerStatus: e.target.value })}>
                <option value="">-</option><option value="已发Offer">已发Offer</option><option value="背调中">背调中</option><option value="已接受">已接受</option><option value="放弃">放弃</option>
              </select></div>
            <div><label className="block text-xs text-gray-500 mb-1">Offer日期</label><input className="input-field" type="date" value={editForm.offerDate ? editForm.offerDate.slice(0, 10) : ""} onChange={(e) => setEditForm({ ...editForm, offerDate: e.target.value })} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">入职状态</label>
              <select className="select-field" value={editForm.onboardingStatus || ""} onChange={(e) => setEditForm({ ...editForm, onboardingStatus: e.target.value })}>
                <option value="">-</option><option value="已入职">已入职</option><option value="等待中">等待中</option><option value="放弃入职">放弃入职</option>
              </select></div>
            <div><label className="block text-xs text-gray-500 mb-1">入职日期</label><input className="input-field" type="date" value={editForm.onboardingDate ? editForm.onboardingDate.slice(0, 10) : ""} onChange={(e) => setEditForm({ ...editForm, onboardingDate: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div><label className="block text-xs text-gray-500 mb-1">备注1</label><input className="input-field" value={editForm.remarks || ""} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">备注2</label><input className="input-field" value={editForm.notes || ""} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="btn-primary btn-sm" onClick={handleSave}>{editForm.id ? "更新" : "保存"}</button>
            <button className="btn-secondary btn-sm" onClick={() => { setShowAdd(false); setDetailApp(null); setEditForm({}); }}>取消</button>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left">
            {["需求","候选人","当前公司","初试","复试","终试","Offer","入职"].map((h) => <th key={h} className="p-2 font-medium text-gray-500 whitespace-nowrap">{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((a) => {
              const d = getDemandInfo(a.demandId);
              return (
                <tr key={a.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(a)}>
                  <td className="p-2 whitespace-nowrap">
                    <div className="font-medium text-xs">{d?.position || "-"}</div>
                    <div className="text-xs text-gray-400">{d?.department || "-"} · {d?.hr || "-"}</div>
                  </td>
                  <td className="p-2">
                    <div className="font-medium">{a.candidateName}</div>
                    {a.currentCompany && <div className="text-xs text-gray-400">{a.currentCompany} · {a.currentPosition}</div>}
                  </td>
                  <td className="p-2 text-gray-500 text-xs">{a.currentCompany || "-"}</td>
                  <td className="p-2"><AppTag label={a.firstInterviewResult} /></td>
                  <td className="p-2"><AppTag label={a.secondInterviewResult} /></td>
                  <td className="p-2"><AppTag label={a.thirdInterviewResult} /></td>
                  <td className="p-2"><AppTag label={a.offerStatus} /></td>
                  <td className="p-2"><AppTag label={a.onboardingStatus} /></td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-400">暂无候选人跟进记录，请先添加招聘需求，再新增跟进记录</td></tr>}
          </tbody>
        </table>
      </div>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => { if (deleteConfirm) { deleteApplication(deleteConfirm); setDeleteConfirm(null); setDetailApp(null); } }} title="删除跟进记录" message="确认删除此候选人跟进记录？" />
    </div>
  );
}

// ---------- 模块: Mapping报告 ----------

type ReportDimension = "position" | "company";

function ReportModule() {
  const [data, setData] = useState(getData());
  const [dimension, setDimension] = useState<ReportDimension>("position");
  const [selectedPosId, setSelectedPosId] = useState("");
  const [selectedCoId, setSelectedCoId] = useState("");
  useEffect(() => subscribe(() => setData(getData())), []);

  const selectedPos = data.positions.find((p) => p.id === selectedPosId);
  const selectedCo = data.companies.find((c) => c.id === selectedCoId);

  const generatePosReport = () => {
    if (!selectedPos) return null;
    const posCands = data.candidates.filter((c) => c.linkedPositionId === selectedPos.id);
    const posCompanies = data.companies.filter((co) => co.linkedPositions.includes(selectedPos.id));
    const contacted = posCands.filter((c) => c.status !== "未触达").length;
    const interested = posCands.filter((c) => ["有兴趣", "初筛", "面试中", "Offer"].includes(c.status)).length;
    const interviewing = posCands.filter((c) => c.status === "面试中").length;
    const aLevel = posCands.filter((c) => c.candidateLevel === "A").length;
    const bLevel = posCands.filter((c) => c.candidateLevel === "B").length;
    const companyNames = Array.from(new Set(posCands.map((c) => c.currentCompany).filter(Boolean)));
    const salaries = posCands.map((c) => parseInt(c.currentSalary) || 0).filter((v) => v > 0);
    const avgSalary = salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0;
    const marketSupply: string = posCands.length >= 10 ? "充足" : posCands.length >= 5 ? "一般" : "稀缺";

    return {
      positionName: selectedPos.name, department: selectedPos.department, priority: selectedPos.priority,
      targetCount: selectedPos.targetCount, mappedCompanies: posCompanies.length,
      identifiedCandidates: posCands.length, contactedCount: contacted, interestedCount: interested,
      interviewingCount: interviewing, aLevelCount: aLevel, bLevelCount: bLevel,
      mainTalentSources: companyNames.slice(0, 5),
      risk: selectedPos.risk || "暂无风险", marketSupply: marketSupply as any,
      salaryObservation: avgSalary > 0 ? `候选人平均薪资约 ${avgSalary}K` : "暂无数据",
      suggestion: "",
      candidateList: posCands.map((c) => `${c.name} (${c.currentCompany}, ${c.candidateLevel}类, ${c.status})`),
      generatedAt: new Date().toISOString(),
      dimension: "position" as const,
    };
  };

  const generateCoReport = () => {
    if (!selectedCo) return null;
    const coCands = data.candidates.filter((c) => c.linkedCompanyId === selectedCo.id);
    const coLinkedCands = data.candidates.filter((c) =>
      selectedCo.linkedPositions.includes(c.linkedPositionId) && c.linkedCompanyId !== selectedCo.id
    );
    const allCands = [...coCands, ...coLinkedCands];
    const contacted = allCands.filter((c) => c.status !== "未触达").length;
    const interested = allCands.filter((c) => ["有兴趣", "初筛", "面试中", "Offer"].includes(c.status)).length;
    const interviewing = allCands.filter((c) => c.status === "面试中").length;
    const aLevel = allCands.filter((c) => c.candidateLevel === "A").length;
    const bLevel = allCands.filter((c) => c.candidateLevel === "B").length;
    const linkedPositions = data.positions.filter((p) => selectedCo.linkedPositions.includes(p.id));
    const salaries = allCands.map((c) => parseInt(c.currentSalary) || 0).filter((v) => v > 0);
    const avgSalary = salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0;
    const statusBreakdown: Record<string, number> = {};
    allCands.forEach((c) => { statusBreakdown[c.status] = (statusBreakdown[c.status] || 0) + 1; });

    return {
      companyName: selectedCo.name,
      companyType: selectedCo.type,
      huntPriority: selectedCo.huntPriority,
      talentQuality: selectedCo.talentQuality,
      industryTags: selectedCo.industryTags,
      city: selectedCo.city,
      linkedPositionNames: linkedPositions.map((p) => p.name),
      identifiedCandidates: allCands.length,
      contactedCount: contacted,
      interestedCount: interested,
      interviewingCount: interviewing,
      aLevelCount: aLevel,
      bLevelCount: bLevel,
      statusBreakdown,
      salaryObservation: avgSalary > 0 ? `候选人平均薪资约 ${avgSalary}K` : "暂无数据",
      candidateList: allCands.map((c) => {
        const posName = data.positions.find((p) => p.id === c.linkedPositionId)?.name || "未关联";
        return `${c.name} (${c.currentPosition}, ${c.candidateLevel}类, ${c.status}, 岗位: ${posName})`;
      }),
      generatedAt: new Date().toISOString(),
      dimension: "company" as const,
    };
  };

  type PosReport = ReturnType<typeof generatePosReport>;
  type CoReport = ReturnType<typeof generateCoReport>;
  const report = dimension === "position" ? (generatePosReport() as PosReport) : (generateCoReport() as CoReport);

  const exportCSV = () => {
    if (!report) return;
    let csv = "";
    let filename = "";
    if (dimension === "position") {
      const r = report as NonNullable<PosReport>;
      csv = `Mapping报告 - ${r.positionName}\n\n字段,内容\n岗位名称,${r.positionName}\n部门,${r.department}\n优先级,${r.priority}\n目标人数,${r.targetCount}\n已Mapping公司数,${r.mappedCompanies}\n已识别候选人,${r.identifiedCandidates}\n已触达人数,${r.contactedCount}\n有兴趣人数,${r.interestedCount}\n面试中人数,${r.interviewingCount}\nA类候选人数,${r.aLevelCount}\nB类候选人数,${r.bLevelCount}\n人才来源公司,"${r.mainTalentSources.join("; ")}"\n招聘风险,${r.risk}\n市场供给,${r.marketSupply}\n薪资观察,${r.salaryObservation}\n\n候选人清单\n${r.candidateList.join("\n")}`;
      filename = `Mapping报告_${r.positionName}.csv`;
    } else {
      const r = report as NonNullable<CoReport>;
      const statusStr = Object.entries(r.statusBreakdown).map(([k, v]) => `${k}:${v}`).join("; ");
      csv = `Mapping报告 - ${r.companyName}\n\n字段,内容\n公司名称,${r.companyName}\n公司类型,${r.companyType}\n挖人优先级,${r.huntPriority}\n人才质量,${r.talentQuality}\n行业标签,${r.industryTags}\n城市,${r.city}\n适配岗位,"${r.linkedPositionNames.join("; ")}"\n已识别候选人,${r.identifiedCandidates}\n已触达人数,${r.contactedCount}\n有兴趣人数,${r.interestedCount}\n面试中人数,${r.interviewingCount}\nA类候选人数,${r.aLevelCount}\nB类候选人数,${r.bLevelCount}\n状态分布,${statusStr}\n薪资观察,${r.salaryObservation}\n\n候选人清单\n${r.candidateList.join("\n")}`;
      filename = `Mapping报告_${r.companyName}.csv`;
    }
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mapping报告</h1>
      <div className="card mb-6">
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm text-gray-500">报告维度</label>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dimension === "position" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => { setDimension("position"); setSelectedPosId(""); }}
            >岗位</button>
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${dimension === "company" ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => { setDimension("company"); setSelectedCoId(""); }}
            >公司</button>
          </div>
        </div>
        <label className="block text-sm text-gray-500 mb-2">
          {dimension === "position" ? "选择岗位生成报告" : "选择目标公司生成报告"}
        </label>
        <div className="flex gap-3">
          {dimension === "position" ? (
            <select className="select-field w-64" value={selectedPosId} onChange={(e) => setSelectedPosId(e.target.value)}>
              <option value="">请选择岗位</option>
              {data.positions.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.department})</option>)}
            </select>
          ) : (
            <select className="select-field w-64" value={selectedCoId} onChange={(e) => setSelectedCoId(e.target.value)}>
              <option value="">请选择目标公司</option>
              {data.companies.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
            </select>
          )}
          {report && <button className="btn-primary btn-sm" onClick={exportCSV}>导出CSV</button>}
        </div>
      </div>

      {/* 岗位维度报告 */}
      {report && dimension === "position" && (() => { const r = report as NonNullable<PosReport>; return (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">{r.positionName} - Mapping报告</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-400">岗位</div><div className="font-semibold">{r.positionName}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-400">部门/优先级</div><div className="font-semibold">{r.department} / <PriorityTag p={r.priority} /></div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-400">目标人数</div><div className="font-semibold">{r.targetCount}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-400">Mapping公司</div><div className="font-semibold">{r.mappedCompanies}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-400">已识别候选人</div><div className="font-semibold">{r.identifiedCandidates}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-400">已触达</div><div className="font-semibold">{r.contactedCount}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-400">有兴趣/面试中</div><div className="font-semibold">{r.interestedCount} / {r.interviewingCount}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-400">A类/B类</div><div className="font-semibold">{r.aLevelCount} / {r.bLevelCount}</div></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div><span className="text-sm text-gray-500">人才来源公司:</span> <span className="text-sm font-medium">{r.mainTalentSources.join(", ") || "暂无"}</span></div>
            <div><span className="text-sm text-gray-500">市场供给判断:</span> <span className={`text-sm font-medium ${r.marketSupply === "稀缺" ? "text-red-600" : r.marketSupply === "一般" ? "text-orange-600" : "text-green-600"}`}>{r.marketSupply}</span></div>
            <div><span className="text-sm text-gray-500">薪资区间观察:</span> <span className="text-sm">{r.salaryObservation}</span></div>
            <div><span className="text-sm text-gray-500">招聘风险:</span> <span className="text-sm text-red-600">{r.risk}</span></div>
          </div>
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">候选人清单 ({r.candidateList.length}人)</h3>
            <ul className="text-sm space-y-1">
              {r.candidateList.map((c, i) => <li key={i} className="text-gray-600">{i + 1}. {c}</li>)}
            </ul>
          </div>
        </div>
      ); })()}

      {/* 公司维度报告 */}
      {report && dimension === "company" && (() => { const r = report as NonNullable<CoReport>; return (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">{r.companyName} - Mapping报告（公司维度）</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-400">公司名称</div><div className="font-semibold">{r.companyName}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-400">类型 / 优先级</div><div className="font-semibold">{r.companyType} / <PriorityTag p={r.huntPriority as any} /></div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-400">人才质量</div><div className="font-semibold">{r.talentQuality}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-400">城市</div><div className="font-semibold">{r.city}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-400">已识别候选人</div><div className="font-semibold">{r.identifiedCandidates}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-400">已触达</div><div className="font-semibold">{r.contactedCount}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-400">有兴趣/面试中</div><div className="font-semibold">{r.interestedCount} / {r.interviewingCount}</div></div>
            <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-400">A类/B类</div><div className="font-semibold">{r.aLevelCount} / {r.bLevelCount}</div></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div><span className="text-sm text-gray-500">行业标签:</span> <span className="text-sm font-medium">{r.industryTags || "暂无"}</span></div>
            <div><span className="text-sm text-gray-500">适配岗位:</span> <span className="text-sm font-medium">{r.linkedPositionNames.join(", ") || "暂无"}</span></div>
            <div><span className="text-sm text-gray-500">状态分布:</span> <span className="text-sm">{Object.entries(r.statusBreakdown).map(([k, v]) => `${k}:${v}`).join(" | ") || "暂无"}</span></div>
            <div><span className="text-sm text-gray-500">薪资观察:</span> <span className="text-sm">{r.salaryObservation}</span></div>
          </div>
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">候选人清单 ({r.candidateList.length}人)</h3>
            <ul className="text-sm space-y-1">
              {r.candidateList.map((c, i) => <li key={i} className="text-gray-600">{i + 1}. {c}</li>)}
            </ul>
          </div>
        </div>
      ); })()}
    </div>
  );
}

// ---------- 主页面 ----------

export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setData(getData());
      setLoading(getIsLoading());
      setError(getError());
    };
    refresh();
    return subscribe(refresh);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3 text-gray-400">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm">正在同步数据...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex h-screen">
      {error && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">&times;</button>
        </div>
      )}
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
        <div className="p-5 border-b">
          <h1 className="text-lg font-bold text-gray-900">Mapping Tool</h1>
          <p className="text-xs text-gray-400 mt-0.5">人才地图管理</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                tab === t.key ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t text-xs text-gray-400">
          v1.1 · Supabase
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-8">
        {tab === "dashboard" && <Dashboard data={data} />}
        {tab === "positions" && <PositionsModule />}
        {tab === "companies" && <CompaniesModule />}
        {tab === "candidates" && <CandidatesModule />}
        {tab === "demands" && <DemandsModule />}
        {tab === "applications" && <ApplicationsModule />}
        {tab === "kanban" && <KanbanModule />}
        {tab === "report" && <ReportModule />}
      </main>
    </div>
  );
}
