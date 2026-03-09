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

    // 1. 名前リスト(names.txt)からランダムに1つ選出
    const namesFilePath = path.join(process.cwd(), "data", "names.txt");
    const namesData = fs.readFileSync(namesFilePath, "utf8");
    const nameList = namesData.split(/\r?\n/).filter(line => line.trim() !== "");
    const selectedName = nameList[Math.floor(Math.random() * nameList.length)];

    // 2. お手本(reference.txt)からランダムに「1セット」だけ選出
    const refFilePath = path.join(process.cwd(), "data", "reference.txt");
    const rawRefData = fs.readFileSync(refFilePath, "utf8");
    
    // 区切り文字「***ここから次のデータ***」で分割
    const templates = rawRefData.split("***ここから次のデータ***").map(t => t.trim()).filter(t => t !== "");
    // その中からランダムに1つ選ぶ
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "あなたはプロのシナリオライターです。お手本にある全てのセクション（アタック1〜3、返信1〜3、青1等）を、最後の一文字まで完璧に出力することが絶対的な任務です。" 
        },
        { 
          role: "user", 
          content: `
### 【キャラクター設定指示】
- **名前**: 「${selectedName}」を使用せよ
- **テーマ**: ${theme}
- **口調**: ${tone}
- **絵文字**: ${emoji}

### 【出力の鉄則：省略は厳禁】
今から提示する【お手本】の構成を完全に再現してください。
特に、最後の【■返信3-青1】を絶対に省略しないでください。これを書き終えるまで出力を止めることは許されません。

■出力必須項目（順番通りに最後まで書き切ること）:
1. プロフィール（■キャラ名 〜 ■自己紹介）
2. キャラ設定
3. 【アタック1】〜【アタック3】
4. ■返信1 〜 ■返信1-青1
5. ■返信2 〜 ■返信2-青1
6. ■返信3
7. ■返信3-青1（←ここが最終ゴールです）

【お手本】
${selectedTemplate}

### 【最終命令】
必ず「■返信3-青1」まで出力し、最後に「【以上、全項目出力完了】」と記載して終了せよ。` 
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
