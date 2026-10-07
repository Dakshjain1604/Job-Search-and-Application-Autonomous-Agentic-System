import * as cheerio from 'cheerio';
import { JobListing } from '@/types';
import { computeJobHash } from '@/lib/storage';

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number;
}

export async function fetchArbeitnowJobs(limit: number = 30): Promise<JobListing[]> {
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      headers: { 'User-Agent': 'Mozilla/5.0 JobScoutAI/1.0' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
      console.warn('[Arbeitnow Connector] HTTP error:', res.status);
      return [];
    }

    const json = (await res.json()) as { data?: ArbeitnowJob[] };
    const rawJobs = json.data || [];

    const jobs: JobListing[] = [];

    for (const j of rawJobs.slice(0, limit)) {
      const cleanDesc = j.description ? cheerio.load(j.description).text().slice(0, 1000) : `${j.title} at ${j.company_name}`;
      const jobId = computeJobHash(j.company_name, j.title, j.url);

      jobs.push({
        id: jobId,
        title: j.title,
        company: j.company_name,
        location: j.location || (j.remote ? 'Remote' : 'Various'),
        remote: Boolean(j.remote),
        url: j.url,
        source: 'arbeitnow',
        salary: null,
        tags: j.tags && j.tags.length > 0 ? j.tags.slice(0, 6) : ['Tech', 'Engineering'],
        description: cleanDesc,
        matchScore: 0,
        fitLevel: 'POTENTIAL',
        matchPros: [],
        matchCons: [],
        tailoredPitch: '',
        status: 'NEW',
        discoveredAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return jobs;
  } catch (err) {
    console.error('[Arbeitnow Connector] Error fetching jobs:', err);
    return [];
  }
}
