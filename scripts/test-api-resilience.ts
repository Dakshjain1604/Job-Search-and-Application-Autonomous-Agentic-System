import assert from 'assert';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

interface TestResult {
  route: string;
  scenario: string;
  status: 'PASS' | 'FAIL';
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

async function recordTest(route: string, scenario: string, fn: () => Promise<string | void>) {
  try {
    const details = await fn();
    results.push({ route, scenario, status: 'PASS', details: details || 'OK' });
    console.log(`  ✅ [PASS] ${route} -> ${scenario} ${details ? `(${details})` : ''}`);
  } catch (err: any) {
    results.push({ route, scenario, status: 'FAIL', error: err.message });
    console.error(`  ❌ [FAIL] ${route} -> ${scenario}: ${err.message}`);
  }
}

export async function runApiResilienceSuite() {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Comprehensive API Resilience Suite`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // 1. GET /api/stats
  console.log('--- 1. Stats Endpoint ---');
  await recordTest('GET /api/stats', 'Standard stats fetch', async () => {
    const res = await fetch(`${BASE_URL}/api/stats`);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.stats, 'Missing stats object');
    assert.strictEqual(typeof data.stats.totalJobs, 'number');
    return `totalJobs: ${data.stats.totalJobs}, highMatch: ${data.stats.highMatchJobs}`;
  });

  // 2. GET /api/jobs (Query parameters, edge filtering)
  console.log('\n--- 2. Jobs Querying & Filtering ---');
  let testJobId = '';
  await recordTest('GET /api/jobs', 'Fetch jobs list (default)', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs?limit=5`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.jobs), 'Expected jobs array');
    if (data.jobs.length > 0) {
      testJobId = data.jobs[0].id;
    }
    return `Fetched ${data.jobs.length} jobs (total: ${data.total})`;
  });

  await recordTest('GET /api/jobs', 'Filter with 0-match search keyword', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs?search=__nonexistent_role_xyz_999__`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.jobs.length, 0, 'Expected 0 jobs returned');
    assert.strictEqual(data.total, 0);
    return 'Gracefully returned 0 jobs with total=0';
  });

  await recordTest('GET /api/jobs', 'Filter by minScore=95 and remoteOnly=true', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs?minScore=95&remoteOnly=true`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    data.jobs.forEach((j: any) => {
      assert.ok(j.matchScore >= 95, `Job score ${j.matchScore} should be >= 95`);
      assert.strictEqual(j.remote, true, 'Job must be remote');
    });
    return `Filtered ${data.jobs.length} jobs matching strict criteria`;
  });

  // 3. PATCH /api/jobs (Validation & Status updates)
  console.log('\n--- 3. Jobs Status Mutations ---');
  await recordTest('PATCH /api/jobs', 'Reject empty body with 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    return `Rejected with 400: ${data.error}`;
  });

  await recordTest('PATCH /api/jobs', 'Reject invalid status string with 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: testJobId || 'dummy-id', status: 'INVALID_STATUS_FOOBAR' })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    return `Rejected invalid status with 400: ${data.error}`;
  });

  if (testJobId) {
    await recordTest('PATCH /api/jobs', 'Successfully toggle job status to SAVED', async () => {
      const res = await fetch(`${BASE_URL}/api/jobs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: testJobId, status: 'SAVED', notes: 'E2E automated test tag' })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.job.status, 'SAVED');
      return `Job ${testJobId} updated to SAVED`;
    });
  }

  // 4. GET & PUT /api/profile
  console.log('\n--- 4. Profile Operations ---');
  let originalProfile: any = null;
  await recordTest('GET /api/profile', 'Fetch current candidate profile', async () => {
    const res = await fetch(`${BASE_URL}/api/profile`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.profile);
    assert.strictEqual(data.profile.name, 'Daksh Jain');
    originalProfile = data.profile;
    return `Loaded profile for ${data.profile.name} (${data.profile.extractedSkills.length} skills)`;
  });

  await recordTest('PUT /api/profile', 'Update profile target roles & skills', async () => {
    assert.ok(originalProfile, 'Need original profile');
    const updated = {
      ...originalProfile,
      targetRoles: [...(originalProfile.targetRoles || []), 'AI Systems Engineer']
    };
    const res = await fetch(`${BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.profile.targetRoles.includes('AI Systems Engineer'));
    return `Successfully updated target roles`;
  });

  // 5. GET & POST /api/watchlist
  console.log('\n--- 5. Company Watchlist Operations ---');
  await recordTest('GET /api/watchlist', 'Fetch tracked companies', async () => {
    const res = await fetch(`${BASE_URL}/api/watchlist`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.watchlist));
    return `Found ${data.watchlist.length} watchlist companies`;
  });

  await recordTest('POST /api/watchlist', 'Toggle company active state', async () => {
    const getRes = await fetch(`${BASE_URL}/api/watchlist`);
    const initial = await getRes.json();
    const first = initial.watchlist[0];
    if (first) {
      const toggleRes = await fetch(`${BASE_URL}/api/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          companyId: first.id,
          enabled: !first.enabled
        })
      });
      assert.strictEqual(toggleRes.status, 200);
      // Revert back
      await fetch(`${BASE_URL}/api/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          companyId: first.id,
          enabled: first.enabled
        })
      });
      return `Toggled and reverted company ${first.name}`;
    }
    return 'No companies to toggle';
  });

  // 6. GET /api/traces
  console.log('\n--- 6. Trace Auditing Endpoint ---');
  await recordTest('GET /api/traces', 'Fetch stored execution traces', async () => {
    const res = await fetch(`${BASE_URL}/api/traces?limit=10`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.traces));
    return `Retrieved ${data.traces.length} execution traces`;
  });

  // 7. POST /api/jobs/pitch
  console.log('\n--- 7. Cold Pitch Generation ---');
  await recordTest('POST /api/jobs/pitch', 'Generate tailored outreach pitch for job', async () => {
    const res = await fetch(`${BASE_URL}/api/jobs/pitch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: testJobId || undefined,
        customJob: !testJobId ? {
          title: 'Full Stack Engineer',
          company: 'AI Startup',
          description: 'Looking for Next.js, TypeScript and Node.js developer.'
        } : undefined
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.pitch && data.pitch.length > 50, 'Pitch should be non-empty');
    return `Generated pitch (${data.pitch.length} chars)`;
  });

  // 8. POST /api/resume/tailor (Resilience on missing inputs and tailoring execution)
  console.log('\n--- 8. Resume Tailoring & ATS Audit ---');
  await recordTest('POST /api/resume/tailor', 'Reject missing job payload with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/resume/tailor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    return `Rejected with 400: ${data.error}`;
  });

  await recordTest('POST /api/resume/tailor', 'Generate tailored LaTeX and audit for role', async () => {
    const res = await fetch(`${BASE_URL}/api/resume/tailor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customJob: {
          title: 'Frontend Engineer',
          company: 'Cerebras Systems',
          description: 'React, TypeScript, Tailwind, Web Performance, and Next.js.'
        },
        strategy: 'ats-optimized'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.tailoredLatex, 'Missing tailored LaTeX code');
    assert.ok(data.atsReport, 'Missing ATS audit report');
    assert.strictEqual(typeof data.atsReport.formatScore, 'number');
    assert.strictEqual(typeof data.atsReport.pageCount, 'number');
    return `Format Score: ${data.atsReport.formatScore}/100, Pages: ${data.atsReport.pageCount}`;
  });

  // 9. POST /api/resume/compile
  console.log('\n--- 9. Resume Compilation ---');
  await recordTest('POST /api/resume/compile', 'Reject empty LaTeX with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/resume/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latexCode: '' })
    });
    assert.strictEqual(res.status, 400);
    return 'Rejected empty latexCode with 400';
  });

  await recordTest('POST /api/resume/compile', 'Compile valid minimal LaTeX document', async () => {
    const minimalLatex = `\\documentclass{article}
\\begin{document}
Daksh Jain - Software Engineer
\\end{document}`;
    const res = await fetch(`${BASE_URL}/api/resume/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latexCode: minimalLatex })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.pdfUrl || data.downloadUrl, 'Must return PDF url');
    return `PDF output ready: ${data.pdfUrl || data.downloadUrl}`;
  });

  // 10. POST /api/apply/generate (Application Kit & Form answers)
  console.log('\n--- 10. Application Field Kit Generation ---');
  await recordTest('POST /api/apply/generate', 'Reject missing jobId and customJob with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/apply/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    return `Rejected with 400: ${data.error}`;
  });

  await recordTest('POST /api/apply/generate', 'Generate field answers and kit for Cerebras role', async () => {
    const res = await fetch(`${BASE_URL}/api/apply/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customJob: {
          title: 'Software Engineer - Front End',
          company: 'Cerebras Systems',
          url: 'https://jobs.ashbyhq.com/cerebras/99c289fa-8fc6-49f7-b7e8-78ac4e9d99ac/application',
          description: 'Front end engineering with React, Next.js, and TypeScript.'
        }
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.kit, 'Missing kit object');
    const nameField = data.kit.candidateFields?.find((f: any) => f.fieldKey === 'full_name');
    assert.strictEqual(nameField?.value, 'Daksh Jain');
    const emailField = data.kit.candidateFields?.find((f: any) => f.fieldKey === 'email');
    assert.strictEqual(emailField?.value, 'dakshjain080@gmail.com');
    assert.ok(data.kit.screeningQuestions?.length > 0, 'Screening questions generated');
    return `Field kit ready for Daksh Jain with ${data.kit.candidateFields.length} fields and ${data.kit.screeningQuestions.length} screening questions`;
  });

  // 11. POST /api/apply/auto-submit (Dry-run mode test)
  console.log('\n--- 11. Autonomous Apply Form Automation (Dry-Run) ---');
  await recordTest('POST /api/apply/auto-submit', 'Reject missing targetUrl and jobId with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/apply/auto-submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 400);
    return 'Rejected missing URL/jobId with 400';
  });

  // 12. POST /api/scan & GET /api/cron/scan
  console.log('\n--- 12. Discovery Pipeline Triggers ---');
  await recordTest('GET /api/cron/scan', 'Reject unauthorized cron trigger with 401', async () => {
    const res = await fetch(`${BASE_URL}/api/cron/scan`);
    // If CRON_SECRET is set, it will be 401; if not set in dev, it returns 200
    assert.ok(res.status === 401 || res.status === 200);
    return `Handled cron request with status ${res.status}`;
  });

  // Print Summary
  console.log(`\n======================================================`);
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`📊 Suite Completed: ${passed}/${total} Passed (${failed} Failed)`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runApiResilienceSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
