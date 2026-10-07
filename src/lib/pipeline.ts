import { JobListing, ScanRun } from '@/types';
import {
  getUserProfile,
  getWatchlist,
  upsertJobListings,
  recordScanRun,
  getJobListings
} from './storage';
import { fetchHackerNewsJobs } from './connectors/hn-connector';
import { fetchRemotiveJobs } from './connectors/remotive-connector';
import { fetchArbeitnowJobs } from './connectors/arbeitnow-connector';
import { fetchCompanyATSJobs } from './connectors/ats-connector';
import { preFilterJobs } from './ai/pre-filter';
import { batchEvaluateJobs } from './ai/decision-engine';
import { recordTrace } from './tracing/logger';

export interface ScanOptions {
  sources?: ('hn' | 'remotive' | 'arbeitnow' | 'watchlist')[];
  maxEvalJobs?: number;
}

export interface ScanPipelineResult {
  scanId: string;
  totalFound: number;
  newJobsAdded: number;
  evaluatedJobs: number;
  highMatches: number;
  topJobs: JobListing[];
  durationMs: number;
}

let activeScanPromise: Promise<ScanPipelineResult> | null = null;
let isScanning = false;
let activeScanId: string | null = null;
let scanStartTime: number | null = null;

export function getScanPipelineStatus() {
  return {
    isScanning,
    activeScanId,
    durationMs: scanStartTime ? Date.now() - scanStartTime : 0
  };
}

export async function runJobDiscoveryPipeline(options?: ScanOptions): Promise<ScanPipelineResult> {
  // Concurrency Guard: If a scan is already running, safely return the existing promise
  if (activeScanPromise) {
    recordTrace({
      level: 'INFO',
      category: 'DISCOVERY',
      message: `Reusing active scan run ${activeScanId} (concurrency lock active)`
    });
    return activeScanPromise;
  }

  isScanning = true;
  scanStartTime = Date.now();
  const scanId = `scan-${scanStartTime}`;
  activeScanId = scanId;

  activeScanPromise = executePipeline(scanId, scanStartTime, options).finally(() => {
    isScanning = false;
    activeScanPromise = null;
    activeScanId = null;
    scanStartTime = null;
  });

  return activeScanPromise;
}

async function executePipeline(
  scanId: string,
  startTime: number,
  options?: ScanOptions
): Promise<ScanPipelineResult> {
  const profile = getUserProfile();
  const watchlist = getWatchlist().filter((w) => w.enabled);

  const selectedSources = options?.sources || ['hn', 'remotive', 'arbeitnow', 'watchlist'];
  const sourcesScanned: string[] = [];

  const rawJobs: JobListing[] = [];

  // Ingestion Phase (Run connectors in parallel)
  const ingestionPromises: Promise<void>[] = [];

  if (selectedSources.includes('hn')) {
    ingestionPromises.push(
      fetchHackerNewsJobs(25)
        .then((jobs) => {
          sourcesScanned.push(`Hacker News (${jobs.length})`);
          rawJobs.push(...jobs);
        })
        .catch((e) => console.error('[Pipeline] HN error:', e))
    );
  }

  if (selectedSources.includes('remotive')) {
    ingestionPromises.push(
      fetchRemotiveJobs(25)
        .then((jobs) => {
          sourcesScanned.push(`Remotive (${jobs.length})`);
          rawJobs.push(...jobs);
        })
        .catch((e) => console.error('[Pipeline] Remotive error:', e))
    );
  }

  if (selectedSources.includes('arbeitnow')) {
    ingestionPromises.push(
      fetchArbeitnowJobs(25)
        .then((jobs) => {
          sourcesScanned.push(`Arbeitnow (${jobs.length})`);
          rawJobs.push(...jobs);
        })
        .catch((e) => console.error('[Pipeline] Arbeitnow error:', e))
    );
  }

  if (selectedSources.includes('watchlist') && watchlist.length > 0) {
    for (const company of watchlist) {
      ingestionPromises.push(
        fetchCompanyATSJobs(company)
          .then((jobs) => {
            if (jobs.length > 0) {
              sourcesScanned.push(`${company.name} [${company.atsProvider}] (${jobs.length})`);
              rawJobs.push(...jobs);
            }
          })
          .catch((e) => console.error(`[Pipeline] ATS error for ${company.name}:`, e))
      );
    }
  }

  await Promise.allSettled(ingestionPromises);

  // Deduplicate against each other
  const uniqueMap = new Map<string, JobListing>();
  for (const job of rawJobs) {
    if (!uniqueMap.has(job.id)) {
      uniqueMap.set(job.id, job);
    }
  }
  const uniqueRawJobs = Array.from(uniqueMap.values());

  recordTrace({
    level: 'INFO',
    category: 'DISCOVERY',
    message: `Ingested ${uniqueRawJobs.length} active positions across ${sourcesScanned.length} sources`,
    details: { totalFound: uniqueRawJobs.length, sourcesScanned: sourcesScanned.length }
  });

  // Fast pre-filter to find the top candidates that best match the candidate's skills and roles
  const maxToEval = options?.maxEvalJobs || 15;
  const prioritizedJobs = preFilterJobs(uniqueRawJobs, profile, maxToEval);

  recordTrace({
    level: 'INFO',
    category: 'FILTER',
    message: `Filtered & ranked top ${prioritizedJobs.length} junior-friendly candidate roles (<2 YOE)`,
    details: { prioritizedCount: prioritizedJobs.length }
  });

  // Evaluate candidate jobs through Decision Engine (OpenRouter AI with Heuristic fallback)
  const evaluatedJobs = await batchEvaluateJobs(prioritizedJobs, profile, 3);

  // Upsert into persistent store
  const { added, updated } = upsertJobListings(evaluatedJobs);

  const highMatches = evaluatedJobs.filter((j) => j.matchScore >= (profile.minMatchScore || 65)).length;

  const durationMs = Date.now() - startTime;

  recordTrace({
    level: 'SUCCESS',
    category: 'DECISION',
    message: `Evaluated ${evaluatedJobs.length} matches: ${highMatches} high-fit opportunities identified (${added} newly indexed)`,
    durationMs,
    details: { highMatches, added, updated }
  });

  // Record scan history
  const scanRun: ScanRun = {
    id: scanId,
    startedAt: new Date(startTime).toISOString(),
    completedAt: new Date().toISOString(),
    sourcesScanned,
    jobsFound: uniqueRawJobs.length,
    jobsMatched: evaluatedJobs.length,
    status: 'SUCCESS'
  };
  recordScanRun(scanRun);

  // Retrieve current top jobs
  const { jobs: topJobs } = getJobListings({ limit: 10 });

  return {
    scanId,
    totalFound: uniqueRawJobs.length,
    newJobsAdded: added,
    evaluatedJobs: evaluatedJobs.length,
    highMatches,
    topJobs,
    durationMs
  };
}
