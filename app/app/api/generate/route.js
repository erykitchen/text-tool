import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export async function POST(req) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const { theme, tone, emoji, template } = await req.json();

    const completion = await openai.chat.com openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "あなたはプロのシナリオライターです。ユーザーが提供するお手本のフォーマットを完全に再現し、指定されたテーマ、口調、絵文字の有無に従って新しいキャラクター設定を生成してください。" 
        },
        { 
          role: "user", 
          content: `
### 【絶対遵守ルール】
1. お手本のフォーマットを【1文字も漏らさず】最初から最後まで完コピせよ。
2. 特に末尾の【■返信3-青1】のセクションまで、全項目を絶対に省略せず、すべて出力せよ。
3. 途中で文章をまとめたり、手抜きをすることは厳禁。
4. 全項目を書き終えたら、最後の一行に必ず「【以上、全項目出力完了】」と記載せよ。

テーマ: ${theme}
口調: ${tone}
emoji: ${emoji}

【お手本】
${template}

### 【最終確認】
プロのライターとして、最後の「■返信3-青1」まで全て出力されていることを確認し、最後に「【以上、全項目出力完了】」と添えて送信せよ。` 
        }
      ],
      temperature: 0.7,
      // 物理的なカットを防ぐため、上限をさらに引き上げました
      max_tokens: 3500,
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
