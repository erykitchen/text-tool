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
          content: `あなたはプロのシナリオライターです。名前は【${selectedName}】、職業は【${selectedJob}】で固定。全11項目を完遂し、最後に『【以上、全項目出力完了】』と書くことがあなたの絶対的な任務です。` 
        },
        { 
          role: "user", 
          content: `
### 【任務】
以下の項目を「1」から「11」まで順番に全て出力してください。

■執筆の鉄則（死守せよ）:
1. **全文疑問形**: アタック1〜3、返信1〜3、青1の全ての文末を必ず「？」で終わらせること。
2. **話題拡張**: プロのライターとして、${selectedJob}の視点で親身に詳しく書いてください（ただし、最後まで書き切れるよう配分に注意せよ）。

■出力必須シーケンス:
1. ■キャラ名：${selectedName}
2. ■プロフィール（生年月日・身長・体重）
3. ■自己紹介（長めに）
4. キャラ設定（名前:${selectedName}、職業:${selectedJob}、性格:${selectedPersonality}、テーマ:${theme}、絵文字:${emoji}）
5. 【アタック1〜3】（すべて末尾は「？」）
6. ■返信1（末尾は「？」）
7. ■返信1-青1（末尾は「？」）
8. ■返信2（末尾は「？」）
9. ■返信2-青1（末尾は「？」）
10. ■返信3（末尾は「？」）
11. ■返信3-青1（※最重要。ここを書き終えるまで終了禁止。末尾は「？」）

最後に必ず独立した行で「【以上、全項目出力完了】」と記述して納品してください。` 
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
