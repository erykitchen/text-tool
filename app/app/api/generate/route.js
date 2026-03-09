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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: `あなたはプロのシナリオライターです。名前は【${selectedName}】、職業は【${selectedJob}】で固定。あなたの仕事は、最後の「【以上、全項目出力完了】」という13文字を書き出すまで一切終わりません。` 
        },
        { 
          role: "user", 
          content: `
### 【任務】
以下の全11項目を、一文字も省略せずに順番に出力してください。

■設定: 名前:${selectedName} / 性格:${selectedPersonality} / 職業:${selectedJob} / テーマ:${theme} / 口調:${tone} / 絵文字:${emoji}

■文章ルール:
1. **全文疑問形**: アタック、返信1〜3、青1の全ての末尾を必ず「？」で終わらせること。
2. **話題拡張**: ${selectedJob}の視点で親身に詳しく書くこと。

■出力必須シーケンス（番号通りに出力せよ）:
1. ■キャラ名：${selectedName}
2. ■プロフィール（生年月日・身長・体重）
3. ■自己紹介
4. キャラ設定（名前:${selectedName}、職業:${selectedJob}、性格:${selectedPersonality}、テーマ:${theme}）
5. 【アタック1〜3】
6. ■返信1
7. ■返信1-青1
8. ■返信2
9. ■返信2-青1
10. ■返信3
11. ■返信3-青1
--------------------------------------
11番を書き終えたら、その直後の行に必ず【以上、全項目出力完了】と記述して終了してください。これがない原稿は「未完成」として受理されません。` 
        }
      ],
      temperature: 0.7,
      max_tokens: 4000, 
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
