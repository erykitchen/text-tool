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

    // リストから取得した名前。これを最後まで使い倒します。
    const name = getData("names.txt");
    const job = getData("jobs.txt");
    const personality = getData("personalities.txt");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          // ここは「青1」が出た時の指示を1文字も変えずに死守
          content: `あなたはプロのシナリオライターです。名前は【${name}】で固定。
【絶対ルール】
1. キャラ名は必ずリストから抽出された「${name}」をそのまま使用すること。
2. 全てのメッセージの文末は、必ず「？」で終わらせること。
3. 相手は「%send_nickname%」と呼び、アタック1〜3では名前を絶対に呼ばない。
4. 全角・半角スペースは一切使用禁止。
5. 項目11(■返信3-青1)を書き出すまで出力を絶対に止めないこと。` 
        },
        { 
          role: "user", 
          // ここも成功パターンを完全死守
          content: `
### 【任務】
以下の12項目を「順番に一文字も省略せず」、最後まで出力してください。

■設定: 名前:${name} / 職業:${job} / 性格:${personality} / テーマ:${theme} / 絵文字:${emoji}

■出力シーケンス:
1. ■キャラ名：${name}
2. ■プロフィール
3. ■自己紹介
4. キャラ設定（名前:${name}、職業:${job}、性格:${personality}、テーマ:${theme}）
5. 【アタック1〜3】
6. ■返信1
7. ■返信1-青1
8. ■返信2
9. ■返信2-青1
10. ■返信3
11. ■返信3-青1
12. 【以上、全項目出力完了】`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000, 
    });

    let result = completion.choices[0]?.message?.content || "";

    // --- 【ここから下の「物理掃除」だけで3点を治します】 ---

    // 【1. 名前の修正】AIがもし違う名前を出しても、リストの名前 ${name} に強制置換
    // （※キャラ設定などの自由記述欄も守るため、行の先頭付近にある名前表記を狙い撃ちします）
    result = result.replace(/■キャラ名[：:][^ \n]+/g, `■キャラ名：${name}`);
    result = result.replace(/名前[：:][^ \n,）]+/g, `名前：${name}`);

    // 【2. スペースの削除】各行の末尾にある空白（半角・全角）を物理的に根絶
    result = result.split('\n').map(line => line.replace(/[ 　\t]+$/, "")).join('\n');

    // 呼び名修正（これは保険）
    result = result.replace(/○○くん|○○さん|あなた|君/g, "%send_nickname%");

    // 【3. 完了報告と青1の死守】
    const checkText = result.replace(/[\s　]/g, "");
    
    // 青1がなければ物理追加（ここも死守）
    if (!checkText.includes("■返信3-青1")) {
        result = result.trim() + `\n\n■返信3-青1\nこれからももっと仲良くなれたら嬉しいなって思ってるよ？😊？`;
    }

    // 完了報告を「確実に」最後に付与
    // 一度消してから足すことで、二重にならず、かつ必ず最後に来るようにします。
    result = result.replace(/【以上、全項目出力完了】/g, "").trim();
    result += "\n\n【以上、全項目出力完了】";

    return NextResponse.json({ result: result });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
