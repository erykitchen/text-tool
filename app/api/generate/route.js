import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    const prompt = `
お手本の「構成」だけを使い、内容は【${job}】で【${personality}】な女性キャラとして、独自の話題で【完全新作】を書き下ろしてください。

### 1. 執筆ルール（脱・コピペ）
- **内容の刷新**: お手本にある「買い物はネット派」「仕事ばかりで外に出ない」等の文章は【使用禁止】。${job}らしい新しいエピソードを書いてください。
- **URL**: URL行は文字や説明を一切入れず、改行のみの【空行】にしてください。
- **性別**: 自分の話は「彼氏募集中/いない」、相手への質問は「彼女いる？」にしてください。

### 2. 名前のルール（厳守）
- **固定行**: 「私　⇔　○○さん」という行は、一字一句変えず【必ずそのまま】出力してください。
- **アタック1〜3**: 相手の名前（%send_nickname%や○○さん等）を【1回も使わない】でください。
- **返信1〜3**: 相手を呼ぶときは必ず「%send_nickname%」を使ってください。

### 3. キャラクター設定
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emoji}

### お手本フォーマット（構成のみ利用）
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { 
          role: "system", 
          content: "あなたはデータ作成機です。挨拶や説明は不要。最初の文字は『■キャラ名』から開始してください。返信内の名前は必ず %send_nickname% にし、固定行の『私　⇔　○○さん』は絶対に変更しないでください。" 
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
