import { NextRequest, NextResponse } from 'next/server';
import { compileLatexToPdf } from '@/lib/resume/compiler';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download') === '1';

    const body = await req.json();
    const latex = body.latex || body.latexCode;

    if (!latex || typeof latex !== 'string') {
      return NextResponse.json(
        { success: false, error: 'LaTeX content string (latex or latexCode) is required in request body.' },
        { status: 400 }
      );
    }

    const compileResult = await compileLatexToPdf(latex);

    if (!compileResult.success) {
      return NextResponse.json(
        { success: false, error: compileResult.error, durationMs: compileResult.durationMs },
        { status: 400 }
      );
    }

    if (download && compileResult.pdfBase64) {
      const buffer = Buffer.from(compileResult.pdfBase64, 'base64');
      const filename = body.filename || 'Daksh_Jain_Resume.pdf';

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': buffer.length.toString()
        }
      });
    }

    return NextResponse.json({
      success: true,
      pdfBase64: compileResult.pdfBase64,
      pdfUrl: compileResult.pdfBase64 ? `data:application/pdf;base64,${compileResult.pdfBase64}` : undefined,
      downloadUrl: '/api/resume/compile?download=1',
      pageCount: compileResult.pageCount,
      durationMs: compileResult.durationMs
    });
  } catch (err: unknown) {
    console.error('[API resume/compile] Compilation error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
