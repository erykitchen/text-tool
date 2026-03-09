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
          content: "あなたはプロのシナリオライターです。お手本のフォーマットを【最後の一文字まで】完全に再現し、指定されたテーマ、口調、絵文字の有無に従って生成してください。" 
        },
        { 
          role: "user", 
          content: `
### 【名前の選定ルール（厳守）】
■キャラ名は、日本の実在する女優の下の名前を参考にしてください。
- **必ず「漢字表記」と「ひらがな表記」を50%ずつの確率でランダムに選べ。**
- 「結衣」「美波」「すず」「環奈」「かすみ」「奈緒」「芽郁」「ひより」「ありす」など、今風でリアリティのある名前を使い、ひらがなばかりに偏るな。

### 【出力の鉄則（省略は即失格）】
お手本に含まれる「■返信3-青1」まで、1つも項目を飛ばさずに書き切ってください。
**出力の最後は必ず「■返信3-青1」の文章で終わらせ、その後に改行して「【全項目出力完了】」と記述して締めくくれ。**

■必須構成:
1. プロフィール（■キャラ名 〜 ■自己紹介）
2. キャラ設定（カップ数 〜 インスタURL）
3. 【アタック1】〜【アタック3】
4. ■返信1 〜 ■返信1-青1
5. ■返信2 〜 ■返信2-青1
6. ■返信3 〜 ■返信3-青1（←ここが最終到達地点。絶対に省略不可）

テーマ: ${theme}
口調: ${tone}
絵文字: ${emoji}

【お手本フォーマット】
${template}

### 【最終確認】
プロとして、末尾の「■返信3-青1」を書き終えるまで、絶対に生成を中断するな。` 
        }
      ],
      temperature: 0.9, // 名前や内容のランダム性をさらに高めるため0.8→0.9にアップ
      max_tokens: 3500,
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
