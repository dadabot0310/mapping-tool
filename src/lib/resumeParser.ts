// 纯前端简历解析器：支持 PDF / DOCX
// 采用规则提取 + 关键词匹配，不依赖外部 API

import type { Candidate } from "./types";

export interface ParseResult {
  success: boolean;
  text: string;
  fields: Partial<Candidate> & { rawText?: string };
  error?: string;
}

// ---------- DOCX 文本提取 ----------
// DOCX 本质是 ZIP 文件，从中提取 word/document.xml 再剥离 XML 标签
async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  // 查找 word/document.xml 在 ZIP 中的位置
  // ZIP local file header: PK..(4) + version(2) + flags(2) + compression(2) + time(2) + date(2) +
  //   crc32(4) + compressedSize(4) + uncompressedSize(4) + fileNameLength(2) + extraFieldLength(2)
  let offset = 0;
  while (offset < bytes.length - 30) {
    if (bytes[offset] !== 0x50 || bytes[offset + 1] !== 0x4b || bytes[offset + 2] !== 0x03 || bytes[offset + 3] !== 0x04) {
      offset++;
      continue;
    }
    const compression = bytes[offset + 8] | (bytes[offset + 9] << 8);
    const compressedSize = bytes[offset + 18] | (bytes[offset + 19] << 8) | (bytes[offset + 20] << 16) | (bytes[offset + 21] << 24);
    const uncompressedSize = bytes[offset + 22] | (bytes[offset + 23] << 8) | (bytes[offset + 24] << 16) | (bytes[offset + 25] << 24);
    const fileNameLen = bytes[offset + 26] | (bytes[offset + 27] << 8);
    const extraLen = bytes[offset + 28] | (bytes[offset + 29] << 8);
    const nameStart = offset + 30;
    const name = new TextDecoder().decode(bytes.slice(nameStart, nameStart + fileNameLen));
    const fileDataStart = nameStart + fileNameLen + extraLen;
    const fileDataEnd = fileDataStart + compressedSize;

    if (name === "word/document.xml") {
      const data = bytes.slice(fileDataStart, fileDataEnd);
      if (compression === 0) {
        return new TextDecoder().decode(data);
      } else if (compression === 8) {
        // deflate 解压
        return decompressDeflate(data, uncompressedSize);
      }
    }
    offset = fileDataEnd;
  }
  return "";
}

function decompressDeflate(data: Uint8Array, expectedSize: number): string {
  // 使用 DecompressionStream API（现代浏览器均支持）
  // 对于较老浏览器不可用的情况，尝试兜底
  try {
    const ds = new DecompressionStream("deflate-raw");
    const writer = ds.writable.getWriter();
    writer.write(data as unknown as BufferSource);
    writer.close();
    return new Promise((resolve) => {
      new Response(ds.readable).text().then(resolve);
    }) as any;
  } catch {
    // 兜底：内联 inflate 实现
    return inflateSync(data, 0);
  }
}

// 简易内联 inflate（处理无 header/checksum 的 deflate 流，仅用于兜底）
function inflateSync(data: Uint8Array, _expectedSize: number): string {
  // 尝试去掉可能的 zlib header（2 字节）后使用 raw deflate
  let start = 0;
  if (data[0] === 0x78 && (data[1] === 0x01 || data[1] === 0x9c || data[1] === 0xda)) {
    start = 2;
  }
  try {
    const ds = new DecompressionStream("deflate-raw");
    const writer = ds.writable.getWriter();
    writer.write((data.slice(start)) as unknown as BufferSource);
    writer.close();
    return new Promise((resolve) => {
      new Response(ds.readable).text().then(resolve);
    }) as any;
  } catch {
    return "";
  }
}

