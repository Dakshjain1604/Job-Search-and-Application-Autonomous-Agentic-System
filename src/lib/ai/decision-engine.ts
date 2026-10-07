import { JobListing, UserProfile, MatchEvaluation, FitLevel } from '@/types';
import { evaluateJobHeuristically } from './heuristic-matcher';

const FREE_MODELS = [
  'openrouter/free',
  'qwen/qwen3.8-27b:free',
  'nvidia/nemotron-3.5-lightning:free',
  'google/gemma-4-31b-it:free'
];

interface LLMEvalResponse {
  matchScore: number;
  fitLevel: FitLevel;
  matchPros: string[];
  matchCons: string[];
  tailoredPitch: string;
}

export async function evaluateJobWithAI(
  job: JobListing,
  profile: UserProfile,
  apiKey?: string
): Promise<MatchEvaluation> {
  const effectiveKey = apiKey || profile.openRouterApiKey || process.env.OPENROUTER_API_KEY;

  // If no API key is configured, seamlessly use the offline heuristic matcher
  if (!effectiveKey) {
    return evaluateJobHeuristically(job, profile);
  }

  const prompt = `You are an elite tech startup hiring advisor and decision engine. Evaluate how well this candidate fits the target job posting.

CANDIDATE PROFILE:
Name: ${profile.name}
Headline: ${profile.headline || 'Software Engineer'}
Target Roles: ${profile.targetRoles.join(', ')}
Key Skills: ${profile.extractedSkills.join(', ')}
Target Experience Level: ${profile.experienceLevel || 'FRESHER'} (~${profile.experienceYears} years experience)
Location / Remote Preference: ${profile.locationPreference} (Remote Only: ${profile.remoteOnly})
Preferred Indian Hubs / Locations: ${(profile.preferredCities || []).join(', ') || 'Bangalore, Hyderabad, Pune, Mumbai, Remote'}
Min Salary Expectation: ${profile.minSalary ? `$${profile.minSalary}` : 'Flexible'}
Custom Guidance: ${profile.customPromptInstructions || 'Focus on fast-paced startups, modern tech stack.'}

Resume Excerpt:
${profile.resumeText.slice(0, 1500)}

JOB POSTING:
Company: ${job.company}
Role: ${job.title}
Location: ${job.location} (Remote: ${job.remote})
Salary: ${job.salary || 'Not specified'}
Tags: ${job.tags.join(', ')}
Description:
${job.description.slice(0, 2000)}

EVALUATION INSTRUCTIONS:
1. Provide an objective matchScore from 0 to 100 based on technical stack alignment, role seniority, and remote/location preferences.
2. CRITICAL SENIORITY RULE: If the candidate experience level is FRESHER or JUNIOR (<2 years), and the job title or description requires Staff, Principal, Architect, Lead, or 3+ years experience, mark matchScore < 40 and fitLevel "LOW". If the role is junior/entry-level/fresher friendly, reward appropriate stack match.
3. Assign a fitLevel: "STRONG_MATCH" (score >= 80), "GOOD_MATCH" (65-79), "POTENTIAL" (45-64), or "LOW" (< 45).
4. List 2-4 specific matchPros (why the candidate is a compelling fit).
5. List 1-3 matchCons or gaps (missing requirements or things to clarify).
6. Write a concise, punchy 3-sentence tailoredPitch / cold outreach note addressing the company and highlighting candidate's exact experience.

Return ONLY a valid JSON object matching this schema:
{
  "matchScore": number,
  "fitLevel": "STRONG_MATCH" | "GOOD_MATCH" | "POTENTIAL" | "LOW",
  "matchPros": string[],
  "matchCons": string[],
  "tailoredPitch": string
}`;

  for (const model of FREE_MODELS) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://jobscout-ai.vercel.app',
          'X-Title': 'JobScout AI Engine'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        }),
        signal: AbortSignal.timeout(12000) // 12s timeout per model attempt
      });

      if (!response.ok) {
        console.warn(`[Decision Engine] Model ${model} returned HTTP ${response.status}`);
        continue;
      }

      const json = await response.json();
      const rawContent = json.choices?.[0]?.message?.content;

      if (!rawContent) continue;

      const parsed = extractJsonFromText(rawContent);
      if (parsed && typeof parsed.matchScore === 'number') {
        const score = Math.max(0, Math.min(100, Math.round(parsed.matchScore)));
        let fitLevel: FitLevel = 'POTENTIAL';
        if (score >= 80) fitLevel = 'STRONG_MATCH';
        else if (score >= 65) fitLevel = 'GOOD_MATCH';
        else if (score >= 45) fitLevel = 'POTENTIAL';
        else fitLevel = 'LOW';

        const titleLower = job.title.toLowerCase();
        const descLower = job.description.toLowerCase();
        const locLower = job.location.toLowerCase();
        const isSenior = /\b(staff|principal|director|vp\b|vice\s*president|head\s*of|architect|lead\b|senior|sr\.?|team\s*lead|manager|distinguished|l4\b|l5\b|l6\b|mts\s*ii|mts\s*iii)\b/i.test(titleLower);
        const hasHighYoe = /\b([3-9]|1[0-9])\+?\s*(?:-\s*\d+)?\s*(?:years?|yrs?)(?:\s+of)?\s+experience\b/i.test(descLower);
        const isJunior = /\b(junior|jr\.?|associate|entry[\s-]level|early[\s-]career|new[\s-]grad|graduate|swe\s*i\b|software\s*engineer\s*i\b|mts\s*i\b|l1\b|intern|internship|fellow|fresher)\b/i.test(titleLower);
        const isJuniorFriendly = !isSenior && (isJunior || !hasHighYoe);
        const isIndiaLocation = Boolean(
          /\b(bangalore|bengaluru|hyderabad|pune|mumbai|gurgaon|gurugram|noida|delhi|india|chennai|ahmedabad|kolkata)\b/i.test(locLower) ||
          /\b(bangalore|bengaluru|hyderabad|pune|mumbai|india)\b/i.test(titleLower)
        );

        return {
          matchScore: score,
          fitLevel,
          matchPros: Array.isArray(parsed.matchPros) ? parsed.matchPros : ['Aligned with profile background.'],
          matchCons: Array.isArray(parsed.matchCons) ? parsed.matchCons : ['Review detailed requirements.'],
          tailoredPitch: parsed.tailoredPitch || '',
          isJuniorFriendly,
          isIndiaLocation
        };
      }
    } catch (err) {
      console.warn(`[Decision Engine] Error calling ${model}:`, err);
    }
  }

  // Graceful fallback to heuristic evaluator if all LLM attempts fail or timeout
  console.log('[Decision Engine] Falling back to offline heuristic matcher');
  return evaluateJobHeuristically(job, profile);
}

