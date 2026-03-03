import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    const prompt = `
あなたはキャラクター設定の「変換エンジン」です。以下の【新設定】に基づき、下にある【お手本】の各項目を一つずつ丁寧に、新しく書き換えて出力してください。

### 【新設定】
- 属性: 女性（恋愛対象は男性）
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emoji}

### 【出力の絶対ルール】
1. **開始**: 余計な前置きは一切せず、最初の文字は必ず「■キャラ名」にしてください。
2. **URL**: URLが記載されている行は、URLを削除し【完全な空行】にしてください。
3. **アタック(1〜3)**: 相手の名前を呼ばない。質問攻めをせず、自分のことや今の気分の独り言にする。アタック3は必ず「諦めてお別れする」内容にする。
4. **返信(1〜3)**: 相手を「%send_nickname%」と呼び、会話を盛り上げる。
5. **整合性**: 自分の話は「彼氏いない」、相手への質問は「彼女いる？」と正しく使い分けること。
6. **固定**: 「私　⇔　○○さん」と「※テンプレ 返信3まで」は絶対に変えない。

### 【お手本フォーマット】（この構成どおりに全て書ききれ）
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: "あなたは挨拶をしないデータ作成機です。渡されたお手本フォーマットを全て埋めるまで出力を止めないでください。最初の文字は『■』です。" }
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
