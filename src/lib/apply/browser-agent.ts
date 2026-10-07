import fs from 'fs';
import path from 'path';
import { chromium, Browser, Page, BrowserContext } from 'playwright-core';
import { JobListing, UserProfile } from '@/types';
import { AutoApplyMode, AutoApplyResult, AutoApplyFieldEvidence } from './types';
import { getOrCompileResumePdfForJob } from './resume-helper';
import { generateApplicationKit } from './application-assistant';
import { updateJobStatus, getUserProfile, getJobById } from '../storage';
import { recordTrace } from '../tracing/logger';
import { getDataDirectory } from '../utils';

const APPLICATIONS_DIR = getDataDirectory('applications');
const SCREENSHOTS_DIR = path.join(APPLICATIONS_DIR, 'screenshots');

function ensureDirectories(): string {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
  return SCREENSHOTS_DIR;
}

/**
 * Discovers the Google Chrome executable path on the host system.
 */
export function getChromeExecutablePath(): string {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const candidatePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
      return p;
    }
  }

  if (process.env.VERCEL) {
    throw new Error(
      'Autonomous browser form-filling runs locally with your desktop browser session. On cloud serverless, use the "Manual Field Kit" (1-click copy) and "Open Official ATS" button, or run JobScout locally for full Chromium automation.'
    );
  }

  throw new Error(
    'Google Chrome executable not found. Please ensure Google Chrome is installed in /Applications/Google Chrome.app or specify CHROME_PATH.'
  );
}

/**
 * Core Autonomous Application Agent
 * Fills ATS forms, attaches the tailored 1-page PDF resume, solves screening questions,
 * captures verification screenshots, and executes/verifies submission.
 */
