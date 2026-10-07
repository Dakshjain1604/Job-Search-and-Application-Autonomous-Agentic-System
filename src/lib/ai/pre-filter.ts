import { JobListing, UserProfile } from '@/types';

// Seniority patterns that disqualify candidates looking for Fresher / Junior (<2 years) roles
const SENIOR_ROLE_REGEX =
  /\b(staff|principal|director|vp\b|vice\s*president|head\s*of|architect|lead\b|senior|sr\.?|team\s*lead|manager|distinguished|l4\b|l5\b|l6\b|mts\s*ii|mts\s*iii)\b/i;

// Experience requirement regex checking for 3+ years of experience
const HIGH_YOE_REGEX =
  /\b([3-9]|1[0-9])\+?\s*(?:-\s*\d+)?\s*(?:years?|yrs?)(?:\s+of)?\s+experience\b/i;

// Early career, Junior, Fresher, and New Grad indicators
const JUNIOR_ROLE_REGEX =
  /\b(junior|jr\.?|associate|entry[\s-]level|early[\s-]career|new[\s-]grad|graduate|swe\s*i\b|software\s*engineer\s*i\b|mts\s*i\b|l1\b|intern|internship|fellow|fresher)\b/i;

// Indian tech hubs and remote India detection regex
const INDIA_LOCATION_REGEX =
  /\b(bangalore|bengaluru|hyderabad|pune|mumbai|gurgaon|gurugram|noida|delhi(?:\s*ncr)?|chennai|ahmedabad|kolkata|india|remote\s*-\s*india|india\s*\(remote\)|remote\s*\(india\))\b/i;

export function preFilterJobs(jobs: JobListing[], profile: UserProfile, maxCandidates: number = 25): JobListing[] {
  const targetRoles = (profile.targetRoles || []).map((r) => r.toLowerCase().trim());
  const extractedSkills = (profile.extractedSkills || []).map((s) => s.toLowerCase().trim());
  const preferredCities = (profile.preferredCities || []).map((c) => c.toLowerCase().trim());
  const isEarlyCareerCandidate = profile.experienceLevel === 'FRESHER' || profile.experienceLevel === 'JUNIOR' || profile.experienceYears <= 2;

  // Exclusion keywords for completely unrelated non-tech roles
  const negativeKeywords = [
    'nurse',
    'nursing',
    'dentist',
    'dental',
    'driver',
    'truck',
    'receptionist',
    'mechanic',
    'electrician',
    'plumber',
    'chef',
    'cook',
    'waiter',
    'cashier',
    'sales representative',
    'account executive'
  ];

  const scored = jobs.map((job) => {
    let heuristicScore = 0;
    const titleLower = job.title.toLowerCase();
    const descLower = job.description.toLowerCase();
    const locLower = job.location.toLowerCase();
    const tagsLower = job.tags.map((t) => t.toLowerCase());

    // 1. Negative filtering for non-tech roles
    const isNegative = negativeKeywords.some((neg) => titleLower.includes(neg));
    if (isNegative) {
      return { job, heuristicScore: -200 };
    }

    // 2. Early-career & Seniority Evaluation (<2 YOE Candidate Guardrails)
    const isSeniorInTitle = SENIOR_ROLE_REGEX.test(titleLower);
    const hasHighYoe = HIGH_YOE_REGEX.test(descLower);
    const isJuniorInTitle = JUNIOR_ROLE_REGEX.test(titleLower);
    const hasJuniorKeywords = JUNIOR_ROLE_REGEX.test(descLower);

    // Tag job for frontend display
    const isJuniorFriendly = !isSeniorInTitle && (isJuniorInTitle || hasJuniorKeywords || !hasHighYoe);
    job.isJuniorFriendly = isJuniorFriendly;

    if (isEarlyCareerCandidate) {
      if (isSeniorInTitle) {
        // Disqualify senior/staff/lead roles for fresher / junior applicants
        return { job, heuristicScore: -150 };
      }
      if (hasHighYoe) {
        // Heavy penalty if 3+ years experience is explicitly required in description
        heuristicScore -= 60;
      }
      if (isJuniorInTitle) {
        // High boost for explicit junior / new grad roles
        heuristicScore += 40;
      } else if (hasJuniorKeywords) {
        heuristicScore += 20;
      }
    }

    // 3. Indian Hub & Location Alignment (+25 points)
    const matchesIndiaLocation =
      INDIA_LOCATION_REGEX.test(locLower) ||
      INDIA_LOCATION_REGEX.test(titleLower) ||
      INDIA_LOCATION_REGEX.test(descLower);

    if (matchesIndiaLocation) {
      job.isIndiaLocation = true;
    }

    const matchesPreferredCity = preferredCities.some((city) => {
      if (city === 'remote') return job.remote || locLower.includes('remote');
      if (city === 'bangalore') return locLower.includes('bangalore') || locLower.includes('bengaluru');
      return locLower.includes(city);
    });

    if (matchesPreferredCity || (preferredCities.length === 0 && matchesIndiaLocation)) {
      heuristicScore += 25;
    }

    // 4. Target Role match in Title (+35 points)
    const matchesTargetRole = targetRoles.some((role) => {
      const words = role.split(/\s+/).filter(Boolean);
      return words.every((w) => titleLower.includes(w)) || titleLower.includes(role);
    });

    if (matchesTargetRole) {
      heuristicScore += 35;
    } else {
      // General tech title checks
      if (
        titleLower.includes('engineer') ||
        titleLower.includes('developer') ||
        titleLower.includes('full stack') ||
        titleLower.includes('frontend') ||
        titleLower.includes('backend') ||
        titleLower.includes('ai') ||
        titleLower.includes('founding')
      ) {
        heuristicScore += 18;
      }
    }

    // 5. Remote matching
    if (profile.remoteOnly) {
      if (job.remote) {
        heuristicScore += 20;
      } else if (
        locLower.includes('remote') ||
        descLower.includes('remote') ||
        descLower.includes('work from anywhere')
      ) {
        heuristicScore += 15;
      } else {
        heuristicScore -= 10;
      }
    } else {
      // If remote or flexible, small bonus
      if (job.remote || locLower.includes('remote')) {
        heuristicScore += 10;
      }
    }

    // 6. Skills overlap (+5 points per skill found in title/tags/description, up to 40)
    const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    let skillHits = 0;
    for (const skill of extractedSkills) {
      const escaped = escapeRegex(skill);
      if (
        tagsLower.includes(skill) ||
        new RegExp(`\\b${escaped}\\b`, 'i').test(titleLower) ||
        new RegExp(`\\b${escaped}\\b`, 'i').test(descLower)
      ) {
        skillHits++;
      }
    }
    heuristicScore += Math.min(skillHits * 5, 40);

    return { job, heuristicScore };
  });

  // Filter out negative scores and sort by heuristicScore descending
  return scored
    .filter((item) => item.heuristicScore > 10)
    .sort((a, b) => b.heuristicScore - a.heuristicScore)
    .slice(0, maxCandidates)
    .map((item) => item.job);
}
