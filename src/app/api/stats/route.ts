import { NextResponse } from 'next/server';
import { getStats } from '@/lib/storage';

export async function GET() {
  try {
    const stats = getStats();
    return NextResponse.json({ success: true, stats });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
