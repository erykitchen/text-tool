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
          content: "あなたはプロのシナリオライターであり、フォーマット遵守の専門家です。提供された【お手本】にある全ての見出し（■キャラ名、■生年月日、■身長、■体重、■自己紹介、キャラ設定、【アタック1-3】、■返信1、■返信1-青1、■返信2、■返信2-青1、■返信3、■返信3-青1）を、1つも省略せずに、最後の一文字まで完全に再現して出力してください。" 
        },
        { 
          role: "user", 
          content: `【最優先事項：以下の項目を必ず全て出力してください。途中で省略することは厳禁です。】
■キャラ名
■生年月日
■身長
■体重
■自己紹介
キャラ設定（カップ数、名前、職業、設定、絵文字）
【アタック1】
【アタック2】
【アタック3】
■返信1
■返信1-青1
■返信2
■返信2-青1
■返信3
■返信3-青1

テーマ: ${theme}
口調: ${tone}
絵文字: ${emoji}

【お手本】
${template}` 
        }
      ],
      temperature: 0.7,
      // 物理的なトークン不足によるカットを防ぐため余裕を持たせています
      max_tokens: 3000,
    });

    return NextResponse.json({ result: completion.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
