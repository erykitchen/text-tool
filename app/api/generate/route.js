import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    const prompt = `
あなたは魅力的なキャラクターを創る作家です。以下の【キャラクター設定】を【お手本フォーマット】に流し込んで、素敵なプロフィールとセリフ集を作成してください。

### 1. キャラクター設定
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emoji}
- 性別: 女性（相手は男性）

### 2. 執筆ガイドライン
- **URLの処理**: お手本にあるURLは、1文字も残さず完全に消去して、そこを「空の行」にしてください。
- **お名前の呼び方**:
  - 【アタック1〜3】は、まだ相手と話していない状態なので、相手の名前（○○さんや%send_nickname%）を呼ばないでください。質問はOKです。
  - 【返信1〜3】は、相手の名前を呼ぶときに必ず「%send_nickname%」を使ってください。
- **恋愛の表現**: 自分のことは「彼氏がいない」、相手には「彼女いるの？」と自然な男女の会話にしてください。
- **アタック3**: 「お返事ないし脈なしかな…諦めるね」といったお別れの挨拶にしてください。
- **固定行**: 「私　⇔　○○さん」の行はそのまま残してください。

### お手本フォーマット
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { 
          role: "system", 
          content: "あなたは創作アシスタントです。ユーザーが提供したフォーマットに従い、指定されたキャラ設定で全ての項目を埋めてください。挨拶は不要で、いきなり『■キャラ名』から出力してください。" 
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
