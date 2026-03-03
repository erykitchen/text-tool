import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    const prompt = `
お手本の文章を【すべて破棄】し、構成（枠組み）だけを残して、中身を以下の【新設定】で書き換えてください。

### 1. 新設定
- 属性: 女性（恋愛対象は男性）
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emoji}

### 2. 厳守ルール（絶対に守ること）
- **最初の1文字目**: 必ず「■」から始めること。
- **URL削除**: インスタ等のURLが含まれる行は、URL部分を完全に削除して【空行】にすること。
- **アタック1〜3**: 相手の名前を呼ばない。質問攻めにせず、自分の性格や近況の独り言にする。※アタック3は必ず「諦めてお別れする」内容にする。
- **返信1〜3**: 相手（%send_nickname%）に質問し、会話を盛り上げる。
- **恋愛描写**: 自分の話は「彼氏いない」、相手への質問は「彼女いる？」とすること。
- **固定行**: 「私　⇔　○○さん」の行は絶対に変えない（○○のまま）。

### 3. お手本フォーマット（この形を1文字も漏らさず埋めろ）
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { 
          role: "system", 
          content: "あなたは挨拶をしないデータ作成機です。渡されたお手本をベースに、指定されたJobとPersonalityで全ての項目を埋めてください。お手本に無い項目（年齢、住んでいる場所など）を勝手に追加することは厳禁です。最初の文字は『■』です。" 
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
