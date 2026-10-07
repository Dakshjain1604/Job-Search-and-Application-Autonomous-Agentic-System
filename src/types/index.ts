export type JobSource =
  | 'hacker-news'
  | 'remotive'
  | 'arbeitnow'
  | 'jobicy'
  | 'ashby'
  | 'greenhouse'
  | 'lever'
  | 'custom';

export type JobStatus = 'NEW' | 'SAVED' | 'APPLIED' | 'INTERVIEWING' | 'ARCHIVED';

export type FitLevel = 'STRONG_MATCH' | 'GOOD_MATCH' | 'POTENTIAL' | 'LOW';

export type ExperienceLevel = 'FRESHER' | 'JUNIOR' | 'MID' | 'SENIOR';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  headline?: string;
  resumeText: string;
  extractedSkills: string[];
  targetRoles: string[];
  experienceYears: number;
  experienceLevel: ExperienceLevel; // 'FRESHER' (<1 yr / new grad) | 'JUNIOR' (1-2 yrs) | 'MID' | 'SENIOR'
  locationPreference: string;
  preferredCities: string[]; // e.g. ['Bangalore', 'Hyderabad', 'Pune', 'Mumbai', 'India Remote']
  remoteOnly: boolean;
  minSalary?: number;
  minMatchScore: number;
  ecosystemFocus?: string[]; // ['YC Startups', 'a16z Portfolio', 'India AI Hubs']
  customPromptInstructions?: string;
  openRouterApiKey?: string;
  updatedAt: string;
}

export interface JobListing {
  id: string; // SHA-256 hash or unique slug
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  remote: boolean;
  url: string;
  source: JobSource;
  salary?: string | null;
  tags: string[];
  description: string;
  matchScore: number; // 0 - 100
  fitLevel: FitLevel;
  matchPros: string[];
  matchCons: string[];
  tailoredPitch: string;
  status: JobStatus;
  notes?: string;
  isJuniorFriendly?: boolean;
  isIndiaLocation?: boolean;
  ecosystem?: ('YC' | 'a16z' | 'India AI' | 'Global AI')[];
  discoveredAt: string;
  updatedAt: string;
}

export interface CompanyWatchlist {
  id: string;
  name: string;
  slug: string;
  atsProvider: 'ashby' | 'greenhouse' | 'lever';
  careersUrl?: string;
  category?: string;
  isYC?: boolean;
  isA16z?: boolean;
  isIndiaHub?: boolean;
  hubs?: string[];
  enabled: boolean;
  lastScannedAt?: string | null;
}

export interface ScanRun {
  id: string;
  startedAt: string;
  completedAt: string;
  sourcesScanned: string[];
  jobsFound: number;
  jobsMatched: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  error?: string;
}

export interface ScanStats {
  totalJobs: number;
  highMatchJobs: number;
  appliedJobs: number;
  savedJobs: number;
  lastScanTimestamp?: string;
  lastScanTime?: string;
}

export interface MatchEvaluation {
  matchScore: number;
  fitLevel: FitLevel;
  matchPros: string[];
  matchCons: string[];
  tailoredPitch: string;
  isJuniorFriendly?: boolean;
  isIndiaLocation?: boolean;
}
