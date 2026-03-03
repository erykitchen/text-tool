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
      emojiInstruction = "絵文字や顔文字は一切使用しないでください。";
    } else if (emoji === "顔文字") {
      emojiInstruction = "絵文字は使わず、顔文字を中心に適度に使用してください。";
    } else {
      emojiInstruction = `絵文字を${emoji}使用してください。`;
    }

    const prompt = `
以下の指示に従い、お手本をベースにした新しいキャラクターを生成してください。

### キャラクター設定
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}

### 執筆・変換ルール
1. **名前の呼び方**:
   - 相手を呼ぶ際は、必ず「%send_nickname%」という変数を使用してください。
   - ただし、【アタック1】【アタック2】【アタック3】の項目内では、名前を呼ばないでください。
2. **URLの扱い**:
   - インスタURLなどのURLが含まれる場合は、すべて削除してください。
3. **そのまま維持する部分**:
   - 「私　⇔　○○さん」
   - 「※テンプレ 返信3まで」
   - 「～」や「--------------------------------------」といった区切り線
   - これらは修正せず、そのまま出力に含めてください。
4. **絵文字の項目**:
   - 出力データ内に「絵文字：」という項目がある場合、値は必ず「使う」または「使わない」の2択にしてください。
   - 実際の内容には以下の指示を適用してください：${emojiInstruction}

### お手本
${template}

### 出力形式
お手本と同じ項目名を使用し、上記のルールをすべて適用して出力してください。
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
