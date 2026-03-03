import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    let emojiInstruction = "";
    if (emoji === "使わない") {
      emojiInstruction = "絵文字、顔文字、特殊記号は一切禁止。テキストのみ。";
    } else if (emoji === "顔文字") {
      emojiInstruction = "絵文字禁止、顔文字のみ使用。";
    } else {
      emojiInstruction = `絵文字を${emoji}使用。`;
    }

    const prompt = `
あなたはプロのシナリオライターです。
お手本にある【すべての項目】を、最後の一文字まで省略せずに書き出してください。

### 1. 禁止事項・死守ルール
- **省略禁止**: 「以下同様」や、後半のカットは絶対にしないでください。■返信3-青1まで必ず書くこと。
- **固定文字**: 「私　⇔　○○さん」を書き換えない。
- **女性設定**: 「彼氏」は禁止、「彼女」にすること。
- **URL**: URLは空行（何も書かない）。

### 2. 執筆指示
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emojiInstruction}

### 3. 各項目のボリューム
- **自己紹介**: 3行以上。
- **アタック1〜3**: オリジナルで作成。アタック3は「お別れ」の内容。
- **返信1〜3・青1**: 各項目3行以上の丁寧な文章。

### お手本フォーマット
${template}

### 出力
お手本にある項目（■キャラ名 から ■返信3-青1 まで）を、順番通りにすべて新規執筆して出力してください。
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "あなたは途中で文章を止めず、最後まで完結させるライターです。全ての項目を埋めてください。" }
      ],
      temperature: 0.7,
      max_tokens: 2000, // ★ここを増やして、途中で切れるのを防ぎます
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
