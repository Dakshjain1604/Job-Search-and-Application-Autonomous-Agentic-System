import { NextRequest, NextResponse } from 'next/server';
import { getJobListings, updateJobStatus, deleteJob } from '@/lib/storage';
import { JobStatus } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as JobStatus | null;
    const minScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!, 10) : undefined;
    const source = searchParams.get('source') || undefined;
    const search = searchParams.get('search') || undefined;
    const juniorOnly = searchParams.get('juniorOnly') === 'true' ? true : undefined;
    const indiaOnly = searchParams.get('indiaOnly') === 'true' ? true : undefined;
    const remoteOnly = searchParams.get('remoteOnly') === 'true' ? true : undefined;
    const ecosystem = searchParams.get('ecosystem') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 100;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0;

    const result = getJobListings({
      status: status || undefined,
      minScore,
      source,
      search,
      juniorOnly,
      indiaOnly,
      remoteOnly,
      ecosystem,
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      jobs: result.jobs,
      total: result.total
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = body?.id || body?.jobId;
    const status = body?.status;
    const validStatuses: JobStatus[] = ['NEW', 'SAVED', 'APPLIED', 'INTERVIEWING', 'ARCHIVED'];

    if (!id || !status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Valid id and status (NEW, SAVED, APPLIED, INTERVIEWING, ARCHIVED) are required' },
        { status: 400 }
      );
    }

    const updated = updateJobStatus(id, status as JobStatus, body?.notes);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, job: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'id parameter is required' }, { status: 400 });
    }

    const deleted = deleteJob(id);
    return NextResponse.json({ success: deleted });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
