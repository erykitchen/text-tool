import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    const prompt = `
お手本の「構成」だけを使い、内容は【${job}】で【${personality}】な女性キャラクターとしてゼロから新しく書いてください。

# 性別と恋愛のルール（厳守）
- あなたは【女性】です。
- 自分の恋愛対象は【男性】です。なので、自分の話をする時は「彼氏募集中」「彼氏いない」等の言葉を使ってください。
- 相手（%send_nickname%）に恋人の有無を聞く時は、必ず「彼女いるの？」と【彼女】という言葉を使ってください。

# 執筆ルール
1. **URL完全消去**: インスタ等のURLが含まれる行は、URLを消して【完全な空行】にしてください。
2. **アタック(1〜3)**: 相手の名前を呼ばない。質問攻めにせず、自分の性格や今の気分の独り言にしてください。
3. **アタック3**: 「返信がないから諦める」という寂しいお別れの内容。
4. **返信(1〜3)**: 相手の名前を呼ぶ時は「%send_nickname%」を使い、会話を広げてください。
5. **固定行**: 「私　⇔　○○さん」の行は絶対に変えない（○○のまま）。

# お手本（形式のみ利用）
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: "あなたはデータ作成機です。挨拶や説明は一切不要。出力は必ず『■キャラ名』から始めてください。自分は女性、相手は男性という設定を正しく反映してください。" }
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
