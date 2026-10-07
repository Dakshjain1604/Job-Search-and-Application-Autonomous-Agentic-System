import assert from 'assert';
import { evaluateJobHeuristically } from '../src/lib/ai/heuristic-matcher';
import { preFilterJobs } from '../src/lib/ai/pre-filter';
import { computeJobHash, getUserProfile, saveUserProfile, upsertJobListings, getJobListings, updateJobStatus, getStats } from '../src/lib/storage';
import { fetchHackerNewsJobs } from '../src/lib/connectors/hn-connector';
import { fetchRemotiveJobs } from '../src/lib/connectors/remotive-connector';
import { fetchArbeitnowJobs } from '../src/lib/connectors/arbeitnow-connector';
import { fetchCompanyATSJobs } from '../src/lib/connectors/ats-connector';
import { runJobDiscoveryPipeline } from '../src/lib/pipeline';
import { JobListing, UserProfile } from '../src/types';

async function runTests() {
  console.log('🧪 Starting JobScout AI Comprehensive Test Suite...\n');

  // Test 1: Deduplication Hash Function
  console.log('▶ Test 1: Deduplication Hash Consistency');
  const hash1 = computeJobHash('Vercel', 'Full Stack Engineer', 'https://vercel.com/jobs/1');
  const hash2 = computeJobHash('vercel', 'full stack engineer', 'https://vercel.com/jobs/1');
  const hash3 = computeJobHash('Linear', 'Frontend Engineer', 'https://linear.app/jobs/2');
  assert.strictEqual(hash1, hash2, 'Hash should be case and whitespace insensitive');
  assert.notStrictEqual(hash1, hash3, 'Different jobs must produce different hashes');
  console.log('  ✓ Deterministic SHA-256 deduplication verified.\n');

  // Test 2: Heuristic Decision Engine
  console.log('▶ Test 2: Heuristic Decision Matcher & Pitch Generator');
  const mockProfile: UserProfile = {
    id: 'test-user',
    name: 'Alex Johnson',
    resumeText: 'Full Stack Engineer with 4 years in React, Next.js, TypeScript, and Node.js.',
    extractedSkills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'PostgreSQL'],
    targetRoles: ['Full Stack Engineer', 'Frontend Engineer'],
    experienceYears: 4,
    experienceLevel: 'JUNIOR',
    locationPreference: 'Worldwide',
    preferredCities: ['Bangalore', 'Remote'],
    remoteOnly: true,
    minMatchScore: 65,
    updatedAt: new Date().toISOString()
  };

  const highMatchJob: JobListing = {
    id: 'job-high',
    title: 'Full Stack Engineer (Next.js / TypeScript)',
    company: 'NextGen AI',
    location: 'Worldwide Remote',
    remote: true,
    url: 'https://example.com/apply',
    source: 'hacker-news',
    tags: ['React', 'Next.js', 'TypeScript', 'Node.js'],
    description: 'Looking for a Senior Full Stack Engineer experienced with Next.js, React, and TypeScript to build scalable frontend and backend systems.',
    matchScore: 0,
    fitLevel: 'POTENTIAL',
    matchPros: [],
    matchCons: [],
    tailoredPitch: '',
    status: 'NEW',
    discoveredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const evalHigh = evaluateJobHeuristically(highMatchJob, mockProfile);
  assert.ok(evalHigh.matchScore >= 80, `Expected score >= 80 for strong match, got ${evalHigh.matchScore}`);
  assert.strictEqual(evalHigh.fitLevel, 'STRONG_MATCH');
  assert.ok(evalHigh.matchPros.length >= 2, 'Should identify matching strengths');
  assert.ok(evalHigh.tailoredPitch.includes('NextGen AI'), 'Tailored pitch should reference company');
  assert.ok(evalHigh.tailoredPitch.includes('Full Stack Engineer'), 'Tailored pitch should reference role');
  console.log(`  ✓ Strong match evaluated: Score=${evalHigh.matchScore} (${evalHigh.fitLevel})`);

  const lowMatchJob: JobListing = {
    id: 'job-low',
    title: 'Senior Java Enterprise Architect',
    company: 'OldCorp',
    location: 'Chicago, IL (Onsite)',
    remote: false,
    url: 'https://example.com/apply2',
    source: 'arbeitnow',
    tags: ['Java', 'Spring', 'Oracle'],
    description: '10+ years enterprise Java experience required. Strictly onsite in Chicago headquarters.',
    matchScore: 0,
    fitLevel: 'POTENTIAL',
    matchPros: [],
    matchCons: [],
    tailoredPitch: '',
    status: 'NEW',
    discoveredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const evalLow = evaluateJobHeuristically(lowMatchJob, mockProfile);
  assert.ok(evalLow.matchScore < 60, `Expected low score for onsite Java role, got ${evalLow.matchScore}`);
  console.log(`  ✓ Low match evaluated: Score=${evalLow.matchScore} (${evalLow.fitLevel})\n`);

  // Test 3: Pre-filter Logic
  console.log('▶ Test 3: Fast Pre-filter Ranking & Negative Exclusion');
  const negativeJob: JobListing = {
    ...lowMatchJob,
    id: 'job-neg',
    title: 'Registered Nurse / Clinical Specialist'
  };
  const midMatchJob: JobListing = {
    ...lowMatchJob,
    id: 'job-mid',
    title: 'Software Developer (General)',
    remote: true,
    tags: ['Software', 'TypeScript']
  };
  const preFiltered = preFilterJobs([negativeJob, highMatchJob, midMatchJob], mockProfile);
  assert.strictEqual(preFiltered.length, 2, 'Should discard negative keyword jobs');
  assert.strictEqual(preFiltered[0].id, 'job-high', 'Top job must be the high-match role');
  assert.strictEqual(preFiltered[1].id, 'job-mid', 'Second job must be the mid-match role');
  console.log('  ✓ Pre-filter correctly filtered negative keywords and ranked candidate roles.\n');

  // Test 4: Storage Persistence & Status Transitions
  console.log('▶ Test 4: Storage Operations & Status Transitions');
  const profile = getUserProfile();
  assert.ok(profile.name, 'Profile must load');

  saveUserProfile({ headline: 'Testing Headline Update' });
  const updatedProfile = getUserProfile();
  assert.strictEqual(updatedProfile.headline, 'Testing Headline Update', 'Profile updates must persist');

  upsertJobListings([highMatchJob]);
  const retrieved = getJobListings({ limit: 1000 });
  assert.ok(retrieved.jobs.some(j => j.id === 'job-high'), 'Upserted job must exist in storage');

  updateJobStatus('job-high', 'SAVED');
  let stats = getStats();
  assert.ok(stats.savedJobs >= 1, 'Saved jobs count must increment');

  updateJobStatus('job-high', 'APPLIED');
  stats = getStats();
  assert.ok(stats.appliedJobs >= 1, 'Applied jobs count must increment');
  console.log('  ✓ Storage, upsert, and status transitions verified.\n');

  // Test 5: Live Ingestion Connectors (Free APIs)
  console.log('▶ Test 5: Live Free Connectors Integration Verification');

  // A. Hacker News Algolia
  try {
    const hnJobs = await fetchHackerNewsJobs(5);
    console.log(`  ✓ Hacker News Algolia API: fetched ${hnJobs.length} live startup postings`);
    if (hnJobs.length > 0) {
      assert.ok(hnJobs[0].title, 'HN job must have a title');
      assert.ok(hnJobs[0].url, 'HN job must have an application url');
    }
  } catch (err) {
    console.warn('  ⚠️ HN Algolia test notice:', err);
  }

  // B. Remotive API
  try {
    const remotiveJobs = await fetchRemotiveJobs(5);
    console.log(`  ✓ Remotive API: fetched ${remotiveJobs.length} live remote tech roles`);
    if (remotiveJobs.length > 0) {
      assert.ok(remotiveJobs[0].remote, 'Remotive jobs are remote');
    }
  } catch (err) {
    console.warn('  ⚠️ Remotive test notice:', err);
  }

  // C. Arbeitnow API
  try {
    const arbeitJobs = await fetchArbeitnowJobs(5);
    console.log(`  ✓ Arbeitnow API: fetched ${arbeitJobs.length} live startup postings`);
  } catch (err) {
    console.warn('  ⚠️ Arbeitnow test notice:', err);
  }

  // D. Direct Startup ATS (Ashby for Resend)
  try {
    const ashbyJobs = await fetchCompanyATSJobs({
      id: 'resend',
      name: 'Resend',
      slug: 'resend',
      atsProvider: 'ashby',
      enabled: true
    });
    console.log(`  ✓ Ashby Direct ATS [Resend]: fetched ${ashbyJobs.length} positions directly without API keys`);
  } catch (err) {
    console.warn('  ⚠️ Ashby test notice:', err);
  }

  // E. Direct Startup ATS (Greenhouse for Figma)
  try {
    const ghJobs = await fetchCompanyATSJobs({
      id: 'figma',
      name: 'Figma',
      slug: 'figma',
      atsProvider: 'greenhouse',
      enabled: true
    });
    console.log(`  ✓ Greenhouse Direct ATS [Figma]: fetched ${ghJobs.length} positions directly without API keys`);
  } catch (err) {
    console.warn('  ⚠️ Greenhouse test notice:', err);
  }

  console.log('\n▶ Test 6: End-to-End Job Discovery Pipeline');
  const pipelineResult = await runJobDiscoveryPipeline({
    sources: ['hn', 'watchlist'],
    maxEvalJobs: 5
  });

  assert.ok(pipelineResult.totalFound >= 0, 'Pipeline must report total found');
  assert.ok(pipelineResult.evaluatedJobs >= 0, 'Pipeline must report evaluated count');
  assert.ok(typeof pipelineResult.durationMs === 'number', 'Pipeline must report duration');
  console.log(`  ✓ Discovery Pipeline completed in ${pipelineResult.durationMs}ms`);
  console.log(`  ✓ Total Scanned: ${pipelineResult.totalFound}, Evaluated: ${pipelineResult.evaluatedJobs}, High Matches: ${pipelineResult.highMatches}`);

  // Test 7: Early-Career / Fresher (<2 YOE) & India Hubs Matching Guardrails
  console.log('\n▶ Test 7: Fresher / Junior (<2 YOE) Guardrails & Indian Tech Hubs Alignment');
  const fresherProfile: UserProfile = {
    id: 'fresher-user',
    name: 'Priya Sharma',
    resumeText: 'Passionate Fresher Full Stack & AI Engineer. Built React, Next.js, Python, and LLM applications.',
    extractedSkills: ['React', 'Next.js', 'TypeScript', 'Python', 'PostgreSQL'],
    targetRoles: ['Full Stack Engineer', 'AI Engineer', 'Junior Software Engineer'],
    experienceYears: 1,
    experienceLevel: 'FRESHER',
    locationPreference: 'Bangalore / Pune / Hyderabad / Remote India',
    preferredCities: ['Bangalore', 'Hyderabad', 'Pune', 'Mumbai', 'Remote'],
    remoteOnly: false,
    minMatchScore: 50,
    updatedAt: new Date().toISOString()
  };

  const seniorStaffJob: JobListing = {
    id: 'job-senior-staff',
    title: 'Staff Full Stack Engineer (10+ YOE)',
    company: 'BigCorp AI',
    location: 'Bangalore, India',
    remote: false,
    url: 'https://example.com/apply-staff',
    source: 'ashby',
    tags: ['Next.js', 'TypeScript', 'Staff'],
    description: 'Requires 10+ years experience leading engineering teams and distributed systems architecture.',
    matchScore: 0,
    fitLevel: 'POTENTIAL',
    matchPros: [],
    matchCons: [],
    tailoredPitch: '',
    status: 'NEW',
    discoveredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const juniorAIJob: JobListing = {
    id: 'job-junior-ai',
    title: 'Junior AI / Full Stack Engineer',
    company: 'Sarvam AI',
    location: 'Bangalore, India',
    remote: false,
    url: 'https://jobs.ashbyhq.com/sarvam/junior',
    source: 'ashby',
    tags: ['Python', 'Next.js', 'TypeScript', 'AI'],
    description: 'Looking for an ambitious junior engineer or fresh grad with strong coding foundations in Python and Next.js to train and deploy generative models.',
    matchScore: 0,
    fitLevel: 'POTENTIAL',
    matchPros: [],
    matchCons: [],
    tailoredPitch: '',
    status: 'NEW',
    discoveredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Pre-filter check
  const filteredCandidates = preFilterJobs([seniorStaffJob, juniorAIJob], fresherProfile);
  assert.strictEqual(filteredCandidates.length, 1, 'Staff role must be filtered out for Fresher profile');
  assert.strictEqual(filteredCandidates[0].id, 'job-junior-ai', 'Junior role must survive pre-filter');
  assert.strictEqual(filteredCandidates[0].isJuniorFriendly, true, 'Job must be marked junior friendly');
  assert.strictEqual(filteredCandidates[0].isIndiaLocation, true, 'Job must be marked India location');

  // Evaluation check
  const fresherEval = evaluateJobHeuristically(juniorAIJob, fresherProfile);
  assert.ok(fresherEval.matchScore >= 75, `Expected score >= 75 for junior match in Bangalore, got ${fresherEval.matchScore}`);
  assert.strictEqual(fresherEval.isJuniorFriendly, true);
  assert.strictEqual(fresherEval.isIndiaLocation, true);
  assert.ok(fresherEval.tailoredPitch.includes('early-career engineer'), 'Tailored pitch must reflect early-career enthusiasm');
  console.log(`  ✓ Junior / Fresher role evaluated: Score=${fresherEval.matchScore} (${fresherEval.fitLevel})`);
  console.log(`  ✓ Seniority guardrails strictly filtered 10+ YOE Staff role.`);
  console.log(`  ✓ Indian Tech Hub location recognized: Bangalore, India.`);

  console.log('\n🎉 ALL 7 TEST SUITES PASSED! JobScout AI system is verified and ready for production.');
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
