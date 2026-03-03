import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    const prompt = `
あなたはゲームのシナリオライターです。以下の設定で「完全新作」の台本を執筆してください。

### 1. キャラクター設定
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emoji}
- 性別: 女性

### 2. 名前の呼び方【最重要・死守】
- **【アタック1〜3】のセリフ**:
  相手の名前（%send_nickname%や○○さん等）を呼ぶことは【絶対に禁止】です。1回も使わないでください。相手への問いかけは名前を呼ばずに行ってください。
- **【返信1〜3】のセリフ**:
  相手を呼ぶときは、必ず【%send_nickname%】という変数名を使ってください。

### 3. 執筆ガイドライン
- **内容の刷新**: お手本にあるエピソード（ネット派など）は流用禁止。${job}に基づいた新しい会話を書いてください。
- **URLの処理**: URLが記載されている行は、文字を一切入れず【完全な空行（改行のみ）】にしてください。
- **恋愛描写**: 自分の話は「彼氏いない」、相手への質問は「彼女いる？」にしてください。
- **アタック3**: 返信がないことへの「脈なしかな？」「諦めるね」という内容。
- **固定行**: 「私　⇔　○○さん」という行は、一字一句変えずに出力してください。

### お手本フォーマット（構成のみ利用）
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { 
          role: "system", 
          content: "あなたはデータ作成機です。挨拶不要。アタック1〜3では絶対に相手の名前を呼ばないでください。返信1〜3でのみ %send_nickname% を使用してください。URL行は必ず空白（Empty Line）にすること。" 
        },
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
