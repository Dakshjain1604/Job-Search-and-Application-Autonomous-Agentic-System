import { NextRequest, NextResponse } from 'next/server';
import { runJobDiscoveryPipeline, getScanPipelineStatus } from '@/lib/pipeline';

export const maxDuration = 60; // 60 seconds execution limit for Vercel Hobby

export async function GET() {
  return NextResponse.json({
    success: true,
    data: getScanPipelineStatus()
  });
}

export async function POST(req: NextRequest) {
  try {
    let options = undefined;
    try {
      options = await req.json();
    } catch {
      // Body is optional
    }

    const result = await runJobDiscoveryPipeline(options);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('[Scan Route Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: String(err)
      },
      { status: 500 }
    );
  }
}
