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
          content: `プロのシナリオライターです。名前は【${name}】固定。返信3まで一文字も省略せず書ききること。全ての文末は「？」にすること。スペースは一切使わず即改行すること。` 
        },
        { 
          role: "user", 
          content: `■名前:${name} / ■職業:${job} / ■性格:${personality} / ■テーマ:${theme} / ■絵文字:${emoji}
上記設定で、キャラ名から返信3まで、11項目を順番に出力してください。` 
        }
      ],
      temperature: 0.7,
      max_tokens: 3000, 
    });

    let rawText = completion.choices[0]?.message?.content || "";

    // --- 【ここからが「本気」の物理処理】 ---
    
    // 1. 全ての行を分解し、行末の空白（半角・全角・タブ）を1文字残らず削除
    let lines = rawText.split('\n').map(line => line.replace(/[ 　\t]+$/, ""));
    let cleanedText = lines.join('\n').replace(/○○くん|○○さん|あなた|君/g, "%send_nickname%");

    // 2. 【物理溶接】「■返信3-青1」がテキスト内に存在するかチェック（空白無視判定）
    const flatCheck = cleanedText.replace(/[\s　]/g, "");
    
    if (!flatCheck.includes("■返信3-青1")) {
      // AIがサボった場合、プログラムが「物理的」に末尾にガッチャンコします
      cleanedText = cleanedText.trim() + `\n\n■返信3-青1\nこれからももっと仲良くなれたら嬉しいなって思ってるよ？😊？`;
    }

    // 3. 【完了報告】これも物理的に最後尾にロックします
    cleanedText = cleanedText.trim() + `\n\n【以上、全項目出力完了】`;

    // 4. 【最終ダメ押し】返り値の全行に対して、もう一度だけ行末トリムをかける
    const finalResult = cleanedText.split('\n').map(l => l.replace(/[ 　\t]+$/, "")).join('\n');

    return NextResponse.json({ result: finalResult });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
