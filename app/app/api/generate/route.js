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
          content: "あなたはプロのシナリオライターであり、フォーマット遵守の鬼です。提供されたお手本の全項目を【1つも省略せず】出力することがあなたの最も重要な任務です。" 
        },
        { 
          role: "user", 
          content: `
### 【超重要：執筆命令】
プロのシナリオライターとして、以下の【出力必須リスト】にある全項目を末尾まで1つも漏らさず書き出してください。
特に、最後の【■返信3-青1】は頻繁に書き漏らされています。今回は【絶対に】省略しないでください。

■出力必須リスト（この順に全て埋めること）:
1. ■キャラ名 〜 ■自己紹介
2. キャラ設定（カップ数 〜 使用場所タグ、インスタURL）
3. 【アタック1】〜【アタック3】
4. ■返信1、■返信1-青1
5. ■返信2、■返信2-青1
6. ■返信3
7. ■返信3-青1（←ここが最終ゴールです。必ず出力せよ）

テーマ: ${theme}
口調: ${tone}
絵文字: ${emoji}

【お手本フォーマット】
${template}

### 【最終チェック】
プロの意地にかけて、最後の「■返信3-青1」まで全てのセクションが出力されていることを確認してから送信せよ。` 
        }
      ],
      temperature: 0.7,
      max_tokens: 3500, // 物理的なカットを防ぐため
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
