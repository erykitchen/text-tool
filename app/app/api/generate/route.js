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

    // 1. 名前リスト(names.txt)から選出
    const namesFilePath = path.join(process.cwd(), "data", "names.txt");
    const namesData = fs.readFileSync(namesFilePath, "utf8");
    const nameList = namesData.split(/\r?\n/).filter(line => line.trim() !== "");
    const selectedName = nameList[Math.floor(Math.random() * nameList.length)];

    // 2. お手本(reference.txt)から1セット選出
    const refFilePath = path.join(process.cwd(), "data", "reference.txt");
    const rawRefData = fs.readFileSync(refFilePath, "utf8");
    const templates = rawRefData.split("***ここから次のデータ***").map(t => t.trim()).filter(t => t !== "");
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "あなたはプロのシナリオライターです。お手本の『形式（見出しの順序）』を完全に守りつつ、内容は『新しいテーマ』に沿ってゼロから創作してください。コピーではなく、完全な新作を書くことがあなたの仕事です。" 
        },
        { 
          role: "user", 
          content: `
### 【今回の創作条件】
- **名前**: 「${selectedName}」を使用せよ
- **テーマ**: ${theme}
- **口調**: ${tone}
- **絵文字**: ${emoji}

### 【執筆のルール】
1. **中身の創作**: 【お手本】の文章をコピーせず、上記のテーマに基づいた「新しいセリフや設定」を執筆してください。
2. **形式の死守**: 見出し（■返信3-青1など）の構成はお手本と一字一句同じにしてください。
3. **完走命令**: 最後の【■返信3-青1】まで、絶対に省略せずに書き切ること。

【お手本フォーマット（この構成を真似て中身を新しく書く）】
${selectedTemplate}

### 【最終確認】
プロのライターとして、${theme}に沿ったオリジナルの内容で、最後の「■返信3-青1」まで全て出力されていることを確認し、最後に「【以上、全項目出力完了】」と添えて送信せよ。` 
        }
      ],
      temperature: 0.8, // 創作性を高めるために少し上げました
      max_tokens: 3500,
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
