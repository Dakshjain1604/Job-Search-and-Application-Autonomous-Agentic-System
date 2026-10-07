import { NextRequest, NextResponse } from 'next/server';
import { getRecentTraces, recordTrace, TraceCategory } from '@/lib/tracing/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const category = searchParams.get('category') as TraceCategory | undefined;

    const traces = getRecentTraces(limit, category);
    return NextResponse.json({
      success: true,
      traces
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = recordTrace({
      level: body.level || 'INFO',
      category: body.category || 'DISCOVERY',
      message: body.message || 'Custom agent trace event',
      details: body.details,
      durationMs: body.durationMs
    });

    return NextResponse.json({
      success: true,
      event
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
