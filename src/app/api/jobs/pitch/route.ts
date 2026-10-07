import { NextRequest, NextResponse } from 'next/server';
import { getJobById, getUserProfile, updateJobPitch } from '@/lib/storage';
import { generateTailoredOutreachNote } from '@/lib/ai/decision-engine';
import { recordTrace } from '@/lib/tracing/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, forceRegenerate } = body;

    if (!jobId) {
      return NextResponse.json({ success: false, error: 'jobId is required' }, { status: 400 });
    }

    const job = getJobById(jobId);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // Return cached pitch if available and regeneration not explicitly requested
    if (job.tailoredPitch && !forceRegenerate) {
      return NextResponse.json({
        success: true,
        pitch: job.tailoredPitch,
        cached: true
      });
    }

    const profile = getUserProfile();
    const startTime = Date.now();
    const pitch = await generateTailoredOutreachNote(job, profile);
    const durationMs = Date.now() - startTime;

    // Persist to storage so subsequent views are instant and zero-cost
    updateJobPitch(jobId, pitch);

    recordTrace({
      level: 'SUCCESS',
      category: 'DECISION',
      message: `Generated on-demand tailored outreach note for ${job.company} (${job.title})`,
      durationMs,
      details: { company: job.company, role: job.title, length: pitch.length }
    });

    return NextResponse.json({
      success: true,
      pitch,
      cached: false,
      durationMs
    });
  } catch (err) {
    console.error('[API /api/jobs/pitch] Error generating pitch:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
