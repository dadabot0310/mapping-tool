---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 7b8d6a58e043209c831e60da1b92c125_017f2192667f11f1a99c5254007bceed
    ReservedCode1: FQqtgEoqAh9Ia/TmGqz02eBEzSl/qyAa+x2r52dR5r9Q8YCc0XpujWgtAM11gBdONaaXHiXzNrIpSUjfslPFE3lubIbjNfwZFytC3lIJmdPVQE4E4mxkmBPPyDjXjJfPSkyrDBJjN9SlA9eGf5WVCmH/PBFVHEPvs28iQgWmD2kVQVftQMTuOxm/0tw=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 7b8d6a58e043209c831e60da1b92c125_017f2192667f11f1a99c5254007bceed
    ReservedCode2: FQqtgEoqAh9Ia/TmGqz02eBEzSl/qyAa+x2r52dR5r9Q8YCc0XpujWgtAM11gBdONaaXHiXzNrIpSUjfslPFE3lubIbjNfwZFytC3lIJmdPVQE4E4mxkmBPPyDjXjJfPSkyrDBJjN9SlA9eGf5WVCmH/PBFVHEPvs28iQgWmD2kVQVftQMTuOxm/0tw=
---

# Mapping Tool - 人才地图管理系统

人力资源招聘 Mapping 工具，用于公司内部招聘人才地图管理。

## 技术栈

- **Next.js 14** (App Router)
- **React 18** (Client Components)
- **TypeScript**
- **Tailwind CSS**
- **localStorage** 数据持久化

## 功能模块

| 模块 | 说明 |
|---|---|
| Dashboard | 招聘全局概览、岗位进度表 |
| 岗位管理 | 新增/编辑/删除岗位，支持搜索、多维度筛选 |
| 目标公司库 | 目标公司管理，多岗位关联，按类型/优先级筛选 |
| 候选人库 | 候选人 CRUD，五维评分模型，详情页含面试反馈 |
| 跟进看板 | 拖拽式看板，候选人状态流转 |
| Mapping报告 | 按岗位生成报告，支持导出 CSV |

## 快速启动

```bash
# 1. 进入项目目录
cd mapping-tool

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器访问
# http://localhost:3000
```

## 示例数据

项目内置了 7 个岗位、10 家目标公司和 8 位候选人的示例数据，围绕国际货代 B2B 平台行业场景设计。

## 评分模型

候选人在 5 个维度上各评 1-5 分，总分自动计算并生成等级：

- **22-25 分**: A 类 — 重点推进
- **18-21 分**: B 类 — 可面试/备选
- **14-17 分**: C 类 — 入库观察
- **14 分以下**: D 类 — 暂不推进

## 数据隐私

- 候选人联系方式脱敏展示（如 `138****1234`）
- 删除候选人二次确认
- 默认字段无歧视性标签
- 状态变更自动记录更新时间

## 项目结构

```
mapping-tool/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
└── src/
    ├── app/
    │   ├── layout.tsx          # 根布局
    │   ├── globals.css         # 全局样式 + Tailwind
    │   └── page.tsx            # 主应用（所有模块）
    └── lib/
        ├── types.ts            # 数据模型类型定义
        ├── store.ts            # 数据持久化 (localStorage)
        └── sampleData.ts       # 示例数据
```

## 后续可扩展建议

1. **权限系统**: 代码已预留权限结构，可集成 NextAuth.js 实现 RBAC
2. **数据库**: 从 localStorage 迁移至 SQLite/PostgreSQL，使用 Prisma ORM
3. **批量导入**: 增强 CSV/Excel 导入功能，支持字段映射
4. **通知系统**: 跟进提醒、面试日程日历集成
5. **数据分析**: 增加图表可视化（ECharts/Recharts），人才漏斗分析
6. **API 层**: 拆分 API Routes，支持移动端接入
7. **国际化**: 支持英文界面切换
*（内容由AI生成，仅供参考）*
