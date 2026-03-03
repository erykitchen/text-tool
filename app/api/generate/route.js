import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    const prompt = `
以下の指示に従い、お手本の「形式」だけを使って、中身を100%新しく書き直してください。

### 1. 【厳守】呼び方のルール
- **アタック1, 2, 3**: 相手の名前（○○さん、%send_nickname%等）を呼ぶのは【絶対に禁止】です。また、相手への直接的な質問も控えてください。
- **返信1, 2, 3**: 相手を呼ぶときは必ず「%send_nickname%」を使ってください。

### 2. 【厳守】言葉の置き換え
- **「彼氏」は禁止**: あなたは女性キャラです。相手に恋人がいるか聞くときは必ず「彼女」と言ってください。
- 例：×「彼氏できました？」 → ○「彼女できました？」

### 3. 【厳守】URLの削除
- インスタURL等のURLが記載されている行は、URLを削除して【完全な空行】にしてください。

### 4. キャラクター設定
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾（絵文字・顔文字）: ${emoji}

### 5. 構成のルール
- 「私　⇔　○○さん」の行は絶対に変えない（○○のまま）。
- アタック3は「返事がないので諦める」お別れの内容。
- 返信3は「もっと仲良くなる」ための前向きな内容。
- 「■返信3-青1」まで全て書き出すこと。

### お手本（形式のみ利用し、内容は${job}に合わせて全て書き換えること）
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: "あなたは指示を100%守るデータ作成マシンです。お手本の内容に引きずられず、ルールに従ってURLの削除や言葉の置き換えを完遂してください。" }
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
