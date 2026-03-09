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
【鉄則】
1. 名前は必ず「${name}」を使用。
2. 全ての文末は必ず「？」で終わらせること（例：😊？）。
3. 相手は「%send_nickname%」と呼び、アタック1〜3では名前を絶対に呼ばない。
4. 全角スペース（　）は絶対に使用禁止。` 
        },
        { 
          role: "user", 
          content: `
### 【重要任務】
以下の12項目を「1」から「12」まで順番に一文字も省略せず、最後まで出力してください。11番(■返信3-青1)を書き飛ばすことはプロとして許されません。

■設定: 名前:${name} / 職業:${job} / 性格:${personality} / テーマ:${theme} / 絵文字:${emoji}

■執筆ルール:
- 全文「？」で終わらせる。
- アタックでは名前を呼ばない。
- 返信では「%send_nickname%」を使う。

■出力必須シーケンス（1〜12を全て書き出せ）:
1. ■キャラ名：${name}
2. ■プロフィール
3. ■自己紹介
4. キャラ設定（名前:${name}、職業:${job}、性格:${personality}、テーマ:${theme}）
5. 【アタック1〜3】（※名前禁止 / 末尾は必ず「？」）
6. ■返信1（※呼び名は%send_nickname% / 末尾は必ず「？」）
7. ■返信1-青1（※末尾は必ず「？」）
8. ■返信2（※呼び名は%send_nickname% / 末尾は必ず「？」）
9. ■返信2-青1（※末尾は必ず「？」）
10. ■返信3（※呼び名は%send_nickname% / 末尾は必ず「？」）
11. ■返信3-青1（※絶対に省略禁止。ここを書き終えるまで終了不可 / 末尾は必ず「？」）
12. 【以上、全項目出力完了】`
        }
      ],
      temperature: 0.7,
      max_tokens: 3500, 
    });

    let resultText = completion.choices[0].message.content;

    // --- 【物理的なクリーンアップ（ここも固定）】 ---
    
    // 1. 全角スペース（　）をすべて削除
    resultText = resultText.replace(/　/g, "");

    // 2. 相手の呼び名の間違いを修正
    resultText = resultText.replace(/○○くん|○○さん|あなた|君/g, "%send_nickname%");

    // 3. 完了報告の強制付与（AIが書き漏らした場合の最終保険）
    if (!resultText.includes("【以上、全項目出力完了】")) {
        resultText += "\n\n【以上、全項目出力完了】";
    }

    return NextResponse.json({ result: resultText });
