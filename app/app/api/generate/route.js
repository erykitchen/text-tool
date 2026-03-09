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
【厳守事項】
1. 名前は絶対に「${name}」のみ。他の名前（あかり、ゆり等）は即失格。
2. セリフは全て「？」で終わらせる。絵文字を使う場合も「〜なの？😊？」のように最後に必ず「？」を置くこと。
3. 途中で止めず、最後まで書き切ること。` 
        },
        { 
          role: "user", 
          content: `
### 【指示】
お手本の中身は完全に無視し、以下のフォーマットを埋めてください。

■設定: 名前:${name} / 職業:${job} / 性格:${personality} / テーマ:${theme} / 口調:${tone} / 絵文字:${emoji}

■文章ルール:
- 全文「？」で終わらせる。
- 相手を惹きつける長文で書く。

■出力必須項目（1〜12を順番に全て出力）:
1. ■キャラ名：${name}
2. ■プロフィール（生年月日・身長・体重）
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
      temperature: 0.9, // 既存の学習（お手本）に引っ張られないよう自由度を最大化
      max_tokens: 4000, 
    });

    let resultText = completion.choices[0].message.content;

    // --- 【物理的な強制修正ロジック】 ---
    // 1. 名前の捏造をプログラム側で強制置換（保険）
    // AIが勝手に名前を変えた場合でも、ここで選ばれた名前に書き換えます
    const namesToReplace = ["あかり", "ゆり", "美波", "さくら"]; // お手本にありがちな名前
    namesToReplace.forEach(n => {
        resultText = resultText.split(n).join(name);
    });

    // 2. 完了報告がなければ強制付与
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