function extractJsonFromText(text: string): LLMEvalResponse | null {
  try {
    return JSON.parse(text);
  } catch {
    // Attempt extracting json from markdown code block ```json ... ```
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// Batch evaluation with zero LLM API cost during discovery scans
// Outreach notes and deep LLM evaluations are generated on-demand when the user clicks
export async function batchEvaluateJobs(
  jobs: JobListing[],
  profile: UserProfile,
  concurrency: number = 5
): Promise<JobListing[]> {
  // Use fast, deterministic heuristic matcher during discovery:
  // Completes in <5ms, zero API token costs, high accuracy scoring!
  return jobs.map((job) => {
    const evalResult = evaluateJobHeuristically(job, profile);
    return {
      ...job,
      matchScore: evalResult.matchScore,
      fitLevel: evalResult.fitLevel,
      matchPros: evalResult.matchPros,
      matchCons: evalResult.matchCons,
      tailoredPitch: job.tailoredPitch || '', // Preserved if already generated, otherwise on-demand
      isJuniorFriendly: evalResult.isJuniorFriendly ?? job.isJuniorFriendly,
      isIndiaLocation: evalResult.isIndiaLocation ?? job.isIndiaLocation,
      updatedAt: new Date().toISOString()
    };
  });
}

/**
 * On-demand tailored outreach note generator
 * Only called when the user explicitly clicks "Generate AI Outreach Note" or opens the Apply Hub
 */
export async function generateTailoredOutreachNote(
  job: JobListing,
  profile: UserProfile,
  apiKey?: string
): Promise<string> {
  const effectiveKey = apiKey || profile.openRouterApiKey || process.env.OPENROUTER_API_KEY;

  if (!effectiveKey) {
    return generateDeterministicOutreachPitch(job, profile);
  }

  const isAiRole = `${job.title} ${job.description} ${job.tags.join(' ')}`.toLowerCase().match(/(ai|agent|llm|genai|machine learning|prompt|rag|mcp)/);

  const prompt = `You are an elite tech talent advisor writing an ultra-personalized, high-converting cold outreach message for an early-career engineer reaching out directly to a founder or engineering hiring manager at ${job.company}.

CANDIDATE PROFILE:
Name: ${profile.name}
Headline: ${profile.headline}
Experience: ${profile.experienceYears} years (~${profile.experienceLevel})
Verified Technical Achievements (Strictly Factual - Zero Hallucinations):
- Open-Source Author: Maintained "neo-mcp" across 45+ releases on PyPI/npm with 700+ automated tests, integrated with Claude Code and Cursor.
- Agent Architecture: Built an autonomous coding agent backed by a hand-written execution loop and 1,300+ deterministic unit/integration tests.
- Production Reliability: Shipped production LLM workflows on Claude API with strict schema recovery, latency/cost budgets, and eval release gates.
- Full Stack: High velocity shipping with Next.js, TypeScript, Python, FastAPI, distributed databases (PostgreSQL, MongoDB, Redis).

TARGET COMPANY & ROLE:
Company: ${job.company}
Role: ${job.title}
Location: ${job.location} (Remote: ${job.remote})
Target Stack & Keywords: ${job.tags.slice(0, 6).join(', ')}
Role Context:
${job.description.slice(0, 1500)}

INSTRUCTIONS FOR THE OUTREACH NOTE:
1. Format: Direct, concise message suitable for LinkedIn InMail or a cold email (3-4 sentences, under 110 words).
2. The Hook: Open by referencing what ${job.company} is building or their specific technical focus in ${isAiRole ? 'AI / agents / developer tools' : 'high-performance systems'}.
3. The Proof: Connect candidate's exact verified technical achievements (${isAiRole ? 'author of neo-mcp with 45+ releases / 700+ tests and 1,300+ test coding agent' : 'TypeScript/Next.js/Python production systems with 700+ tests and 45+ releases'}) directly to ${job.company}'s needs.
4. The Ask: Low-friction call to action (e.g. "Would love to share a 5-minute code repo/demo or chat if your team is open to it").
5. Tone: Confident, humble, engineering-driven, polite. NO fluff, NO generic phrases ("I hope this message finds you well", "I am thrilled to apply", etc.).

Return ONLY the raw note text. No quotation marks, no Markdown headings, no intro/outro filler.`;

  for (const model of FREE_MODELS) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://jobscout-ai.vercel.app',
          'X-Title': 'JobScout AI Outreach Note Generator'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an executive talent advisor writing tailored, high-converting cold outreach notes for top engineering talent. Respond with ONLY the final outreach note text (starting with "Hi [Company] Team,"). Never output reasoning, meta-commentary, thinking tokens, or chain-of-thought.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 500
        }),
        signal: AbortSignal.timeout(9000)
      });

      if (!response.ok) continue;

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content?.trim();
      if (!raw) continue;

      // Robust sanitization: strip <think>...</think> reasoning tags
      let cleanPitch = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

      // If model prepended conversational analysis or thought blocks, extract the actual note
      if (cleanPitch.includes("Here's a thinking process") || cleanPitch.includes("Here is a draft") || cleanPitch.includes("1.  **Analyze")) {
        const match = cleanPitch.match(/(?:Hi\s+[^\n]+|Dear\s+[^\n]+)[\s\S]+/i);
        if (match) {
          cleanPitch = match[0].trim();
        }
      }

      // Strip outer quotes if model wrapped the note in quotes
      if (cleanPitch.startsWith('"') && cleanPitch.endsWith('"')) {
        cleanPitch = cleanPitch.slice(1, -1).trim();
      }

      if (cleanPitch && cleanPitch.length > 50 && !cleanPitch.toLowerCase().includes("thinking process")) {
        return cleanPitch;
      }
    } catch (err) {
      console.warn(`[Pitch Generator] OpenRouter model ${model} failed, trying next:`, err);
    }
  }

  // Fallback to high quality deterministic outreach pitch
  return generateDeterministicOutreachPitch(job, profile);
}

