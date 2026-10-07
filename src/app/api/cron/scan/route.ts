import { NextRequest, NextResponse } from 'next/server';
import { runJobDiscoveryPipeline } from '@/lib/pipeline';

export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // If no secret configured, allow execution in development
    return true;
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) {
    return true;
  }

  const urlSecret = new URL(req.url).searchParams.get('key');
  return urlSecret === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runJobDiscoveryPipeline();
    return NextResponse.json({
      success: true,
      message: 'Automated 12-hour job discovery completed',
      result
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runJobDiscoveryPipeline();
    return NextResponse.json({
      success: true,
      message: 'Automated 12-hour job discovery completed',
      result
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
