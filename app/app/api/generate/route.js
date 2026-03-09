import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export async function POST(req) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const { theme, tone, emoji, template } = await req.json();

    // 修正済み：メソッドの呼び出しを正しい形に直しました
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "あなたはプロのシナリオライターです。ユーザーが提供するお手本のフォーマットを完全に再現し、指定されたテーマ、口調、絵文字の有無に従って新しいキャラクター設定を生成してください。" 
        },
        { 
          role: "user", 
          content: `
### 【執筆命令：絶対遵守】
プロのシナリオライターとして、お手本にある全ての項目を【1つも省略せず】、末尾の「■返信3-青1」まで書き切ってください。

1. お手本のフォーマットを【1文字も漏らさず】最初から最後まで完コピせよ。
2. 特に末尾の【■返信3-青1】などの項目を絶対に省略せず、すべて出力せよ。
3. 全項目を書き終えたら、最後の一行に必ず「【以上、全項目出力完了】」と記載せよ。

テーマ: ${theme}
口調: ${tone}
絵文字: ${emoji}

【お手本】
${template}

### 【最終確認】
最後の「■返信3-青1」まで全て出力されていることを確認し、最後に「【以上、全項目出力完了】」と添えて送信せよ。` 
        }
      ],
      temperature: 0.7,
      max_tokens: 3500, // 末尾まで余裕を持って書き切るための設定
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
