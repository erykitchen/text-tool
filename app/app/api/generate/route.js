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
### 【執筆命令：絶対遵守】
プロのシナリオライターとして、以下の項目を【1つも省略せず】、必ず「■返信3-青1」まで書き切ってください。
たとえ【お手本】の中に項目が足りない場合でも、以下の構成を最優先して作成すること。

■必須構成リスト:
1. ■キャラ名 〜 ■自己紹介
2. キャラ設定（カップ数 〜 使用場所タグ、インスタURL）
3. 【アタック1】〜【アタック3】
4. ■返信1、■返信1-青1
5. ■返信2、■返信2-青1
6. ■返信3、■返信3-青1（←ここを絶対に忘れないこと）

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
      max_tokens: 3500,
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