export function generateDeterministicOutreachPitch(job: JobListing, profile: UserProfile): string {
  const isAi = `${job.title} ${job.description} ${job.tags.join(' ')}`.toLowerCase().match(/(ai|agent|llm|genai|prompt|rag|mcp)/);

  if (isAi) {
    return `Hi ${job.company} Team,

I've been closely following ${job.company}'s work in ${job.tags.slice(0, 3).join('/') || 'AI systems'} and noticed your opening for ${job.title}. As an engineer focused on production LLMs, I authored neo-mcp (open-source MCP library with 45+ releases on PyPI/npm and 700+ tests) and built an autonomous coding agent backed by 1,300+ deterministic tests.

Given your emphasis on ${job.tags[0] || 'reliable software'}, my hands-on background in agent execution loops and structured outputs maps directly to what you're building. Would love to share a brief 5-minute demo or chat about how I can contribute to ${job.company}!

Best,
${profile.name}`;
  } else {
    return `Hi ${job.company} Team,

I came across the ${job.title} opening at ${job.company} and was really impressed by your engineering focus in ${job.tags.slice(0, 3).join(', ') || 'modern web systems'}. As a full-stack engineer with hands-on experience in TypeScript, Next.js, and high-throughput Python backends, I specialize in building reliable, test-driven systems (author of open-source tools with 700+ automated tests and 45+ releases).

Given your stack, I could ramp up immediately on your core architecture. Would love to connect for a brief exploratory conversation or share recent code repositories if you're open to it!

Best,
${profile.name}`;
  }
}
