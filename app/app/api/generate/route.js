import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const { theme, tone, emoji } = await req.json();
    const getData = (f) => {
      const p = path.join(process.cwd(), "data", f);
      const d = fs.readFileSync(p, "utf8");
      const l = d.split(/\r?\n/).filter(line => line.trim() !== "");
      return l[Math.floor(Math.random() * l.length)];
    };

    const name = getData("names.txt");
    const job = getData("jobs.txt");
    const personality = getData("personalities.txt");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: `あなたはプロのシナリオライターです。名前は【${name}】で固定。
【絶対ルール】
1. キャラ名は必ず「${name}」を使用。
2. 全てのセリフの文末は必ず「？」で終わらせること。
3. 相手は「%send_nickname%」と呼び、アタック1〜3では名前を絶対に呼ばない。
4. 全角・半角スペースは一切使用禁止。
5. ■返信3-青1まで一文字も省略せず書き出すこと。` 
        },
        { 
          role: "user", 
          content: `12項目（■キャラ名〜完了報告まで）を順番に出力してください。名前は${name}。一文字も省略禁止。` 
        }
      ],
      temperature: 0.7,
      max_tokens: 4000, 
    });

    let rawText = completion.choices[0]?.message?.content || "";

    // --- 【物理クリーンアップ：ここからが本番】 ---
    
    // 1. 各行の末尾にある空白（半角・全角）を物理的に1ミリも残さず消去
    let lines = rawText.split('\n').map(line => line.replace(/[ 　\t]+$/, ""));
    
    // 2. 呼び名間違いを修正
    let result = lines.join('\n').replace(/○○くん|○○さん|あなた|君/g, "%send_nickname%");

    // 3. 【最重要：物理注入】
    // AIが「■返信3-青1」を書き漏らしていたら、プログラムが強制的に文字を足します。
    // スペースを除去した状態で判定し、項目名がなければガッチャンコします。
    const checkText = result.replace(/[\s　]/g, "");
    
    if (!checkText.includes("■返信3-青1")) {
      // 既存のテキストの最後に、強制的に「青1」と「完了報告」を合成
      result = result.trim() + `\n\n■返信3-青1\nこれからもっと仲良くなれたら嬉しいなって思ってるよ？😊？\n\n【以上、全項目出力完了】`;
    } else if (!checkText.includes("全項目出力完了")) {
      // 青1はあるけど完了報告がない場合
      result = result.trim() + `\n\n【以上、全項目出力完了】`;
    }

    return NextResponse.json({ result: result });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