function stripXmlTags(xml: string): string {
  // 将 <w:t> 等文本容器内容提取，同时处理换行（<w:br/> → \n）和段落结束（</w:p> → \n）
  return xml
    .replace(/<w:br\s*\/?>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// ---------- PDF 文本提取 ----------
// 简易 PDF 文本提取：查找 BT...ET 块中的文本操作符
async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const text = new TextDecoder("latin1").decode(new Uint8Array(buffer));
  // 先尝试解压 stream 内容
  const parts: string[] = [];

  // 方法1：提取 BT...ET 块中的 Tj/TJ 操作符
  const btRegex = /BT([\s\S]*?)ET/g;
  let match;
  while ((match = btRegex.exec(text)) !== null) {
    const block = match[1];
    // 提取 Tj 操作符的文本: (text) Tj
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjm;
    while ((tjm = tjRegex.exec(block)) !== null) {
      parts.push(decodePdfString(tjm[1]));
    }
    // 提取 TJ 数组: [(text1) num (text2) ...] TJ
    const tJRegex = /\[([\s\S]*?)\]\s*TJ/g;
    let tJm;
    while ((tJm = tJRegex.exec(block)) !== null) {
      const arr = tJm[1];
      const strRegex = /\(([^)]*)\)/g;
      let sm;
      while ((sm = strRegex.exec(arr)) !== null) {
        parts.push(decodePdfString(sm[1]));
      }
    }
  }

  if (parts.length > 0) return parts.join("");

  // 方法2：提取所有 stream 内容，尝试 deflate 解压
  const streamRegex = /stream\s*\n([\s\S]*?)endstream/g;
  while ((match = streamRegex.exec(text)) !== null) {
    const raw = match[1].replace(/\r?\n$/, "");
    // 尝试解压
    try {
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i) & 0xff;
      const ds = new DecompressionStream("deflate-raw");
      const writer = ds.writable.getWriter();
      writer.write(bytes as unknown as BufferSource);
      writer.close();
      const decompressed = await new Response(ds.readable).text();
      // 从解压后的文本中提取 BT/ET
      const btRegex2 = /BT([\s\S]*?)ET/g;
      while ((match = btRegex2.exec(decompressed)) !== null) {
        const block2 = match[1];
        const tjRegex = /\(([^)]*)\)\s*Tj/g;
        let m;
        while ((m = tjRegex.exec(block2)) !== null) {
          parts.push(decodePdfString(m[1]));
        }
      }
    } catch {
      // 解压失败，跳过
    }
  }

  return parts.join("");
}

function decodePdfString(s: string): string {
  return s
    .replace(/\\([nrt\\()])/g, (_m, c) => {
      if (c === "n") return "\n";
      if (c === "r") return "\r";
      if (c === "t") return "\t";
      return c;
    })
    .replace(/\\([0-7]{1,3})/g, (_m, oct) => String.fromCharCode(parseInt(oct, 8)));
}

// ---------- 文本清理 ----------
function cleanText(text: string): string {
  return text
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "") // 移除控制字符
    .replace(/\n{4,}/g, "\n\n\n") // 合并多余空行
    .replace(/[ \t]{3,}/g, "  ") // 合并多余空格
    .trim();
}

