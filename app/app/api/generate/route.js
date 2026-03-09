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

    const selectedName = getData("names.txt");
    const selectedPersonality = getData("personalities.txt");
    const selectedJob = getData("jobs.txt");

    const refFilePath = path.join(process.cwd(), "data", "reference.txt");
    const fullReferenceData = fs.readFileSync(refFilePath, "utf8");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "あなたはプロのシナリオライターです。指定されたフォーマットの全項目を、最後の一文字まで完璧に埋めることがあなたの絶対的な任務です。途中で出力を止めることは絶対に許されません。" 
        },
        { 
          role: "user", 
          content: `
### 【教育資料：お手本リスト】
${fullReferenceData}

---

### 【ミッション：新作執筆】
以下の固定フォーマットを【1文字も省略せず】埋めてください。

■設定条件:
- 名前: ${selectedName} / 性格: ${selectedPersonality} / 職業: ${selectedJob}
- テーマ: ${theme} / 口調: ${tone} / 絵文字: ${emoji}

■文章の品質ルール:
- 相手に気に入ってもらえるよう話題を広げ、一文を長めに詳しく書くこと。
- **すべてのセリフの最後は、必ず相手のことを聞く「疑問形（？）」で締めること。**

■出力必須項目（上から順にすべて出力せよ）:

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
■返信3-青1

### 【鉄の掟】
1. 「■返信3-青1」を書き終えるまで、絶対に生成を終了してはいけません。
2. 最後に必ず「【以上、全項目出力完了】」と1行添えてください。` 
        }
      ],
      temperature: 0.7,
      max_tokens: 4096, // 制限をモデルの最大値まで解放
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
