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
      // 改行で分割し、空行を除去
      const list = data.split(/\r?\n/).filter(line => line.trim() !== "");
      // シンプルにランダム抽出
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
1. キャラ名は「${name}」を絶対に使用すること。
2. 全ての文末は必ず「？」で終わらせること（絵文字の後に「？」を置く）。
3. 相手は「%send_nickname%」と呼ぶこと。ただし【アタック1〜3】内では名前を絶対に呼ばないこと。
4. 文中に「全角スペース」を絶対に入れないこと。` 
        },
        { 
          role: "user", 
          content: `
### 【任務】
以下の12項目を順番に、一文字も省略せずに出力してください。

■設定: 名前:${name} / 職業:${job} / 性格:${personality} / テーマ:${theme} / 絵文字:${emoji}

■出力リスト:
1. ■キャラ名：${name}
2. ■プロフィール
3. ■自己紹介
4. キャラ設定（名前:${name}、職業:${job}、性格:${personality}、テーマ:${theme}）
5. 【アタック1〜3】（※相手の名前を呼ばない / 末尾は必ず「？」）
6. ■返信1（※呼び名は%send_nickname% / 末尾は必ず「？」）
7. ■返信1-青1（※末尾は必ず「？」）
8. ■返信2（※呼び名は%send_nickname% / 末尾は「？」）
9. ■返信2-青1（※末尾は「？」）
10. ■返信3（※呼び名は%send_nickname% / 末尾は「？」）
11. ■返信3-青1（※省略厳禁。ここを書き終えるまで終了不可 / 末尾は「？」）
12. 【以上、全項目出力完了】`
        }
      ],
      temperature: 0.8, // 多様性を出すために少し上げました
      max_tokens: 4000, 
    });

    let resultText = completion.choices[0].message.content;

    // --- 【物理的な最終クリーンアップ】 ---
    
    // 1. 全角スペース（　）をすべて削除
    resultText = resultText.replace(/　/g, "");

    // 2. 相手の呼び名の間違い（○○くん等）を強制修正
    resultText = resultText.replace(/○○くん|○○さん|あなた|君/g, "%send_nickname%");

    // 3. 完了報告が漏れていたら強制付与
    if (!resultText.includes("【以上、全項目出力完了】")) {
        resultText += "\n\n【以上、全項目出力完了】";
    }
    // ------------------------------------

    return NextResponse.json({ result: resultText });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
