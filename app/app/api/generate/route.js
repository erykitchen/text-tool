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

    // 【新戦略】お手本から抽出した「完璧な構成案」を直接注入します
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "あなたはプロのシナリオライターです。名前は必ず「" + name + "」を使用し、相手を呼ぶ際は「%send_nickname%」と呼び、全ての文末を「？」にする独自の美学を持っています。" 
        },
        { 
          role: "user", 
          content: `
### 【任務：新作シナリオの執筆】
以下の「お手本の構成フロー」を厳守しつつ、設定に基づいて【${name}】としての新作を書き下ろしてください。

■設定: 名前:${name} / 職業:${job} / 性格:${personality} / テーマ:${theme} / 絵文字:${emoji}

■執筆の鉄則:
1. **全文疑問形**: アタック、返信、青1、すべての末尾を必ず「？」で終わらせること。
2. **名前の完全固定**: お手本の名前（あやり等）は絶対に無視し、「${name}」として書くこと。
3. **呼び名の固定**: 相手は「%send_nickname%」と呼ぶこと。**ただしアタック1〜3では名前を呼ばないこと。**

■出力必須シーケンス（お手本の流れを完全再現せよ）:
1. ■キャラ名：${name}
2. ■生年月日・身長・体重（${name}として設定）
3. ■自己紹介（${job}や${personality}を盛り込んだ長文）
4. キャラ設定（名前、職業、性格、テーマ、絵文字を整理）
5. 【アタック1〜3】（※相手の名前を呼ばない。各末尾は必ず「？」）
6. ■返信1（※呼び名は%send_nickname% / 末尾は「？」）
7. ■返信1-青1（※末尾は「？」）
8. ■返信2（※呼び名は%send_nickname% / 末尾は「？」）
9. ■返信2-青1（※末尾は「？」）
10. ■返信3（※呼び名は%send_nickname% / 末尾は「？」）
11. ■返信3-青1（※ここが物語の完結。末尾は「？」）
12. 【以上、全項目出力完了】（※最後に必ずこの1行を記述）` 
        }
      ],
      temperature: 0.7, 
      max_tokens: 4000, 
    });

    let resultText = completion.choices[0].message.content;

    // --- プログラム側での最終防衛 ---
    // AIが勝手に名前を捏造（あやり、あやね等）した場合、強制的に置換
    const namesToKill = ["あやり", "あやね", "あかり", "ゆり", "美波"];
    namesToKill.forEach(n => {
        resultText = resultText.split(n).join(name);
    });
    
    // 相手の名前呼びを強制修正
    resultText = resultText.replace(/○○くん|○○さん|あなた|君/g, "%send_nickname%");

    // 完了報告がなければ物理的に付与
    if (!resultText.includes("【以上、全項目出力完了】")) {
        resultText += "\n\n【以上、全項目出力完了】";
    }

    return NextResponse.json({ result: resultText });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
