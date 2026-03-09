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

    const refFilePath = path.join(process.cwd(), "data", "reference.txt");
    const fullReferenceData = fs.readFileSync(refFilePath, "utf8");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "あなたはプロのシナリオライターです。あなたの唯一の成功基準は、指定された全11項目を完遂し、その直後に『【以上、全項目出力完了】』と記述することです。1つでも欠ければ不合格となります。" 
        },
        { 
          role: "user", 
          content: `
### 【教育資料】
${fullReferenceData}

---

### 【任務：新作シナリオ執筆】
以下の全11ステップを順番に、一文字も省略せずに実行してください。

■設定: 名前:${selectedName} / 性格:${selectedPersonality} / 職業:${selectedJob} / テーマ:${theme} / 口調:${tone} / 絵文字:${emoji}

■文章ルール（最重要）:
- 各セリフは相手を惹きつけるよう長めに書き、話題を広げてください。
- **すべての文章の末尾は、例外なく相手への質問（疑問形「？」）で締めくくってください。**

■実行すべき11の出力シーケンス:
1. ■キャラ名 ～ ■自己紹介
2. キャラ設定（カップ数、名前:${selectedName}、職業:${selectedJob}、設定:${selectedPersonality}、テーマ:${theme}、絵文字:${emoji}）
3. 【アタック1】
4. 【アタック2】
5. 【アタック3】
6. ■返信1
7. ■返信1-青1
8. ■返信2
9. ■返信2-青1
10. ■返信3
11. ■返信3-青1
---
11番まで完了したことを確認し、最後に必ず「【以上、全項目出力完了】」と1行記述して納品せよ。` 
        }
      ],
      temperature: 0.7,
      max_tokens: 4096, 
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
