import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    const prompt = `
以下の【新設定】で、下の【お手本】の文字情報をすべて上書きしろ。
余計な挨拶、確認、前置きは一切不要。いきなり「■キャラ名」から書き始め、最後まで一気に書ききれ。

# 新設定
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emoji}
- 性別: 女性（「彼氏」は禁止、必ず「彼女」とすること）

# 鉄の掟
1. **URL完全消去**: URLが1文字でも含まれる行は、中身をすべて消して【完全な空行】にせよ。
2. **アタック(1〜3)**: 相手の名前（○○さん、%send_nickname%等）を呼ぶのは【絶対に禁止】。質問もせず、自分の話だけにせよ。
3. **返信(1〜3)**: 相手の名前を呼ぶときは必ず「%send_nickname%」を使え。
4. **固定行**: 「私　⇔　○○さん」の行は絶対に変えるな。
5. **アタック3**: 「返信がないから諦める」という寂しいお別れの内容にせよ。

# お手本
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: "あなたは挨拶を一切せず、最初の1文字目から『■』で書き始めるデータ出力機です。返答に『了解しました』や『作成します』を含めることは厳禁です。" },
        { role: "user", content: prompt }
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
