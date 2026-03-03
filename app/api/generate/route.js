import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    const prompt = `
お手本の「構成」を使い、内容は【${job}】で【${personality}】な女性キャラとしてゼロから書き直してください。

### 1. 呼び方のルール
- **アタック(1〜3)**: 相手の名前（%send_nickname%や○○さん等）を呼ぶのは【絶対に禁止】。質問や問いかけはOKです。
- **返信(1〜3)**: 相手を呼ぶときは、必ず「%send_nickname%」という文字列を使ってください。

### 2. URLの扱い
- インスタURL等のURLが記載されている行は、URLを削除し、文字も何も入れず【完全な空白の行】にしてください。「【空行】」といった説明文字も一切不要です。

### 3. 性別・恋愛ルール
- 自分は女性、相手は男性です。
- 自分の話は「彼氏募集中」「彼氏いない」、相手への質問は「彼女いるの？」としてください。

### 4. 構成のルール
- アタック3は、返信がないことに対して「脈なしかな？」「諦めるね」といったお別れの内容にしてください。
- 「私　⇔　○○さん」の行は絶対に変えない（○○のまま）。
- 挨拶や説明は不要。出力は「■キャラ名」から開始してください。

### お手本フォーマット
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: "あなたはデータ作成機です。挨拶はせず、指定された名前の置換ルールとURL削除ルールを厳守して出力してください。" }
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
