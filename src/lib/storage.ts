import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UserProfile, JobListing, CompanyWatchlist, ScanRun, ScanStats, JobStatus } from '@/types';
import { getDataDirectory } from './utils';

import { TOP_100_AI_COMPANIES } from './data/top-ai-companies';

interface DatabaseSchema {
  profile: UserProfile;
  watchlist: CompanyWatchlist[];
  jobs: JobListing[];
  scans: ScanRun[];
}

const DATA_DIR = getDataDirectory();
const DB_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_PROFILE: UserProfile = {
  id: 'daksh-jain',
  name: 'Daksh Jain',
  email: 'dakshjain080@gmail.com',
  headline: 'AI & Full-Stack Engineer | Production LLM Agents, MCP (45+ PyPI releases), Eval Harnesses & GraphRAG',
  resumeText: `Daksh Jain
AI Engineer | LLM Agents, RAG, and Evaluation in Production
Jaipur, India (Open to relocation to Bangalore, Hyderabad, Pune, Mumbai, Gurgaon, or Remote) | dakshjain080@gmail.com | +91-76270-56978
GitHub: https://github.com/Dakshjain1604 | LinkedIn: https://linkedin.com/in/daksh-jain16 | Portfolio: https://portfolio-dakshjain.vercel.app

Summary:
AI engineer with 1+ year building and operating LLM systems in production: conversational agents, tool and MCP integration layers, RAG pipelines, and the evaluation harnesses that gate what ships. Author of an open-source MCP server maintained across 45+ releases and of an adaptive LLM evaluation framework, with full-stack delivery.

Technical Skills:
- Languages: Python, TypeScript, JavaScript, SQL
- LLM and Agents: agent architecture, autonomous loops, tool and function calling, structured outputs, multi-agent orchestration, MCP (Model Context Protocol), prompt engineering, guardrails, human-in-the-loop, Claude, OpenAI and Gemini APIs
- Retrieval and Evaluation: RAG, hybrid search, vector search (ChromaDB), embeddings, BM25, knowledge graphs, reranking, LLM evaluation, eval harnesses, graders, sandboxing, model debugging, latency and cost control, ML and NLP (scikit-learn, pandas)
- Platform and Delivery: FastAPI, Node.js, Express, React, Next.js, REST, OAuth 2.0; MongoDB, PostgreSQL, Redis; Docker, AWS, CI/CD (GitHub Actions), observability and tracing, pytest

Experience:
- NEO (heyneo.com), AI engineering platform | AI and Full Stack Engineer | Oct 2025 - Present (Promoted from Intern to Full-Time in 3 months):
  • Built NeoClaw, a chat bridge from Telegram, WhatsApp, Slack and Discord to the NEO coding agent, driven by an LLM agent loop over 50+ tools.
  • Hardened NeoClaw with per-project permission gates on local commands, rate limiting, cost budgets and a reply verifier that rejects claims of actions never taken.
  • Built neo-mcp, an open-source, local-first Python MCP server that lets Claude Code, Cursor, Codex and other editors hand AI and ML tasks to NEO.
  • Maintained one backward-compatible contract for tool schemas and structured outputs across 45+ releases on PyPI and npm, guarded by 700+ automated tests.
  • Established evaluation as the release gate for prompt and model changes, replacing subjective review with measured output quality.
  • Shipped three production LLM features on the Claude API, owning prompt design, tool calling, output parsing and recovery from malformed responses.
  • Eliminated recurring manual restarts on a production service by diagnosing connection-pool exhaustion and shipping idempotency-safe retries across five releases in one day.
- Celebal Technologies | Data Science Intern (Oct 2024 - Feb 2025) & Backend Intern (Jun - Aug 2024):
  • Built ML and NLP classification pipelines that extract structure from unstructured text, using scikit-learn and pandas.
  • Built REST and GraphQL APIs in Node.js and Express for a high-volume e-commerce platform.

Selected Projects:
- Ornith Evaluation Framework: Model-agnostic harness that scores whether an LLM refuses destructive filesystem, database, and git commands inside a sandboxed trap repo. Binary search over 15 escalating levels. (Python)
- DocuMind: Hybrid GraphRAG document assistant fusing embedding vector search, BM25, and knowledge-graph traversal with cross-encoder reranking, reaching +183% Recall@10 over a vector-only baseline. (Next.js, FastAPI, ChromaDB)
- Coding Agent: Autonomous CLI coding agent with hand-written agent loop with no orchestration framework, model routing for cost control, and 1,300+ tests. (TypeScript, Node.js)
- LLM Response Judge: Multi-provider grading across Anthropic, OpenAI, and Google SDKs with analytics dashboard for regressions. (FastAPI, React)

Education:
JECRC University | B.Tech, Computer Science and Engineering | CGPA 8.6/10 | 2022 - 2026`,
  extractedSkills: [
    'Python',
    'TypeScript',
    'JavaScript',
    'SQL',
    'FastAPI',
    'Next.js',
    'React',
    'Node.js',
    'Express',
    'PostgreSQL',
    'MongoDB',
    'Redis',
    'Docker',
    'ChromaDB',
    'RAG',
    'BM25',
    'Knowledge Graphs',
    'LLM Agents',
    'MCP (Model Context Protocol)',
    'Tool Calling',
    'Eval Harnesses',
    'Prompt Engineering',
    'Claude API',
    'OpenAI API',
    'Gemini API',
    'AWS',
    'CI/CD',
    'Git',
    'pytest'
  ],
  targetRoles: [
    'AI Engineer',
    'Full Stack Engineer',
    'LLM Engineer',
    'Founding Engineer',
    'Software Engineer',
    'Junior AI Engineer',
    'Associate Software Engineer'
  ],
  experienceYears: 1,
  experienceLevel: 'FRESHER',
  locationPreference: 'Jaipur, India (Open to relocation to Bangalore, Hyderabad, Pune, Mumbai, Gurgaon, or Remote)',
  preferredCities: ['Bangalore', 'Hyderabad', 'Pune', 'Mumbai', 'Gurgaon / Noida', 'Remote'],
  ecosystemFocus: ['India AI Hubs', 'YC Startups', 'a16z Portfolio'],
  remoteOnly: false,
  minSalary: 0,
  minMatchScore: 50,
  customPromptInstructions: 'Prioritize fast-growing early-stage AI startups, YC AI companies, top Indian AI startups in Bangalore/Hyderabad/Pune/Mumbai, and frontier developer tool companies. Look for roles working on LLM agents, MCP tooling, RAG, and full-stack AI engineering. Emphasize Daksh\'s proven track record of shipping open-source MCP servers (45+ releases on PyPI), hand-written agent loops, and production reliability.',
  updatedAt: new Date().toISOString()
};

