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
      emojiInstruction = "絵文字・顔文字・記号（♪、★、💖など）は一切禁止。句読点のみ。";
    } else if (emoji === "顔文字") {
      emojiInstruction = "絵文字禁止、顔文字のみ使用。";
    } else {
      emojiInstruction = `絵文字を${emoji}使用してください。`;
    }

    const prompt = `
# 役割
あなたはゲーム・演劇用のキャラクター設定ライターです。
以下の【構成案】をベースに、指定された【設定】に沿った女性キャラクターの台本を100%新規で書き下ろしてください。

# 設定（最優先）
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emojiInstruction}
- 性別: 女性（「彼女」と呼び、「彼氏」は禁止）

# 厳守ルール
1. **フォーマット固定**: 各項目は必ず「■」から始め、「###」は使用しない。「私　⇔　○○さん」等の固定行は改変禁止。
2. **URL消去**: URLが含まれる箇所は何も書かずに【空行】にすること。
3. **内容の刷新**: お手本の内容（趣味・エピソード等）はすべて破棄し、${job}と${personality}に基づいた文章を作成。
4. **アタック3**: 「返信がないので諦めてお別れを告げる、寂しげな挨拶」にすること。
5. **省略禁止**: 「■返信3-青1」まで全ての項目を必ず埋めること。

# お手本フォーマット
${template}
`;

    const response = await openai.chat.completions.create({
      // モデルをより賢く、指示に忠実な gpt-4o-mini に変更します
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: "あなたはクリエイティブな執筆アシスタントです。ユーザーの提示するテンプレートの形式に従い、健全なロールプレイ用のキャラクター台本を作成します。省略や拒否をせず、最後まで出力してください。" }
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
