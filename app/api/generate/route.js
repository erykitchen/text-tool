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
      emojiInstruction = "絵文字、顔文字、特殊記号、♪などは【一切禁止】。句読点のみ。";
    } else if (emoji === "顔文字") {
      emojiInstruction = "絵文字禁止、顔文字のみ使用。";
    } else {
      emojiInstruction = `絵文字を${emoji}使用。`;
    }

    const prompt = `
あなたは高性能なデータ変換エンジンです。
挨拶やAIとしての自己紹介は【一切不要】です。出力は必ず「■キャラ名」から始めてください。

### 1. 変換ルール（厳守）
- **完全な上書き**: お手本の【項目名】は維持しつつ、中身は【職業：${job}】【性格：${personality}】の女性キャラクターとして一から新しく書いてください。
- **固定文言**: 「私　⇔　○○さん」などの固定行は、1文字も変えずにお手本の位置のまま出力してください。
- **お別れの挨拶**: 【アタック3】は、返信が来ないことを寂しがりつつ、最後のお別れを告げる内容にしてください。
- **省略禁止**: 「■返信3-青1」まで、すべての項目を埋めてください。

### 2. キャラクター・セリフのルール
- 性別：女性（「彼氏」という言葉は禁止。「彼女」を使用すること）
- 相手への呼びかけ：必ず「%send_nickname%」を使う（アタック1〜3は名前を呼ばない）。
- 自分の名前：セリフの中で自分の名前を名乗るのは禁止です。

### 3. 外見・口調
- 口調：${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾：${emojiInstruction}

### お手本フォーマット（ここから開始して最後まで書ききること）
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "あなたはAIではありません。渡されたお手本フォーマットに、指定されたキャラ設定を流し込んで出力する専用の機械です。余計な挨拶や解説は一切排除してください。" },
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
