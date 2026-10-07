import { NextRequest, NextResponse } from 'next/server';
import { generateApplicationKit } from '@/lib/apply/application-assistant';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body || (!body.jobId && !body.customJob)) {
      return NextResponse.json(
        { success: false, error: 'jobId or customJob object is required' },
        { status: 400 }
      );
    }
    const kit = await generateApplicationKit(body);

    return NextResponse.json({
      success: true,
      kit
    });
  } catch (err: unknown) {
    console.error('[API apply/generate] Error generating application kit:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
