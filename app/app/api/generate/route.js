import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const { theme, tone, emoji } = await req.json();

    const getData = (fileName) => {
      const filePath = path.join(process.cwd(), "data", fileName);
      const data = fs.readFileSync(filePath, "utf8");
      const list = data.split(/\r?\n/).filter(line => line.trim() !== "");
      return list[Math.floor(Math.random() * list.length)];
    };

    // リストから選ばれた「正しい名前」
    const name = getData("names.txt");
    const job = getData("jobs.txt");
    const personality = getData("personalities.txt");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: `あなたはプロのシナリオライターです。名前は必ず【${name}】を使用。
【絶対ルール】
1. キャラ名は必ず「${name}」を使用すること。
2. 全ての文末は必ず「？」で終わらせること。
3. 項目11(■返信3-青1)まで一文字も省略せず書き出すこと。` 
        },
        { 
          role: "user", 
          content: `名前:${name}、職業:${job}、性格:${personality}、テーマ:${theme}、絵文字:${emoji}。11.■返信3-青1まで順番に出力してください。`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000, 
    });

    let rawText = completion.choices[0]?.message?.content || "";

    // --- 【ここが「本気」の物理修正：AIのミスを上書きします】 ---

    // 1. 【名前の修正】AIが間違えた名前を名乗っても、${name} に物理的に置換
    let processedText = rawText.replace(/■キャラ名[：:][^ \n]+/g, `■キャラ名：${name}`);
    processedText = processedText.replace(/名前[：:][^ \n,）]+/g, `名前：${name}`);

    // 2. 【スペースの抹殺】行末にある空白を「正規表現」で物理的に全消去
    // 最後に join('\n') することで、文字の直後に改行を強制します
    processedText = processedText.split('\n').map(line => line.replace(/[\s　]+$/, "")).join('\n');

    // 3. 【完了報告の物理結合】
    // AIにお願いするのをやめ、プログラムが最後に文字を「足し算」します。
    // これにより、プログラムが動けば100%末尾に出現します。
    processedText = processedText.trim() + "\n\n【以上、全項目出力完了】";

    // ★重要★ 加工した「processedText」を確実に返します
    return NextResponse.json({ result: processedText });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
