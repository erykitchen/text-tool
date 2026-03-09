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

    // --- 1. 名前リスト(names.txt)を読み込む ---
    const namesFilePath = path.join(process.cwd(), "data", "names.txt");
    const namesData = fs.readFileSync(namesFilePath, "utf8");
    const nameList = namesData.split(/\r?\n/).filter(line => line.trim() !== "");
    const selectedName = nameList[Math.floor(Math.random() * nameList.length)];

    // --- 2. お手本(reference.txt)を読み込む ---
    const refFilePath = path.join(process.cwd(), "data", "reference.txt");
    const template = fs.readFileSync(refFilePath, "utf8");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "あなたはプロのシナリオライターであり、フォーマット遵守の専門家です。お手本の全項目を最後の一文字まで再現することがあなたの絶対的な責務です。" 
        },
        { 
          role: "user", 
          content: `
### 【キャラクター設定指示】
- **今回の名前**: 「${selectedName}」を必ず使用してください。
- **テーマ**: ${theme}
- **口調**: ${tone}
- **絵文字**: ${emoji}

### 【出力の鉄の掟（省略は厳禁）】
プロのライターとして、以下のお手本フォーマットを【1文字も漏らさず】、必ず末尾の「■返信3-青1」まで書き切ってください。
途中で文章をまとめたり、最後の項目を削ることは絶対に許されません。

【お手本フォーマット】
${template}

### 【最終確認】
最後の「■返信3-青1」まで全て出力されていることを確認し、最後に「【以上、全項目出力完了】」と添えて送信せよ。` 
        }
      ],
      temperature: 0.7,
      max_tokens: 3500,
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
