import * as cheerio from 'cheerio';
import { JobListing } from '@/types';
import { computeJobHash } from '@/lib/storage';

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo?: string;
  category: string;
  tags: string[];
  candidate_required_location?: string;
  salary?: string;
  description: string;
  publication_date: string;
}

export async function fetchRemotiveJobs(limit: number = 30): Promise<JobListing[]> {
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=50', {
      headers: { 'User-Agent': 'Mozilla/5.0 JobScoutAI/1.0' },
      next: { revalidate: 7200 }, // Cache 2 hours to respect 2 req/min limit
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
      console.warn('[Remotive Connector] HTTP error:', res.status);
      return [];
    }

    const data = (await res.json()) as { jobs?: RemotiveJob[] };
    const rawJobs = data.jobs || [];

    const jobs: JobListing[] = [];

    for (const j of rawJobs.slice(0, limit)) {
      const cleanDesc = j.description ? cheerio.load(j.description).text().slice(0, 1000) : `${j.title} at ${j.company_name}`;
      const jobId = computeJobHash(j.company_name, j.title, j.url);

      jobs.push({
        id: jobId,
        title: j.title,
        company: j.company_name,
        companyLogo: j.company_logo,
        location: j.candidate_required_location || 'Worldwide Remote',
        remote: true,
        url: j.url,
        source: 'remotive',
        salary: j.salary || null,
        tags: j.tags && j.tags.length > 0 ? j.tags.slice(0, 6) : ['Remote', 'Software'],
        description: cleanDesc,
        matchScore: 0,
        fitLevel: 'POTENTIAL',
        matchPros: [],
        matchCons: [],
        tailoredPitch: '',
        status: 'NEW',
        discoveredAt: j.publication_date || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return jobs;
  } catch (err) {
    console.error('[Remotive Connector] Error fetching jobs:', err);
    return [];
  }
}