const DEFAULT_WATCHLIST: CompanyWatchlist[] = TOP_100_AI_COMPANIES;

// In-memory fallback if disk write fails (e.g. read-only serverless lambda)
let memoryStore: DatabaseSchema | null = null;

function ensureDataDir(): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    return true;
  } catch {
    return false;
  }
}

function loadDatabase(): DatabaseSchema {
  if (memoryStore) {
    return memoryStore;
  }

  ensureDataDir();

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content) as DatabaseSchema;
      if (parsed && typeof parsed === 'object' && parsed.profile) {
        memoryStore = parsed;
        return parsed;
      }
    } catch (err) {
      console.warn('[Storage] Error parsing db.json, creating recovery backup:', err);
      try {
        fs.copyFileSync(DB_FILE, `${DB_FILE}.${Date.now()}.corrupt.bak`);
      } catch {}
    }
  }

  const initialData: DatabaseSchema = {
    profile: DEFAULT_PROFILE,
    watchlist: DEFAULT_WATCHLIST,
    jobs: [],
    scans: []
  };

  saveDatabase(initialData);
  memoryStore = initialData;
  return initialData;
}

function saveDatabase(data: DatabaseSchema): void {
  memoryStore = data;
  try {
    ensureDataDir();
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.warn('[Storage] Notice: filesystem write failed, using in-memory store:', err);
  }
}

export function computeJobHash(company: string, title: string, url: string): string {
  const norm = `${company.trim().toLowerCase()}::${title.trim().toLowerCase()}::${url.trim()}`;
  return crypto.createHash('sha256').update(norm).digest('hex').slice(0, 16);
}

// User Profile Operations
export function getUserProfile(): UserProfile {
  const db = loadDatabase();
  return {
    ...DEFAULT_PROFILE,
    ...(db.profile || {})
  };
}

export function saveUserProfile(profileUpdates: Partial<UserProfile>): UserProfile {
  const db = loadDatabase();
  db.profile = {
    ...DEFAULT_PROFILE,
    ...(db.profile || {}),
    ...profileUpdates,
    updatedAt: new Date().toISOString()
  };
  saveDatabase(db);
  return db.profile;
}