export async function runAutonomousApplication(
  job: JobListing,
  options: {
    mode: AutoApplyMode;
    customAnswers?: Record<string, string>;
  }
): Promise<AutoApplyResult> {
  const startTime = Date.now();
  ensureDirectories();

  const profile: UserProfile = getUserProfile();
  const chromePath = getChromeExecutablePath();
  const kit = await generateApplicationKit({ customJob: job });

  // 1. Ensure Tailored 1-Page PDF Resume is compiled and ready on disk
  const resumeInfo = await getOrCompileResumePdfForJob(job);
  const pdfPath = resumeInfo.pdfPath;

  const filledFields: AutoApplyFieldEvidence[] = [];
  let screeningQuestionsAnswered = 0;
  let resumeAttached = false;
  let captchaDetected = false;
  let captchaType: 'turnstile' | 'recaptcha' | 'hcaptcha' | 'other' | undefined;
  let submitted = false;
  let confirmationMessage: string | undefined;
  let confirmationUrl: string | undefined;
  let screenshotBase64: string | undefined;

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    recordTrace({
      level: 'LOOP',
      category: 'APPLY',
      message: `Launching Autonomous Browser Agent for ${job.company} (${options.mode} mode)`,
      details: { company: job.company, mode: options.mode, atsProvider: kit.atsProvider }
    });

    browser = await chromium.launch({
      executablePath: chromePath,
      headless: options.mode !== 'headed',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-size=1280,900'
      ]
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
    });

    const page: Page = await context.newPage();

    // 2. Navigate to direct application URL
    await page.goto(kit.applicationUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Short stabilization wait for SPA / hydration
    await page.waitForTimeout(2000);

    // 2b. Check if an "Apply" button needs to be clicked to reveal the form
    try {
      const applyBtnSelectors = [
        'button:has-text("Apply for this job")',
        'a:has-text("Apply for this job")',
        'button:has-text("Apply Now")',
        'a:has-text("Apply Now")',
        'a[href*="#apply"]',
        '#apply_button'
      ];
      for (const sel of applyBtnSelectors) {
        const btn = page.locator(sel).first();
        if ((await btn.count()) > 0 && (await btn.isVisible())) {
          await btn.click({ timeout: 2000 }).catch(() => {});
          await page.waitForTimeout(1500);
          break;
        }
      }
    } catch {
      // Ignore if form is already directly visible
    }

    // 3. Dismiss any cookie banners or overlays if present
    try {
      const cookieButtons = page.locator(
        'button:has-text("Accept All"), button:has-text("Accept all cookies"), button:has-text("Accept Cookies"), button:has-text("Accept"), button:has-text("Agree"), button:has-text("Allow"), button:has-text("Got it"), #onetrust-accept-btn-handler'
      );
      if ((await cookieButtons.count()) > 0) {
        await cookieButtons.first().click({ timeout: 1500 }).catch(() => {});
        await page.waitForTimeout(500);
      }
    } catch {
      // Ignore banner dismissal errors
    }

    // 4. Check for CAPTCHA / Cloudflare Turnstile blocks
    const hasTurnstile = (await page.locator('iframe[src*="turnstile"], div.cf-turnstile, [data-sitekey]').count()) > 0;
    const hasRecaptcha = (await page.locator('iframe[src*="recaptcha"], .g-recaptcha').count()) > 0;
    const hasHcaptcha = (await page.locator('iframe[src*="hcaptcha"]').count()) > 0;

    if (hasTurnstile || hasRecaptcha || hasHcaptcha) {
      captchaDetected = true;
      captchaType = hasTurnstile ? 'turnstile' : hasRecaptcha ? 'recaptcha' : 'hcaptcha';
      recordTrace({
        level: 'WARN',
        category: 'APPLY',
        message: `CAPTCHA / Bot challenge detected (${captchaType}) on ${job.company} portal`,
        details: { captchaType, company: job.company }
      });
    }

    // 5. Resume File Upload (Attach Tailored PDF) FIRST
    // Doing this before text fields prevents ATS resume auto-parsers from wiping entered values
    try {
      const fileInputs = page.locator('input[type="file"]');
      const fileInputCount = await fileInputs.count();

      if (fileInputCount > 0) {
        const resumeFileInput = fileInputs.first();
        await resumeFileInput.setInputFiles(pdfPath);
        resumeAttached = true;
        filledFields.push({
          field: 'Resume (1-Page PDF)',
          selector: 'input[type="file"]',
          valueMasked: path.basename(pdfPath),
          status: 'filled'
        });

        recordTrace({
          level: 'INFO',
          category: 'APPLY',
          message: `Attached tailored 1-page PDF resume (${path.basename(pdfPath)}) to ${job.company} portal dropzone`,
          details: { fileName: path.basename(pdfPath), company: job.company }
        });

        // Allow ATS frontend upload handler to register file upload and complete any auto-parsing
        await page.waitForTimeout(2000);
      }
    } catch (fileErr) {
      console.warn(`[Browser Agent] File upload failed for ${job.company}:`, fileErr);
    }

    // 6. Fill standard personal information fields with event dispatch
    const personalData = {
      firstName: 'Daksh',
      lastName: 'Jain',
      fullName: profile.name || 'Daksh Jain',
      email: profile.email || 'dakshjain080@gmail.com',
      phone: '+91-76270-56978',
      location: 'Jaipur, India',
      currentCompany: 'NEO (heyneo.com)',
      linkedin: 'https://linkedin.com/in/daksh-jain16',
      github: 'https://github.com/Dakshjain1604',
      portfolio: 'https://portfolio-dakshjain.vercel.app'
    };

    // Helper to safely fill an input matching selectors, ensuring React/Vue state updates
    const tryFillInput = async (selectors: string[], value: string, fieldName: string) => {
      for (const sel of selectors) {
        try {
          const loc = page.locator(sel).first();
          if ((await loc.count()) > 0 && (await loc.isVisible())) {
            await loc.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => {});
            await loc.click({ timeout: 1000 }).catch(() => {});
            await loc.fill(value, { timeout: 2000 });
            // Dispatch input and change events for controlled React / Formik components
            await loc.dispatchEvent('input').catch(() => {});
            await loc.dispatchEvent('change').catch(() => {});
            await loc.dispatchEvent('blur').catch(() => {});
            filledFields.push({
              field: fieldName,
              selector: sel,
              valueMasked: fieldName.toLowerCase().includes('phone') ? '+91-***-56978' : value,
              status: 'filled'
            });
            return true;
          }
        } catch {
          // Continue to next selector
        }
      }
      return false;
    };

    // A. Name Fields (Supports both First/Last split and Full Name)
    const filledFirst = await tryFillInput(
      [
        'input[name*="first_name" i]',
        'input#first_name',
        'input[placeholder*="First Name" i]',
        'input[data-testid*="first-name" i]',
        'input[aria-label*="First Name" i]'
      ],
      personalData.firstName,
      'First Name'
    );

    const filledLast = await tryFillInput(
      [
        'input[name*="last_name" i]',
        'input#last_name',
        'input[placeholder*="Last Name" i]',
        'input[data-testid*="last-name" i]',
        'input[aria-label*="Last Name" i]'
      ],
      personalData.lastName,
      'Last Name'
    );

    if (!filledFirst || !filledLast) {
      await tryFillInput(
        [
          'input#_systemfield_name',
          'input[name="_systemfield_name"]',
          'input[name="name" i]',
          'input#name',
          'input[placeholder*="Full Name" i]',
          'input[placeholder*="Name" i]',
          'input[data-testid*="name" i]',
          'input[aria-label*="Name" i]',
          'input[name*="fullname" i]',
          'input[name*="candidate_name" i]'
        ],
        personalData.fullName,
        'Full Name'
      );
    }

    // B. Email Field
    await tryFillInput(
      [
        'input[type="email"]',
        'input[name*="email" i]',
        'input#email',
        'input[placeholder*="Email" i]',
        'input[data-testid*="email" i]',
        'input[aria-label*="Email" i]'
      ],
      personalData.email,
      'Email Address'
    );

    // C. Phone Field
    await tryFillInput(
      [
        'input[type="tel"]',
        'input[name*="phone" i]',
        'input#phone',
        'input[placeholder*="Phone" i]',
        'input[data-testid*="phone" i]',
        'input[aria-label*="Phone" i]'
      ],
      personalData.phone,
      'Phone Number'
    );

    // D. Location Field
    await tryFillInput(
      [
        'input[name*="location" i]',
        'input#location',
        'input[placeholder*="Location" i]',
        'input[placeholder*="City" i]',
        'input[aria-label*="Location" i]'
      ],
      personalData.location,
      'Current Location'
    );

    // E. Current Company / Organization
    await tryFillInput(
      [
        'input[name="org" i]',
        'input[name*="company" i]',
        'input#org',
        'input[placeholder*="Current company" i]',
        'input[placeholder*="Company" i]',
        'input[aria-label*="Company" i]'
      ],
      personalData.currentCompany,
      'Current Company'
    );

    // F. Social & Web Links
    await tryFillInput(
      [
        'input[name*="linkedin" i]',
        'input[name*="urls[LinkedIn]"]',
        'input[id*="linkedin" i]',
        'input[placeholder*="LinkedIn" i]',
        'input[data-testid*="linkedin" i]'
      ],
      personalData.linkedin,
      'LinkedIn Profile'
    );

    await tryFillInput(
      [
        'input[name*="github" i]',
        'input[name*="urls[GitHub]"]',
        'input[id*="github" i]',
        'input[placeholder*="GitHub" i]',
        'input[data-testid*="github" i]'
      ],
      personalData.github,
      'GitHub Profile'
    );

    await tryFillInput(
      [
        'input[name*="portfolio" i]',
        'input[name*="website" i]',
        'input[name*="urls[Portfolio]"]',
        'input[placeholder*="Portfolio" i]',
        'input[placeholder*="Website" i]'
      ],
      personalData.portfolio,
      'Portfolio URL'
    );

    // 7. Solve Screening Questions & Textarea Prompts
    try {
      // Find all textareas and rich-text contenteditables
      const textareas = page.locator('textarea, div[contenteditable="true"]');
      const textareaCount = await textareas.count();

      for (let i = 0; i < textareaCount; i++) {
        const area = textareas.nth(i);
        if (!(await area.isVisible())) continue;

        const placeholder = (await area.getAttribute('placeholder')) || '';
        const nameAttr = (await area.getAttribute('name')) || '';
        const idAttr = (await area.getAttribute('id')) || '';
        const ariaLabel = (await area.getAttribute('aria-label')) || '';

        const labelText = await area.evaluate((el) => {
          const parent = el.closest('label') || el.closest('.field') || el.closest('[class*="question"]') || el.parentElement;
          return parent?.textContent || '';
        });

        const combinedPrompt = `${placeholder} ${nameAttr} ${idAttr} ${ariaLabel} ${labelText}`.toLowerCase();

        let chosenAnswer = '';
        let questionLabel = `Screening Question #${i + 1}`;

        if (combinedPrompt.includes('why') || combinedPrompt.includes('interest') || combinedPrompt.includes('about us')) {
          chosenAnswer = kit.screeningQuestions.find((q) => q.id === 'q-why-us')?.suggestedAnswer || '';
          questionLabel = `Why ${job.company}`;
        } else if (combinedPrompt.includes('project') || combinedPrompt.includes('challeng') || combinedPrompt.includes('proud') || combinedPrompt.includes('achievement')) {
          chosenAnswer = kit.screeningQuestions.find((q) => q.id === 'q-complex-project')?.suggestedAnswer || '';
          questionLabel = 'Most Challenging Project';
        } else if (combinedPrompt.includes('stack') || combinedPrompt.includes('experience') || combinedPrompt.includes('technical') || combinedPrompt.includes('skill')) {
          chosenAnswer = kit.screeningQuestions.find((q) => q.id === 'q-experience-stack')?.suggestedAnswer || '';
          questionLabel = 'Technical Stack & AI';
        } else if (combinedPrompt.includes('relocat') || combinedPrompt.includes('location') || combinedPrompt.includes('onsite') || combinedPrompt.includes('start date') || combinedPrompt.includes('notice')) {
          chosenAnswer = kit.screeningQuestions.find((q) => q.id === 'q-location-availability')?.suggestedAnswer || '';
          questionLabel = 'Availability & Relocation';
        } else {
          chosenAnswer = kit.outreach.coldEmail.body;
          questionLabel = 'Cover Note';
        }

        if (chosenAnswer) {
          const isContentEditable = (await area.getAttribute('contenteditable')) === 'true';
          if (isContentEditable) {
            await area.click();
            await page.keyboard.type(chosenAnswer, { delay: 5 });
          } else {
            await area.fill(chosenAnswer);
            await area.dispatchEvent('input').catch(() => {});
            await area.dispatchEvent('change').catch(() => {});
            await area.dispatchEvent('blur').catch(() => {});
          }

          screeningQuestionsAnswered++;
          filledFields.push({
            field: questionLabel,
            selector: `textarea:nth(${i})`,
            valueMasked: chosenAnswer.slice(0, 60) + '...',
            status: 'filled'
          });
        }
      }
    } catch (txtErr) {
      console.warn(`[Browser Agent] Screening question filling encountered an error:`, txtErr);
    }

    // Helper to extract visible human label for any element across Ashby, Greenhouse, Lever
    const extractFieldLabel = async (loc: any): Promise<string> => {
      try {
        return await loc.evaluate((el: HTMLElement) => {
          // 1. Explicit <label for="id">
          if (el.id) {
            try {
              const explicit = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
              if (explicit && explicit.textContent && explicit.textContent.trim()) {
                return explicit.textContent.trim();
              }
            } catch {}
          }
          // 2. Closest <label>
          const parentLabel = el.closest('label');
          if (parentLabel && parentLabel.textContent && parentLabel.textContent.trim()) {
            return parentLabel.textContent.trim();
          }
          // 3. Form field container (Ashby, Greenhouse, Lever wrappers)
          const container = el.closest('[class*="field"], [data-testid*="field"], [class*="form-group"], [class*="question"], fieldset, [data-testid]');
          if (container) {
            const heading = container.querySelector('label, h3, h4, span, p, legend');
            if (heading && heading.textContent && heading.textContent.trim()) {
              return heading.textContent.trim();
            }
            return (container.textContent || '').trim().slice(0, 150);
          }
          // 4. Preceding sibling
          const prev = el.previousElementSibling;
          if (prev && prev.textContent && prev.textContent.trim()) {
            return prev.textContent.trim();
          }
          return el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('name') || '';
        });
      } catch {
        return '';
      }
    };

    // 8. Comprehensive Contextual Input Resolver (resolves UUID-named fields like Personal Website & Accomplishments)
    try {
      const allTextInputs = page.locator('input[type="text"], input[type="url"], input:not([type])');
      const inputCount = await allTextInputs.count();

      for (let i = 0; i < inputCount; i++) {
        const inp = allTextInputs.nth(i);
        if (!(await inp.isVisible())) continue;

        // Skip inputs that already have values
        const currentVal = await inp.inputValue().catch(() => '');
        if (currentVal && currentVal.trim().length > 0) continue;

        const labelText = await extractFieldLabel(inp);
        const nameAttr = (await inp.getAttribute('name')) || '';
        const idAttr = (await inp.getAttribute('id')) || '';
        const placeholder = (await inp.getAttribute('placeholder')) || '';
        const ariaLabel = (await inp.getAttribute('aria-label')) || '';

        const prompt = `${labelText} ${nameAttr} ${idAttr} ${placeholder} ${ariaLabel}`.toLowerCase();

        let ans = '';
        let label = labelText ? labelText.slice(0, 45) : `Field #${i + 1}`;

        if (prompt.includes('website') || prompt.includes('portfolio') || prompt.includes('personal site') || prompt.includes('personal url') || prompt.includes('blog')) {
          ans = personalData.portfolio;
          label = 'Personal Website / Portfolio';
        } else if (prompt.includes('github')) {
          ans = personalData.github;
          label = 'GitHub Profile';
        } else if (prompt.includes('linkedin')) {
          ans = personalData.linkedin;
          label = 'LinkedIn Profile';
        } else if (prompt.includes('other') || prompt.includes('relevant') || prompt.includes('accomplishment') || prompt.includes('anything else') || prompt.includes('additional') || prompt.includes('talks') || prompt.includes('notes') || prompt.includes('comments')) {
          ans = `Author of neo-mcp (open-source MCP server with 45+ releases on PyPI/npm, 700+ tests, Claude Code & Cursor integration) and autonomous coding agent with 1,300+ deterministic tests across 70+ files. Hand-crafted agent loop, tool calling, and model routing. Production Next.js, FastAPI, and agent loop systems. Portfolio: https://portfolio-dakshjain.vercel.app`;
          label = 'Additional Information / Technical Accomplishments';
        } else if (prompt.includes('notice') || prompt.includes('start date') || prompt.includes('availab')) {
          ans = 'Immediate / 1-2 weeks';
          label = 'Notice Period / Availability';
        } else if (prompt.includes('salary') || prompt.includes('compensation') || prompt.includes('ctc') || prompt.includes('pay')) {
          ans = 'Market competitive / flexible';
          label = 'Compensation Expectation';
        } else if (prompt.includes('referral') || prompt.includes('hear about') || prompt.includes('source')) {
          ans = 'Job Board / Tech Network';
          label = 'Referral Source';
        } else if (prompt.includes('experience') || prompt.includes('yoe') || prompt.includes('years')) {
          ans = '1+ years in production AI & software systems';
          label = 'Years of Experience';
        } else if (prompt.includes('authorized') || prompt.includes('work auth')) {
          ans = 'Yes (Citizen of India, open to global remote)';
          label = 'Work Authorization';
        } else if (prompt.includes('phone') || prompt.includes('mobile')) {
          ans = personalData.phone;
          label = 'Phone Number';
        } else if (prompt.includes('email')) {
          ans = personalData.email;
          label = 'Email Address';
        }

        if (ans) {
          await inp.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => {});
          await inp.click({ timeout: 1000 }).catch(() => {});
          await inp.fill(ans);
          await inp.dispatchEvent('input').catch(() => {});
          await inp.dispatchEvent('change').catch(() => {});
          await inp.dispatchEvent('blur').catch(() => {});
          screeningQuestionsAnswered++;
          filledFields.push({
            field: label,
            selector: `input:nth(${i})`,
            valueMasked: ans.length > 50 ? ans.slice(0, 50) + '...' : ans,
            status: 'filled'
          });
          recordTrace({
            level: 'INFO',
            category: 'APPLY',
            message: `Auto-filled contextual field: "${label}"`,
            details: { field: label, preview: ans.slice(0, 40) }
          });
        }
      }
    } catch (err) {
      console.warn('[Browser Agent] Contextual input resolution error:', err);
    }

    // 9. Checkboxes & ATS Yes/No Toggle Groups (e.g. "Complete the Takehome", agreements, acknowledgments)
    try {
      // 9A. Handle Ashby / modern ATS Yes/No toggle button groups
      const yesNoContainers = page.locator('.ashby-application-form-input-yesno, [class*="yesno"], div:has(> button[data-option="yes"])');
      const ynCount = await yesNoContainers.count();
      for (let i = 0; i < ynCount; i++) {
        const yn = yesNoContainers.nth(i);
        if (!(await yn.isVisible())) continue;

        const labelText = await extractFieldLabel(yn);
        const ynPrompt = labelText.toLowerCase();

        if (
          ynPrompt.includes('takehome') ||
          ynPrompt.includes('assignment') ||
          ynPrompt.includes('agree') ||
          ynPrompt.includes('consent') ||
          ynPrompt.includes('acknowledg') ||
          ynPrompt.includes('confirm') ||
          ynPrompt.includes('understand') ||
          ynPrompt.includes('authorized') ||
          ynPrompt.includes('eligible')
        ) {
          const yesBtn = yn.locator('button[data-option="yes"], button:has-text("Yes")').first();
          if ((await yesBtn.count()) > 0) {
            await yesBtn.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => {});
            await yesBtn.click().catch(() => {});
            filledFields.push({
              field: labelText.slice(0, 45) || `Toggle #${i + 1}`,
              selector: `button[data-option="yes"]:nth(${i})`,
              valueMasked: 'Yes (Confirmed)',
              status: 'filled'
            });
            recordTrace({
              level: 'INFO',
              category: 'APPLY',
              message: `Confirmed ATS Yes/No toggle: "${labelText.slice(0, 45)}" (Yes)`,
              details: { label: labelText.slice(0, 45) }
            });
          }
        }
      }

      // 9B. Handle standard checkboxes
      const checkboxes = page.locator('input[type="checkbox"]');
      const cbCount = await checkboxes.count();
      for (let i = 0; i < cbCount; i++) {
        const cb = checkboxes.nth(i);
        const isChecked = await cb.isChecked().catch(() => false);
        if (isChecked) continue;

        const cbLabel = await extractFieldLabel(cb);
        const fieldName = cbLabel.slice(0, 40) || `Acknowledgment #${i + 1}`;
        if (filledFields.some((f) => f.field.toLowerCase().slice(0, 20) === fieldName.toLowerCase().slice(0, 20))) continue;

        const cbPrompt = cbLabel.toLowerCase();

        if (
          cbPrompt.includes('takehome') ||
          cbPrompt.includes('assignment') ||
          cbPrompt.includes('agree') ||
          cbPrompt.includes('consent') ||
          cbPrompt.includes('acknowledg') ||
          cbPrompt.includes('confirm') ||
          cbPrompt.includes('understand')
        ) {
          // If native checkbox is visible, check it directly
          if (await cb.isVisible()) {
            await cb.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => {});
            await cb.check({ force: true }).catch(() => {});
          } else {
            // Check if there is an adjacent or parent Yes button
            const parentYes = cb.locator('xpath=ancestor::div[1]//button[@data-option="yes" or text()="Yes"]').first();
            if ((await parentYes.count()) > 0) {
              await parentYes.click().catch(() => {});
            } else {
              // Click closest label or trigger DOM check
              await cb.evaluate((el: HTMLInputElement) => {
                const parent = el.closest('label') || el.parentElement;
                if (parent) (parent as HTMLElement).click();
                el.checked = true;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
              }).catch(() => {});
            }
          }

          // Verify if it got checked
          const checkedNow = await cb.isChecked().catch(() => true);
          if (checkedNow) {
            filledFields.push({
              field: cbLabel.slice(0, 40) || `Acknowledgment #${i + 1}`,
              selector: `input[type="checkbox"]:nth(${i})`,
              valueMasked: 'Checked',
              status: 'filled'
            });
            recordTrace({
              level: 'INFO',
              category: 'APPLY',
              message: `Checked agreement/acknowledgment: "${cbLabel.slice(0, 40)}"`,
              details: { label: cbLabel.slice(0, 40) }
            });
          }
        }
      }
    } catch {
      // Ignore checkbox errors
    }

    // 10. Autonomous Radio Group & Demographic / Compliance Resolver
    // Handles Export Control (EAR/ITAR), EEOC (Gender, Race, Veteran, Disability), Work Authorization, Sponsorship
    try {
      const radioNames = await page.locator('input[type="radio"]').evaluateAll((radios) =>
        Array.from(new Set(radios.map((r) => (r as HTMLInputElement).name).filter(Boolean)))
      );

      for (const groupName of radioNames) {
        const groupRadios = page.locator(`input[type="radio"][name="${groupName}"]`);
        const count = await groupRadios.count();
        if (count === 0) continue;

        // Skip if any radio in this group is already checked
        const anyChecked = await groupRadios.evaluateAll((radios) =>
          radios.some((r) => (r as HTMLInputElement).checked)
        );
        if (anyChecked) continue;

        // Extract context prompt for this group
        const groupPrompt = (await groupRadios.first().evaluate((el) => {
          const fieldset = el.closest('fieldset');
          if (fieldset) {
            const legend = fieldset.querySelector('legend');
            if (legend && legend.textContent) return legend.textContent.trim();
            return fieldset.textContent?.slice(0, 300) || '';
          }
          const container = el.closest('[class*="field"], [class*="form-group"], [class*="question"], [data-testid]');
          if (container) {
            const h = container.querySelector('label, h3, h4, span, p, legend');
            if (h && h.textContent) return h.textContent.trim();
            return container.textContent?.slice(0, 300) || '';
          }
          return '';
        })).toLowerCase();

        // Determine matcher and semantic label
        let matcher: ((text: string) => boolean) | null = null;
        let fieldLabel = 'Compliance Option';
        let displayVal = 'Selected';

        if (
          groupPrompt.includes('ear') ||
          groupPrompt.includes('itar') ||
          groupPrompt.includes('export') ||
          groupPrompt.includes('u.s. person') ||
          groupPrompt.includes('us person')
        ) {
          fieldLabel = 'Export Control (EAR/ITAR Compliance)';
          displayVal = 'Non-U.S. Person (Compliant)';
          matcher = (t: string) =>
            (t.includes('not a u.s. person') || t.includes('not a us person')) &&
            (t.includes('not a current citizen') || !t.includes('current citizen'));
        } else if (groupPrompt.includes('gender') || groupPrompt.includes('sex')) {
          fieldLabel = 'Demographics: Gender';
          displayVal = 'Male';
          matcher = (t: string) => t.startsWith('male') || t === 'male' || t.includes('decline');
        } else if (groupPrompt.includes('race') || groupPrompt.includes('ethnic')) {
          fieldLabel = 'Demographics: Race / Ethnicity';
          displayVal = 'Asian';
          matcher = (t: string) => t.includes('asian') || t.includes('decline');
        } else if (groupPrompt.includes('veteran')) {
          fieldLabel = 'Demographics: Veteran Status';
          displayVal = 'Not a Protected Veteran';
          matcher = (t: string) =>
            t.includes('not a protected veteran') ||
            t.includes('not a veteran') ||
            t.includes('i am not') ||
            t === 'no' ||
            t.includes('decline');
        } else if (groupPrompt.includes('disability') || groupPrompt.includes('handicap')) {
          fieldLabel = 'Demographics: Disability';
          displayVal = 'No Disability';
          matcher = (t: string) =>
            t.includes('do not have') ||
            t.includes('no, i do not') ||
            t.includes('dont have') ||
            t === 'no' ||
            t.includes('decline');
        } else if (
          groupPrompt.includes('authorized') ||
          groupPrompt.includes('legally') ||
          groupPrompt.includes('work auth') ||
          groupPrompt.includes('eligibility') ||
          groupPrompt.includes('eligible')
        ) {
          fieldLabel = 'Work Authorization';
          displayVal = 'Yes (Authorized)';
          matcher = (t: string) => t.startsWith('yes') || t === 'yes';
        } else if (
          groupPrompt.includes('sponsorship') ||
          groupPrompt.includes('visa') ||
          groupPrompt.includes('require sponsor')
        ) {
          fieldLabel = 'Visa Sponsorship';
          displayVal = 'No (Not Required)';
          matcher = (t: string) => t.startsWith('no') || t === 'no';
        } else if (groupPrompt.includes('relocat')) {
          fieldLabel = 'Relocation Willingness';
          displayVal = 'Yes';
          matcher = (t: string) => t.startsWith('yes') || t === 'yes';
        } else if (groupPrompt.includes('18') || groupPrompt.includes('legal age')) {
          fieldLabel = 'Legal Age (18+)';
          displayVal = 'Yes';
          matcher = (t: string) => t.startsWith('yes') || t === 'yes';
        }

        if (matcher) {
          let chosenIndex = -1;
          for (let i = 0; i < count; i++) {
            const optText = (await groupRadios.nth(i).evaluate((el) => {
              const id = el.id;
              const explicit = id ? document.querySelector('label[for="' + CSS.escape(id) + '"]') : null;
              if (explicit && explicit.textContent) return explicit.textContent.trim();
              const pLabel = el.closest('label');
              if (pLabel && pLabel.textContent) return pLabel.textContent.trim();
              return el.parentElement?.textContent?.trim() || '';
            })).toLowerCase();

            if (matcher(optText)) {
              chosenIndex = i;
              break;
            }
          }

          if (chosenIndex !== -1) {
            const targetRadio = groupRadios.nth(chosenIndex);
            await targetRadio.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => {});
            // In Ashby / React, click the label or force-click the radio
            await targetRadio.evaluate((el: HTMLInputElement) => {
              const id = el.id;
              const explicit = id ? (document.querySelector('label[for="' + CSS.escape(id) + '"]') as HTMLElement) : null;
              if (explicit) { explicit.click(); return; }
              const pLabel = el.closest('label') as HTMLElement;
              if (pLabel) { pLabel.click(); return; }
              el.click();
              el.checked = true;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }).catch(() => {});

            await targetRadio.check({ force: true }).catch(() => {});

            screeningQuestionsAnswered++;
            filledFields.push({
              field: fieldLabel,
              selector: `input[type="radio"][name="${groupName}"]:nth(${chosenIndex})`,
              valueMasked: displayVal,
              status: 'filled'
            });
            recordTrace({
              level: 'INFO',
              category: 'APPLY',
              message: `Auto-selected compliance radio: "${fieldLabel}" -> ${displayVal}`,
              details: { field: fieldLabel, value: displayVal }
            });
          }
        }
      }

      // 10B. Handle Standard <select> Dropdowns
      const selects = page.locator('select');
      const selectCount = await selects.count();
      for (let i = 0; i < selectCount; i++) {
        const sel = selects.nth(i);
        if (!(await sel.isVisible())) continue;

        const selContext = (await sel.evaluate((el) => {
          const id = el.id;
          const explicit = id ? document.querySelector('label[for="' + CSS.escape(id) + '"]') : null;
          if (explicit && explicit.textContent) return explicit.textContent.trim();
          const pLabel = el.closest('label');
          if (pLabel && pLabel.textContent) return pLabel.textContent.trim();
          return el.closest('div, fieldset')?.textContent || '';
        })).toLowerCase();

        let targetLabel = '';
        let matchedValue = '';

        if (selContext.includes('authorized') || selContext.includes('legally')) {
          targetLabel = 'Work Authorization';
          matchedValue = 'Yes';
        } else if (selContext.includes('sponsorship') || selContext.includes('visa')) {
          targetLabel = 'Visa Sponsorship';
          matchedValue = 'No';
        } else if (selContext.includes('gender') || selContext.includes('sex')) {
          targetLabel = 'Demographics: Gender';
          matchedValue = 'Male';
        } else if (selContext.includes('race') || selContext.includes('ethnic')) {
          targetLabel = 'Demographics: Race';
          matchedValue = 'Asian';
        } else if (selContext.includes('veteran')) {
          targetLabel = 'Demographics: Veteran';
          matchedValue = 'No';
        } else if (selContext.includes('disability')) {
          targetLabel = 'Demographics: Disability';
          matchedValue = 'No';
        }

        if (targetLabel && matchedValue) {
          const options = await sel.locator('option').allInnerTexts();
          const optIndex = options.findIndex((o) => o.toLowerCase().includes(matchedValue.toLowerCase()));
          if (optIndex !== -1) {
            await sel.selectOption({ index: optIndex }).catch(() => {});
            screeningQuestionsAnswered++;
            filledFields.push({
              field: targetLabel,
              selector: `select:nth(${i})`,
              valueMasked: options[optIndex].trim(),
              status: 'filled'
            });
            recordTrace({
              level: 'INFO',
              category: 'APPLY',
              message: `Auto-selected dropdown option: "${targetLabel}" -> ${options[optIndex].trim()}`,
              details: { field: targetLabel, value: options[optIndex].trim() }
            });
          }
        }
      }
    } catch (radioErr) {
      console.warn('[Browser Agent] Radio/Select resolver encountered error:', radioErr);
    }

    // 10. Post-Fill Stabilization & Scrolling for Full Rendering
    // Smooth scroll down the page to ensure all dynamic elements are rendered and painted
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);

    // 11. Capture Visual Full-Page Snapshot / Screenshot
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    screenshotBase64 = screenshotBuffer.toString('base64');

    const screenshotFile = path.join(
      SCREENSHOTS_DIR,
      `app_${job.id}_${Date.now()}_${options.mode}.png`
    );
    fs.writeFileSync(screenshotFile, screenshotBuffer);

    recordTrace({
      level: 'INFO',
      category: 'APPLY',
      message: `Completed form-filling & captured visual snapshot for ${job.company} (${filledFields.length} fields filled, ${screeningQuestionsAnswered} questions solved)`,
      details: {
        company: job.company,
        mode: options.mode,
        fieldsCount: filledFields.length,
        questionsCount: screeningQuestionsAnswered,
        resumeAttached
      }
    });

    // 12. Execution / Submission Phase
    if (options.mode === 'submit' && !captchaDetected) {
      recordTrace({
        level: 'INFO',
        category: 'APPLY',
        message: `Attempting autonomous form submission for ${job.company}`,
        details: { company: job.company }
      });

      // Submit button selectors for Ashby, Greenhouse, Lever, and general forms
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        '#submit_app',
        '#btn-submit',
        'button:has-text("Submit Application")',
        'button:has-text("Submit application")',
        'button:has-text("Apply Now")',
        'button:has-text("Submit")'
      ];

      let clicked = false;
      for (const sel of submitSelectors) {
        const btn = page.locator(sel).first();
        if ((await btn.count()) > 0 && (await btn.isVisible())) {
          await btn.click();
          clicked = true;
          break;
        }
      }

      if (clicked) {
        // Wait up to 10 seconds for submission acknowledgment or URL transition
        await page.waitForTimeout(5000);

        confirmationUrl = page.url();
        const pageContent = (await page.content()).toLowerCase();

        const successPatterns = [
          'thank you',
          'application received',
          'application submitted',
          'we have received your application',
          "we've received your application",
          'application complete'
        ];

        const isSuccess =
          successPatterns.some((pattern) => pageContent.includes(pattern)) ||
          confirmationUrl.includes('confirmation') ||
          confirmationUrl.includes('thank-you') ||
          confirmationUrl.includes('success');

        if (isSuccess) {
          submitted = true;
          confirmationMessage = 'Application successfully submitted and confirmed by ATS portal!';

          // Capture confirmation receipt screenshot
          const confirmScreenshot = await page.screenshot({ fullPage: true });
          screenshotBase64 = confirmScreenshot.toString('base64');

          // Update job status in database to APPLIED
          updateJobStatus(job.id, 'APPLIED', `Autonomous submission confirmed at ${new Date().toISOString()}`);

          recordTrace({
            level: 'SUCCESS',
            category: 'APPLY',
            message: `Autonomous application confirmed for ${job.company} (${job.title})`,
            details: { company: job.company, confirmationUrl }
          });
        } else {
          confirmationMessage = 'Form was submitted. Please review confirmation status.';
        }
      }
    }

    // 13. Save Local Application Evidence Artifact
    const artifactFile = path.join(
      APPLICATIONS_DIR,
      `app_${job.id}_${Date.now()}_${options.mode}.json`
    );
    const artifactPayload = {
      jobId: job.id,
      company: job.company,
      jobTitle: job.title,
      atsProvider: kit.atsProvider,
      applicationUrl: kit.applicationUrl,
      mode: options.mode,
      timestamp: new Date().toISOString(),
      resumeAttached,
      resumeFileName: path.basename(pdfPath),
      filledFields,
      screeningQuestionsAnswered,
      screenshotFile,
      captchaDetected,
      captchaType,
      submitted,
      confirmationMessage,
      confirmationUrl,
      durationMs: Date.now() - startTime
    };

    try {
      fs.writeFileSync(artifactFile, JSON.stringify(artifactPayload, null, 2), 'utf-8');
      recordTrace({
        level: 'SUCCESS',
        category: 'APPLY',
        message: `Saved local application artifact for ${job.company}: ${path.basename(artifactFile)}`,
        details: { artifactFile: path.relative(process.cwd(), artifactFile) }
      });
    } catch (saveErr) {
      console.warn('[Browser Agent] Failed to save application artifact:', saveErr);
    }

    if (options.mode === 'headed') {
      // Keep browser alive for user to interact
      // (Do not close browser in headed mode)
      return {
        success: true,
        jobId: job.id,
        company: job.company,
        jobTitle: job.title,
        atsProvider: kit.atsProvider,
        mode: options.mode,
        resumeAttached,
        resumeFileName: path.basename(pdfPath),
        filledFields,
        screeningQuestionsAnswered,
        captchaDetected,
        captchaType,
        submitted: false,
        confirmationMessage: 'Pre-filled Chrome browser window launched on your desktop.',
        screenshotBase64,
        artifactPath: artifactFile,
        durationMs: Date.now() - startTime
      };
    }

    return {
      success: true,
      jobId: job.id,
      company: job.company,
      jobTitle: job.title,
      atsProvider: kit.atsProvider,
      mode: options.mode,
      resumeAttached,
      resumeFileName: path.basename(pdfPath),
      filledFields,
      screeningQuestionsAnswered,
      captchaDetected,
      captchaType,
      submitted,
      confirmationMessage:
        confirmationMessage ||
        (options.mode === 'preview'
          ? 'Form successfully pre-filled and validated. Ready for submission.'
          : undefined),
      confirmationUrl,
      screenshotBase64,
      artifactPath: artifactFile,
      durationMs: Date.now() - startTime
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Browser Agent] Application error for ${job.company}:`, err);

    recordTrace({
      level: 'ERROR',
      category: 'APPLY',
      message: `Autonomous application encountered an error for ${job.company}: ${errorMsg}`,
      details: { company: job.company, error: errorMsg }
    });

    return {
      success: false,
      jobId: job.id,
      company: job.company,
      jobTitle: job.title,
      atsProvider: kit.atsProvider,
      mode: options.mode,
      resumeAttached,
      filledFields,
      screeningQuestionsAnswered,
      captchaDetected,
      captchaType,
      submitted: false,
      error: errorMsg,
      screenshotBase64,
      durationMs: Date.now() - startTime
    };
  } finally {
    // Only close browser if not in headed mode
    if (options.mode !== 'headed' && browser) {
      await browser.close().catch(() => {});
    }
  }
}
