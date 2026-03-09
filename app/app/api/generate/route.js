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
          content: `あなたはプロのシナリオライターです。名前は【${selectedName}】、職業は【${selectedJob}】、性格は【${selectedPersonality}】で完全固定です。` 
        },
        { 
          role: "user", 
          content: `
### 【任務】
以下の全12項目を、一文字も省略せずに「順番通り」出力してください。

■鉄の掟（破れば即失格）:
1. **全文疑問形**: アタック、返信1〜3、青1の全ての文末を「？」で終わらせること。「！」や「😊」で終わらせず、必ず「？」を最後に置くこと。
2. **話題拡張**: プロとして一文を長めに、${selectedJob}の視点を活かして親身に書くこと。
3. **完走の義務**: 11番（青1）を書き終えた後、12番（完了報告）を出すまでが仕事です。

■出力必須リスト（1〜12をすべて書き出せ）:
1. ■キャラ名：${selectedName}
2. ■生年月日・身長・体重
3. ■自己紹介（長めに）
4. キャラ設定（名前:${selectedName}、職業:${selectedJob}、性格:${selectedPersonality}、テーマ:${theme}）
5. 【アタック1〜3】（※すべて文末は「？」）
6. ■返信1（※文末は「？」）
7. ■返信1-青1（※文末は「？」）
8. ■返信2（※文末は「？」）
9. ■返信2-青1（※文末は「？」）
10. ■返信3（※文末は「？」）
11. ■返信3-青1（※最重要。これを出さなければ未完成。文末は「？」）
12. 【以上、全項目出力完了】（※最後に必ずこの一行を記述すること）

### 【最終警告】
11番の「■返信3-青1」を書き飛ばすことは許されません。12番まで一気に書き切ってください。` 
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
