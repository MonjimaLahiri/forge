import { NextResponse } from 'next/server';

const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';

interface GenerateImageBody {
  prompt: string;
  imageStyle?: string;
}

export async function POST(request: Request) {
  let body: GenerateImageBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt : '';
  if (!prompt.trim()) {
    return NextResponse.json({ error: 'Prompt is empty.' }, { status: 400 });
  }

  const fullPrompt = body.imageStyle?.trim()
    ? `${prompt}. Style: ${body.imageStyle.trim()}.`
    : prompt;

  // Random seed so "Regenerate" gets a fresh image instead of a cached result
  // for an identical prompt.
  const seed = Math.floor(Math.random() * 1_000_000_000);
  const url = `${POLLINATIONS_BASE}/${encodeURIComponent(fullPrompt)}?width=768&height=768&seed=${seed}&nologo=true`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json({ source: 'mock', reason: 'fallback' });
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ source: 'mock', reason: 'fallback' });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const imageUrl = `data:${contentType};base64,${buffer.toString('base64')}`;

    return NextResponse.json({ imageUrl, source: 'ai', model: 'pollinations' });
  } catch {
    return NextResponse.json({ source: 'mock', reason: 'fallback' });
  }
}
