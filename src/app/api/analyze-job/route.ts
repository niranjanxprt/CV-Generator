import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { messages, model, temperature, max_tokens } = await req.json();

        const apiKey = process.env.PERPLEXITY_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'PERPLEXITY_API_KEY is not configured on the server' }, { status: 500 });
        }

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model || 'sonar',
                messages,
                temperature: temperature || 0.2,
                max_tokens: max_tokens || 2000
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: `Perplexity API error: ${response.status}`, details: errorText }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
