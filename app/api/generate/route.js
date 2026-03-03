import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    const prompt = `
お手本フォーマットの各項目を、以下の【新設定】で埋めてください。

### 1. 新設定
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emoji}
- 性別: 女性（相手は男性）

### 2. 置換ルール（厳守）
- **URL**: インスタURL等のURLがある行は、URLや説明文字（「空の行」など）を一切書かず、何も入力しないで改行のみ（真っ白な行）にしてください。
- **アタック1〜3の名前**: 相手を呼ぶ言葉（%send_nickname%、○○さん、あなた、等）は【1回も使わない】でください。
- **返信1〜3の名前**: 相手を呼ぶときは、100%必ず「%send_nickname%」と書いてください。「○○さん」という表記は禁止です。
- **恋愛描写**: 自分の話は「彼氏いない」、相手への質問は「彼女いる？」に統一してください。
- **アタック3**: 「脈なしかな？」「諦めるね」という内容を含めてください。
- **固定行**: 「私　⇔　○○さん」の行は一字一句変えないでください。

### お手本フォーマット
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { 
          role: "system", 
          content: "あなたはデータ作成機です。挨拶や説明は不要。最初の文字は『■キャラ名』から始めてください。URLの行は文字を一切入れず改行のみ。返信内の名前は必ず %send_nickname% にしてください。" 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7, 
      max_tokens: 2500,
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
