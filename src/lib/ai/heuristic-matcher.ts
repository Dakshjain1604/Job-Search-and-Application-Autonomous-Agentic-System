import { JobListing, UserProfile, MatchEvaluation, FitLevel } from '@/types';

// Seniority patterns that disqualify candidates looking for Fresher / Junior (<2 years) roles
const SENIOR_ROLE_REGEX =
  /\b(staff|principal|director|vp\b|vice\s*president|head\s*of|architect|lead\b|senior|sr\.?|team\s*lead|manager|distinguished|l4\b|l5\b|l6\b|mts\s*ii|mts\s*iii)\b/i;

// Experience requirement regex checking for 3+ years of experience
const HIGH_YOE_REGEX =
  /\b([3-9]|1[0-9])\+?\s*(?:-\s*\d+)?\s*(?:years?|yrs?)(?:\s+of)?\s+experience\b/i;

// Early career, Junior, Fresher, and New Grad indicators
const JUNIOR_ROLE_REGEX =
  /\b(junior|jr\.?|associate|entry[\s-]level|early[\s-]career|new[\s-]grad|graduate|swe\s*i\b|software\s*engineer\s*i\b|mts\s*i\b|l1\b|intern|internship|fellow|fresher)\b/i;

// Indian tech hubs regex
const INDIA_LOCATION_REGEX =
  /\b(bangalore|bengaluru|hyderabad|pune|mumbai|gurgaon|gurugram|noida|delhi(?:\s*ncr)?|chennai|ahmedabad|kolkata|india|remote\s*-\s*india|india\s*\(remote\)|remote\s*\(india\))\b/i;