// ---------- 字段提取规则 ----------
function extractFields(text: string): Partial<Candidate> {
  const result: Partial<Candidate> = {};

  // 邮箱 + 手机号 → 合并到 contact
  const contactParts: string[] = [];
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) contactParts.push(emailMatch[0]);

  const phoneMatch = text.match(/(?:电话|手机|Phone|Tel|Mobile|联系方式)?[：:\s]*(1[3-9]\d{9})/i);
  if (phoneMatch) {
    contactParts.push(phoneMatch[1]);
  } else {
    const phone2 = text.match(/1[3-9]\d{9}/);
    if (phone2) contactParts.push(phone2[0]);
  }
  if (contactParts.length > 0) result.contact = contactParts.join(" / ");

  // 姓名：取首行中 2-4 个中文字符，且不在常见排除词中
  const excludeNames = new Set([
    "简历", "个人简历", "求职", "应聘", "姓名", "基本信息", "联系方式", "教育背景",
    "工作经历", "项目经验", "技能", "自我评价", "个人", "男", "女", "先生", "女士",
    "电话", "手机", "邮箱", "地址", "年龄", "民族", "性别", "生日", "籍贯",
  ]);
  const lines = text.split("\n").filter((l) => l.trim());
  for (const line of lines.slice(0, 10)) {
    const trimmed = line.trim();
    if (excludeNames.has(trimmed)) continue;
    const nameMatch = trimmed.match(/^[\u4e00-\u9fa5]{2,4}$/);
    if (nameMatch && !excludeNames.has(nameMatch[0])) {
      result.name = nameMatch[0];
      break;
    }
    // 也尝试 "姓名：张三" 格式
    const nameLabelMatch = trimmed.match(/(?:姓名|名字)[：:\s]*([\u4e00-\u9fa5]{2,4})/);
    if (nameLabelMatch) {
      result.name = nameLabelMatch[1];
      break;
    }
  }

  // 学历
  const eduMatch = text.match(/(博士|硕士|研究生|本科|学士|大专|专科|MBA|EMBA|高中|中专|博士后)/);
  if (eduMatch) (result as any).education = eduMatch[0];

  // 工作年限
  const expMatch = text.match(/(\d{1,2})\s*年(?:以上)?\s*(?:工作|相关)?经验/);
  if (expMatch) {
    result.experienceYears = parseInt(expMatch[1]);
  } else {
    // 尝试从 "X年开发经验" "X年行业经验" 等提取
    const expMatch2 = text.match(/(\d{1,2})\s*年/);
    if (expMatch2) result.experienceYears = parseInt(expMatch2[1]);
  }

  // 当前职位：从工作经历段提取最近职位
  const posPatterns = [
    /现任[职位|岗位]*[：:\s]*([^\n]{2,30})/,
    /目前职位[：:\s]*([^\n]{2,30})/,
    /最近职位[：:\s]*([^\n]{2,30})/,
    /(?:高级|资深|初级)?(?:前端|后端|全栈|Java|Python|产品|运营|设计|测试|运维|架构|数据|算法|项目经理|技术总监|CTO|CEO|COO)[\u4e00-\u9fa5]*[工程师|经理|总监|主管|专家|专员|设计师|分析师]?/,
  ];
  for (const pat of posPatterns) {
    const m = text.match(pat);
    if (m) {
      result.currentPosition = m[1] || m[0];
      break;
    }
  }

  // 当前公司：从工作经历段提取最近公司
  const companyPatterns = [
    /(?:公司|企业|任职|在职|工作在)[：:\s]*([\u4e00-\u9fa5A-Za-z0-9·（）()]{2,30}(?:公司|集团|科技|有限|网络|信息|数据|软件|技术|互联网|电商|金融|银行|保险|证券|基金|咨询)?)/,
    /(?:目前在|就职于|服务于|供职于)([\u4e00-\u9fa5A-Za-z0-9·（）()]{2,30}(?:公司|集团|科技|有限|网络|信息|数据|软件)?)/,
  ];
  for (const pat of companyPatterns) {
    const m = text.match(pat);
    if (m) {
      result.currentCompany = m[1];
      break;
    }
  }

  // 如果没匹配到，尝试取工作经历段的第一家公司
  if (!result.currentCompany) {
    const workSection = text.match(
      /工作经历[\s\S]{10,300}?(?=项目经验|教育背景|技能|自我评价|$)/
    );
    if (workSection) {
      const coMatch = workSection[0].match(
        /([\u4e00-\u9fa5A-Za-z0-9·（）()]{2,30}(?:公司|集团|科技|有限|网络|信息|数据|软件|技术|互联网))/
      );
      if (coMatch) result.currentCompany = coMatch[1];
    }
  }

  // 技能标签
  const skillKeywords = [
    "Java", "Python", "JavaScript", "TypeScript", "Go", "Rust", "C++", "C#", "PHP", "Ruby",
    "React", "Vue", "Angular", "Node.js", "Spring", "Django", "Flask", "MySQL",
    "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "Azure",
    "Linux", "Git", "CI/CD", "微服务", "敏捷", "Scrum", "项目管理",
    "数据分析", "机器学习", "深度学习", "NLP", "SEO", "SEM", "运营",
    "产品设计", "UI", "UX", "Figma", "Sketch", "Photoshop", "Illustrator",
    "Tableau", "Power BI", "Excel", "SQL", "Spark", "Hadoop", "Flink",
    "Kafka", "RabbitMQ", "Elasticsearch", "Nginx", "GraphQL", "RESTful",
  ];
  const foundSkills: string[] = [];
  for (const skill of skillKeywords) {
    if (text.includes(skill) && !foundSkills.includes(skill)) {
      foundSkills.push(skill);
    }
  }
  if (foundSkills.length > 0) {
    result.skillTags = foundSkills.slice(0, 8).join(", ");
  }

  return result;
}

// ---------- 主入口 ----------
export async function parseResume(file: File): Promise<ParseResult> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !["pdf", "docx"].includes(ext)) {
    return { success: false, text: "", fields: {}, error: "仅支持 PDF / DOCX 格式的简历文件" };
  }

  try {
    const buffer = await file.arrayBuffer();
    let rawText = "";

    if (ext === "docx") {
      rawText = await extractDocxText(buffer);
      rawText = stripXmlTags(rawText);
    } else if (ext === "pdf") {
      rawText = await extractPdfText(buffer);
    }

    rawText = cleanText(rawText);

    if (!rawText || rawText.length < 10) {
      return { success: false, text: rawText, fields: {}, error: "未能从文件中提取到有效文本内容，请确认文件是否可读" };
    }

    const fields = extractFields(rawText);
    // 将解析出的学历信息合并到 notes
    const extraNotes = [`[简历解析] 来源文件: ${file.name}`];
    if ((fields as any).education) {
      extraNotes.push(`学历: ${(fields as any).education}`);
      delete (fields as any).education;
    }
    const mergedNotes = fields.notes
      ? `${fields.notes}\n${extraNotes.join("; ")}`
      : extraNotes.join("; ");

    return { success: true, text: rawText, fields: { ...fields, notes: mergedNotes } };
  } catch (e: any) {
    return { success: false, text: "", fields: {}, error: `解析失败: ${e.message || "未知错误"}` };
  }
}
