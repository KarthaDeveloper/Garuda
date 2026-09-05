import type { CandidateProfile } from "@/lib/types";

const KNOWN_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "Go",
  "Rust",
  "AWS",
  "GCP",
  "Azure",
  "Docker",
  "Kubernetes",
  "PostgreSQL",
  "SQL",
  "MongoDB",
  "Machine Learning",
  "Deep Learning",
  "PyTorch",
  "TensorFlow",
  "Pandas",
  "Spark",
  "Product Strategy",
  "Roadmapping",
  "A/B Testing",
  "Analytics",
  "Figma",
  "Agile",
];

export const SAMPLE_RESUME = `Maya Rao
Senior Software Engineer

SUMMARY
Software engineer with 6 years of experience building reliable customer-facing products.

EXPERIENCE
Senior Software Engineer, Northstar Labs
- Led a TypeScript and React migration used by 1.2 million monthly users.
- Reduced checkout latency by 38% by redesigning Node.js services and PostgreSQL queries.
- Mentored four engineers and introduced production readiness reviews.

Software Engineer, Harbor Systems
- Built event-driven services on AWS and improved deployment frequency from weekly to daily.

SKILLS
TypeScript, React, Next.js, Node.js, PostgreSQL, AWS, Docker, Product Strategy

EDUCATION
B.Tech in Computer Science, 2020`;

function normalize(text: string) {
  return text.replace(/\u0000/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function linesForSection(text: string, heading: RegExp) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const start = lines.findIndex((line) => heading.test(line));
  if (start < 0) return [];
  const result: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^[A-Z][A-Z &/]{2,}$/.test(line)) break;
    if (line.length > 10) result.push(line.replace(/^[-•]\s*/, ""));
    if (result.length === 4) break;
  }
  return result;
}

export function extractCandidateProfile(raw: string, fileName = "resume.txt"): CandidateProfile {
  const text = normalize(raw);
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const firstLine = lines.find((line) => /^[A-Za-z][A-Za-z .'-]{2,50}$/.test(line));
  const name = firstLine && !/resume|curriculum|profile/i.test(firstLine) ? firstLine : "Candidate";
  const headline =
    lines.find(
      (line, index) =>
        index > 0 &&
        index < 8 &&
        line.length < 90 &&
        /(engineer|manager|scientist|analyst|developer|designer|lead|consultant)/i.test(line),
    ) || "Experienced professional";
  const skills = KNOWN_SKILLS.filter((skill) =>
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text),
  ).slice(0, 12);
  const bullets = lines
    .filter((line) => /^[-•]/.test(line) || /\b(led|built|created|launched|improved|reduced|grew|managed|designed)\b/i.test(line))
    .map((line) => line.replace(/^[-•]\s*/, ""))
    .filter((line) => line.length > 20)
    .slice(0, 5);

  return {
    name,
    headline,
    skills: skills.length ? skills : ["Communication", "Problem solving"],
    experience: bullets.length ? bullets : lines.filter((line) => line.length > 45).slice(0, 4),
    education: linesForSection(text, /^education$/i),
    rawText: text,
    fileName,
  };
}

async function parsePdf(file: File) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let index = 1; index <= pdf.numPages; index += 1) {
    const page = await pdf.getPage(index);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return pages.join("\n");
}

async function parseDocx(file: File) {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

export async function parseResume(file: File): Promise<CandidateProfile> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !["pdf", "docx", "txt"].includes(extension)) {
    throw new Error("Use a PDF, DOCX, or TXT resume.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Keep the resume under 8 MB.");
  }

  const text =
    extension === "pdf"
      ? await parsePdf(file)
      : extension === "docx"
        ? await parseDocx(file)
        : await file.text();
  if (normalize(text).length < 80) {
    throw new Error("We could not find enough readable text in that resume.");
  }
  return extractCandidateProfile(text, file.name);
}

export function loadSampleProfile() {
  return extractCandidateProfile(SAMPLE_RESUME, "maya-rao-sample-resume.txt");
}
