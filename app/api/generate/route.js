import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    // 絵文字の設定をAIが理解しやすい指示に変換
    let emojiInstruction = "";
    if (emoji === "使わない") {
      emojiInstruction = "絵文字や顔文字は一切使用しないでください。";
    } else if (emoji === "顔文字") {
      emojiInstruction = "絵文字は使わず、顔文字（(^_^)など）を中心に適度に使用してください。";
    } else {
      emojiInstruction = `絵文字を${emoji}使用してください。`;
    }

    const prompt = `
以下の「お手本」の形式（項目名や構成）を完全に真似て、新しいキャラクターを1人生成してください。

【設定】
職業: ${job}
性格: ${personality}
口調: ${tone === 'polite' ? '敬語' : 'タメ語'}

【出力ルール】
1. お手本の中に「絵文字：」という項目がある場合、その値は選択肢にかかわらず必ず「使う」または「使わない」のどちらかで記載してください。
2. 絵文字の使用感については、以下の指示を優先してください：
   指示：${emojiInstruction}

【お手本】
${template}

【出力形式】
お手本と同じ項目名を使用し、設定に沿った内容で出力してください。
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
