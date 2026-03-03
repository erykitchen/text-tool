import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    let emojiInstruction = "";
    if (emoji === "使わない") {
      emojiInstruction = "絵文字、顔文字、記号（♪、★、☆、💖など）は1つ残らず削除してください。";
    } else if (emoji === "顔文字") {
      emojiInstruction = "絵文字は禁止。顔文字のみ使用。";
    } else {
      emojiInstruction = `絵文字を${emoji}使用してください。`;
    }

    const prompt = `
# 命令
あなたはデータ変換マシンです。お手本の「構成」を維持しつつ、中身を以下の「新設定」で完全に書き換えてください。
お手本の内容（運動好き、サウナ等）は【すべて破棄】し、新設定に基づいた文章を作成してください。

# 新設定
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emojiInstruction}
- 性別: 女性（「彼女」と呼び、「彼氏」は禁止）

# 変換ルール
1. **項目名・記号**: 「■」や「【アタック1】」等の項目名は一字一句変えない。Markdown（###）は禁止。
2. **固定行の維持**: 「私　⇔　○○さん（または君）」「※テンプレ 返信3まで」はそのまま残す。○○を書き換えない。
3. **URL**: URLが含まれる行は、URL部分を消して【空行】にする。
4. **名前の処理**: 相手を呼ぶときは「%send_nickname%」を使う。ただし【アタック1～3】では相手の名前を呼ばない。
5. **アタック3の役割**: 必ず「返事がないので諦める、名残惜しいお別れ」の内容にする。
6. **省略禁止**: 「■返信3-青1」まで全て出力する。

# お手本フォーマット（中身は無視し、形だけ真似ること）
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "あなたは指示された設定以外の情報を出力しない変換機です。お手本の文章に引っ張られず、JobとPersonalityから全ての文章を新しく生成してください。" }
      ],
      temperature: 0.8,
      max_tokens: 2500,
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
