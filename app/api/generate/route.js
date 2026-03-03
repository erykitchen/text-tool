import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    const prompt = `
以下の「お手本」の形式（項目名や構成）を完全に真似て、新しいキャラクターを1人生成してください。

【設定】
職業: ${job}
性格: ${personality}
口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
絵文字・顔文字の使用感: ${emoji}

【お手本】
${template}

【出力形式】
お手本と同じ項目名を使用し、設定に沿った内容で出力してください。
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
