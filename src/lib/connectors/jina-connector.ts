export async function scrapeCareerPageWithJina(targetUrl: string): Promise<string> {
  try {
    const jinaUrl = `https://r.jina.ai/${targetUrl.trim()}`;
    const headers: Record<string, string> = {
      'Accept': 'text/plain',
      'X-Return-Format': 'markdown',
      'X-Timeout': '12'
    };

    if (process.env.JINA_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.JINA_API_KEY}`;
    }

    const res = await fetch(jinaUrl, { headers });
    if (!res.ok) {
      throw new Error(`Jina reader returned HTTP ${res.status}`);
    }

    const markdown = await res.text();
    // Return first 8000 characters
    return markdown.slice(0, 8000);
  } catch (err) {
    console.error('[Jina Connector] Error scraping URL:', targetUrl, err);
    throw err;
  }
}
