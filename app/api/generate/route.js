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
      emojiInstruction = "絵文字や顔文字は一切禁止。";
    } else if (emoji === "顔文字") {
      emojiInstruction = "絵文字は使わず、顔文字（例：(^_^)）を適度に使用。";
    } else {
      emojiInstruction = `絵文字を${emoji}使用して。`;
    }

    const prompt = `
あなたはプロのシナリオライターです。
渡された「お手本」はあくまで【項目のフォーマット（構成）】としてのみ使用し、中身の文章は【職業：${job}】と【性格：${personality}】に合わせて、一から完全にオリジナルで書き上げてください。

### 絶対ルール
1. **中身は100%オリジナル**: お手本の文章をコピペせず、設定にふさわしい新しい自己紹介やセリフを作ってください。
2. **女性キャラ限定**: 恋愛対象は「彼女」とし、「彼氏」という言葉は使わないでください。
3. **URL削除**: インスタ等のURLは削除し、空白にしてください。「※削除しました」等の注釈も不要です。
4. **変数の使用**: 相手を呼ぶ際は「%send_nickname%」を使ってください（アタック1-3は除く）。
5. **固定文言**: 「私　⇔　○○さん（または君）」「※テンプレ 返信3まで」「--------------------------------------」等の記号的要素は、お手本の位置を維持して出力してください。

### キャラクター設定
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emojiInstruction}

### フォーマットの参照元（お手本）
${template}

### 出力の構成
お手本にある【項目名】はすべて維持しつつ、その中身（自己紹介、メッセージ内容など）を${job}と${personality}を反映した魅力的な内容に作り変えて出力してください。
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "あなたはキャラクター作成の専門家です。既存の文章をなぞるのではなく、設定から新しい物語を生み出します。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.8, // ★ここを上げることで、AIの創造性が増し、アレンジが強くなります
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
