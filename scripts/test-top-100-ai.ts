import { TOP_100_AI_COMPANIES, AICompanyProfile } from '../src/lib/data/top-ai-companies';
import { fetchCompanyATSJobs } from '../src/lib/connectors/ats-connector';
import { preFilterJobs } from '../src/lib/ai/pre-filter';
import { evaluateJobHeuristically } from '../src/lib/ai/heuristic-matcher';
import { getUserProfile, upsertJobListings, getStats, getJobListings } from '../src/lib/storage';
import { JobListing } from '../src/types';

interface CompanyResult {
  company: string;
  provider: string;
  status: 'SUCCESS' | 'ERROR';
  jobCount: number;
  durationMs: number;
  error?: string;
}

// Concurrency pool helper
async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await fn(items[currentIndex]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function runTop100AIBenchmark() {
  console.log('===============================================================');
  console.log('🚀 TOP 100 AI COMPANIES JOB PORTAL PARSING & BENCHMARK SUITE');
  console.log('===============================================================\n');

  console.log(`Loaded ${TOP_100_AI_COMPANIES.length} verified AI company portals across Ashby, Greenhouse, and Lever.`);
  console.log('Testing unauthenticated public ATS endpoints with concurrency limit = 8...\n');

  const startTime = Date.now();
  const allFoundJobs: JobListing[] = [];
  const results: CompanyResult[] = [];

  const companyResults = await mapConcurrent<AICompanyProfile, CompanyResult>(
    TOP_100_AI_COMPANIES,
    8,
    async (comp) => {
      const compStart = Date.now();
      try {
        const jobs = await fetchCompanyATSJobs(comp);
        const durationMs = Date.now() - compStart;

        if (jobs.length > 0) {
          allFoundJobs.push(...jobs);
          console.log(`  ✓ [${comp.atsProvider.toUpperCase()}] ${comp.name.padEnd(28)}: ${jobs.length} openings (${durationMs}ms)`);
          return {
            company: comp.name,
            provider: comp.atsProvider,
            status: 'SUCCESS',
            jobCount: jobs.length,
            durationMs
          };
        } else {
          console.log(`  · [${comp.atsProvider.toUpperCase()}] ${comp.name.padEnd(28)}: 0 openings (${durationMs}ms)`);
          return {
            company: comp.name,
            provider: comp.atsProvider,
            status: 'SUCCESS',
            jobCount: 0,
            durationMs
          };
        }
      } catch (err) {
        const durationMs = Date.now() - compStart;
        console.warn(`  ✕ [${comp.atsProvider.toUpperCase()}] ${comp.name.padEnd(28)}: Error (${durationMs}ms) - ${String(err)}`);
        return {
          company: comp.name,
          provider: comp.atsProvider,
          status: 'ERROR',
          jobCount: 0,
          durationMs,
          error: String(err)
        };
      }
    }
  );

  const totalTimeMs = Date.now() - startTime;
  const successfulPortals = companyResults.filter((r) => r.status === 'SUCCESS' && r.jobCount > 0);
  const totalOpenings = allFoundJobs.length;

  console.log('\n===============================================================');
  console.log('📊 PORTAL PARSING BENCHMARK RESULTS');
  console.log('===============================================================');
  console.log(`• Total Portals Scanned:       ${TOP_100_AI_COMPANIES.length}`);
  console.log(`• Active Portals with Jobs:    ${successfulPortals.length}`);
  console.log(`• Total AI Job Openings Found: ${totalOpenings}`);
  console.log(`• Total Scan Time:             ${(totalTimeMs / 1000).toFixed(2)}s`);
  console.log(`• Average Portal Latency:      ${Math.round(totalTimeMs / TOP_100_AI_COMPANIES.length)}ms/portal\n`);

  // Top 10 Portals by Openings Count
  const topHiring = [...companyResults].sort((a, b) => b.jobCount - a.jobCount).slice(0, 10);
  console.log('🔥 Top 10 AI Companies by Active Openings:');
  topHiring.forEach((item, i) => {
    console.log(`   ${(i + 1).toString().padStart(2)}. ${item.company.padEnd(26)}: ${item.jobCount} roles (${item.provider})`);
  });

  // Deduplicate found jobs
  const dedupMap = new Map<string, JobListing>();
  for (const job of allFoundJobs) {
    if (!dedupMap.has(job.id)) {
      dedupMap.set(job.id, job);
    }
  }
  const uniqueJobs = Array.from(dedupMap.values());
  console.log(`\n• Deterministic Deduplication: ${uniqueJobs.length} unique opportunities (100% duplicate free)\n`);

  // Candidate Profile Matching & Evaluation
  console.log('===============================================================');
  console.log('🧠 AI DECISION MATCHING & PRE-FILTERING FOR CANDIDATE');
  console.log('===============================================================');

  const profile = getUserProfile();
  console.log(`Candidate: ${profile.name}`);
  console.log(`Target Roles: ${profile.targetRoles.join(', ')}`);
  console.log(`Skills: ${profile.extractedSkills.join(', ')}\n`);

  // Fast pre-filter
  const prioritized = preFilterJobs(uniqueJobs, profile, 40);
  console.log(`Filtered down to top ${prioritized.length} candidate roles aligned with candidate's tech stack.\n`);

  // Evaluate candidate jobs through Decision Engine
  console.log('Evaluating top positions with Decision Engine & generating custom pitches:');
  const evaluatedJobs: JobListing[] = [];

  for (const job of prioritized) {
    const evaluation = evaluateJobHeuristically(job, profile);
    const scoredJob: JobListing = {
      ...job,
      matchScore: evaluation.matchScore,
      fitLevel: evaluation.fitLevel,
      matchPros: evaluation.matchPros,
      matchCons: evaluation.matchCons,
      tailoredPitch: evaluation.tailoredPitch,
      isJuniorFriendly: evaluation.isJuniorFriendly ?? job.isJuniorFriendly,
      isIndiaLocation: evaluation.isIndiaLocation ?? job.isIndiaLocation,
      updatedAt: new Date().toISOString()
    };
    evaluatedJobs.push(scoredJob);
  }

  // Sort descending by score
  evaluatedJobs.sort((a, b) => b.matchScore - a.matchScore);

  // Print Top 5 Matches
  console.log('\n🏆 Top 5 Matched AI Opportunities:');
  evaluatedJobs.slice(0, 5).forEach((j, i) => {
    console.log(`\n#${i + 1} [${j.matchScore}% Match] ${j.title} @ ${j.company}`);
    console.log(`   Location: ${j.location} | Remote: ${j.remote ? 'Yes' : 'No'} | ATS: ${j.source}`);
    console.log(`   Key Strengths: ${j.matchPros.slice(0, 2).join('; ')}`);
    console.log(`   Apply: ${j.url}`);
  });

  // Save the evaluated high-match jobs directly into the database
  console.log('\n===============================================================');
  console.log('💾 POPULATING DATABASE RESOURCE');
  console.log('===============================================================');

  const { added, updated } = upsertJobListings(evaluatedJobs);
  const updatedStats = getStats();

  const juniorCount = evaluatedJobs.filter((j) => j.isJuniorFriendly).length;
  const indiaCount = evaluatedJobs.filter((j) => j.isIndiaLocation).length;

  console.log(`✓ Added ${added} new high-value AI job listings into local database (.data/db.json)`);
  console.log(`✓ Updated ${updated} listings with fresh scores`);
  console.log(`✓ Total Database Jobs:       ${updatedStats.totalJobs}`);
  console.log(`✓ High-Match Roles (>=65%):  ${updatedStats.highMatchJobs}`);
  console.log(`✓ Junior / Fresher Friendly: ${juniorCount} roles`);
  console.log(`✓ India Tech Hub Roles:      ${indiaCount} roles (Bangalore, Pune, Hyderabad, Mumbai)`);
  console.log('===============================================================\n');
}

runTop100AIBenchmark().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
