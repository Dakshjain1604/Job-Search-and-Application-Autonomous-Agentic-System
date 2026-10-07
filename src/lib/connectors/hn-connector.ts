import * as cheerio from 'cheerio';
import { JobListing } from '@/types';
import { computeJobHash } from '@/lib/storage';

interface AlgoliaStoryHit {
  objectID: string;
  title: string;
}

interface AlgoliaCommentHit {
  objectID: string;
  comment_text: string;
  created_at: string;
  author: string;
  story_id: number;
}

export async function fetchHackerNewsJobs(limit: number = 30): Promise<JobListing[]> {
  try {
    // 1. Find the latest "Ask HN: Who is hiring?" thread
    const storyRes = await fetch(
      'https://hn.algolia.com/api/v1/search_by_date?query=hiring&tags=story,author_whoishiring&hitsPerPage=1',
      { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) }
    );

    if (!storyRes.ok) {
      console.warn('[HN Connector] Failed to fetch latest hiring thread:', storyRes.status);
      return [];
    }

    const storyData = (await storyRes.json()) as { hits: AlgoliaStoryHit[] };
    if (!storyData.hits || storyData.hits.length === 0) {
      return [];
    }

    const latestStory = storyData.hits[0];
    const storyId = latestStory.objectID;

    // 2. Fetch top comments for this story
    const commentsRes = await fetch(
      `https://hn.algolia.com/api/v1/search_by_date?tags=comment,story_${storyId}&hitsPerPage=${Math.min(limit * 2, 60)}`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!commentsRes.ok) {
      console.warn('[HN Connector] Failed to fetch comments for story:', storyId);
      return [];
    }

    const commentsData = (await commentsRes.json()) as { hits: AlgoliaCommentHit[] };
    const hits = commentsData.hits || [];

    const jobs: JobListing[] = [];

    for (const hit of hits) {
      if (!hit.comment_text || hit.comment_text.length < 50) continue;

      const $ = cheerio.load(hit.comment_text);
      const text = $.text().trim();
      const firstLine = text.split('\n').filter(Boolean)[0] || '';

      // Most HN hiring comments start with: "Company Name | Role | Location | REMOTE / ONSITE | Salary"
      const pipeParts = firstLine.split('|').map((s) => s.trim());
      const company = pipeParts[0] || hit.author || 'Startup (via HN)';
      const role = pipeParts[1] || 'Software Engineer / Product';
      const location = pipeParts[2] || 'Remote';

      // Detect remote
      const isRemote =
        /remote/i.test(firstLine) ||
        /remote/i.test(text.slice(0, 300)) ||
        /anywhere/i.test(firstLine);

      // Detect links
      const links: string[] = [];
      $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.startsWith('http')) {
          links.push(href);
        }
      });

      const applyUrl = links[0] || `https://news.ycombinator.com/item?id=${hit.objectID}`;

      // Detect tech tags
      const commonTech = [
        'React',
        'Next.js',
        'TypeScript',
        'Node.js',
        'Python',
        'Go',
        'Rust',
        'Postgres',
        'AWS',
        'Docker',
        'Kubernetes',
        'Tailwind',
      ];
      const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const matchedTags = commonTech.filter((tech) =>
        new RegExp(`\\b${escapeRegex(tech)}\\b`, 'i').test(text)
      );

      // Extract salary if mentioned
      const salaryMatch = text.match(/\$[0-9]{2,3}(?:,[0-9]{3})*(?:\s*-\s*\$[0-9]{2,3}(?:,[0-9]{3})*)?(?:\s*(?:k|usd|per year|yr))?/i);
      const salary = salaryMatch ? salaryMatch[0] : null;

      const cleanDesc = text.length > 800 ? `${text.slice(0, 800)}...` : text;
      const jobId = computeJobHash(company, role, applyUrl);

      jobs.push({
        id: jobId,
        title: role,
        company,
        location,
        remote: isRemote,
        url: applyUrl,
        source: 'hacker-news',
        salary,
        tags: matchedTags.length > 0 ? matchedTags : ['Tech Startup'],
        description: cleanDesc,
        matchScore: 0,
        fitLevel: 'POTENTIAL',
        matchPros: [],
        matchCons: [],
        tailoredPitch: '',
        status: 'NEW',
        discoveredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      if (jobs.length >= limit) break;
    }

    return jobs;
  } catch (err) {
    console.error('[HN Connector] Error fetching HN jobs:', err);
    return [];
  }
}
