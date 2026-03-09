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
          content: "あなたはプロのシナリオライターです。今回は必ず名前を【" + name + "】として執筆し、お手本の内容は1文字も使わず、独自の文章で作成してください。すべての文章の末尾は『？』で終わらせることが絶対条件です。" 
        },
        { 
          role: "user", 
          content: `
### 【任務】
以下の全11項目を、番号順に一文字も省略せず出力してください。

■設定: 名前:${name} / 職業:${job} / 性格:${personality} / テーマ:${theme} / 口調:${tone} / 絵文字:${emoji}

■文章ルール（死守せよ）:
1. **全文疑問形**: アタック、返信1〜3、青1の全ての文末は、必ず「？」で終わらせてください（絵文字があってもその後に「？」を置く）。
2. **名前の固定**: お手本にある名前は無視し、必ず「${name}」と名乗ってください。
3. **完走の義務**: 11番の「■返信3-青1」を書き終えるまで、絶対に終了してはいけません。

■出力必須シーケンス（1〜11を全て書き出せ）:
1. ■キャラ名：${name}
2. ■プロフィール（生年月日・身長・体重）
3. ■自己紹介
4. キャラ設定（名前:${name}、職業:${job}、性格:${personality}、テーマ:${theme}）
5. 【アタック1〜3】（すべて末尾は「？」）
6. ■返信1（末尾は「？」）
7. ■返信1-青1（末尾は「？」）
8. ■返信2（末尾は「？」）
9. ■返信2-青1（末尾は「？」）
10. ■返信3（末尾は「？」）
11. ■返信3-青1（※最重要項目。文末は「？」）

最後に、完了の合図として必ず【以上、全項目出力完了】と記述して納品してください。` 
        }
      ],
      temperature: 0.7,
      max_tokens: 3500, // 文字数制限をあえて少し絞り、AIに「後半を端折る余裕」を与えない
    });

    let resultText = completion.choices[0].message.content;

    // もしAIが完了報告を書き漏らした場合のバックアップ処理（プログラム側で強制付与）
    if (!resultText.includes("【以上、全項目出力完了】")) {
        resultText += "\n【以上、全項目出力完了】";
    }

    return NextResponse.json({ result: resultText });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
