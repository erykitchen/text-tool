import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    const prompt = `
以下の「お手本」のフォーマットを使い、中身を【${job}】で【${personality}】な女性キャラに書き換えて。
挨拶や説明はいらない。「■キャラ名」から始めて。

■ルール
1. 相手は「%send_nickname%」と呼ぶ。ただし【アタック1〜3】では名前を呼ばない。
2. アタック3は、返信が来ないから諦める「お別れ」の内容にする。
3. 絵文字は「${emoji}」。
4. 「私　⇔　○○さん」の行は絶対に変えない。○○のままにする。
5. インスタURLなどのURLは消して空行にする。
6. 口調は「${tone === 'polite' ? '敬語' : 'タメ語'}」。
7. 「■返信3-青1」まで全部書く。

■お手本
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.8, // 少し遊び（創造性）を持たせて、アレンジを強くします
      max_tokens: 2500,
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
