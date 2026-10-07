import * as cheerio from 'cheerio';
import { JobListing, CompanyWatchlist } from '@/types';
import { computeJobHash } from '@/lib/storage';

// Ashby Public Board Job Interface
interface AshbyJob {
  id: string;
  title: string;
  department?: string;
  location?: string;
  isRemote?: boolean;
  jobUrl?: string;
  compensation?: {
    compensationTierSummary?: string;
  };
  descriptionHtml?: string;
}

// Greenhouse Public Board Job Interface
interface GreenhouseJob {
  id: number;
  title: string;
  location?: {
    name: string;
  };
  absolute_url: string;
  content?: string;
}

// Lever Public Postings Interface
interface LeverPosting {
  id: string;
  text: string;
  categories?: {
    location?: string;
    commitment?: string;
    team?: string;
  };
  hostedUrl: string;
  descriptionPlain?: string;
  salaryRange?: {
    min?: number;
    max?: number;
    currency?: string;
  };
}

export async function fetchCompanyATSJobs(company: CompanyWatchlist): Promise<JobListing[]> {
  try {
    switch (company.atsProvider) {
      case 'ashby':
        return await fetchAshbyJobs(company);
      case 'greenhouse':
        return await fetchGreenhouseJobs(company);
      case 'lever':
        return await fetchLeverJobs(company);
      default:
        return [];
    }
  } catch (err) {
    console.error(`[ATS Connector] Failed to fetch for ${company.name} (${company.atsProvider}):`, err);
    return [];
  }
}

function extractJobMetadata(
  company: CompanyWatchlist,
  title: string,
  location: string,
  desc: string
) {
  const locLower = location.toLowerCase();
  const titleLower = title.toLowerCase();
  const descLower = desc.toLowerCase();

  const isSenior = /\b(staff|principal|director|vp\b|vice\s*president|head\s*of|architect|lead\b|senior|sr\.?|team\s*lead|manager|distinguished|l4\b|l5\b|l6\b|mts\s*ii|mts\s*iii)\b/i.test(titleLower);
  const hasHighYoe = /\b([3-9]|1[0-9])\+?\s*(?:-\s*\d+)?\s*(?:years?|yrs?)(?:\s+of)?\s+experience\b/i.test(descLower);
  const isJunior = /\b(junior|jr\.?|associate|entry[\s-]level|early[\s-]career|new[\s-]grad|graduate|swe\s*i\b|software\s*engineer\s*i\b|mts\s*i\b|l1\b|intern|internship|fellow|fresher)\b/i.test(titleLower);

  const isJuniorFriendly = !isSenior && (isJunior || !hasHighYoe);

  const isIndiaLocation = Boolean(
    company.isIndiaHub ||
    /\b(bangalore|bengaluru|hyderabad|pune|mumbai|gurgaon|gurugram|noida|delhi|india|chennai|ahmedabad|kolkata)\b/i.test(locLower) ||
    /\b(bangalore|bengaluru|hyderabad|pune|mumbai|india)\b/i.test(titleLower)
  );

  const ecosystem: ('YC' | 'a16z' | 'India AI' | 'Global AI')[] = [];
  if (company.isYC) ecosystem.push('YC');
  if (company.isA16z) ecosystem.push('a16z');
  if (company.isIndiaHub || isIndiaLocation) ecosystem.push('India AI');
  if (ecosystem.length === 0) ecosystem.push('Global AI');

  return { isJuniorFriendly, isIndiaLocation, ecosystem };
}

