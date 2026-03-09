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
1. キャラ名は必ずリストから抽出された「${name}」をそのまま使用すること。
2. 全てのメッセージの文末は、必ず「？」で終わらせること（例：😊？）。
3. 相手は「%send_nickname%」と呼び、アタック1〜3では名前を絶対に呼ばない。
4. 全角スペース（　）は絶対に使用禁止。
5. 項目11(■返信3-青1)を書き出すまで出力を絶対に止めないこと。` 
        },
        { 
          role: "user", 
          content: `
### 【任務】
以下の12項目を「順番に一文字も省略せず」、最後まで出力してください。

■設定: 名前:${name} / 職業:${job} / 性格:${personality} / テーマ:${theme} / 絵文字:${emoji}

■出力シーケンス:
1. ■キャラ名：${name}
2. ■プロフィール
3. ■自己紹介
4. キャラ設定（名前:${name}、職業:${job}、性格:${personality}、テーマ:${theme}）
5. 【アタック1〜3】（※名前禁止 / 末尾は「？」）
6. ■返信1（※呼び名は%send_nickname% / 末尾は「？」）
7. ■返信1-青1（※末尾は「？」）
8. ■返信2（※呼び名は%send_nickname% / 末尾は「？」）
9. ■返信2-青1（※末尾は「？」）
10. ■返信3（※呼び名は%send_nickname% / 末尾は「？」）
11. ■返信3-青1（※絶対に省略禁止。末尾は必ず「？」）
12. 【以上、全項目出力完了】`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000, 
    });

    let rawText = completion.choices[0]?.message?.content || "";

    // --- 【後処理：ここが生命線です】 ---
    
    // 1. 各行の末尾にある不要なスペース（半角・全角）だけを削除し、即改行させる
    let finalText = rawText.split('\n')
      .map(line => line.replace(/[ 　\t]+$/, "")) 
      .join('\n');

    // 2. 相手の呼び名間違いを修正
    finalText = finalText.replace(/○○くん|○○さん|あなた|君/g, "%send_nickname%");

    // 3. 【青1・完了報告の死守ロジック】
    // スペースの有無に左右されないよう、一時的に空白を消した状態でチェック
    const dryRunCheck = finalText.replace(/[\s　]/g, "");

    if (!dryRunCheck.includes("■返信3-青1")) {
        finalText += `\n\n■返信3-青1\nこれから少しずつ、%send_nickname%のことをもっと知っていけたら嬉しいなって思ってるよ？😊？`;
    }
    if (!dryRunCheck.includes("全項目出力完了")) {
        finalText += "\n\n【以上、全項目出力完了】";
    }

    return NextResponse.json({ result: finalText });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
