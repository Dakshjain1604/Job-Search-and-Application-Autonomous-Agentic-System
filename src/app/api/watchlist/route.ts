import { NextRequest, NextResponse } from 'next/server';
import { getWatchlist, addWatchlistCompany, removeWatchlistCompany } from '@/lib/storage';
import { TOP_100_AI_COMPANIES } from '@/lib/data/top-ai-companies';

export async function GET(req: NextRequest) {
  try {
    const list = getWatchlist();
    const includeDirectory = req.nextUrl.searchParams.get('includeDirectory') === 'true';

    return NextResponse.json({
      success: true,
      watchlist: list,
      directory: includeDirectory ? TOP_100_AI_COMPANIES : undefined
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support batch importing top AI companies
    if (body.importBatch) {
      let toAdd = TOP_100_AI_COMPANIES;
      if (body.category && body.category !== 'all') {
        toAdd = toAdd.filter((c) => c.category === body.category);
      }
      if (body.limit && typeof body.limit === 'number') {
        toAdd = toAdd.slice(0, body.limit);
      }

      let addedCount = 0;
      for (const comp of toAdd) {
        addWatchlistCompany({
          name: comp.name,
          slug: comp.slug,
          atsProvider: comp.atsProvider,
          careersUrl: comp.careersUrl,
          enabled: true
        });
        addedCount++;
      }

      return NextResponse.json({
        success: true,
        message: `Imported ${addedCount} AI companies into watchlist`,
        watchlist: getWatchlist()
      });
    }

    const { name, slug, atsProvider, careersUrl } = body;

    if (!name || !slug || !atsProvider) {
      return NextResponse.json(
        { success: false, error: 'name, slug, and atsProvider are required' },
        { status: 400 }
      );
    }

    const added = addWatchlistCompany({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      atsProvider,
      careersUrl: careersUrl?.trim() || undefined,
      enabled: true
    });

    return NextResponse.json({ success: true, company: added });
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

    const deleted = removeWatchlistCompany(id);
    return NextResponse.json({ success: deleted });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
