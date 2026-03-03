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
      emojiInstruction = "絵文字・顔文字・記号（♪、★、💖など）は一切禁止。文字のみ。";
    } else if (emoji === "顔文字") {
      emojiInstruction = "絵文字禁止、顔文字のみ使用。";
    } else {
      emojiInstruction = `絵文字を${emoji}使用してください。`;
    }

    const prompt = `
以下の【新設定】に基づき、お手本フォーマットの「中身」だけをすべて書き換えて出力せよ。
余計な挨拶や「承知しました」等の前置きは一切不要。いきなり「■キャラ名」から書き始めること。

# 新設定
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emojiInstruction}
- 性別: 女性（「彼氏」という言葉は禁止。必ず「彼女」とすること）

# 厳守ルール
1. **URL完全削除**: URLが含まれる箇所は、何も書かずに【空行】にすること。
2. **固定行維持**: 「私　⇔　○○さん（または君）」は1文字も変えず、○○もそのまま残すこと。
3. **内容刷新**: お手本の趣味や運動などのエピソードは捨て、${job}と${personality}で新しく書くこと。
4. **アタック3**: 必ず「お別れを告げる寂しいメッセージ」にすること。
5. **省略禁止**: 「■返信3-青1」まで、すべての項目を埋めること。

# お手本（この形式をコピーし、中身だけを新設定で埋めろ）
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: "あなたは指示された設定をフォーマットに流し込むだけの出力専用マシンです。会話はせず、指定された項目を埋めることにのみ集中してください。#等のMarkdownは禁止です。" }
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
