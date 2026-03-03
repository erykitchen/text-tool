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
    let referenceData = "";
    if (fs.existsSync(filePath)) {
      referenceData = fs.readFileSync(filePath, 'utf8');
    }

    const prompt = `
あなたはゲーム開発のデータ作成マシンです。
【過去の大量データ】を読み込み、その「構成」を学習した上で、新しいキャラクターを制作してください。

### 過去の大量データ（学習用）
${referenceData}

### 今回の制作指示
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emoji}

### ⚠️ URLに関する絶対命令（最優先）
過去データやお手本に「http」から始まるURLが記載されていても、あなたはそれを【絶対に】出力してはいけません。
URLが含まれる行は、URLも説明文も全て削除し、何も書かない「空行（改行のみ）」として出力してください。

### その他のルール
- 【アタック1〜3】: 相手の名前（%send_nickname%等）を呼ばない。
- 【返信1〜3】: 相手を必ず「%send_nickname%」と呼ぶ。
- 【固定行】: 「私　⇔　○○さん」を維持する。
- 【新作】: 過去データの文章をそのまま使わず、${job}に合わせた内容にすること。

### 出力フォーマット
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "あなたはデータ出力専用機です。URLの行を空行にすること、名前の使い分けをすることを完璧に守ってください。挨拶は不要、■キャラ名から開始。" }
      ],
      temperature: 0.85,
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
