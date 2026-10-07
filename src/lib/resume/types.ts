export type ResumeVariant = 'AI' | 'SWE';

export interface AtsCheckItem {
  name: string;
  passed: boolean;
  message: string;
  category: 'FORMAT' | 'KEYWORD' | 'HONESTY';
}

export interface AtsReport {
  formatScore: number; // 0 - 100
  keywordScore: number; // 0 - 100
  pageCount: number;
  wordCount: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  checks: AtsCheckItem[];
}

export interface RepositioningRationale {
  titleLine: string;
  summaryRationale: string;
  skillsRationale: string;
  projectRankingRationale: string;
  leadExperienceRationale: string;
  hardScreensIdentified: string[];
}

export interface TailorResumeRequest {
  jobId?: string;
  customJob?: {
    company: string;
    title: string;
    description: string;
    location?: string;
    url?: string;
  };
  roleFamily?: 'auto' | 'ai' | 'swe';
  targetLocation?: string;
}

export interface TailoredResumeResult {
  jobTitle: string;
  company: string;
  variant: ResumeVariant;
  tailoredLatex: string;
  baseLatex: string;
  repositioningRationale: RepositioningRationale;
  atsReport: AtsReport;
  pdfAvailable: boolean;
  diffChanges: string[];
  compileCommand: string;
}

export interface CompileResult {
  success: boolean;
  pdfBase64?: string;
  pageCount?: number;
  error?: string;
  durationMs: number;
}
