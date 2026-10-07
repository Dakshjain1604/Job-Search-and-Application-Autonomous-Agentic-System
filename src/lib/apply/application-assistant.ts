import { JobListing, UserProfile } from '@/types';
import { ApplicationKit, CandidateField, ScreeningQuestion, ExecutiveOutreach, DiscoveryLinks } from './types';
import { getJobById, getUserProfile } from '../storage';
import { recordTrace } from '../tracing/logger';

export function detectAtsProvider(url: string): 'ashby' | 'greenhouse' | 'lever' | 'other' {
  const lower = url.toLowerCase();
  if (lower.includes('ashbyhq.com') || lower.includes('ashby')) return 'ashby';
  if (lower.includes('greenhouse.io') || lower.includes('gh_jid')) return 'greenhouse';
  if (lower.includes('lever.co')) return 'lever';
  return 'other';
}

export function formatDirectApplyUrl(url: string, ats: string): string {
  if (ats === 'ashby' && !url.includes('/application')) {
    // Ashby hosted pages often end in /application for the form
    return url.endsWith('/') ? `${url}application` : `${url}/application`;
  }
  return url;
}

export async function generateApplicationKit(
  jobInput: { jobId?: string; customJob?: Partial<JobListing> }
): Promise<ApplicationKit> {
  let job: JobListing;

  if (jobInput.customJob) {
    job = {
      id: jobInput.customJob.id || 'custom-' + Date.now(),
      title: jobInput.customJob.title || 'AI / Software Engineer',
      company: jobInput.customJob.company || 'Innovative Tech Startup',
      location: jobInput.customJob.location || 'Remote / India',
      remote: jobInput.customJob.remote ?? true,
      url: jobInput.customJob.url || 'https://jobs.example.com',
      source: jobInput.customJob.source || 'custom',
      salary: jobInput.customJob.salary || null,
      tags: jobInput.customJob.tags || ['Python', 'TypeScript', 'AI', 'Agents'],
      description: jobInput.customJob.description || '',
      matchScore: jobInput.customJob.matchScore || 85,
      fitLevel: jobInput.customJob.fitLevel || 'STRONG_MATCH',
      matchPros: jobInput.customJob.matchPros || ['Direct stack alignment with Python and TypeScript.'],
      matchCons: jobInput.customJob.matchCons || [],
      tailoredPitch: jobInput.customJob.tailoredPitch || '',
      status: jobInput.customJob.status || 'NEW',
      discoveredAt: jobInput.customJob.discoveredAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } else if (jobInput.jobId) {
    const existing = getJobById(jobInput.jobId);
    if (!existing) {
      throw new Error(`Job listing with ID "${jobInput.jobId}" not found.`);
    }
    job = existing;
  } else {
    throw new Error('Either jobId or customJob must be supplied.');
  }

  const profile: UserProfile = getUserProfile();
  const atsProvider = detectAtsProvider(job.url);
  const applicationUrl = formatDirectApplyUrl(job.url, atsProvider);

  // 1. Candidate standard field mapping
  const candidateFields: CandidateField[] = [
    { label: 'First Name', fieldKey: 'first_name', value: 'Daksh', category: 'personal' },
    { label: 'Last Name', fieldKey: 'last_name', value: 'Jain', category: 'personal' },
    { label: 'Full Name', fieldKey: 'full_name', value: profile.name, category: 'personal' },
    { label: 'Email Address', fieldKey: 'email', value: profile.email || 'dakshjain080@gmail.com', category: 'personal' },
    { label: 'Phone Number', fieldKey: 'phone', value: '+91-76270-56978', category: 'personal' },
    { label: 'Current Location', fieldKey: 'location', value: 'Jaipur, India', category: 'personal' },
    {
      label: 'Relocation & Onsite Availability',
      fieldKey: 'relocation',
      value: 'Open to relocation (Bangalore, Hyderabad, Pune, Mumbai, Gurgaon, or Remote), immediately available onsite.',
      category: 'availability'
    },
    { label: 'LinkedIn Profile', fieldKey: 'linkedin', value: 'https://linkedin.com/in/daksh-jain16', category: 'links' },
    { label: 'GitHub Profile', fieldKey: 'github', value: 'https://github.com/Dakshjain1604', category: 'links' },
    { label: 'Portfolio Website', fieldKey: 'portfolio', value: 'https://portfolio-dakshjain.vercel.app', category: 'links' },
    {
      label: 'Notice Period / Start Date',
      fieldKey: 'notice_period',
      value: 'Immediate / Available to start within 1-2 weeks',
      category: 'availability'
    },
    {
      label: 'Work Authorization',
      fieldKey: 'work_authorization',
      value: 'Authorized to work in India (Citizen) and open to global remote contracts or visa sponsorship.',
      category: 'availability'
    },
    {
      label: 'Desired Compensation',
      fieldKey: 'compensation',
      value: 'Market competitive / flexible based on startup stage and equity',
      category: 'compensation'
    }
  ];

  // 2. High-conviction screening question solutions
  const descLower = (job.description + ' ' + job.title).toLowerCase();
  const isAgentOrCli = descLower.includes('agent') || descLower.includes('coding') || descLower.includes('mcp') || descLower.includes('cli');
  const isRagOrSearch = descLower.includes('rag') || descLower.includes('retrieval') || descLower.includes('search') || descLower.includes('vector');

  const screeningQuestions: ScreeningQuestion[] = [
    {
      id: 'q-why-us',
      question: `Why do you want to work at ${job.company}?`,
      suggestedAnswer: `I've been following ${job.company}'s work solving ${job.title.toLowerCase().includes('agent') ? 'autonomous workflows and AI developer tooling' : 'high-impact production systems'}. At NEO, I built NeoClaw (a 4-channel bridge to our coding agent over 50+ tools) and authored neo-mcp, an open-source MCP server maintained across 45+ releases on PyPI. I love building real, production-hardened AI software with high shipping velocity, and I want to bring that same hands-on engineering ownership to ${job.company}.`,
      evidenceSource: 'NEO NeoClaw chat bridge & neo-mcp PyPI releases'
    },
    {
      id: 'q-complex-project',
      question: 'Describe your most challenging technical project or achievement.',
      suggestedAnswer: isRagOrSearch
        ? `Built DocuMind, a hybrid GraphRAG document assistant fusing embedding-based vector search, BM25, and knowledge-graph traversal with cross-encoder reranking. Through rigorous offline benchmarking across a 40-question eval set, the hybrid architecture achieved a +183% improvement in Recall@10 (0.150 to 0.425) and +454% MRR over a vector-only baseline.`
        : `Built and maintain neo-mcp, an open-source, local-first Python MCP server that lets Claude Code, Cursor, Codex and other editors hand AI tasks to NEO. The main challenge was maintaining a single backward-compatible contract for tool schemas and structured outputs across 45+ releases on PyPI and npm, guarded by 700+ automated tests and strict path validation against workspace escapes.`,
      evidenceSource: isRagOrSearch ? 'DocuMind eval results' : 'neo-mcp 45+ releases & 700+ tests'
    },
    {
      id: 'q-experience-stack',
      question: `What is your experience with the core stack for this role?`,
      suggestedAnswer: `I have 1+ year of production experience shipping software in Python, TypeScript, React, Next.js, Node.js, and FastAPI. In production at NEO, I own our AI platform surface end to end, leading the v1 to v2 API migration, operating Redis caching and MongoDB pipelines, and establishing evaluation release gates on Claude/OpenAI APIs. Behind all my projects sit extensive automated tests (over 1,300+ tests in my CLI coding agent and 700+ in neo-mcp).`,
      evidenceSource: 'Production NEO experience and GitHub test suites'
    },
    {
      id: 'q-location-availability',
      question: 'Are you available to work in our office location or relocate?',
      suggestedAnswer: `Yes, absolutely. I am based in Jaipur, India and actively open to relocation for onsite roles in ${job.location || 'Bangalore, Hyderabad, Pune, Mumbai, or Gurgaon'}, as well as fully remote setups. I am prepared to begin immediately.`,
      evidenceSource: 'Daksh Jain location preference'
    }
  ];

  // 3. Executive Cold Outreach Pack
  const leadProject = isAgentOrCli
    ? 'neo-mcp (an open-source MCP server with 45+ releases on PyPI)'
    : 'DocuMind (a hybrid GraphRAG pipeline reaching +183% Recall@10)';

  const executiveOutreach: ExecutiveOutreach = {
    coldEmail: {
      subject: `Engineer for ${job.company}: Production LLM systems & open-source MCP author`,
      body: `Hi ${job.company} Team,

I noticed ${job.company} is hiring for ${job.title}, and I wanted to reach out directly with concrete work that aligns with your engineering roadmap.

I'm an AI & full-stack engineer with 1+ year of experience building production LLM systems. At NEO (heyneo.com), I built NeoClaw—a 4-channel bridge to our coding agent over 50+ tools—and authored neo-mcp (https://github.com/Dakshjain1604/neo-mcp), an open-source Python MCP server maintained across 45+ releases on PyPI and npm, tested against Claude Code, Cursor, and Codex with 700+ automated tests.

I also built an autonomous CLI coding agent backed by 1,300+ tests (https://github.com/Dakshjain1604/Ai-coding-Agent). I love shipping clean, robust code with fast iteration cycles and would love to contribute to ${job.company}.

My resume is attached, and my portfolio is at https://portfolio-dakshjain.vercel.app. Would you be open to a 10-minute chat this week?

Best regards,
Daksh Jain
+91-76270-56978 | dakshjain080@gmail.com`
    },

    linkedInNote: `Hi! Saw ${job.company} is building in this space. I'm an AI engineer with 1+ yr in production LLMs & author of neo-mcp (45+ PyPI releases, 700+ tests). Would love to connect and see if my background aligns with your ${job.title} role!`.slice(0, 298),

    linkedInInMail: `Hi,

I came across ${job.company}'s work and wanted to connect regarding the ${job.title} opening.

I currently work at NEO building production LLM agents and authoring neo-mcp (an open-source MCP server with 45+ releases on PyPI/npm used from Cursor and Claude Code). I also engineered an autonomous CLI coding agent with 1,300+ tests (github.com/Dakshjain1604/Ai-coding-Agent).

Given your team's focus on high-velocity engineering, I'd welcome the chance to share how my experience shipping reliable agent loops and full-stack systems can help ${job.company}.

Portfolio: https://portfolio-dakshjain.vercel.app
GitHub: https://github.com/Dakshjain1604

Best,
Daksh Jain`,

    twitterDm: `Hey! Huge fan of what ${job.company} is shipping. I'm an AI/full-stack engineer with 1+ yr production experience; authored neo-mcp (45+ releases, 700+ tests) and built a CLI coding agent with 1,300+ tests. Saw your ${job.title} opening and would love to share how I can help build!`
  };

  // 4. Recruiter & Founder Discovery Links
  const encodedComp = encodeURIComponent(job.company);
  const discoveryLinks: DiscoveryLinks = {
    founderSearchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodedComp}+founder+OR+co-founder`,
    engineeringLeadSearchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodedComp}+"Engineering+Manager"+OR+"Head+of+Engineering"+OR+"VP+Engineering"`,
    recruiterSearchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodedComp}+"Technical+Recruiter"+OR+"Talent+Acquisition"`
  };

  recordTrace({
    level: 'LOOP',
    category: 'APPLY',
    message: `Generated application auto-fill payload & executive outreach pack for ${job.company}`,
    details: { company: job.company, atsProvider, fieldsCount: candidateFields.length, questionsCount: screeningQuestions.length }
  });

  return {
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    applicationUrl,
    atsProvider,
    candidateFields,
    screeningQuestions,
    outreach: executiveOutreach,
    discoveryLinks
  };
}
