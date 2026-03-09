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
          content: `あなたはプロのシナリオライターです。今回は必ず名前を【${selectedName}】、職業を【${selectedJob}】、性格を【${selectedPersonality}】に固定して執筆してください。` 
        },
        { 
          role: "user", 
          content: `
### 【任務】
以下の「全12項目」を順番に、一文字も省略せず、すべてオリジナルの新作文章で埋めてください。

■執筆の鉄則:
1. **全文疑問形**: アタック、返信、青1、すべてのメッセージの最後は、必ず相手への質問「？」で締めること。
2. **話題拡張**: 相手に好かれるよう一文を長く、親身に詳しく、${selectedJob}らしい視点で書くこと。
3. **完全完走**: 11番の「■返信3-青1」を書き終えるまで、絶対に終了しないでください。

■出力必須シーケンス（ここから12番まで全て書き出せ）:
1. ■キャラ名：${selectedName}
2. ■生年月日
3. ■身長
4. ■体重
5. ■自己紹介
6. キャラ設定（カップ数、職業:${selectedJob}、性格:${selectedPersonality}、テーマ:${theme}、絵文字:${emoji}）
7. 【アタック1〜3】
8. ■返信1、■返信1-青1
9. ■返信2、■返信2-青1
10. ■返信3
11. ■返信3-青1
12. 【以上、全項目出力完了】

### 【最終確認命令】
プロとして、12番の「【以上、全項目出力完了】」を記述するまで、あなたの仕事は一切完了したとみなされません。必ず最後まで到達してください。` 
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
