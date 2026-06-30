import { NextResponse } from 'next/server';
import { buildGameAnalysisPrompt, getMissingKeyAnalysis } from '../../../lib/aiRecap';
import { Game } from '../../../lib/types';

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ message: 'Configure Gemini API key for AI features', analysis: getMissingKeyAnalysis() }, { status: 400 });
  }

  const body = (await request.json()) as { game?: Game };
  if (!body.game) {
    return NextResponse.json({ message: 'Game payload is required' }, { status: 400 });
  }

  const prompt = buildGameAnalysisPrompt(body.game);
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ message: 'Gemini request failed' }, { status: 502 });
  }

  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

  try {
    const analysis = JSON.parse(text) as ReturnType<typeof getMissingKeyAnalysis>;
    return NextResponse.json({ analysis });
  } catch {
    return NextResponse.json({ message: 'Gemini returned an unexpected response' }, { status: 502 });
  }
}