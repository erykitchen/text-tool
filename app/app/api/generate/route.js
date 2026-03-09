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

    // 1. リストから1つずつピックアップ
    const name = getData("names.txt");
    const job = getData("jobs.txt");
    const personality = getData("personalities.txt");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "あなたはプロのシナリオライターです。名前は必ず「" + name + "」を使用し、全ての文末を「？」にしてください。相手は「%send_nickname%」と呼びますが、アタック1〜3では名前を呼びません。" 
        },
        { 
          role: "user", 
          content: `
以下の12項目を順番に出力してください。

■設定: 名前:${name} / 職業:${job} / 性格:${personality} / テーマ:${theme} / 絵文字:${emoji}

■執筆ルール:
1. 名前は「${name}」で固定。
2. 相手は「%send_nickname%」と呼ぶ（アタック1〜3では名前を呼ばない）。
3. 全文、文末は「？」で終わらせる。

■出力リスト:
1. ■キャラ名：${name}
2. ■プロフィール
3. ■自己紹介
4. キャラ設定
5. 【アタック1〜3】（※名前を呼ばない / 末尾？）
6. ■返信1（※呼び名は%send_nickname% / 末尾？）
7. ■返信1-青1（※末尾？）
8. ■返信2（※呼び名は%send_nickname% / 末尾？）
9. ■返信2-青1（※末尾？）
10. ■返信3（※呼び名は%send_nickname% / 末尾？）
11. ■返信3-青1（※末尾？）
12. 【以上、全項目出力完了】` 
        }
      ],
      temperature: 0.7,
      max_tokens: 3000, 
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
