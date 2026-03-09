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
          content: "あなたはプロのシナリオライターです。指定されたフォーマットの全項目を、最後の一文字まで完璧に埋めることがあなたの絶対的な任務です。" 
        },
        { 
          role: "user", 
          content: `
### 【教育資料：お手本リスト】
※構成の参考にせよ。
${fullReferenceData}

---

### 【ミッション：新作執筆】
以下の固定フォーマットに従い、指定された設定で新作を執筆してください。

■設定条件（厳守）:
- **名前**: ${selectedName}
- **性格**: ${selectedPersonality}
- **職業**: ${selectedJob}
- **テーマ**: ${theme}
- **口調**: ${tone}
- **絵文字**: ${emoji}

■文章の品質ルール:
- 相手に気に入ってもらえるよう話題を広げ、一文を長めに詳しく書くこと。
- **すべてのセリフの最後は、必ず相手のことを聞く「疑問形（？）」で締めること。**

■出力必須項目（以下の順番通りに、一文字も欠かさず出力せよ）:

■キャラ名
■生年月日
■身長
■体重
■自己紹介
--------------------------------------

キャラ設定
カップ数：
名前：${selectedName}
職業：${selectedJob}
設定：${selectedPersonality}
テーマ：${theme}
絵文字：${emoji}

--------------------------------------
【アタック1】 
【アタック2】
【アタック3】
--------------------------------------
■返信1
■返信1-青1
■返信2
■返信2-青1
■返信3
■返信3-青1（←ここが終点です。絶対に省略しないでください）

### 【最終確認】
プロとして、最後の「■返信3-青1」まで到達したことを確認し、最後に「【以上、全項目出力完了】」と記載して送信せよ。` 
        }
      ],
      temperature: 0.7,
      max_tokens: 3800,
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
