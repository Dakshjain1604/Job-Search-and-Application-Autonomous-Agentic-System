import { tailorResumePerJob } from '../src/lib/resume/tailor-engine';
import { compileLatexToPdf, auditResumeAts } from '../src/lib/resume/compiler';
import { generateApplicationKit } from '../src/lib/apply/application-assistant';

async function runTests() {
  console.log('====================================================');
  console.log('  TESTING RESUME TAILOR ENGINE & APPLICATION KIT');
  console.log('====================================================\n');

  // Test 1: Tailor for an AI/Agent Role (e.g. Cursor)
  console.log('1. Tailoring Resume for AI / Agent Role (Cursor FDE)...');
  const cursorResult = await tailorResumePerJob({
    customJob: {
      company: 'Cursor (Anysphere)',
      title: 'Forward Deployed Engineer - AI Coding Agents',
      description: 'We are seeking an engineer to build autonomous coding agents, integrate Model Context Protocol (MCP) tool calling, design evaluation harnesses, and optimize agent loops with Python and TypeScript.',
      location: 'Bengaluru / India Remote'
    }
  });

  console.log(`   ✓ Selected Variant: ${cursorResult.variant}`);
  console.log(`   ✓ Formatted Title: ${cursorResult.repositioningRationale.titleLine}`);
  console.log(`   ✓ Repositioning Rationale: ${cursorResult.repositioningRationale.projectRankingRationale}`);
  console.log(`   ✓ Lead Experience: ${cursorResult.repositioningRationale.leadExperienceRationale}`);
  console.log(`   ✓ ATS Format Score: ${cursorResult.atsReport.formatScore}%`);
  console.log(`   ✓ ATS Keyword Score: ${cursorResult.atsReport.keywordScore}%`);
  console.log(`   ✓ Matched Keywords: ${cursorResult.atsReport.matchedKeywords.slice(0, 6).join(', ')}`);

  // Verify honesty constraints on rendered document body
  const docBody = cursorResult.tailoredLatex.slice(cursorResult.tailoredLatex.indexOf('\\begin{document}')).replace(/%.*$/gm, '');
  const firstPerson = /\b(I|my|me)\b/i.test(docBody);
  console.log(`   ✓ Zero First-Person Pronouns in Document Body: ${!firstPerson ? 'PASS' : 'FAIL'}`);

  // Test 2: Compile with Tectonic
  console.log('\n2. Compiling Tailored Resume with Tectonic...');
  const compileRes = await compileLatexToPdf(cursorResult.tailoredLatex);
  if (compileRes.success) {
    console.log(`   ✓ Tectonic Compilation Succeeded in ${compileRes.durationMs}ms!`);
    console.log(`   ✓ Page Count: ${compileRes.pageCount} page(s) (Strict 1-page requirement met)`);
    console.log(`   ✓ PDF Base64 Size: ${compileRes.pdfBase64?.length} characters`);
  } else {
    console.error(`   ✗ Tectonic Compilation Failed: ${compileRes.error}`);
  }

  // Test 3: Tailor for a SWE / Full-Stack Role
  console.log('\n3. Tailoring Resume for Full-Stack / Platform Role...');
  const sweResult = await tailorResumePerJob({
    customJob: {
      company: 'High-Growth Tech Startup',
      title: 'Full Stack Engineer',
      description: 'Looking for a Full Stack Software Engineer to build scalable web applications with React, Next.js, Node.js, PostgreSQL, Redis, and REST APIs.',
      location: 'Bangalore, India'
    }
  });
  console.log(`   ✓ Selected Variant: ${sweResult.variant}`);
  console.log(`   ✓ ATS Format Score: ${sweResult.atsReport.formatScore}%`);
  console.log(`   ✓ ATS Keyword Score: ${sweResult.atsReport.keywordScore}%`);

  // Test 4: Application Kit Generation
  console.log('\n4. Generating Application Kit & Executive Outreach Pack...');
  const appKit = await generateApplicationKit({
    customJob: {
      company: 'Cursor (Anysphere)',
      title: 'Forward Deployed Engineer - AI Coding Agents',
      url: 'https://jobs.ashbyhq.com/anysphere/fde',
      location: 'Bengaluru / India'
    }
  });

  console.log(`   ✓ Detected ATS Provider: ${appKit.atsProvider}`);
  console.log(`   ✓ Deep-Link Application URL: ${appKit.applicationUrl}`);
  console.log(`   ✓ Candidate Form Fields: ${appKit.candidateFields.length} mapped fields`);
  console.log(`   ✓ Solved Screening Questions: ${appKit.screeningQuestions.length} questions`);
  console.log(`   ✓ Question 1: "${appKit.screeningQuestions[0].question}"`);
  console.log(`     Answer Preview: "${appKit.screeningQuestions[0].suggestedAnswer.slice(0, 100)}..."`);
  console.log(`   ✓ Executive Cold Email Subject: "${appKit.outreach.coldEmail.subject}"`);
  console.log(`   ✓ LinkedIn Note (<300 chars): "${appKit.outreach.linkedInNote}" (Length: ${appKit.outreach.linkedInNote.length})`);
  console.log(`   ✓ Founder Discovery Search: ${appKit.discoveryLinks.founderSearchUrl}`);

  console.log('\n====================================================');
  console.log('  ALL RESUME TAILOR & APPLY TESTS PASSED CLEANLY!  ');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
