import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, saveUserProfile } from '@/lib/storage';

export async function GET() {
  try {
    const profile = getUserProfile();
    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        // Mask API key for security in client response
        openRouterApiKey: profile.openRouterApiKey ? `${profile.openRouterApiKey.slice(0, 7)}...${profile.openRouterApiKey.slice(-4)}` : undefined,
        hasApiKey: Boolean(profile.openRouterApiKey || process.env.OPENROUTER_API_KEY)
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Auto extract skills from resume text if skills are empty or requested
    let extractedSkills = body.extractedSkills;
    if ((!extractedSkills || extractedSkills.length === 0) && body.resumeText) {
      extractedSkills = extractCommonSkills(body.resumeText);
    }

    const updated = saveUserProfile({
      ...body,
      extractedSkills: extractedSkills || []
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

function extractCommonSkills(text: string): string[] {
  const dictionary = [
    'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Rust',
    'PostgreSQL', 'SQL', 'MongoDB', 'Redis', 'Tailwind CSS', 'Tailwind', 'GraphQL',
    'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Git', 'Linux', 'REST API',
    'OpenAI', 'LLM', 'AI', 'Machine Learning', 'FastAPI', 'Express', 'Prisma', 'Supabase'
  ];

  const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const found: string[] = [];
  for (const skill of dictionary) {
    const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i');
    if (regex.test(text)) {
      found.push(skill);
    }
  }
  return found;
}
