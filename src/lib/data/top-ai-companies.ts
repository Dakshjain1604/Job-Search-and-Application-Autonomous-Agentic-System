import { CompanyWatchlist } from '@/types';

export type AICategory =
  | 'India AI Hubs (Bangalore, Hyderabad, Pune, Mumbai)'
  | 'YC AI Startups (Recent Batches)'
  | 'a16z AI Portfolio'
  | 'Foundation Models & LLM Labs'
  | 'AI Developer Tools & Infra'
  | 'Generative Media & Creative AI'
  | 'AI Coding & Autonomous Agents'
  | 'Enterprise AI & Vertical AI'
  | 'AI Hardware & Cloud Compute'
  | 'Robotics & Physical AI';

export interface AICompanyProfile extends CompanyWatchlist {
  category: AICategory;
  hubs?: string[];
  isYC?: boolean;
  isA16z?: boolean;
  isIndiaHub?: boolean;
  description?: string;
}

export const TOP_100_AI_COMPANIES: AICompanyProfile[] = [
  // ==========================================
  // 🇮🇳 INDIA AI HUBS (Bangalore, Hyderabad, Pune, Mumbai, Remote India)
  // ==========================================
  {
    id: 'sarvam',
    name: 'Sarvam AI',
    slug: 'sarvam',
    atsProvider: 'ashby',
    category: 'India AI Hubs (Bangalore, Hyderabad, Pune, Mumbai)',
    hubs: ['Bangalore', 'Remote India'],
    isIndiaHub: true,
    careersUrl: 'https://jobs.ashbyhq.com/sarvam',
    enabled: true
  },
  {
    id: 'atlan',
    name: 'Atlan',
    slug: 'atlan',
    atsProvider: 'ashby',
    category: 'India AI Hubs (Bangalore, Hyderabad, Pune, Mumbai)',
    hubs: ['Bangalore', 'Remote India'],
    isIndiaHub: true,
    careersUrl: 'https://jobs.ashbyhq.com/atlan',
    enabled: true
  },
  {
    id: 'signoz',
    name: 'SigNoz',
    slug: 'signoz',
    atsProvider: 'ashby',
    category: 'India AI Hubs (Bangalore, Hyderabad, Pune, Mumbai)',
    hubs: ['Bangalore', 'Remote India'],
    isYC: true,
    isIndiaHub: true,
    careersUrl: 'https://jobs.ashbyhq.com/signoz',
    enabled: true
  },
  {
    id: 'composio',
    name: 'Composio',
    slug: 'composio',
    atsProvider: 'ashby',
    category: 'India AI Hubs (Bangalore, Hyderabad, Pune, Mumbai)',
    hubs: ['Bangalore', 'Remote India', 'SF'],
    isYC: true,
    isIndiaHub: true,
    careersUrl: 'https://jobs.ashbyhq.com/composio',
    enabled: true
  },
  {
    id: 'ema',
    name: 'Ema Unlimited',
    slug: 'ema',
    atsProvider: 'ashby',
    category: 'India AI Hubs (Bangalore, Hyderabad, Pune, Mumbai)',
    hubs: ['Bangalore', 'Remote India'],
    isIndiaHub: true,
    careersUrl: 'https://jobs.ashbyhq.com/ema',
    enabled: true
  },
  {
    id: 'devrev',
    name: 'DevRev',
    slug: 'devrev',
    atsProvider: 'greenhouse',
    category: 'India AI Hubs (Bangalore, Hyderabad, Pune, Mumbai)',
    hubs: ['Bangalore', 'Chennai', 'Remote India'],
    isIndiaHub: true,
    careersUrl: 'https://boards.greenhouse.io/devrev',
    enabled: true
  },
  {
    id: 'mercor-india',
    name: 'Mercor (India & Global)',
    slug: 'mercor',
    atsProvider: 'ashby',
    category: 'India AI Hubs (Bangalore, Hyderabad, Pune, Mumbai)',
    hubs: ['Bangalore', 'Remote India', 'Worldwide'],
    isYC: true,
    isIndiaHub: true,
    careersUrl: 'https://jobs.ashbyhq.com/mercor',
    enabled: true
  },
  {
    id: 'supabase-india',
    name: 'Supabase (Remote India / Global)',
    slug: 'supabase',
    atsProvider: 'ashby',
    category: 'India AI Hubs (Bangalore, Hyderabad, Pune, Mumbai)',
    hubs: ['Remote India', 'Worldwide'],
    isYC: true,
    isIndiaHub: true,
    careersUrl: 'https://jobs.ashbyhq.com/supabase',
    enabled: true
  },
  {
    id: 'posthog-india',
    name: 'PostHog (Remote India / Global)',
    slug: 'posthog',
    atsProvider: 'ashby',
    category: 'India AI Hubs (Bangalore, Hyderabad, Pune, Mumbai)',
    hubs: ['Remote India', 'Worldwide'],
    isYC: true,
    isIndiaHub: true,
    careersUrl: 'https://jobs.ashbyhq.com/posthog',
    enabled: true
  },
  {
    id: 'resend-india',
    name: 'Resend (Remote India / Global)',
    slug: 'resend',
    atsProvider: 'ashby',
    category: 'India AI Hubs (Bangalore, Hyderabad, Pune, Mumbai)',
    hubs: ['Remote India', 'Worldwide'],
    isYC: true,
    isIndiaHub: true,
    careersUrl: 'https://jobs.ashbyhq.com/resend',
    enabled: true
  },

  // ==========================================
  // ⚡ TOP YC AI STARTUPS (Recent Batches W23 / S23 / W24 / S24 / W25)
  // ==========================================
  {
    id: 'cursor-yc',
    name: 'Cursor (Anysphere)',
    slug: 'cursor',
    atsProvider: 'ashby',
    category: 'YC AI Startups (Recent Batches)',
    isYC: true,
    isA16z: true,
    careersUrl: 'https://jobs.ashbyhq.com/cursor',
    enabled: true
  },
  {
    id: 'cognition-yc',
    name: 'Cognition (Devin)',
    slug: 'cognition',
    atsProvider: 'ashby',
    category: 'YC AI Startups (Recent Batches)',
    isYC: true,
    careersUrl: 'https://jobs.ashbyhq.com/cognition',
    enabled: true
  },
  {
    id: 'decagon-yc',
    name: 'Decagon',
    slug: 'decagon',
    atsProvider: 'ashby',
    category: 'YC AI Startups (Recent Batches)',
    isYC: true,
    isA16z: true,
    careersUrl: 'https://jobs.ashbyhq.com/decagon',
    enabled: true
  },
  {
    id: 'e2b-yc',
    name: 'E2B (AI Sandbox)',
    slug: 'e2b',
    atsProvider: 'ashby',
    category: 'YC AI Startups (Recent Batches)',
    isYC: true,
    careersUrl: 'https://jobs.ashbyhq.com/e2b',
    enabled: true
  },
  {
    id: 'retellai',
    name: 'Retell AI (Voice Agents)',
    slug: 'retellai',
    atsProvider: 'ashby',
    category: 'YC AI Startups (Recent Batches)',
    isYC: true,
    careersUrl: 'https://jobs.ashbyhq.com/retellai',
    enabled: true
  },
  {
    id: 'wordware',
    name: 'Wordware (AI IDE)',
    slug: 'wordware',
    atsProvider: 'ashby',
    category: 'YC AI Startups (Recent Batches)',
    isYC: true,
    careersUrl: 'https://jobs.ashbyhq.com/wordware',
    enabled: true
  },
  {
    id: 'coderabbit',
    name: 'CodeRabbit (AI Code Review)',
    slug: 'coderabbit',
    atsProvider: 'ashby',
    category: 'YC AI Startups (Recent Batches)',
    isYC: true,
    careersUrl: 'https://jobs.ashbyhq.com/coderabbit',
    enabled: true
  },
  {
    id: 'bland-ai',
    name: 'Bland AI (Phone Calling Agents)',
    slug: 'bland.ai',
    atsProvider: 'ashby',
    category: 'YC AI Startups (Recent Batches)',
    isYC: true,
    careersUrl: 'https://jobs.ashbyhq.com/bland.ai',
    enabled: true
  },
  {
    id: 'artisan',
    name: 'Artisan AI (AI Workers)',
    slug: 'artisan',
    atsProvider: 'ashby',
    category: 'YC AI Startups (Recent Batches)',
    isYC: true,
    careersUrl: 'https://jobs.ashbyhq.com/artisan',
    enabled: true
  },
  {
    id: 'granola-yc',
    name: 'Granola (AI Notepad)',
    slug: 'granola',
    atsProvider: 'ashby',
    category: 'YC AI Startups (Recent Batches)',
    isYC: true,
    careersUrl: 'https://jobs.ashbyhq.com/granola',
    enabled: true
  },
  {
    id: 'lancedb-yc',
    name: 'LanceDB (Vector DB)',
    slug: 'lancedb',
    atsProvider: 'ashby',
    category: 'YC AI Startups (Recent Batches)',
    isYC: true,
    careersUrl: 'https://jobs.ashbyhq.com/lancedb',
    enabled: true
  },
  {
    id: 'stackblitz-yc',
    name: 'StackBlitz (Bolt.new)',
    slug: 'stackblitz',
    atsProvider: 'greenhouse',
    category: 'YC AI Startups (Recent Batches)',
    isYC: true,
    careersUrl: 'https://boards.greenhouse.io/stackblitz',
    enabled: true
  },

  // ==========================================
  // 🦁 TOP a16z AI PORTFOLIO COMPANIES
  // ==========================================
  {
    id: 'hebbia-a16z',
    name: 'Hebbia (a16z)',
    slug: 'hebbia',
    atsProvider: 'ashby',
    category: 'a16z AI Portfolio',
    isA16z: true,
    careersUrl: 'https://jobs.ashbyhq.com/hebbia',
    enabled: true
  },
  {
    id: 'genspark',
    name: 'Genspark (AI Search)',
    slug: 'genspark',
    atsProvider: 'ashby',
    category: 'a16z AI Portfolio',
    isA16z: true,
    careersUrl: 'https://jobs.ashbyhq.com/genspark',
    enabled: true
  },
  {
    id: 'hippocratic-a16z',
    name: 'Hippocratic AI',
    slug: 'hippocratic',
    atsProvider: 'ashby',
    category: 'a16z AI Portfolio',
    isA16z: true,
    careersUrl: 'https://jobs.ashbyhq.com/hippocratic',
    enabled: true
  },
  {
    id: 'elevenlabs-a16z',
    name: 'ElevenLabs (Voice AI)',
    slug: 'elevenlabs',
    atsProvider: 'ashby',
    category: 'a16z AI Portfolio',
    isA16z: true,
    careersUrl: 'https://jobs.ashbyhq.com/elevenlabs',
    enabled: true
  },
  {
    id: 'ideogram-a16z',
    name: 'Ideogram (Image AI)',
    slug: 'ideogram',
    atsProvider: 'ashby',
    category: 'a16z AI Portfolio',
    isA16z: true,
    careersUrl: 'https://jobs.ashbyhq.com/ideogram',
    enabled: true
  },
  {
    id: 'perplexity-a16z',
    name: 'Perplexity AI',
    slug: 'perplexity',
    atsProvider: 'ashby',
    category: 'a16z AI Portfolio',
    isA16z: true,
    careersUrl: 'https://jobs.ashbyhq.com/perplexity',
    enabled: true
  },
  {
    id: 'character-a16z',
    name: 'Character AI',
    slug: 'character',
    atsProvider: 'ashby',
    category: 'a16z AI Portfolio',
    isA16z: true,
    careersUrl: 'https://jobs.ashbyhq.com/character',
    enabled: true
  },
  {
    id: 'cartesia-a16z',
    name: 'Cartesia (Voice SSM)',
    slug: 'cartesia',
    atsProvider: 'ashby',
    category: 'a16z AI Portfolio',
    isA16z: true,
    careersUrl: 'https://jobs.ashbyhq.com/cartesia',
    enabled: true
  },
  {
    id: 'togetherai-a16z',
    name: 'Together AI',
    slug: 'togetherai',
    atsProvider: 'greenhouse',
    category: 'a16z AI Portfolio',
    isA16z: true,
    careersUrl: 'https://boards.greenhouse.io/togetherai',
    enabled: true
  },

  // ==========================================
  // FOUNDATION MODELS & LLM LABS
  // ==========================================
  {
    id: 'openai',
    name: 'OpenAI',
    slug: 'openai',
    atsProvider: 'ashby',
    category: 'Foundation Models & LLM Labs',
    careersUrl: 'https://openai.com/careers',
    enabled: true
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    slug: 'anthropic',
    atsProvider: 'greenhouse',
    category: 'Foundation Models & LLM Labs',
    careersUrl: 'https://boards.greenhouse.io/anthropic',
    enabled: true
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    slug: 'mistral',
    atsProvider: 'ashby',
    category: 'Foundation Models & LLM Labs',
    isA16z: true,
    careersUrl: 'https://jobs.ashbyhq.com/mistral',
    enabled: true
  },
  {
    id: 'cohere',
    name: 'Cohere',
    slug: 'cohere',
    atsProvider: 'ashby',
    category: 'Foundation Models & LLM Labs',
    careersUrl: 'https://jobs.ashbyhq.com/cohere',
    enabled: true
  },
  {
    id: 'liquid-ai',
    name: 'Liquid AI',
    slug: 'liquid.ai',
    atsProvider: 'ashby',
    category: 'Foundation Models & LLM Labs',
    careersUrl: 'https://jobs.ashbyhq.com/liquid.ai',
    enabled: true
  },
  {
    id: 'imbue',
    name: 'Imbue',
    slug: 'imbue',
    atsProvider: 'greenhouse',
    category: 'Foundation Models & LLM Labs',
    careersUrl: 'https://boards.greenhouse.io/imbue',
    enabled: true
  },
  {
    id: 'reka',
    name: 'Reka AI',
    slug: 'reka',
    atsProvider: 'ashby',
    category: 'Foundation Models & LLM Labs',
    careersUrl: 'https://jobs.ashbyhq.com/reka',
    enabled: true
  },
  {
    id: 'essential-ai',
    name: 'Essential AI',
    slug: 'essential.ai',
    atsProvider: 'ashby',
    category: 'Foundation Models & LLM Labs',
    careersUrl: 'https://jobs.ashbyhq.com/essential.ai',
    enabled: true
  },
  {
    id: 'allenai',
    name: 'Allen Institute for AI',
    slug: 'allenai',
    atsProvider: 'greenhouse',
    category: 'Foundation Models & LLM Labs',
    careersUrl: 'https://boards.greenhouse.io/allenai',
    enabled: true
  },

  // ==========================================
  // AI DEVELOPER TOOLS & INFRA
  // ==========================================
  {
    id: 'modal',
    name: 'Modal Labs',
    slug: 'modal',
    atsProvider: 'ashby',
    category: 'AI Developer Tools & Infra',
    careersUrl: 'https://jobs.ashbyhq.com/modal',
    enabled: true
  },
  {
    id: 'fireworks',
    name: 'Fireworks AI',
    slug: 'fireworks',
    atsProvider: 'ashby',
    category: 'AI Developer Tools & Infra',
    careersUrl: 'https://jobs.ashbyhq.com/fireworks',
    enabled: true
  },
  {
    id: 'baseten',
    name: 'Baseten',
    slug: 'baseten',
    atsProvider: 'ashby',
    category: 'AI Developer Tools & Infra',
    isYC: true,
    careersUrl: 'https://jobs.ashbyhq.com/baseten',
    enabled: true
  },
  {
    id: 'langchain',
    name: 'LangChain',
    slug: 'langchain',
    atsProvider: 'ashby',
    category: 'AI Developer Tools & Infra',
    careersUrl: 'https://jobs.ashbyhq.com/langchain',
    enabled: true
  },
  {
    id: 'llamaindex',
    name: 'LlamaIndex',
    slug: 'llamaindex',
    atsProvider: 'ashby',
    category: 'AI Developer Tools & Infra',
    careersUrl: 'https://jobs.ashbyhq.com/llamaindex',
    enabled: true
  },
  {
    id: 'pinecone',
    name: 'Pinecone',
    slug: 'pinecone',
    atsProvider: 'ashby',
    category: 'AI Developer Tools & Infra',
    isA16z: true,
    careersUrl: 'https://jobs.ashbyhq.com/pinecone',
    enabled: true
  },
  {
    id: 'weaviate',
    name: 'Weaviate',
    slug: 'weaviate',
    atsProvider: 'ashby',
    category: 'AI Developer Tools & Infra',
    careersUrl: 'https://jobs.ashbyhq.com/weaviate',
    enabled: true
  },
  {
    id: 'chroma',
    name: 'Chroma',
    slug: 'chroma',
    atsProvider: 'ashby',
    category: 'AI Developer Tools & Infra',
    careersUrl: 'https://jobs.ashbyhq.com/chroma',
    enabled: true
  },
  {
    id: 'qdrant',
    name: 'Qdrant',
    slug: 'qdrant',
    atsProvider: 'ashby',
    category: 'AI Developer Tools & Infra',
    careersUrl: 'https://jobs.ashbyhq.com/qdrant',
    enabled: true
  },
  {
    id: 'unstructured',
    name: 'Unstructured.io',
    slug: 'unstructured',
    atsProvider: 'ashby',
    category: 'AI Developer Tools & Infra',
    careersUrl: 'https://jobs.ashbyhq.com/unstructured',
    enabled: true
  },
  {
    id: 'exa',
    name: 'Exa (Metaphor)',
    slug: 'exa',
    atsProvider: 'ashby',
    category: 'AI Developer Tools & Infra',
    careersUrl: 'https://jobs.ashbyhq.com/exa',
    enabled: true
  },
  {
    id: 'braintrust',
    name: 'Braintrust Data',
    slug: 'braintrust',
    atsProvider: 'ashby',
    category: 'AI Developer Tools & Infra',
    careersUrl: 'https://jobs.ashbyhq.com/braintrust',
    enabled: true
  },
  {
    id: 'anyscale',
    name: 'Anyscale (Ray)',
    slug: 'anyscale',
    atsProvider: 'ashby',
    category: 'AI Developer Tools & Infra',
    careersUrl: 'https://jobs.ashbyhq.com/anyscale',
    enabled: true
  },
  {
    id: 'runpod',
    name: 'RunPod',
    slug: 'runpod',
    atsProvider: 'ashby',
    category: 'AI Developer Tools & Infra',
    careersUrl: 'https://jobs.ashbyhq.com/runpod',
    enabled: true
  },
  {
    id: 'deepgram',
    name: 'Deepgram',
    slug: 'deepgram',
    atsProvider: 'ashby',
    category: 'AI Developer Tools & Infra',
    careersUrl: 'https://jobs.ashbyhq.com/deepgram',
    enabled: true
  },
  {
    id: 'assemblyai',
    name: 'AssemblyAI',
    slug: 'assemblyai',
    atsProvider: 'greenhouse',
    category: 'AI Developer Tools & Infra',
    careersUrl: 'https://boards.greenhouse.io/assemblyai',
    enabled: true
  },

  // ==========================================
  // GENERATIVE MEDIA & CREATIVE AI
  // ==========================================
  {
    id: 'runway',
    name: 'Runway',
    slug: 'runway',
    atsProvider: 'ashby',
    category: 'Generative Media & Creative AI',
    careersUrl: 'https://jobs.ashbyhq.com/runway',
    enabled: true
  },
  {
    id: 'pika',
    name: 'Pika',
    slug: 'pika',
    atsProvider: 'ashby',
    category: 'Generative Media & Creative AI',
    careersUrl: 'https://jobs.ashbyhq.com/pika',
    enabled: true
  },
  {
    id: 'suno',
    name: 'Suno',
    slug: 'suno',
    atsProvider: 'ashby',
    category: 'Generative Media & Creative AI',
    careersUrl: 'https://jobs.ashbyhq.com/suno',
    enabled: true
  },
  {
    id: 'udio',
    name: 'Udio',
    slug: 'udio',
    atsProvider: 'greenhouse',
    category: 'Generative Media & Creative AI',
    careersUrl: 'https://boards.greenhouse.io/udio',
    enabled: true
  },
  {
    id: 'heygen',
    name: 'HeyGen',
    slug: 'heygen',
    atsProvider: 'greenhouse',
    category: 'Generative Media & Creative AI',
    careersUrl: 'https://boards.greenhouse.io/heygen',
    enabled: true
  },
  {
    id: 'synthesia',
    name: 'Synthesia',
    slug: 'synthesia',
    atsProvider: 'ashby',
    category: 'Generative Media & Creative AI',
    careersUrl: 'https://jobs.ashbyhq.com/synthesia',
    enabled: true
  },
  {
    id: 'tavus',
    name: 'Tavus',
    slug: 'tavus',
    atsProvider: 'ashby',
    category: 'Generative Media & Creative AI',
    isYC: true,
    careersUrl: 'https://jobs.ashbyhq.com/tavus',
    enabled: true
  },
  {
    id: 'krea',
    name: 'Krea AI',
    slug: 'krea',
    atsProvider: 'ashby',
    category: 'Generative Media & Creative AI',
    isA16z: true,
    careersUrl: 'https://jobs.ashbyhq.com/krea',
    enabled: true
  },
  {
    id: 'worldlabs',
    name: 'World Labs',
    slug: 'worldlabs',
    atsProvider: 'ashby',
    category: 'Generative Media & Creative AI',
    isA16z: true,
    careersUrl: 'https://jobs.ashbyhq.com/worldlabs',
    enabled: true
  },
  {
    id: 'blackforestlabs',
    name: 'Black Forest Labs (FLUX)',
    slug: 'blackforestlabs',
    atsProvider: 'ashby',
    category: 'Generative Media & Creative AI',
    isA16z: true,
    careersUrl: 'https://jobs.ashbyhq.com/blackforestlabs',
    enabled: true
  },
  {
    id: 'photoroom',
    name: 'Photoroom',
    slug: 'photoroom',
    atsProvider: 'ashby',
    category: 'Generative Media & Creative AI',
    careersUrl: 'https://jobs.ashbyhq.com/photoroom',
    enabled: true
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    slug: 'midjourney',
    atsProvider: 'ashby',
    category: 'Generative Media & Creative AI',
    careersUrl: 'https://jobs.ashbyhq.com/midjourney',
    enabled: true
  },

  // ==========================================
  // AI CODING & AUTONOMOUS AGENTS
  // ==========================================
  {
    id: 'sierra',
    name: 'Sierra',
    slug: 'sierra',
    atsProvider: 'ashby',
    category: 'AI Coding & Autonomous Agents',
    careersUrl: 'https://jobs.ashbyhq.com/sierra',
    enabled: true
  },
  {
    id: 'poolside',
    name: 'Poolside AI',
    slug: 'poolside',
    atsProvider: 'ashby',
    category: 'AI Coding & Autonomous Agents',
    careersUrl: 'https://jobs.ashbyhq.com/poolside',
    enabled: true
  },
  {
    id: 'magic-dev',
    name: 'Magic AI',
    slug: 'magic.dev',
    atsProvider: 'ashby',
    category: 'AI Coding & Autonomous Agents',
    careersUrl: 'https://jobs.ashbyhq.com/magic.dev',
    enabled: true
  },
  {
    id: 'factory',
    name: 'Factory AI',
    slug: 'factory',
    atsProvider: 'ashby',
    category: 'AI Coding & Autonomous Agents',
    careersUrl: 'https://jobs.ashbyhq.com/factory',
    enabled: true
  },
  {
    id: 'replit',
    name: 'Replit',
    slug: 'replit',
    atsProvider: 'ashby',
    category: 'AI Coding & Autonomous Agents',
    careersUrl: 'https://jobs.ashbyhq.com/replit',
    enabled: true
  },
  {
    id: 'warp',
    name: 'Warp',
    slug: 'warp',
    atsProvider: 'ashby',
    category: 'AI Coding & Autonomous Agents',
    careersUrl: 'https://jobs.ashbyhq.com/warp',
    enabled: true
  },
  {
    id: 'lovable',
    name: 'Lovable',
    slug: 'lovable',
    atsProvider: 'ashby',
    category: 'AI Coding & Autonomous Agents',
    careersUrl: 'https://jobs.ashbyhq.com/lovable',
    enabled: true
  },
  {
    id: 'notion',
    name: 'Notion (AI)',
    slug: 'notion',
    atsProvider: 'ashby',
    category: 'AI Coding & Autonomous Agents',
    careersUrl: 'https://jobs.ashbyhq.com/notion',
    enabled: true
  },
  {
    id: 'fal',
    name: 'Fal.ai',
    slug: 'fal',
    atsProvider: 'ashby',
    category: 'AI Coding & Autonomous Agents',
    isYC: true,
    careersUrl: 'https://jobs.ashbyhq.com/fal',
    enabled: true
  },

  // ==========================================
  // ENTERPRISE AI & VERTICAL AI
  // ==========================================
  {
    id: 'scaleai',
    name: 'Scale AI',
    slug: 'scaleai',
    atsProvider: 'greenhouse',
    category: 'Enterprise AI & Vertical AI',
    careersUrl: 'https://boards.greenhouse.io/scaleai',
    enabled: true
  },
  {
    id: 'glean',
    name: 'Glean',
    slug: 'gleanwork',
    atsProvider: 'greenhouse',
    category: 'Enterprise AI & Vertical AI',
    careersUrl: 'https://boards.greenhouse.io/gleanwork',
    enabled: true
  },
  {
    id: 'harvey',
    name: 'Harvey',
    slug: 'harvey',
    atsProvider: 'ashby',
    category: 'Enterprise AI & Vertical AI',
    careersUrl: 'https://jobs.ashbyhq.com/harvey',
    enabled: true
  },
  {
    id: 'databricks',
    name: 'Databricks (Mosaic AI)',
    slug: 'databricks',
    atsProvider: 'greenhouse',
    category: 'Enterprise AI & Vertical AI',
    careersUrl: 'https://boards.greenhouse.io/databricks',
    enabled: true
  },
  {
    id: 'ambiencehealthcare',
    name: 'Ambience Healthcare',
    slug: 'ambiencehealthcare',
    atsProvider: 'ashby',
    category: 'Enterprise AI & Vertical AI',
    careersUrl: 'https://jobs.ashbyhq.com/ambiencehealthcare',
    enabled: true
  },
  {
    id: 'writer',
    name: 'Writer',
    slug: 'writer',
    atsProvider: 'ashby',
    category: 'Enterprise AI & Vertical AI',
    careersUrl: 'https://jobs.ashbyhq.com/writer',
    enabled: true
  },
  {
    id: 'abridge',
    name: 'Abridge',
    slug: 'abridge',
    atsProvider: 'ashby',
    category: 'Enterprise AI & Vertical AI',
    careersUrl: 'https://jobs.ashbyhq.com/abridge',
    enabled: true
  },
  {
    id: 'cresta',
    name: 'Cresta',
    slug: 'cresta',
    atsProvider: 'greenhouse',
    category: 'Enterprise AI & Vertical AI',
    careersUrl: 'https://boards.greenhouse.io/cresta',
    enabled: true
  },
  {
    id: 'deepl',
    name: 'DeepL',
    slug: 'deepl',
    atsProvider: 'ashby',
    category: 'Enterprise AI & Vertical AI',
    careersUrl: 'https://jobs.ashbyhq.com/deepl',
    enabled: true
  },
  {
    id: 'scribe',
    name: 'Scribe',
    slug: 'scribe',
    atsProvider: 'ashby',
    category: 'Enterprise AI & Vertical AI',
    careersUrl: 'https://jobs.ashbyhq.com/scribe',
    enabled: true
  },
  {
    id: 'snorkelai',
    name: 'Snorkel AI',
    slug: 'snorkelai',
    atsProvider: 'greenhouse',
    category: 'Enterprise AI & Vertical AI',
    careersUrl: 'https://boards.greenhouse.io/snorkelai',
    enabled: true
  },
  {
    id: 'stabilityai',
    name: 'Stability AI',
    slug: 'stabilityai',
    atsProvider: 'greenhouse',
    category: 'Enterprise AI & Vertical AI',
    careersUrl: 'https://boards.greenhouse.io/stabilityai',
    enabled: true
  },
  {
    id: 'arizeai',
    name: 'Arize AI',
    slug: 'arizeai',
    atsProvider: 'greenhouse',
    category: 'Enterprise AI & Vertical AI',
    careersUrl: 'https://boards.greenhouse.io/arizeai',
    enabled: true
  },
  {
    id: 'helsing',
    name: 'Helsing',
    slug: 'helsing',
    atsProvider: 'greenhouse',
    category: 'Enterprise AI & Vertical AI',
    careersUrl: 'https://boards.greenhouse.io/helsing',
    enabled: true
  },
  {
    id: 'anduril',
    name: 'Anduril Industries',
    slug: 'andurilindustries',
    atsProvider: 'greenhouse',
    category: 'Enterprise AI & Vertical AI',
    careersUrl: 'https://boards.greenhouse.io/andurilindustries',
    enabled: true
  },
  {
    id: 'norm-ai',
    name: 'Norm AI',
    slug: 'norm-ai',
    atsProvider: 'ashby',
    category: 'Enterprise AI & Vertical AI',
    careersUrl: 'https://jobs.ashbyhq.com/norm-ai',
    enabled: true
  },
  {
    id: 'clickhouse',
    name: 'ClickHouse',
    slug: 'clickhouse',
    atsProvider: 'ashby',
    category: 'Enterprise AI & Vertical AI',
    careersUrl: 'https://jobs.ashbyhq.com/clickhouse',
    enabled: true
  },
  {
    id: 'nabla',
    name: 'Nabla',
    slug: 'nabla',
    atsProvider: 'ashby',
    category: 'Enterprise AI & Vertical AI',
    careersUrl: 'https://jobs.ashbyhq.com/nabla',
    enabled: true
  },

  // ==========================================
  // AI HARDWARE & CLOUD COMPUTE
  // ==========================================
  {
    id: 'cerebras',
    name: 'Cerebras Systems',
    slug: 'cerebras',
    atsProvider: 'ashby',
    category: 'AI Hardware & Cloud Compute',
    careersUrl: 'https://jobs.ashbyhq.com/cerebras',
    enabled: true
  },
  {
    id: 'crusoe',
    name: 'Crusoe Energy',
    slug: 'crusoe',
    atsProvider: 'ashby',
    category: 'AI Hardware & Cloud Compute',
    careersUrl: 'https://jobs.ashbyhq.com/crusoe',
    enabled: true
  },
  {
    id: 'd-matrix',
    name: 'd-Matrix',
    slug: 'd-matrix',
    atsProvider: 'ashby',
    category: 'AI Hardware & Cloud Compute',
    careersUrl: 'https://jobs.ashbyhq.com/d-matrix',
    enabled: true
  },
  {
    id: 'coreweave',
    name: 'CoreWeave',
    slug: 'coreweave',
    atsProvider: 'greenhouse',
    category: 'AI Hardware & Cloud Compute',
    isA16z: true,
    careersUrl: 'https://boards.greenhouse.io/coreweave',
    enabled: true
  },
  {
    id: 'insitro',
    name: 'insitro (AI Biology)',
    slug: 'insitro',
    atsProvider: 'ashby',
    category: 'AI Hardware & Cloud Compute',
    careersUrl: 'https://jobs.ashbyhq.com/insitro',
    enabled: true
  },
  {
    id: 'tenstorrent',
    name: 'Tenstorrent',
    slug: 'tenstorrent',
    atsProvider: 'greenhouse',
    category: 'AI Hardware & Cloud Compute',
    careersUrl: 'https://boards.greenhouse.io/tenstorrent',
    enabled: true
  },
  {
    id: 'nebius',
    name: 'Nebius',
    slug: 'nebius',
    atsProvider: 'greenhouse',
    category: 'AI Hardware & Cloud Compute',
    careersUrl: 'https://boards.greenhouse.io/nebius',
    enabled: true
  },
  {
    id: 'etched',
    name: 'Etched.ai',
    slug: 'etched',
    atsProvider: 'ashby',
    category: 'AI Hardware & Cloud Compute',
    careersUrl: 'https://jobs.ashbyhq.com/etched',
    enabled: true
  },
  {
    id: 'matx',
    name: 'MatX',
    slug: 'MatX',
    atsProvider: 'ashby',
    category: 'AI Hardware & Cloud Compute',
    careersUrl: 'https://jobs.ashbyhq.com/MatX',
    enabled: true
  },

  // ==========================================
  // ROBOTICS & PHYSICAL AI
  // ==========================================
  {
    id: 'figure',
    name: 'Figure AI',
    slug: 'figure',
    atsProvider: 'greenhouse',
    category: 'Robotics & Physical AI',
    careersUrl: 'https://boards.greenhouse.io/figure',
    enabled: true
  },
  {
    id: 'applied',
    name: 'Applied Intuition',
    slug: 'applied',
    atsProvider: 'ashby',
    category: 'Robotics & Physical AI',
    isA16z: true,
    careersUrl: 'https://jobs.ashbyhq.com/applied',
    enabled: true
  },
  {
    id: 'skydio',
    name: 'Skydio',
    slug: 'skydio',
    atsProvider: 'ashby',
    category: 'Robotics & Physical AI',
    careersUrl: 'https://jobs.ashbyhq.com/skydio',
    enabled: true
  },
  {
    id: 'linear',
    name: 'Linear',
    slug: 'linear',
    atsProvider: 'ashby',
    category: 'Robotics & Physical AI',
    careersUrl: 'https://jobs.ashbyhq.com/linear',
    enabled: true
  },
  {
    id: 'apptronik',
    name: 'Apptronik',
    slug: 'apptronik',
    atsProvider: 'greenhouse',
    category: 'Robotics & Physical AI',
    careersUrl: 'https://boards.greenhouse.io/apptronik',
    enabled: true
  },
  {
    id: 'cobot',
    name: 'Collaborative Robotics (Cobot)',
    slug: 'cobot',
    atsProvider: 'ashby',
    category: 'Robotics & Physical AI',
    careersUrl: 'https://jobs.ashbyhq.com/cobot',
    enabled: true
  },
  {
    id: 'figma',
    name: 'Figma',
    slug: 'figma',
    atsProvider: 'greenhouse',
    category: 'Robotics & Physical AI',
    careersUrl: 'https://boards.greenhouse.io/figma',
    enabled: true
  },
  {
    id: 'kodiak',
    name: 'Kodiak Robotics',
    slug: 'kodiak',
    atsProvider: 'greenhouse',
    category: 'Robotics & Physical AI',
    careersUrl: 'https://boards.greenhouse.io/kodiak',
    enabled: true
  }
];
