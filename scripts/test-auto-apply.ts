import http from 'http';
import fs from 'fs';
import path from 'path';
import { getOrCompileResumePdfForJob } from '../src/lib/apply/resume-helper';
import { runAutonomousApplication, getChromeExecutablePath } from '../src/lib/apply/browser-agent';
import { JobListing } from '../src/types';

async function runAutoApplyTests() {
  console.log('\n====================================================');
  console.log('  TESTING 1-CLICK AUTONOMOUS APPLICATION ENGINE');
  console.log('====================================================\n');

  // Test 1: Chrome Executable Discovery
  console.log('▶ Test 1: Chrome Binary Discovery');
  const chromePath = getChromeExecutablePath();
  if (!fs.existsSync(chromePath)) {
    throw new Error(`Chrome path ${chromePath} does not exist.`);
  }
  console.log(`  ✓ Discovered Google Chrome executable: ${chromePath}`);

  // Test 2: Resume PDF Compilation & Attachment Verification
  console.log('\n▶ Test 2: Tailored 1-Page PDF Resume Compilation & Storage');
  const mockJob: JobListing = {
    id: 'test-auto-apply-composio',
    title: 'AI Systems Engineer (New Grad)',
    company: 'Composio AI',
    location: 'Bangalore, India',
    remote: true,
    url: 'http://localhost:8999/apply',
    source: 'ashby',
    salary: '$120k',
    tags: ['Python', 'TypeScript', 'Agents', 'MCP'],
    description: 'Building infrastructure for AI agents to call tools and integrate workflows.',
    matchScore: 98,
    fitLevel: 'STRONG_MATCH',
    matchPros: ['Direct stack match with Python and MCP.'],
    matchCons: [],
    tailoredPitch: '',
    status: 'NEW',
    isJuniorFriendly: true,
    isIndiaLocation: true,
    discoveredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const resumeInfo = await getOrCompileResumePdfForJob(mockJob);
  if (!fs.existsSync(resumeInfo.pdfPath)) {
    throw new Error(`Expected resume file at ${resumeInfo.pdfPath} does not exist.`);
  }
  const pdfStats = fs.statSync(resumeInfo.pdfPath);
  if (pdfStats.size < 5000) {
    throw new Error(`Resume PDF file size is suspiciously small: ${pdfStats.size} bytes.`);
  }
  console.log(`  ✓ Tailored PDF verified: ${path.basename(resumeInfo.pdfPath)} (${pdfStats.size} bytes, source: ${resumeInfo.source})`);

  // Test 3: Stand up mock ATS Application Server
  console.log('\n▶ Test 3: Automated Browser Agent Form-Filling & File Attachment');
  
  const mockHtml = `<!DOCTYPE html>
  <html>
  <head><title>Composio Careers - Apply</title></head>
  <body style="font-family: sans-serif; padding: 20px;">
    <h1>Apply for AI Systems Engineer at Composio</h1>
    <form id="app-form" action="/submit" method="POST" enctype="multipart/form-data">
      <div>
        <label for="name">Full Name</label>
        <input type="text" id="name" name="name" required />
      </div>
      <div>
        <label for="email">Email Address</label>
        <input type="email" id="email" name="email" required />
      </div>
      <div>
        <label for="phone">Phone Number</label>
        <input type="tel" id="phone" name="phone" />
      </div>
      <div>
        <label for="linkedin">LinkedIn Profile</label>
        <input type="text" id="linkedin" name="urls[LinkedIn]" />
      </div>
      <div>
        <label for="github">GitHub Profile</label>
        <input type="text" id="github" name="urls[GitHub]" />
      </div>
      <div>
        <label for="portfolio">Portfolio URL</label>
        <input type="text" id="portfolio" name="urls[Portfolio]" />
      </div>
      <div>
        <label for="resume">Attach Resume / CV (PDF)</label>
        <input type="file" id="resume" name="resume" accept=".pdf" required />
      </div>
      <div>
        <label for="why_us">Why do you want to work at Composio?</label>
        <textarea id="why_us" name="question_why_us" rows="4"></textarea>
      </div>
      <div>
        <label for="project">Describe your most challenging technical project</label>
        <textarea id="project" name="question_project" rows="4"></textarea>
      </div>
      <div style="margin-top: 15px;">
        <button type="submit" id="submit-btn" style="padding: 10px 20px;">Submit Application</button>
      </div>
    </form>
  </body>
  </html>`;

  const confirmationHtml = `<!DOCTYPE html>
  <html>
  <head><title>Application Received</title></head>
  <body style="font-family: sans-serif; padding: 40px; text-align: center;">
    <h1>Thank you for your application!</h1>
    <p>We have received your application for AI Systems Engineer. Our team will review your profile shortly.</p>
  </body>
  </html>`;

  const server = http.createServer((req, res) => {
    if (req.url === '/submit' && req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(confirmationHtml);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(mockHtml);
    }
  });

  await new Promise<void>((resolve) => server.listen(8999, resolve));
  console.log('  ✓ Mock ATS portal server listening on port 8999');

  try {
    // Mode A: Preview Mode (Safe 1-click snapshot review)
    console.log('\n  [A] Testing "preview" mode (headless fill + attach resume + snapshot)...');
    const previewResult = await runAutonomousApplication(mockJob, { mode: 'preview' });

    if (!previewResult.success) {
      throw new Error(`Preview mode failed: ${previewResult.error}`);
    }
    if (!previewResult.resumeAttached) {
      throw new Error('Resume file was not attached to input[type="file"].');
    }
    if (!previewResult.screenshotBase64 || previewResult.screenshotBase64.length < 5000) {
      throw new Error('Screenshot base64 was missing or too small.');
    }
    if (previewResult.filledFields.length < 4) {
      throw new Error(`Too few fields filled: ${previewResult.filledFields.length}`);
    }

    console.log(`  ✓ Preview mode success:`);
    console.log(`    - Resume Attached: ${previewResult.resumeFileName} (YES)`);
    console.log(`    - Fields Filled: ${previewResult.filledFields.length} fields (${previewResult.filledFields.map(f => f.field).join(', ')})`);
    console.log(`    - Screening Questions Solved: ${previewResult.screeningQuestionsAnswered}`);
    console.log(`    - Visual Snapshot Base64 Size: ${previewResult.screenshotBase64.length} chars`);
    console.log(`    - Execution Duration: ${previewResult.durationMs}ms`);

    // Mode B: Submit Mode (Zero-touch auto-submit + confirmation receipt)
    console.log('\n  [B] Testing "submit" mode (auto-submit + confirmation detection)...');
    const submitResult = await runAutonomousApplication(mockJob, { mode: 'submit' });

    if (!submitResult.success) {
      throw new Error(`Submit mode failed: ${submitResult.error}`);
    }
    if (!submitResult.submitted) {
      throw new Error('Form was not marked as submitted.');
    }
    if (!submitResult.confirmationMessage) {
      throw new Error('Missing confirmation message.');
    }

    console.log(`  ✓ Submit mode success:`);
    console.log(`    - Submitted: YES`);
    console.log(`    - Confirmation Message: "${submitResult.confirmationMessage}"`);
    console.log(`    - Final URL: ${submitResult.confirmationUrl}`);
    console.log(`    - Receipt Screenshot Captured: YES (${submitResult.screenshotBase64?.length} chars)`);

  } finally {
    server.close();
    console.log('\n  ✓ Mock ATS server closed.');
  }

  console.log('\n====================================================');
  console.log('  ALL 1-CLICK AUTONOMOUS APPLY TESTS PASSED CLEANLY!  ');
  console.log('====================================================\n');
}

runAutoApplyTests().catch((err) => {
  console.error('\n❌ Auto-Apply test failed:', err);
  process.exit(1);
});
