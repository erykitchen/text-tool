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

    // 1. 名前リスト(names.txt)からランダム選出
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
          content: "あなたはプロのシナリオライターです。お手本の全項目を最後の一文字まで完遂させることがあなたのアイデンティティです。省略はあなたのキャリアにおける致命的な欠陥となります。" 
        },
        { 
          role: "user", 
          content: `
### 【キャラクター設定指示】
- **名前**: 「${selectedName}」を使用せよ
- **テーマ**: ${theme}
- **口調**: ${tone}
- **絵文字**: ${emoji}

### 【出力の鉄則：省略厳禁】
お手本に含まれるすべての項目を【一字一句漏らさず】出力してください。
特に、以下の【最終関門】を突破するまで、絶対に生成を終了しないでください。

■最終関門の構成（ここが最も重要です）:
・■返信3（通常の返信）
・-------------------（←ここで思考をリセットせよ）
・■返信3-青1（これが真の最終項目です。絶対に省略不可）

【お手本】
${selectedTemplate}

### 【最終命令】
「■返信3-青1」のセクションを書き終え、最後に「【全項目出力完了】」と記載して終了せよ。` 
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