// Job Listings Operations
export function getJobListings(filter?: {
  status?: JobStatus;
  minScore?: number;
  source?: string;
  search?: string;
  juniorOnly?: boolean;
  indiaOnly?: boolean;
  ecosystem?: string;
  limit?: number;
  offset?: number;
}): { jobs: JobListing[]; total: number } {
  const db = loadDatabase();
  let list = [...(db.jobs || [])];

  if (filter?.status) {
    list = list.filter((j) => j.status === filter.status);
  }

  if (filter?.minScore !== undefined) {
    list = list.filter((j) => j.matchScore >= (filter.minScore ?? 0));
  }

  if (filter?.source && filter.source !== 'all') {
    list = list.filter((j) => j.source === filter.source);
  }

  if (filter?.juniorOnly) {
    list = list.filter((j) => j.isJuniorFriendly);
  }

  if (filter?.indiaOnly) {
    list = list.filter((j) => j.isIndiaLocation);
  }

  if (filter?.ecosystem && filter.ecosystem !== 'all') {
    list = list.filter((j) => j.ecosystem?.includes(filter.ecosystem as any));
  }

  if (filter?.search && filter.search.trim()) {
    const q = filter.search.toLowerCase();
    list = list.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.tags.some((t) => t.toLowerCase().includes(q)) ||
        j.location.toLowerCase().includes(q)
    );
  }

  // Sort descending by matchScore then date
  list.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime();
  });

  const total = list.length;
  const offset = filter?.offset || 0;
  const limit = filter?.limit || 100;

  return {
    jobs: list.slice(offset, offset + limit),
    total
  };
}

export function upsertJobListings(newJobs: JobListing[]): { added: number; updated: number } {
  const db = loadDatabase();
  const existingMap = new Map(db.jobs.map((j) => [j.id, j]));

  let added = 0;
  let updated = 0;

  for (const job of newJobs) {
    if (existingMap.has(job.id)) {
      const existing = existingMap.get(job.id)!;
      // Preserve existing user interactions (e.g. if marked APPLIED or SAVED)
      existingMap.set(job.id, {
        ...job,
        status: existing.status,
        notes: existing.notes || job.notes,
        discoveredAt: existing.discoveredAt,
        updatedAt: new Date().toISOString()
      });
      updated++;
    } else {
      existingMap.set(job.id, job);
      added++;
    }
  }

  db.jobs = Array.from(existingMap.values());
  saveDatabase(db);

  return { added, updated };
}

export function updateJobStatus(jobId: string, status: JobStatus, notes?: string): JobListing | null {
  const db = loadDatabase();
  const job = db.jobs.find((j) => j.id === jobId);
  if (!job) return null;

  job.status = status;
  if (notes !== undefined) {
    job.notes = notes;
  }
  job.updatedAt = new Date().toISOString();

  saveDatabase(db);
  return job;
}

export function getJobById(jobId: string): JobListing | undefined {
  const db = loadDatabase();
  return db.jobs.find((j) => j.id === jobId);
}

export function updateJobPitch(jobId: string, pitch: string): JobListing | null {
  const db = loadDatabase();
  const job = db.jobs.find((j) => j.id === jobId);
  if (!job) return null;

  job.tailoredPitch = pitch;
  job.updatedAt = new Date().toISOString();
  saveDatabase(db);
  return job;
}

export function deleteJob(jobId: string): boolean {
  const db = loadDatabase();
  const initialLength = db.jobs.length;
  db.jobs = db.jobs.filter((j) => j.id !== jobId);
  if (db.jobs.length !== initialLength) {
    saveDatabase(db);
    return true;
  }
  return false;
}

// Watchlist Operations
export function getWatchlist(): CompanyWatchlist[] {
  const db = loadDatabase();
  if (!db.watchlist || db.watchlist.length <= 5) {
    db.watchlist = TOP_100_AI_COMPANIES;
    saveDatabase(db);
  }
  return db.watchlist;
}

export function addWatchlistCompany(company: Omit<CompanyWatchlist, 'id'>): CompanyWatchlist {
  const db = loadDatabase();
  const newCompany: CompanyWatchlist = {
    ...company,
    id: company.slug.toLowerCase().trim()
  };

  db.watchlist = db.watchlist.filter((w) => w.id !== newCompany.id);
  db.watchlist.push(newCompany);
  saveDatabase(db);

  return newCompany;
}

export function removeWatchlistCompany(id: string): boolean {
  const db = loadDatabase();
  const initialLength = db.watchlist.length;
  db.watchlist = db.watchlist.filter((w) => w.id !== id);
  if (db.watchlist.length !== initialLength) {
    saveDatabase(db);
    return true;
  }
  return false;
}

// Scan Runs & Stats
export function getStats(): ScanStats {
  const db = loadDatabase();
  const jobs = db.jobs || [];

  const highMatchJobs = jobs.filter((j) => j.matchScore >= (db.profile.minMatchScore || 70)).length;
  const appliedJobs = jobs.filter((j) => j.status === 'APPLIED').length;
  const savedJobs = jobs.filter((j) => j.status === 'SAVED').length;

  const lastScan = db.scans.length > 0 ? db.scans[db.scans.length - 1].completedAt : undefined;

  return {
    totalJobs: jobs.length,
    highMatchJobs,
    appliedJobs,
    savedJobs,
    lastScanTimestamp: lastScan
  };
}

export function recordScanRun(scan: ScanRun): void {
  const db = loadDatabase();
  db.scans.push(scan);
  // Keep only the last 50 scans
  if (db.scans.length > 50) {
    db.scans = db.scans.slice(-50);
  }
  saveDatabase(db);
}
