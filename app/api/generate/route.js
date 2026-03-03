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
      emojiInstruction = "絵文字・顔文字・記号は一切禁止。";
    } else if (emoji === "顔文字") {
      emojiInstruction = "絵文字禁止、顔文字のみ使用。";
    } else {
      emojiInstruction = `絵文字を${emoji}使用。`;
    }

    const prompt = `
以下の【新設定】でお手本の「中身だけ」を書き換えて、今すぐ結果のみを出力せよ。
挨拶、確認、前置きは一切不要。最初の文字は必ず「■」にすること。

# 新設定
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emojiInstruction}
- 性別: 女性（「彼女」と呼び、「彼氏」は禁止）

# 厳守ルール
1. 【重要】URLを含む行はURLを消して【完全な空行】にせよ。
2. 【重要】「私　⇔　○○さん（または君）」は絶対に変えるな。
3. アタック3は、返信がないことへの「名残惜しいお別れの挨拶」にせよ。
4. 省略せず「■返信3-青1」まで全て書ききれ。

# お手本（この形式をコピーせよ）
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: "あなたは挨拶をしない出力マシンです。ユーザーからの入力（お手本と設定）はすでに揃っています。追加の質問はせず、即座に「■キャラ名」から始まるデータのみを出力してください。Markdownの#や###は使用禁止です。" }
      ],
      temperature: 0.7,
      max_tokens: 2500,
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
