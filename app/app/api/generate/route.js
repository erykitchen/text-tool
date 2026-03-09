import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export async function POST(req) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const { theme, tone, emoji, template } = await req.json();

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
### 【絶対遵守ルール】
1. お手本のフォーマットを【1文字も漏らさず】最初から最後まで完コピせよ。
2. 特に末尾の【■返信3-青1】などの項目を絶対に省略せず、すべて出力せよ。
3. 途中で文章をまとめたり、手抜きをすることは厳禁。

テーマ: ${theme}
口調: ${tone}
絵文字: ${emoji}

【お手本】
${template}

### 【最終確認】
お手本に含まれるすべての見出し項目（アタック1〜3、返信1〜3、青1等）がすべて出力されていることを確認してから送信せよ。` 
        }
      ],
      temperature: 0.7,
      // 最後まで書ききるためにトークン上限を少し余裕を持って設定（任意）
      max_tokens: 2500,
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