function escapeRegex(str: string): string {
  return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function evaluateJobHeuristically(job: JobListing, profile: UserProfile): MatchEvaluation {
  const titleLower = job.title.toLowerCase();
  const descLower = job.description.toLowerCase();
  const locLower = job.location.toLowerCase();
  const tagsLower = job.tags.map((t) => t.toLowerCase());

  const isEarlyCareerCandidate =
    profile.experienceLevel === 'FRESHER' ||
    profile.experienceLevel === 'JUNIOR' ||
    profile.experienceYears <= 2;

  let score = 42; // Base score
  const pros: string[] = [];
  const cons: string[] = [];

  // 1. Early-Career & Seniority Analysis
  const isSeniorInTitle = SENIOR_ROLE_REGEX.test(titleLower);
  const hasHighYoe = HIGH_YOE_REGEX.test(descLower);
  const isJuniorInTitle = JUNIOR_ROLE_REGEX.test(titleLower);
  const hasJuniorKeywords = JUNIOR_ROLE_REGEX.test(descLower);

  const isJuniorFriendly = !isSeniorInTitle && (isJuniorInTitle || hasJuniorKeywords || !hasHighYoe);
  const isIndiaLocation =
    INDIA_LOCATION_REGEX.test(locLower) ||
    INDIA_LOCATION_REGEX.test(titleLower) ||
    INDIA_LOCATION_REGEX.test(descLower);

  if (isEarlyCareerCandidate) {
    if (isSeniorInTitle) {
      score -= 35;
      cons.push('Seniority gap: Title indicates Senior, Staff, or Lead level role.');
    } else if (hasHighYoe) {
      score -= 20;
      cons.push('Experience gap: Job description indicates requirement of 3+ years experience.');
    }

    if (isJuniorInTitle) {
      score += 25;
      pros.push('Early-career / Junior / Fresher friendly position with immediate role alignment.');
    } else if (hasJuniorKeywords) {
      score += 12;
      pros.push('Culture & qualifications supportive of entry-level and early-career engineers.');
    }
  }

  // 2. Title & Target Role Matching
  const targetRoles = profile.targetRoles || [];
  const matchedRole = targetRoles.find((role) => {
    const words = role.toLowerCase().split(/\s+/).filter(Boolean);
    return words.every((w) => titleLower.includes(w)) || titleLower.includes(role.toLowerCase());
  });

  if (matchedRole) {
    score += 25;
    pros.push(`Target role match: Position aligns directly with "${matchedRole}".`);
  } else if (/software|engineer|developer|full stack|frontend|backend|ai/i.test(titleLower)) {
    score += 14;
    pros.push('Core engineering role aligned with software development background.');
  }

  // 3. Indian Hub & Location Alignment
  const preferredCities = (profile.preferredCities || []).map((c) => c.toLowerCase().trim());
  const matchesPreferredCity = preferredCities.some((city) => {
    if (city === 'remote') return job.remote || locLower.includes('remote');
    if (city === 'bangalore') return locLower.includes('bangalore') || locLower.includes('bengaluru');
    return locLower.includes(city);
  });

  if (matchesPreferredCity) {
    score += 15;
    pros.push(`Location matches your preferred hubs: ${job.location}.`);
  } else if (isIndiaLocation) {
    score += 10;
    pros.push(`Located in Indian tech ecosystem: ${job.location}.`);
  }

  // 4. Skills Intersection
  const skills = profile.extractedSkills || [];
  const matchedSkills: string[] = [];
  const missingProminentSkills: string[] = [];

  for (const skill of skills) {
    const escaped = escapeRegex(skill);
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (tagsLower.includes(skill.toLowerCase()) || regex.test(titleLower) || regex.test(descLower)) {
      matchedSkills.push(skill);
    }
  }

  if (matchedSkills.length > 0) {
    const skillBonus = Math.min(matchedSkills.length * 6, 25);
    score += skillBonus;
    pros.push(`Key matching stack: ${matchedSkills.slice(0, 5).join(', ')}.`);
  } else {
    cons.push('Specific matching technologies not explicitly highlighted in posting preview.');
  }

  // Check some common tech that might be missing
  const commonTech = ['Go', 'Rust', 'Kubernetes', 'Java', 'C++', 'GraphQL'];
  for (const t of commonTech) {
    const escaped = escapeRegex(t);
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(descLower) && !skills.map((s) => s.toLowerCase()).includes(t.toLowerCase())) {
      missingProminentSkills.push(t);
    }
  }
  if (missingProminentSkills.length > 0) {
    cons.push(`May require unfamiliar tech: ${missingProminentSkills.slice(0, 3).join(', ')}.`);
  }

  // 5. Remote Preference
  if (profile.remoteOnly) {
    if (job.remote) {
      score += 10;
      pros.push('100% Remote flexibility matching your work preference.');
    } else {
      score -= 15;
      cons.push(`Posting lists location as "${job.location}" - verify remote flexibility.`);
    }
  }

  // 6. Compensation Check
  if (job.salary) {
    score += 5;
    pros.push(`Transparent compensation posted: ${job.salary}.`);
  }

  // Clamp score
  const finalScore = Math.max(15, Math.min(98, score));

  let fitLevel: FitLevel = 'POTENTIAL';
  if (finalScore >= 80) fitLevel = 'STRONG_MATCH';
  else if (finalScore >= 65) fitLevel = 'GOOD_MATCH';
  else if (finalScore >= 45) fitLevel = 'POTENTIAL';
  else fitLevel = 'LOW';

  // Generate tailored pitch hook
  const topSkillsStr = matchedSkills.slice(0, 3).join(', ') || 'Next.js, TypeScript, and AI tools';
  
  let tailoredPitch: string;
  if (isEarlyCareerCandidate) {
    tailoredPitch = `Hi ${job.company} Team,

I came across your opening for ${job.title} and wanted to reach out. As an enthusiastic early-career engineer specializing in ${topSkillsStr}, I've built end-to-end full stack and AI projects with high shipping velocity. I admire what you're building at ${job.company} and would love to bring my technical grit, rapid learning ability, and dedication to your team.

Looking forward to connecting!
Best,
${profile.name || 'Candidate'}`;
  } else {
    tailoredPitch = `Hi ${job.company} Team,

I came across your opening for ${job.title} and wanted to reach out directly. With my background in ${topSkillsStr} and experience building scalable web applications in fast-paced startup environments, I would love to contribute to what you're building at ${job.company}.

Looking forward to connecting!
Best,
${profile.name || 'Candidate'}`;
  }

  return {
    matchScore: finalScore,
    fitLevel,
    matchPros: pros,
    matchCons: cons.length > 0 ? cons : ['Verify specific team timezones and product roadmap alignment.'],
    tailoredPitch,
    isJuniorFriendly,
    isIndiaLocation
  };
}
