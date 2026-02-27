import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export async function POST(req) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const { theme, tone, emoji, template } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "あなたはプロのシナリオライターです。ユーザーが提供するお手本のフォーマットを完全に再現し、指定されたテーマ、口調、絵文字の有無に従って新しいキャラクター設定を生成してください。" },
        { role: "user", content: `テーマ: ${theme}\n口調: ${tone}\n絵文字: ${emoji}\n\n【お手本】\n${template}` }
      ],
      temperature: 0.7,
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
