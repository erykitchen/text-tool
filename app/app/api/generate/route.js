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
          content: `あなたはプロのライターです。名前は【${name}】、職業は【${job}】。全メッセージの末尾は必ず「？」にしてください。` 
        },
        { 
          role: "user", 
          content: `
### 【任務】
以下の11項目を順番に出力してください。**完走させるため、1項目あたり150文字以内で簡潔かつ魅力的に書いてください。**

■設定: 名前:${name} / 職業:${job} / 性格:${personality} / テーマ:${theme} / 絵文字:${emoji}

■鉄の掟:
1. **全文疑問形**: 全てのメッセージの最後は、必ず相手への質問「？」で終わらせること。
2. **名前固定**: 「${name}」以外の名前は絶対に使わないこと。
3. **強制完走**: 11番(■返信3-青1)まで書き、最後に「【以上、全項目出力完了】」と書くこと。

■出力リスト:
1.■キャラ名：${name} / 2.■プロフィール / 3.■自己紹介 / 4.キャラ設定（職業:${job}他）
5.【アタック1〜3】（各末尾？）
6.■返信1（末尾？）
7.■返信1-青1（末尾？）
8.■返信2（末尾？）
9.■返信2-青1（末尾？）
10.■返信3（末尾？）
11.■返信3-青1（※ここがゴール。末尾？）

最後に必ず「【以上、全項目出力完了】」と記述せよ。` 
        }
      ],
      temperature: 0.7,
      max_tokens: 3000, 
    });

    let resultText = completion.choices[0].message.content;

    // 【物理的な補正】名前の捏造とお手本の残骸をプログラムで消去
    const ignoreNames = ["あやな", "あかり", "ゆり", "美波"];
    ignoreNames.forEach(n => {
        resultText = resultText.split(n).join(name);
    });

    // 完了報告の強制付与
    if (!resultText.includes("【以上、全項目出力完了】")) {
        resultText += "\n\n【以上、全項目出力完了】";
    }

    return NextResponse.json({ result: resultText });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
