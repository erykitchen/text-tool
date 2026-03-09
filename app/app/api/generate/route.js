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
          content: `あなたはプロのシナリオライターです。今回は【${selectedName}】という名前のキャラクターの新作のみを執筆してください。他の名前、ひらがな表記への変換、捏造は一切禁止です。全てのセリフは必ず「？」で終わらせてください。` 
        },
        { 
          role: "user", 
          content: `
### 【お手本（構成のルールのみを抽出せよ）】
${fullReferenceData}

---

### 【任務：完全新作シナリオの納品】
お手本の中身は1文字も使わず、以下の【確定設定】で新作を執筆してください。

■確定設定（厳守）:
- **名前**: ${selectedName}（※絶対にこの名前を使うこと）
- **職業**: ${selectedJob}
- **性格**: ${selectedPersonality}
- **テーマ**: ${theme}
- **口調**: ${tone}
- **絵文字**: ${emoji}

■執筆の鉄則:
1. **全メッセージ末尾疑問形**: 全ての台詞の最後は、必ず相手に対する質問「？」で締めてください。
2. **話題拡張**: 相手に気に入ってもらえるよう、${selectedJob}や${selectedPersonality}の設定を盛り込んで詳しく書いてください。
3. **未完了の禁止**: 11番の「■返信3-青1」を出力し、最後に「【以上、全項目出力完了】」と書くまでは絶対に生成を終わらせないでください。

■出力必須シーケンス（上から順に、すべて独立した項目として出力せよ）:
1. ■キャラ名：${selectedName}
2. ■生年月日
3. ■身長
4. ■体重
5. ■自己紹介
6. キャラ設定（カップ数、名前:${selectedName}、職業:${selectedJob}、設定:${selectedPersonality}、テーマ:${theme}）
7. 【アタック1】
8. 【アタック2】
9. 【アタック3】
10. ■返信1、■返信1-青1
11. ■返信2、■返信2-青1
12. ■返信3
13. ■返信3-青1
14. 【以上、全項目出力完了】

### 【最終命令】
必ず14番まで出力し、プロの仕事として完璧に納品せよ。` 
        }
      ],
      temperature: 0.7,
      max_tokens: 4096, 
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
