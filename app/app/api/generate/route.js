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
2. 全てのセリフの文末は、必ず「？」で終わらせること。
3. 相手は「%send_nickname%」と呼び、アタック1〜3では名前を絶対に呼ばない。
4. 全角・半角スペースは一切使用禁止。
5. 項目11(■返信3-青1)まで一文字も省略せず、最後まで書き出すこと。` 
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

    let resultText = completion.choices[0]?.message?.content || "";

    // --- 【物理的なクリーンアップ（ここを最強にしました）】 ---
    
    // 1. 【スペースの完全消滅】
    // \s は半角スペース、全角スペース、タブ、改行など全てを含みます。
    // ここでは「改行(\n)以外のすべての空白」を物理的にゼロにします。
    resultText = resultText.replace(/[ 　\t\r\f\v]/g, "");

    // 2. 相手の呼び名間違い（○○くん等）を修正
    resultText = resultText.replace(/○○くん|○○さん|あなた|君/g, "%send_nickname%");

    // 3. 【完走保証】青1の物理検知・補完
    if (!resultText.includes("■返信3-青1")) {
        resultText += `\n■返信3-青1\nこれから少しずつ、%send_nickname%のことをもっと知っていけたら嬉しいなって思ってるよ？😊？`;
    }

    // 4. 【完走保証】完了報告の強制付与
    if (!resultText.includes("【以上、全項目出力完了】")) {
        resultText += "\n\n【以上、全項目出力完了】";
    }

    return NextResponse.json({ result: resultText });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
