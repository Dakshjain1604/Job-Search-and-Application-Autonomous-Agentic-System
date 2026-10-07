import { NextRequest, NextResponse } from 'next/server';
import { getJobById } from '@/lib/storage';
import { runAutonomousApplication } from '@/lib/apply/browser-agent';
import { AutoApplyMode } from '@/lib/apply/types';

export const maxDuration = 60; // 60 seconds max duration for browser execution

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, mode = 'preview', customAnswers } = body;

    if (!jobId) {
      return NextResponse.json({ success: false, error: 'jobId is required' }, { status: 400 });
    }

    const job = getJobById(jobId);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job listing not found' }, { status: 404 });
    }

    const validModes: AutoApplyMode[] = ['preview', 'submit', 'headed'];
    const chosenMode: AutoApplyMode = validModes.includes(mode) ? mode : 'preview';

    const result = await runAutonomousApplication(job, {
      mode: chosenMode,
      customAnswers
    });

    return NextResponse.json({
      success: result.success,
      result
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[API /api/apply/auto-submit] Error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
