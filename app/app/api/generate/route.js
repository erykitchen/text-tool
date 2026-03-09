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

    const name = getData("names.txt");
    const job = getData("jobs.txt");
    const personality = getData("personalities.txt");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: `あなたはプロのシナリオライターです。
【絶対ルール】
1. キャラ名は「${name}」のみ使用。他は一切禁止。
2. 全てのセリフ、メッセージの最後は必ず「？」で終わらせること（絵文字の後に「？」を置く）。
3. 項目11(■返信3-青1)と項目12(完了報告)を書き出すまで、出力は絶対に終了しない。` 
        },
        { 
          role: "user", 
          content: `
### 【任務】
以下の12項目を「1」から「12」まで順番に全て出力してください。

■設定: 名前:${name} / 職業:${job} / 性格:${personality} / テーマ:${theme} / 口調:${tone} / 絵文字:${emoji}

■執筆ルール:
- **全文疑問形**: アタック1〜3、返信1〜3、青1の全ての文末を「？」で終わらせてください。
- **話題拡張**: 相手に好かれるよう一文を長く、親身に詳しく書いてください。

■出力必須シーケンス（ここから一文字も漏らさず書き出せ）:
1. ■キャラ名：${name}
2. ■プロフィール（生年月日・身長・体重）
3. ■自己紹介
4. キャラ設定（名前:${name}、職業:${job}、性格:${personality}、テーマ:${theme}）
5. 【アタック1〜3】（※末尾は「？」）
6. ■返信1（※末尾は「？」）
7. ■返信1-青1（※末尾は「？」）
8. ■返信2（※末尾は「？」）
9. ■返信2-青1（※末尾は「？」）
10. ■返信3（※末尾は「？」）
11. ■返信3-青1（※絶対に省略禁止。末尾は「？」）
12. 【以上、全項目出力完了】（※最後の一行として必ず出力）

### 【最終警告】
プロとして、11番と12番を書き漏らすことは最大の恥辱です。必ず最後まで完遂してください。` 
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
