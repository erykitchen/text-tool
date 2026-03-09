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

    // 2. お手本(reference.txt)を全体として読み込む
    const refFilePath = path.join(process.cwd(), "data", "reference.txt");
    const fullReferenceData = fs.readFileSync(refFilePath, "utf8");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "あなたはプロのシナリオライターです。提供されるお手本データ群から共通の構成ルールを完璧に把握し、一文字の妥協も許さず、指定された全項目を完遂させることがあなたの絶対的な使命です。" 
        },
        { 
          role: "user", 
          content: `
### 【教育資料：お手本リスト】
※以下のデータから「構成の型（見出しの順序と種類）」を深く学習せよ。
${fullReferenceData}

---

### 【プロの執筆任務：完全新作シナリオ】
お手本の構成を100%維持したまま、以下の設定に基づき、相手を惹きつける魅力的な新作を執筆してください。

■キャラクター設定（厳守）:
- **名前**: ${selectedName}
- **性格**: ${selectedPersonality}
- **職業**: ${selectedJob}
- **追加テーマ**: ${theme}
- **口調**: ${tone}
- **絵文字**: ${emoji}

■執筆の鉄則:
1. **文章の品質**: 相手に好印象を与え、もっと話したいと思わせるよう、話題を広げつつ一文を少し長めに詳しく書いてください。
2. **対話の継続**: **すべての文章の最後は、必ず相手のことを聞く「疑問形（？）」で締めてください。**
3. **完走の義務**: お手本にある「■返信3」で満足せず、必ず最終項目【■返信3-青1】まで一気呵成に書き上げること。

■必須出力項目リスト（順番通りに最後まで）:
1. ■キャラ名 〜 ■自己紹介
2. キャラ設定（カップ数 〜 インスタURL）
3. 【アタック1】〜【アタック3】
4. ■返信1、■返信1-青1
5. ■返信2、■返信2-青1
6. ■返信3
7. ■返信3-青1（←ここが真のゴールです。絶対に省略不可）

### 【最終検品指示】
プロとして、最後の「■返信3-青1」が書き出されていることを目視確認し、最後に「【以上、全項目出力完了】」と記載して送信せよ。` 
        }
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
