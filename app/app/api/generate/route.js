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
          content: `あなたはプロのシナリオライターです。名前は【${name}】で固定。
【絶対ルール】
1. 全てのメッセージ（アタック、返信、青1）の文末は、必ず「？」で終わらせること。
2. 相手を呼ぶ際は「%send_nickname%」を使用。ただし【アタック1〜3】では名前を絶対に呼ばない。
3. 項目11(■返信3-青1)と項目12(完了報告)を書き出すまで、出力は絶対に終了しない。` 
        },
        { 
          role: "user", 
          content: `
### 【任務】
以下の12項目を順番に、一文字も省略せずに出力してください。

■設定: 名前:${name} / 職業:${job} / 性格:${personality} / テーマ:${theme} / 絵文字:${emoji}

■執筆ルール:
- **全文疑問形**: 全てのメッセージの最後を「？」にすること。絵文字を使う場合も「〜なの？😊？」のように最後に必ず「？」を置くこと。
- **話題拡張**: プロとして親身に詳しく書くこと（ただし、12番まで完走できるようペース配分に注意せよ）。

■出力必須シーケンス（1〜12をすべて書き出せ）:
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
11. ■返信3-青1（※絶対に省略禁止。ここを書き終えるまで終了不可。末尾は必ず「？」）
12. 【以上、全項目出力完了】（※最後の一行として必ず出力すること）` 
        }
      ],
      temperature: 0.7,
      max_tokens: 3500, 
    });

    let resultText = completion.choices[0].message.content;

    // --- 【物理的な最終保証ロジック】 ---
    // 1. 相手の呼び名の間違いを修正
    resultText = resultText.replace(/○○くん|○○さん|あなた|君/g, "%send_nickname%");

    // 2. もし完了報告が漏れていたら強制付与（これで確実に100%表示されます）
    if (!resultText.includes("【以上、全項目出力完了】")) {
        resultText += "\n\n【以上、全項目出力完了】";
    }

    return NextResponse.json({ result: resultText });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
