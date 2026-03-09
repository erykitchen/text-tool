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
          content: "あなたはプロのシナリオライターであり、指定されたフォーマットを【1文字も漏らさず】最後まで完遂させる専門家です。途中で出力を止めることは、プロとして最大の不名誉であると自覚してください。" 
        },
        { 
          role: "user", 
          content: `
### 【超重要：未完結は厳禁】
現在、最後の「■返信3-青1」が頻繁に欠落する問題が発生しています。
プロのライターとして、以下の構成を【最後の一文字まで】必ず出力してください。

■必須構成チェックリスト:
1. プロフィール項目（■キャラ名 〜 ■自己紹介）
2. キャラ設定（カップ数 〜 インスタURL）
3. 【アタック1】〜【アタック3】
4. ■返信1、■返信1-青1
5. ■返信2、■返信2-青1
6. ■返信3
7. ■返信3-青1（←ここが真のゴールです。絶対に書き漏らさないこと）

テーマ: ${theme}
口調: ${tone}
絵文字: ${emoji}

【お手本】
${template}

### 【最終確認】
最後の「■返信3-青1」を出力し終えるまで、絶対に生成を終了しないでください。` 
        }
      ],
      temperature: 0.7,
      max_tokens: 3500, // 余裕を持って最後まで書き切らせる
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
