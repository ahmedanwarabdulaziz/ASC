import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Fetch the URL with proper headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch URL',
        status: response.status 
      }, { status: response.status });
    }

    const html = await response.text();

    // Extract Open Graph metadata
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+name=["']og:title["']\s+content=["']([^"']+)["']/i);
    const ogDescriptionMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
                                 html.match(/<meta\s+name=["']og:description["']\s+content=["']([^"']+)["']/i);
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+name=["']og:image["']\s+content=["']([^"']+)["']/i);

    // Fallback to regular meta tags
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descriptionMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);

    const metadata = {
      title: ogTitleMatch?.[1] || titleMatch?.[1] || 'Untitled',
      description: ogDescriptionMatch?.[1] || descriptionMatch?.[1] || '',
      image: ogImageMatch?.[1] || null,
      url: url,
    };

    return NextResponse.json(metadata);
  } catch (error: any) {
    console.error('Error fetching metadata:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch metadata',
      message: error.message 
    }, { status: 500 });
  }
}

