import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const { theme, tone, emoji } = await req.json();

    const getData = (fileName) => {
      const filePath = path.join(process.cwd(), "data", fileName);
      const data = fs.readFileSync(filePath, "utf8");
      const list = data.split(/\r?\n/).filter(line => line.trim() !== "");
      return list[Math.floor(Math.random() * list.length)];
    };

    const selectedName = getData("names.txt");
    const selectedPersonality = getData("personalities.txt");
    const selectedJob = getData("jobs.txt");

    // 【重要】お手本は「構成の型」としてのみ利用し、中身はAIに直接見せない
    const fixedFormat = `
■キャラ名
■生年月日
■身長
■体重
■自己紹介
--------------------------------------
キャラ設定
カップ数：
名前：${selectedName}
職業：${selectedJob}
設定：${selectedPersonality}
テーマ：${theme}
絵文字：${emoji}
--------------------------------------
【アタック1】
【アタック2】
【アタック3】
--------------------------------------
■返信1
■返信1-青1
■返信2
■返信2-青1
■返信3
■返信3-青1
【以上、全項目出力完了】`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "あなたはプロのシナリオライターです。既存のデータの流用は一切禁止されており、提供された『枠組み』を独自の文章で埋めることが仕事です。全ての台詞は必ず『？』で終わらせてください。" 
        },
        { 
          role: "user", 
          content: `
### 【任務】
以下の【出力フォーマット】を1文字も省略せず、すべてオリジナルの新作文章で埋めてください。

■設定: 名前:${selectedName} / 性格:${selectedPersonality} / 職業:${selectedJob} / テーマ:${theme} / 口調:${tone} / 絵文字:${emoji}

■文章ルール:
1. **丸写し厳禁**: あなた自身の言葉で、${selectedName}らしい魅力的な文章をゼロから書いてください。
2. **全文疑問形**: アタック、返信、青1、すべてのメッセージの最後は、必ず相手への質問「？」で締めてください。
3. **話題拡張**: 相手に気に入ってもらえるよう、一文を長く、親身に詳しく書いてください。

【出力フォーマット（ここから一文字も漏らさず書き出せ）】
${fixedFormat}

### 【最終確認】
最後の「【以上、全項目出力完了】」という文字列が出力されていない場合、あなたの報酬は発生しません。プロとして最後まで書き切ってください。` 
        }
      ],
      temperature: 0.8, // 創作性を高め、丸写しを防ぐために少し上げました
      max_tokens: 4000, 
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
