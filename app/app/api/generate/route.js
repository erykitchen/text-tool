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
          content: "あなたはプロのシナリオライターです。名前は必ず【" + selectedName + "】を使い、全てのメッセージの語尾を「？」にしてください。最後の完了報告まで書き出すことが絶対条件です。" 
        },
        { 
          role: "user", 
          content: `
### 【任務】
以下の項目を順番に、一文字も省略せずに出力してください。

■設定: 名前:${selectedName} / 性格:${selectedPersonality} / 職業:${selectedJob} / テーマ:${theme} / 口調:${tone} / 絵文字:${emoji}

■ルール:
- **全文疑問形**: アタック1〜3、返信1〜3、青1の全ての末尾を「？」で終わらせること。
- **話題拡張**: 相手に気に入ってもらえるよう、親身で長めの文章を心がけること。

■出力必須項目（1から11まで完遂せよ）:
1. ■キャラ名：${selectedName}
2. ■生年月日・身長・体重
3. ■自己紹介
4. キャラ設定（名前:${selectedName}、職業:${selectedJob}、性格:${selectedPersonality}、テーマ:${theme}）
5. 【アタック1〜3】
6. ■返信1
7. ■返信1-青1
8. ■返信2
9. ■返信2-青1
10. ■返信3
11. ■返信3-青1（←ここを書き終えるまで絶対に止まるな）

最後に必ず「【以上、全項目出力完了】」と1行添えて納品してください。` 
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
