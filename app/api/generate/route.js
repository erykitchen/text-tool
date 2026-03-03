import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const getRandomLine = (fileName) => {
  const filePath = path.join(process.cwd(), 'data', fileName);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  return lines[Math.floor(Math.random() * lines.length)];
};

export async function POST(req) {
  try {
    let { job, personality, tone, emoji, template } = await req.json();

    // ランダム抽選
    if (!job || job === 'random') job = getRandomLine('jobs.txt') || 'アパレル店員';
    if (!personality || personality === 'random') personality = getRandomLine('personalities.txt') || '元気いっぱい';

    // お手本ファイルの読み込み
    const refPath = path.join(process.cwd(), 'data', 'reference.txt');
    const referenceData = fs.existsSync(refPath) ? fs.readFileSync(refPath, 'utf8') : "";

    const prompt = `
### 【絶対遵守のシステム命令】
1. キャラクターは【必ず女性】として作成すること。
2. お手本ファイルの中に「http」で始まるURLが含まれていても、それは【無視】せよ。
3. 出力する際、URLが記載されている行（またはURLを入れるべき場所）は、文字を一切入れず、必ず【完全な空行】にすること。

### 【お手本ファイル（URLが含まれていますが、出力時は空行にしてください）】
${referenceData}

---

### 【今回の作成依頼】
上記お手本の「構成・変数・ノリ」を継承し、以下の設定で【女性キャラクター】を1人分作成してください。
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emoji}

### 【データ構造の鉄則】
- **名前の変数**: 返信(1-3)内では必ず「%send_nickname%」と呼ぶこと。
- **アタック(1-3)**: 相手の名前を絶対に呼ばないこと。
- **URL行**: 重ねて命じるが、URLを含む行は【空行】にせよ。絶対にURLを捏造したり、お手本からコピーしてはならない。

### 【出力フォーマット】
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "あなたはURLを検知して削除し、女性キャラクターのデータを作成する専用マシンです。お手本にURLがあっても、あなたはそれを無視して空行として出力します。" 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7, 
    });

    return NextResponse.json({ 
      result: response.choices[0].message.content,
      selectedJob: job,
      selectedPersonality: personality 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
