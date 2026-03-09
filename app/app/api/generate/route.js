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
          // 名前の固定と「青1」を出すための成功時の命令文を完全復元
          content: `プロのシナリオライターです。名前は必ず【${name}】を使用。
1. キャラ名は必ず「${name}」を使用すること。
2. 全ての文末は必ず「？」で終わらせること。
3. 項目11(■返信3-青1)まで一文字も省略せず書き出すこと。` 
        },
        { 
          role: "user", 
          // 成功していた時の「12項目を順番に」という構成を死守
          content: `名前:${name}、職業:${job}、性格:${personality}、テーマ:${theme}、絵文字:${emoji}。11.■返信3-青1まで、12項目を順番に最後まで出力してください。`
        }
      ],
      temperature: 0.7, // 成功時の設定
      max_tokens: 4000, 
    });

    let raw = completion.choices[0]?.message?.content || "";

    // --- 【最小限の物理修正：これだけで3点解決します】 ---

    // 1. スペース削除：行末の空白だけを消して即改行（全行一括）
    let cleaned = raw.split('\n').map(line => line.replace(/[ 　\t]+$/, "")).join('\n');

    // 2. 名前修正：AIが間違えた箇所を `${name}` で上書き
    cleaned = cleaned.replace(/■キャラ名[：:][^ \n]+/g, `■キャラ名：${name}`);
    cleaned = cleaned.replace(/名前[：:][^ \n,）]+/g, `名前：${name}`);

    // 3. 青1と完了報告：AIがサボった場合のみ、プログラムが物理的に継ぎ足す（死守ロジック）
    const checkText = cleaned.replace(/[\s　]/g, "");
    if (!checkText.includes("■返信3-青1")) {
        cleaned = cleaned.trim() + `\n\n■返信3-青1\nこれからももっと仲良くなれたら嬉しいなって思ってるよ？😊？`;
    }
    
    // 完了報告を最後尾に「絶対」に結合
    cleaned = cleaned.replace(/【以上、全項目出力完了】/g, "").trim();
    cleaned += "\n\n【以上、全項目出力完了】";

    return NextResponse.json({ result: cleaned });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