async function fetchAshbyJobs(company: CompanyWatchlist): Promise<JobListing[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${company.slug}?includeCompensation=true`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 JobScoutAI/1.0' },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(8000)
  });

  if (!res.ok) {
    console.warn(`[Ashby] ${company.name} returned HTTP ${res.status}`);
    return [];
  }

  const data = (await res.json()) as { jobs?: AshbyJob[] };
  const ashbyJobs = data.jobs || [];

  return ashbyJobs.map((j) => {
    const jobUrl = j.jobUrl || `https://jobs.ashbyhq.com/${company.slug}/${j.id}`;
    const cleanDesc = j.descriptionHtml ? cheerio.load(j.descriptionHtml).text().slice(0, 1000) : `${j.title} at ${company.name}`;
    const isRemote = j.isRemote ?? /remote/i.test(j.location || '');
    const location = j.location || (isRemote ? 'Remote' : 'Multiple Locations');

    const meta = extractJobMetadata(company, j.title, location, cleanDesc);

    return {
      id: computeJobHash(company.name, j.title, jobUrl),
      title: j.title,
      company: company.name,
      location,
      remote: isRemote,
      url: jobUrl,
      source: 'ashby',
      salary: j.compensation?.compensationTierSummary || null,
      tags: [company.name, j.department || 'Engineering', isRemote ? 'Remote' : 'Onsite'].filter(Boolean),
      description: cleanDesc,
      matchScore: 0,
      fitLevel: 'POTENTIAL',
      matchPros: [],
      matchCons: [],
      tailoredPitch: '',
      isJuniorFriendly: meta.isJuniorFriendly,
      isIndiaLocation: meta.isIndiaLocation,
      ecosystem: meta.ecosystem,
      status: 'NEW',
      discoveredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

async function fetchGreenhouseJobs(company: CompanyWatchlist): Promise<JobListing[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs?content=true`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 JobScoutAI/1.0' },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(8000)
  });

  if (!res.ok) {
    console.warn(`[Greenhouse] ${company.name} returned HTTP ${res.status}`);
    return [];
  }

  const data = (await res.json()) as { jobs?: GreenhouseJob[] };
  const ghJobs = data.jobs || [];

  return ghJobs.map((j) => {
    const locationName = j.location?.name || 'Multiple Locations';
    const isRemote = /remote/i.test(locationName) || /remote/i.test(j.title);
    const cleanDesc = j.content ? cheerio.load(j.content).text().slice(0, 1000) : `${j.title} at ${company.name}`;
    const meta = extractJobMetadata(company, j.title, locationName, cleanDesc);

    return {
      id: computeJobHash(company.name, j.title, j.absolute_url),
      title: j.title,
      company: company.name,
      location: locationName,
      remote: isRemote,
      url: j.absolute_url,
      source: 'greenhouse',
      salary: null,
      tags: [company.name, 'Tech Startup', isRemote ? 'Remote' : 'Onsite'],
      description: cleanDesc,
      matchScore: 0,
      fitLevel: 'POTENTIAL',
      matchPros: [],
      matchCons: [],
      tailoredPitch: '',
      isJuniorFriendly: meta.isJuniorFriendly,
      isIndiaLocation: meta.isIndiaLocation,
      ecosystem: meta.ecosystem,
      status: 'NEW',
      discoveredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

async function fetchLeverJobs(company: CompanyWatchlist): Promise<JobListing[]> {
  const url = `https://api.lever.co/v0/postings/${company.slug}?mode=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 JobScoutAI/1.0' },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(8000)
  });

  if (!res.ok) {
    console.warn(`[Lever] ${company.name} returned HTTP ${res.status}`);
    return [];
  }

  const leverJobs = (await res.json()) as LeverPosting[];

  return (leverJobs || []).map((j) => {
    const loc = j.categories?.location || 'Remote';
    const isRemote = /remote/i.test(loc) || /remote/i.test(j.text);
    const cleanDesc = j.descriptionPlain ? j.descriptionPlain.slice(0, 1000) : `${j.text} at ${company.name}`;
    const meta = extractJobMetadata(company, j.text, loc, cleanDesc);

    let salary: string | null = null;
    if (j.salaryRange?.min && j.salaryRange?.max) {
      salary = `${j.salaryRange.currency || '$'}${j.salaryRange.min.toLocaleString()} - ${j.salaryRange.currency || '$'}${j.salaryRange.max.toLocaleString()}`;
    }

    return {
      id: computeJobHash(company.name, j.text, j.hostedUrl),
      title: j.text,
      company: company.name,
      location: loc,
      remote: isRemote,
      url: j.hostedUrl,
      source: 'lever',
      salary,
      tags: [company.name, j.categories?.team || 'Engineering', isRemote ? 'Remote' : 'Onsite'].filter(Boolean),
      description: cleanDesc,
      matchScore: 0,
      fitLevel: 'POTENTIAL',
      matchPros: [],
      matchCons: [],
      tailoredPitch: '',
      isJuniorFriendly: meta.isJuniorFriendly,
      isIndiaLocation: meta.isIndiaLocation,
      ecosystem: meta.ecosystem,
      status: 'NEW',
      discoveredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}
