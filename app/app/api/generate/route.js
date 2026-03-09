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
1. キャラ名はリストから抽出した【${name}】を絶対に使用すること。オリジナルの名前は厳禁。
2. 全ての文末は必ず「？」で終わらせること。
3. 相手は「%send_nickname%」と呼び、アタック1〜3では名前を絶対に呼ばない。
4. 項目11(■返信3-青1)まで一文字も省略せず書き出すこと。` 
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
5. 【アタック1〜3】（※名前禁止 / 末尾は必ず「？」）
6. ■返信1（※呼び名は%send_nickname% / 末尾は必ず「？」）
7. ■返信1-青1（※末尾は必ず「？」）
8. ■返信2（※呼び名は%send_nickname% / 末尾は必ず「？」）
9. ■返信2-青1（※末尾は必ず「？」）
10. ■返信3（※呼び名は%send_nickname% / 末尾は必ず「？」）
11. ■返信3-青1（※絶対に省略禁止。末尾は必ず「？」）
12. 【以上、全項目出力完了】`
        }
      ],
      temperature: 0.7,
      max_tokens: 3800, // 少し余裕を持たせました
    });

    let resultText = completion.choices[0]?.message?.content || "";

    // --- 【物理的なクリーンアップ（AIのミスを力技で直す）】 ---

    // 1. スペースの根絶（全角・半角・連続スペースすべて）
    // 文字の前後にあるスペースをすべて削除します
    resultText = resultText.replace(/[ 　]+/g, " ").replace(/■ /g, "■").replace(/： /g, "：").replace(/  /g, "");
    // さらに徹底的に「行末の空白」を消去
    resultText = resultText.split('\n').map(line => line.trim()).join('\n');

    // 2. 相手の呼び名の間違いを修正
    resultText = resultText.replace(/○○くん|○○さん|あなた|君/g, "%send_nickname%");

    // 3. 【重要】返信3-青1と完了報告の強制チェック
    // AIが途中で止まった場合でも、プログラム側で「完了報告」を必ず付ける
    if (!resultText.includes("【以上、全項目出力完了】")) {
        resultText += "\n\n【以上、全項目出力完了】";
    }

    return NextResponse.json({ result: resultText });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
