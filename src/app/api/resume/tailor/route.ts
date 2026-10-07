import { NextRequest, NextResponse } from 'next/server';
import { tailorResumePerJob } from '@/lib/resume/tailor-engine';
import { TailorResumeRequest } from '@/lib/resume/types';

export async function POST(req: NextRequest) {
  try {
    const body: TailorResumeRequest = await req.json().catch(() => ({}));
    if (!body || (!body.jobId && !body.customJob)) {
      return NextResponse.json(
        { success: false, error: 'jobId or customJob object is required' },
        { status: 400 }
      );
    }
    const result = await tailorResumePerJob(body);

    return NextResponse.json({
      success: true,
      result,
      tailoredLatex: result?.tailoredLatex,
      atsReport: result?.atsReport
    });
  } catch (err: unknown) {
    console.error('[API resume/tailor] Error tailoring resume:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
