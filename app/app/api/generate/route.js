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
1. キャラ名は必ず「${name}」のみ使用し、他の名前は一切禁止。
2. 全てのセリフ（アタック、返信）の文末は、必ず「？」で終わらせること。
3. 相手は「%send_nickname%」と呼び、アタック1〜3では名前禁止。
4. 全角・半角スペースは一切使用禁止（即改行すること）。
5. 項目11(■返信3-青1)まで一文字も省略せず書き出すこと。` 
        },
        { 
          role: "user", 
          content: `
### 【任務】
以下の12項目を順番に出力してください。

■設定: 名前:${name} / 職業:${job} / 性格:${personality} / テーマ:${theme} / 絵文字:${emoji}

■出力シーケンス:
1. ■キャラ名：${name}
2. ■プロフィール
3. ■自己紹介
4. キャラ設定（名前:${name}、職業:${job}、性格:${personality}、テーマ:${theme}）
5. 【アタック1〜3】
6. ■返信1
7. ■返信1-青1
8. ■返信2
9. ■返信2-青1
10. ■返信3
11. ■返信3-青1
12. 【以上、全項目出力完了】`
        }
      ],
      temperature: 0.3, // ランダム性を抑え、指示への忠実度を上げる
    });

    let rawText = completion.choices[0]?.message?.content || "";

    // --- 【本気の物理クリーンアップ】 ---

    let processedLines = rawText.split('\n').map(line => {
        // 1. 行末の空白（半角・全角・タブ）を物理的に根絶
        let cleanedLine = line.replace(/[ 　\t]+$/, "");

        // 2. セリフ行（【アタック】や■返信）の文末が「？」でなければ強制付与
        // ただし、項目名やURL、設定行は除外
        if (cleanedLine.match(/(】|■返信.*|よ。|ね。|ます。|だ。|だよ。|✨|😊|💖|💕)$/) && 
            !cleanedLine.includes("■キャラ名") && 
            !cleanedLine.includes("URL") &&
            !cleanedLine.includes("キャラ設定")) {
            if (!cleanedLine.endsWith("？")) {
                cleanedLine += "？";
            }
        }
        return cleanedLine;
    });

    let finalText = processedLines.join('\n');

    // 3. 名前間違いとスペースの最終掃除
    finalText = finalText.replace(/○○くん|○○さん|あなた|君/g, "%send_nickname%");
    
    // 4. 【青1・完了報告の強制保証】
    const checkTarget = finalText.replace(/[\s　]/g, "");
    if (!checkTarget.includes("■返信3-青1")) {
        finalText += `\n\n■返信3-青1\nこれから少しずつ、%send_nickname%のことをもっと知っていけたら嬉しいなって思ってるよ？😊？`;
    }
    if (!checkTarget.includes("全項目出力完了")) {
        finalText += "\n\n【以上、全項目出力完了】";
    }

    return NextResponse.json({ result: finalText });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
