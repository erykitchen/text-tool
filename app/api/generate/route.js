import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    const prompt = `
以下の指示でデータを生成せよ。

# 設定
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emoji}

# 命令ルール（絶対遵守）
1. **URLの行は削除**: URLが含まれる行は、URLも文字も一切含めず、完全に空行（改行のみ）にせよ。
2. **お手本の文章は使用禁止**: 「買い物はネット派」「仕事ばかりで外に出ない」等の文章は【コピペ厳禁】。${job}に基づき、全く別の文章を新規作成せよ。
3. **アタック1〜3**: 相手の名前（○○さんや%send_nickname%等）を【絶対に呼ぶな】。1回でも呼んだら失敗とみなす。
4. **返信1〜3**: 相手の名前は、100%必ず「%send_nickname%」と表記せよ。「○○さん」は禁止。
5. **固定行の維持**: 「私　⇔　○○さん」という1行だけは、そのまま出力せよ。
6. **恋愛設定**: 自分の話は「彼氏いない」、相手への質問は「彼女いる？」にせよ。

# 出力形式（以下の項目を埋めろ）
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { 
          role: "system", 
          content: "あなたは挨拶をしない出力マシンです。最初の1文字は『■』。URLの行は文字を1文字も入れず空行にすること。アタック1〜3では絶対に名前を呼ばないこと。返信では必ず %send_nickname% を使うこと。お手本の文章を流用せず、指定された職業に合わせた新規の文章を書きなさい。" 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.9, 
      max_tokens: 2500,
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
