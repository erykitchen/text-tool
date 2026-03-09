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
          content: `プロのシナリオライターです。名前は【${name}】固定。返信3-青1まで一文字も省略せず書ききること。全ての文末は「？」にすること。スペースは一切禁止。` 
        },
        { 
          role: "user", 
          content: `名前:${name}、職業:${job}、性格:${personality}、テーマ:${theme}、絵文字:${emoji}。11.■返信3-青1まで、12項目を順番に出力してください。`
        }
      ],
      temperature: 0.3, // 揺らぎを最小化
    });

    let rawText = completion.choices[0]?.message?.content || "";

    // --- 【物理的な強制書き換え】 ---

    // 1. 各行の末尾にある全ての空白（半角・全角・タブ）を物理的に根絶
    let processedLines = rawText.split('\n').map(line => line.replace(/[ 　\t]+$/, ""));

    // 2. 名前の強制修正（AIが間違えた名前を名乗っても、${name} で上書き）
    let result = processedLines.join('\n')
      .replace(/■キャラ名[：:][^ \n]+/g, `■キャラ名：${name}`)
      .replace(/名前[：:][^ \n,）]+/g, `名前：${name}`)
      .replace(/○○くん|○○さん|あなた|君/g, "%send_nickname%");

    // 3. 【青1・完了報告】の「物理的な結合」
    // 文字が含まれているかチェックし、なければJavaScriptが強制的に文字を足します。
    const flat = result.replace(/[\s　]/g, "");
    
    if (!flat.includes("■返信3-青1")) {
      result = result.trim() + `\n\n■返信3-青1\nこれからももっと仲良くなれたら嬉しいなって思ってるよ？😊？`;
    }

    // 4. 【完了報告】AIが書こうが書くまいが、最後に必ず文字を合成
    result = result.replace(/【以上、全項目出力完了】/g, "").trim();
    result += "\n\n【以上、全項目出力完了】";

    // 5. 【ダメ押しの行末トリム】
    const finalResult = result.split('\n').map(l => l.replace(/[ 　\t]+$/, "")).join('\n');

    return NextResponse.json({ result: finalResult });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
