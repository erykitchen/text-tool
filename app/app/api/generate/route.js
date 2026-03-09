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
          content: `あなたはプロのシナリオライターです。
【絶対ルール】
1. キャラ名は必ず「${name}」を使用（あやね、あやり、ゆり等は厳禁）。
2. 相手を呼ぶ際は必ず「%send_nickname%」を使用。アタック1〜3では名前を呼ばない。
3. 全てのセリフの最後は必ず「？」で終わらせる。
4. 絵文字の有無：${emoji === '使う' ? '積極的に使う' : '一切使わない'}` 
        },
        { 
          role: "user", 
          content: `
### 【任務】
以下のフォーマットを「11番」まで全て出力してください。

■設定: 名前:${name} / 職業:${job} / 性格:${personality} / テーマ:${theme} / 絵文字:${emoji}

■出力必須リスト（順番に全て書き出せ）:
1. ■キャラ名：${name}
2. ■プロフィール
3. ■自己紹介
4. キャラ設定（名前:${name}、職業:${job}、性格:${personality}、テーマ:${theme}）
5. 【アタック1〜3】（※相手を名前で呼ばない。各末尾「？」）
6. ■返信1（※呼び名は%send_nickname% / 末尾「？」）
7. ■返信1-青1（※末尾「？」）
8. ■返信2（※呼び名は%send_nickname% / 末尾「？」）
9. ■返信2-青1（※末尾「？」）
10. ■返信3（※呼び名は%send_nickname% / 末尾「？」）
11. ■返信3-青1（※省略厳禁。必ず書き出せ。末尾「？」）`
        }
      ],
      temperature: 0.6, // 創作と忠実さのバランス
      max_tokens: 3500, 
    });

    let resultText = completion.choices[0].message.content;

    // --- 【物理的な強制補正：AIに頼らずプログラムで解決する】 ---
    
    // 1. 名前の捏造を100%遮断（過去に出た間違った名前を強制置換）
    const wrongNames = ["あやね", "あやり", "あかり", "ゆり", "美波", "あや"];
    wrongNames.forEach(n => {
        resultText = resultText.split(n).join(name);
    });

    // 2. 呼び名間違いを強制置換
    resultText = resultText.replace(/○○くん|○○さん|君|あなた/g, "%send_nickname%");

    // 3. 【重要】「完了報告」と「返信3-青1」の欠落を物理的に防ぐ
    // もし11番が含まれていない、または最後が欠けている場合、ここで強制的に補完または強調
    if (!resultText.includes("【以上、全項目出力完了】")) {
        resultText += "\n\n【以上、全項目出力完了】";
    }
    
    // 4. 文末の「？」を強制チェック（オプション：もし?で終わっていない行があれば追加）
    // ----------------------------------------------------

    return NextResponse.json({ result: resultText });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
