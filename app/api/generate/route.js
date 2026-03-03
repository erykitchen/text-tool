import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    // 1. お手本集（reference.txt）を読み込む
    const filePath = path.join(process.cwd(), 'data', 'reference.txt');
    let referenceData = "（過去のデータがありません）";
    if (fs.existsSync(filePath)) {
      referenceData = fs.readFileSync(filePath, 'utf8');
    }

    const prompt = `
# 命令:
【過去の成功事例集】の書き方・形式・ノリを完璧に模倣し、
今回のお題に基づいた【新しいキャラクター1人分だけ】のデータを生成せよ。

# 今回のお題（この設定で1人だけ作ること）:
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emoji}

# 学習用・過去の成功事例集:
${referenceData}

# 厳守ルール（絶対に守れ）:
1. **出力数**: 生成するのは【1キャラクター分】のみ。事例のリストアップや目次は一切不要。
2. **URL完全抹消**: URLが含まれる行は、URLも文字も一切入れず、真っ白な「空行」にせよ。
3. **名前のルール**: 
   - 【アタック1〜3】: 相手の名前（%send_nickname%や○○さん等）を呼ぶのは【禁止】。
   - 【返信1〜3】: 相手を必ず「%send_nickname%」と呼べ。
   - 【固定行】: 「私　⇔　○○さん」を維持せよ。
4. **コピペ禁止**: 事例集の文章をそのまま使わず、${job}に合わせた完全新作を執筆せよ。

# 出力フォーマット（ここを埋めること）:
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "あなたは指示を待つ必要のない出力マシンです。過去の事例を参考にしつつ、今回のお題で1人分だけのデータを即座に生成してください。挨拶、説明、事例の箇条書きは全て厳禁です。" 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.8, // 0.9だと少し暴れるので、0.8に微調整して安定させます
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
