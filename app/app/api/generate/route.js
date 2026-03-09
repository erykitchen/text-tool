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
          content: "あなたはプロのシナリオライターです。あなたの執筆スタイルは、常に相手を惹きつける長文であり、かつ全てのメッセージの末尾を「？」で締めくくるのが特徴です。また、相手の呼び名は常に「%send_nickname%」に統一しており、特にアタック1〜3では相手の名前を一切呼ばない美学を持っています。" 
        },
        { 
          role: "user", 
          content: `
### 【新作シナリオ執筆依頼】
以下の全12項目を、プロのライターとして一文字も省略せずに順番に出力してください。

■指定データ: 名前:${name} / 職業:${job} / 性格:${personality} / テーマ:${theme} / 絵文字:${emoji}

■執筆の鉄則（一生忘れないでください）:
1. **名前固定**: キャラ名は必ず「${name}」を使用。
2. **呼び名固定**: 相手の呼び名は100%「%send_nickname%」で固定。
3. **アタックの制約**: 【アタック1〜3】の中では、相手の名前（%send_nickname%等）を絶対に呼ばない。
4. **全文疑問形**: 全てのメッセージの最後は、必ず相手への質問「？」で終わらせる。
5. **完全完走**: 11番（■返信3-青1）を書き終え、最後に「【以上、全項目出力完了】」と書くまでがあなたの仕事です。

■出力シーケンス:
1. ■キャラ名：${name}
2. ■プロフィール
3. ■自己紹介
4. キャラ設定（名前:${name}、職業:${job}、性格:${personality}、テーマ:${theme}）
5. 【アタック1〜3】（※相手を名前で呼ばない。末尾は必ず「？」）
6. ■返信1（※呼び名は%send_nickname% / 末尾は必ず「？」）
7. ■返信1-青1（※末尾は必ず「？」）
8. ■返信2（※呼び名は%send_nickname% / 末尾は必ず「？」）
9. ■返信2-青1（※末尾は必ず「？」）
10. ■返信3（※呼び名は%send_nickname% / 末尾は必ず「？」）
11. ■返信3-青1（※省略厳禁。末尾は必ず「？」）
12. 【以上、全項目出力完了】` 
        }
      ],
      temperature: 0.7, 
      max_tokens: 4000, 
    });

    let resultText = completion.choices[0].message.content;

    // --- プログラム側での最終防衛 ---
    // 1. 万が一の呼び名間違いを修正
    resultText = resultText.replace(/○○くん|○○さん|あなた|君/g, "%send_nickname%");
    
    // 2. 完了報告がなければ付与
    if (!resultText.includes("【以上、全項目出力完了】")) {
        resultText += "\n\n【以上、全項目出力完了】";
    }

    return NextResponse.json({ result: resultText });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
