import fs from 'fs';
import path from 'path';
import { JobListing } from '@/types';
import { tailorResumePerJob } from '../resume/tailor-engine';
import { compileLatexToPdf } from '../resume/compiler';
import { recordTrace } from '../tracing/logger';
import { getDataDirectory } from '../utils';

const RESUMES_STORAGE_DIR = getDataDirectory('resumes');
const BUNDLED_RESUMES_DIR = path.join(process.cwd(), 'public', 'resumes');
const MASTER_DESKTOP_DIR = '/Users/dakshjain/desktop/Resumes';

export function ensureResumesDirectory(): string {
  if (!fs.existsSync(RESUMES_STORAGE_DIR)) {
    fs.mkdirSync(RESUMES_STORAGE_DIR, { recursive: true });
  }
  return RESUMES_STORAGE_DIR;
}

/**
 * Ensures that a high-converting, 1-page tailored PDF resume exists on disk for the given job.
 * 1. Checks if a tailored PDF for this job was already generated.
 * 2. If not, runs the tailor engine to align projects and skills to the job description.
 * 3. Compiles the strict 1-page LaTeX into a PDF via Tectonic.
 * 4. Saves to disk and returns the absolute file path for browser automation attachment.
 */
export async function getOrCompileResumePdfForJob(job: JobListing): Promise<{
  pdfPath: string;
  source: 'tailored_compile' | 'cached' | 'master_fallback';
  durationMs: number;
}> {
  const startTime = Date.now();
  ensureResumesDirectory();

  const sanitizedId = job.id.replace(/[^a-zA-Z0-9-_]/g, '_');
  const targetPdfPath = path.join(RESUMES_STORAGE_DIR, `Daksh_Jain_Resume_${sanitizedId}.pdf`);

  // 1. Check if already compiled and cached on disk
  if (fs.existsSync(targetPdfPath) && fs.statSync(targetPdfPath).size > 1000) {
    return {
      pdfPath: targetPdfPath,
      source: 'cached',
      durationMs: Date.now() - startTime
    };
  }

  // 2. Compile on-demand tailored resume for this job
  try {
    const tailorResult = await tailorResumePerJob({ customJob: job });
    const compileResult = await compileLatexToPdf(tailorResult.tailoredLatex);

    if (compileResult.success && compileResult.pdfBase64) {
      const buffer = Buffer.from(compileResult.pdfBase64, 'base64');
      fs.writeFileSync(targetPdfPath, buffer);

      recordTrace({
        level: 'SUCCESS',
        category: 'RESUME',
        message: `Compiled & saved tailored 1-page PDF for ${job.company} (${job.title})`,
        durationMs: Date.now() - startTime,
        details: { path: targetPdfPath, sizeBytes: buffer.length }
      });

      return {
        pdfPath: targetPdfPath,
        source: 'tailored_compile',
        durationMs: Date.now() - startTime
      };
    }
  } catch (err) {
    console.warn(`[Resume Helper] Tailored compilation failed for ${job.company}, checking master fallbacks:`, err);
  }

  // 3. Fallback to bundled repository master PDFs or local desktop PDFs if Tectonic is unavailable
  const isAiRole = `${job.title} ${job.description} ${job.tags.join(' ')}`.toLowerCase().match(/(ai|agent|llm|genai|prompt|rag|mcp)/);
  const preferredPdf = isAiRole ? 'Daksh_Jain_Resume_AI.pdf' : 'Daksh_Jain_Resume.pdf';

  const candidateMasterPaths = [
    path.join(BUNDLED_RESUMES_DIR, preferredPdf),
    path.join(BUNDLED_RESUMES_DIR, 'Daksh_Jain_Resume.pdf'),
    path.join(MASTER_DESKTOP_DIR, preferredPdf),
    path.join(MASTER_DESKTOP_DIR, 'Daksh_Jain_Resume.pdf')
  ];

  for (const masterFile of candidateMasterPaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ masterFile)) {
      try {
        fs.copyFileSync(masterFile, targetPdfPath);
        return {
          pdfPath: targetPdfPath,
          source: 'master_fallback',
          durationMs: Date.now() - startTime
        };
      } catch (copyErr) {
        // If target copy fails (e.g. read-only tmp), return the static bundled file directly
        return {
          pdfPath: masterFile,
          source: 'master_fallback',
          durationMs: Date.now() - startTime
        };
      }
    }
  }

  throw new Error(`Could not generate or locate a valid PDF resume to attach for ${job.company}.`);
}
