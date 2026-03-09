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
        { 
          role: "system", 
          content: "あなたはプロのシナリオライターであり、フォーマット遵守の専門家です。提供された【お手本】にある全ての見出し（アタック、返信、青1等）を、1つも省略せずに、最後の一文字まで完全に再現して出力してください。" 
        },
        { 
          role: "user", 
          content: `【執筆命令：末尾の「■返信3-青1」まで、1つも項目を飛ばさずに書き切ってください。】\n\nテーマ: ${theme}\n口調: ${tone}\n絵文字: ${emoji}\n\n【お手本】\n${template}\n\n【最終確認：プロの仕事として、最後の「■返信3-青1」まで全てのセクションが出力されていることを確認してから送信してください。】` 
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
