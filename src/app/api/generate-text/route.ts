import { NextResponse } from 'next/server';
import { generateMockText } from '@/lib/mockText';

// Tried in order — earlier entries are cheaper/more likely to have free-tier quota.
// If a model returns RESOURCE_EXHAUSTED (or any other failure), the next one is tried.
const GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
const MAX_OUTPUT_TOKENS = 200;

const SYSTEM_INSTRUCTION =
  'You write concise marketing and product copy. Respond with 2-3 sentences unless the ' +
  'user explicitly asks for more length or detail. Give exactly one version of the requested ' +
  'text — never offer multiple options or variations unless explicitly asked. Return only the ' +
  'generated copy itself: no preamble, no explanation, no labels, no markdown formatting.';

interface GenerateTextBody {
  prompt: string;
  model?: string;
  temperature?: number;
}

function geminiUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

export async function POST(request: Request) {
  let body: GenerateTextBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt : '';
  if (!prompt.trim()) {
    return NextResponse.json({ error: 'Prompt is empty.' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // No key configured — use the same mock fallback the preview used before this route existed.
  if (!apiKey) {
    return NextResponse.json({ text: generateMockText(prompt), source: 'mock', model: 'mock', reason: 'no-key' });
  }

  const temperature = typeof body.temperature === 'number'
    ? Math.min(1, Math.max(0, body.temperature))
    : 0.7;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(geminiUrl(model), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          generationConfig: {
            temperature,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
          },
        }),
      });

      if (!response.ok) {
        // Covers RESOURCE_EXHAUSTED (quota) and any other per-model failure — move to the next model.
        continue;
      }

      const data = await response.json();

      // Content blocked by safety filters — not a model-availability issue, but try the
      // next model anyway in case it has different safety thresholds.
      if (data?.promptFeedback?.blockReason) {
        continue;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text === 'string' && text.trim()) {
        return NextResponse.json({ text: text.trim(), source: 'ai', model });
      }
    } catch {
      // Network error reaching this model — move to the next one.
      continue;
    }
  }

  // Every model failed (quota, blocked, network, or empty response) — fall back to mock.
  return NextResponse.json({ text: generateMockText(prompt), source: 'mock', model: 'mock', reason: 'fallback' });
}
