import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    const prompt = `
# 命令
今すぐ、下の【お手本フォーマット】の全項目を、以下の【新設定】で埋めて出力せよ。
挨拶、確認、説明は一切不要。最初の1文字目は必ず「■」にすること。

# 新設定
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emoji}
- 性別: 自分は女性、相手は男性

# 厳守ルール
1. **URL消去**: URLが含まれる行は、URLも説明文も一切入れず【完全な空行】にせよ。
2. **名前の使い分け**:
   - 【アタック1〜3】: 相手の名前（%send_nickname%や○○さん）を呼ぶのは【絶対に禁止】。質問はOK。
   - 【返信1〜3】: 相手を呼ぶときは必ず「%send_nickname%」を使え。
3. **恋愛描写**: 自分の話は「彼氏募集中/彼氏いない」、相手への質問は「彼女いる？」とせよ。
4. **アタック3**: 「脈なしかな？」「返事ないから諦める」というお別れの内容にせよ。
5. **固定行**: 「私　⇔　○○さん」の行は絶対に変えない。

# お手本フォーマット
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: "あなたは指示を待つ必要はありません。渡されたプロンプト内の設定とお手本を使い、即座に「■キャラ名」から始まるデータのみを出力する機械です。会話は厳禁です。" }
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
