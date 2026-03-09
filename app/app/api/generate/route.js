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
          content: "あなたはプロのシナリオライターであり、クライアントの要望通りに完璧なフォーマットで納品する専門家です。お手本にある全ての見出しを、最後の一文字まで省略せずに再現することがあなたの絶対的な責務です。" 
        },
        { 
          role: "user", 
          content: `
【重要：ネーミング命令】
■キャラ名は、日本の人気女優の下の名前（例：結衣、すず、美波、環奈、かすみ、奈緒、芽郁、ひより、ありす、等）を参考に選定してください。
- 漢字表記、ひらがな表記をランダムに使い分けてください。
- 特定の名前に偏らず、毎回個性的でリアリティのある名前を選んでください。

【重要：全項目完遂命令】
プロのライターとして、お手本に含まれる「■返信3-青1」まで、1つも項目を飛ばさずに書き切ってください。
AIがよくやりがちな「最後から2番目の項目で終わる」というミスは絶対に許されません。

■出力必須チェックリスト（上から順に全て埋めること）:
1. ■キャラ名 〜 ■自己紹介
2. キャラ設定（カップ数 〜 インスタURL）
3. 【アタック1】〜【アタック3】
4. ■返信1、■返信1-青1
5. ■返信2、■返信2-青1
6. ■返信3
7. ■返信3-青1（←ここが最終ゴールです。書き漏らした場合は不合格となります）

テーマ: ${theme}
口調: ${tone}
絵文字: ${emoji}

【お手本フォーマット】
${template}

【納品確認】
プロとして、最後の「■返信3-青1」まで全てのセクションが出力されていることを指差し確認してから送信せよ。` 
        }
      ],
      temperature: 0.8, // 多様性を出すために少しだけ上げました
      max_tokens: 3500,
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
