export interface CandidateField {
  label: string;
  fieldKey: string;
  value: string;
  category: 'personal' | 'links' | 'availability' | 'compensation';
}

export interface ScreeningQuestion {
  id: string;
  question: string;
  suggestedAnswer: string;
  evidenceSource: string;
}

export interface ExecutiveOutreach {
  coldEmail: {
    subject: string;
    body: string;
  };
  linkedInNote: string; // Under 300 characters for connection invites
  linkedInInMail: string; // Full InMail message
  twitterDm: string;
}

export interface DiscoveryLinks {
  founderSearchUrl: string;
  engineeringLeadSearchUrl: string;
  recruiterSearchUrl: string;
}

export interface ApplicationKit {
  jobId: string;
  jobTitle: string;
  company: string;
  applicationUrl: string;
  atsProvider: 'ashby' | 'greenhouse' | 'lever' | 'other';
  candidateFields: CandidateField[];
  screeningQuestions: ScreeningQuestion[];
  outreach: ExecutiveOutreach;
  discoveryLinks: DiscoveryLinks;
}

export type AutoApplyMode = 'preview' | 'submit' | 'headed';

export interface AutoApplyFieldEvidence {
  field: string;
  selector: string;
  valueMasked: string;
  status: 'filled' | 'skipped' | 'failed';
}

export interface AutoApplyResult {
  success: boolean;
  jobId: string;
  company: string;
  jobTitle: string;
  atsProvider: 'ashby' | 'greenhouse' | 'lever' | 'other';
  mode: AutoApplyMode;
  resumeAttached: boolean;
  resumeFileName?: string;
  filledFields: AutoApplyFieldEvidence[];
  screeningQuestionsAnswered: number;
  captchaDetected: boolean;
  captchaType?: 'turnstile' | 'recaptcha' | 'hcaptcha' | 'other';
  submitted: boolean;
  confirmationMessage?: string;
  confirmationUrl?: string;
  screenshotBase64?: string;
  error?: string;
  artifactPath?: string;
  durationMs: number;
}
