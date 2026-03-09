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
          content: "あなたはプロのシナリオライターであり、一文字の欠落も許さない検品官です。提供されたお手本の項目を【末尾の最後の一文字まで】完全に再現して出力してください。" 
        },
        { 
          role: "user", 
          content: `
### 【名前の絶対ルール】
- 日本の女優の下の名前を参考に「漢字表記」と「ひらがな表記」を完全にランダムで選べ。
- 「美波」「結衣」「すず」「かすみ」「奈緒」「芽郁」「環奈」「ありす」など、ひらがな固定をやめ、漢字を積極的に混ぜること。

### 【執筆完了の条件（省略は不合格）】
現在、最後の「■返信3-青1」が欠落する重大なエラーが発生しています。
プロのライターとして、以下の【全チェックリスト】を物理的に最後まで書き出すことが今回の任務です。

■全チェックリスト（この順に全て埋めること）:
1. ■キャラ名 〜 ■自己紹介
2. キャラ設定（カップ数 〜 インスタURL）
3. 【アタック1】〜【アタック3】
4. ■返信1、■返信1-青1
5. ■返信2、■返信2-青1
6. ■返信3
7. ■返信3-青1（←ここが最大の難所です。絶対に書き漏らさないでください）

テーマ: ${theme}
口調: ${tone}
絵文字: ${emoji}

【お手本フォーマット】
${template}

### 【最終確認】
最後の「■返信3-青1」を書き終えるまで、絶対に筆を置かないでください。` 
        }
      ],
      temperature: 0.9, 
      max_tokens: 3800, // 余裕を持って4000手前まで拡張
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
