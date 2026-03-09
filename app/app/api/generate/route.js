import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
          // 1. 名前を最優先で固定（名前間違い防止）
          content: `あなたはプロのシナリオライターです。名前は必ず【${name}】を使用してください。
【絶対ルール】
1. キャラ名は必ずリストから抽出された「${name}」をそのまま使用すること。
2. 全てのメッセージの文末は、必ず「？」で終わらせること。
3. 相手は「%send_nickname%」と呼び、アタック1〜3では名前を絶対に呼ばない。
4. 全角・半角スペースは一切使用禁止。
5. 項目11(■返信3-青1)を書き出すまで出力を絶対に止めないこと。` 
        },
        { 
          role: "user", 
          // 2. 成功していた時のプロンプト構成を完全復元（青1死守）
          content: `
### 【任務】
以下の12項目を「順番に一文字も省略せず」、最後まで出力してください。

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
      temperature: 0.7,
      max_tokens: 4000, 
    });

    let result = completion.choices[0]?.message?.content || "";

    // --- 【ここから「だけ」頑張ります（後処理）】 ---
    
    // 3. 行末のスペースを物理的に抹殺（スペース削除）
    result = result.split('\n').map(line => line.replace(/[ 　\t]+$/, "")).join('\n');

    // 4. 青1がない場合、物理的に強制追加（青1死守）
    const checkText = result.replace(/[\s　]/g, "");
    if (!checkText.includes("■返信3-青1")) {
        result = result.trim() + `\n\n■返信3-青1\nこれからももっと仲良くなれたら嬉しいなって思ってるよ？😊？`;
    }

    // 5. 完了報告も物理追加
    if (!checkText.includes("全項目出力完了")) {
        result = result.trim() + `\n\n【以上、全項目出力完了】`;
    }

    return NextResponse.json({ result: result });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
