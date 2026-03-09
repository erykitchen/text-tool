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

    // 1. 各データファイルを読み込んでランダム選出
    const getData = (fileName) => {
      const filePath = path.join(process.cwd(), "data", fileName);
      const data = fs.readFileSync(filePath, "utf8");
      const list = data.split(/\r?\n/).filter(line => line.trim() !== "");
      return list[Math.floor(Math.random() * list.length)];
    };

    const selectedName = getData("names.txt");
    const selectedPersonality = getData("personalities.txt");
    const selectedJob = getData("jobs.txt");

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
          content: `あなたはプロのシナリオライターです。名前は必ず「${selectedName}」、職業は「${selectedJob}」、性格は「${selectedPersonality}」として執筆してください。` 
        },
        { 
          role: "user", 
          content: `
### 【今回の創作条件】
- **名前**: ${selectedName}（※必ずこの名前を使うこと）
- **職業**: ${selectedJob}
- **性格**: ${selectedPersonality}
- **追加設定/テーマ**: ${theme}
- **口調**: ${tone}
- **絵文字**: ${emoji}

### 【執筆のルール】
1. **文章の質**: 相手に好印象を与え、仲良くなりたい気持ちが伝わるよう、一文を少し長めに詳しく書いてください。話題を広げつつ、文の最後は必ず「相手のこと」を聞く疑問形で締めてください。
2. **形式の死守**: 見出し（■返信3-青1など）の構成はお手本と一字一句同じにし、最後の一文字まで絶対に省略しないでください。
3. **中身の創作**: お手本の文章をコピーせず、上記の設定に基づいて新しい内容で執筆してください。

【お手本フォーマット（構成のみを継承）】
${selectedTemplate}

### 【出力の鉄則】
必ず「■返信3-青1」まで到達してください。最後に「【以上、全項目出力完了】」と記載して終了せよ。` 
        }
      ],
      temperature: 0.8,
      max_tokens: 3500,
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
