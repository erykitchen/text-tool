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
      emojiInstruction = "絵文字、顔文字、音符、星、記号（💖、(*^^*)、♪、☆など）を一切使用しないでください。純粋な文字のみにしてください。";
    } else if (emoji === "顔文字") {
      emojiInstruction = "絵文字は使わず、顔文字（(^_^)など）のみを使用してください。";
    } else {
      emojiInstruction = `絵文字を${emoji}使用してください。`;
    }

    const prompt = `
あなたはプロのライターです。以下のルールを厳守してキャラクターを生成してください。

### 1. 【最優先】絶対に書き換えてはいけない部分
以下の文字列は、システム上の固定管理用テキストです。一字一句変えずにそのまま出力してください。
- 「私　⇔　○○さん」
- 「私　⇔　○○君」
- 「※テンプレ 返信3まで」
※「○○」の部分をキャラ名に書き換えるのは【絶対に禁止】です。

### 2. セリフ内の名前（変数）のルール
- 生成キャラの名前は「自分」です。
- メッセージを送る相手（ターゲット）のことは、必ず「%send_nickname%」と呼んでください。
- セリフの中で自分自身の名前（例：ゆうり、など）を呼ぶのは【不自然なので禁止】です。
- 【アタック1～3】では、相手の名前（%send_nickname%）すら呼ばないでください。

### 3. URLの削除ルール
- インスタURL等のURL箇所は、何も書かずに【完全な空行】にしてください。

### 4. キャラクター設定
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emojiInstruction}

### 各項目の生成内容
■キャラ名：ランダムな名前
■生年月日：24～35歳でランダム
■身長・体重：指定範囲内でランダム
■自己紹介：設定に合わせた新規文章
■タメ語■：
  - カップ数、名前（ひらがな）、職業、設定、絵文字の有無を正しく記入。

【アタック1～3】【返信1～3および追いメッセージ】：
- 相手への呼びかけは「%send_nickname%」に統一。
- 自分の名前をセリフに入れない。
- 設定に合わせたオリジナルの文章。

### お手本フォーマット（この形を崩さず、###は付けない）
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "「私　⇔　○○さん」は固定文字です。書き換えないでください。また、自分自身の名前をセリフの中で呼ばないでください。相手は%send_nickname%です。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
