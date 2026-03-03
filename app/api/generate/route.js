import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    const prompt = `
以下の「お手本」のフォーマットで、中身を【${job}】で【${personality}】な女性キャラとして新しく書いてください。
挨拶はいりません。「■キャラ名」から始めて。

■アタック(1〜3)の特別なルール（厳守！）
- 相手の名前（%send_nickname%や○○さん等）を【絶対に】呼ばないでください。
- 「相手への質問」は控えめにし、自分のことや、自分の今の気分を伝える内容にしてください。
- アタック3は「返事がないので諦めてお別れする」寂しい内容にしてください。

■返信(1〜3)のルール
- 相手（%send_nickname%）に質問したり、話を広げたりして、もっと仲良くなる内容にしてください。

■基本ルール
- 「私　⇔　○○さん」の行は絶対に変えない（○○のまま）。
- インスタURLなどのURLは消して空行にする。
- 絵文字は「${emoji}」。
- 口調は「${tone === 'polite' ? '敬語' : 'タメ語'}」。
- 自分の名前をセリフの中で呼ばない。
- 「■返信3-青1」まで全部書く。

■お手本
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.8, 
      max_tokens: 2500,
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
