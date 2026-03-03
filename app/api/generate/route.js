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
      emojiInstruction = "【厳禁】絵文字・顔文字・記号（♪、★、💖など）は一切禁止。文章は句読点（。、！？）のみで構成してください。";
    } else if (emoji === "顔文字") {
      emojiInstruction = "絵文字は使わず、顔文字（(^_^)など）を適度に使用。";
    } else {
      emojiInstruction = `絵文字を${emoji}使用してください。`;
    }

    const prompt = `
あなたはプロのシナリオライターです。
以下の【絶対ルール】と【構成案】に基づき、読み応えのあるキャラクター設定とメッセージを作成してください。

### 1. 絶対ルール
- **「私　⇔　○○さん」**は固定文字です。○○を書き換えたり改変したりしないでください。
- 生成キャラは【女性】です。恋愛対象を指す言葉は必ず**「彼女」**とし、「彼氏」という言葉は絶対に使わないでください。
- **URL削除**: URL箇所は何も書かずに【完全な空行】にしてください。
- **記号**: Markdown（###）は使用せず、項目は必ず「■」から始めてください。

### 2. 文章量と内容の指示
- **自己紹介**: 3〜5行程度で、職業や性格が伝わる魅力的な文章にしてください。
- **アタック3**: 「もう諦めるね」「寂しいけどお別れだね」といった、名残惜しいお別れの挨拶をしっかり長く書いてください。
- **返信1〜3**: 相手の興味を引くような、1メッセージあたり3行以上のボリュームで丁寧に書き下ろしてください。

### 3. 設定
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emojiInstruction}

### 各項目の生成ルール
■キャラ名：ランダムな姓名（ひらがな、漢字、カタカナ、ローマ字を混ぜる）
■生年月日：24～35歳になるようランダム
■身長・体重：指定範囲内でランダム
■自己紹介：上記設定を反映したオリジナルの文章（3行以上）
■タメ語■：指定のフォーマット（カップ数C-F、名前、職業、設定、絵文字の有無）

【アタック1】：初対面のアプローチ
【アタック2】：返信がない時の追いメッセージ
【アタック3】：【重要】返信がないので諦めてお別れを告げる、名残惜しいメッセージ
【返信1～3および青1】：相手（%send_nickname%）との会話を盛り上げる丁寧な文章

### お手本フォーマット
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "あなたは1つ1つのメッセージを丁寧に、かつルールを厳守して作成する作家です。文章が短くなりすぎないよう、詳細に描写してください。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
