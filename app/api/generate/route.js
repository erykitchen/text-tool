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
    let { job, personality, tone, template } = await req.json();

    // ランダム決定
    if (!job || job === 'random') job = getRandomLine('jobs.txt') || 'アパレル店員';
    if (!personality || personality === 'random') personality = getRandomLine('personalities.txt') || '元気いっぱい';

    // 文章の長さをランダムで決定（バリエーション用）
    const lengths = ["簡潔に", "標準的な長さで", "たっぷりと詳細に、セリフの深みを出して"];
    const chosenLength = lengths[Math.floor(Math.random() * lengths.length)];

    // お手本ファイルの読み込み
    const refPath = path.join(process.cwd(), 'data', 'reference.txt');
    const referenceData = fs.existsSync(refPath) ? fs.readFileSync(refPath, 'utf8') : "";

    const prompt = `
### 【絶対遵守のシステム命令】
1. キャラクターは【必ず女性】にすること。
2. 口調は必ず【${tone === 'polite' ? '敬語（です・ます調）' : 'タメ語（親しみやすい口語）'}】にせよ。
3. 文章の量は【${chosenLength}】作成せよ。長い指示の場合は、情景描写や感情を豊かに膨らませること。
4. 下記の【お手本ファイル】の形式・構成を【1文字の狂いもなく】継承せよ。URLが含まれていても無視し、URL行は必ず【完全な空行】にせよ。

### 【お手本ファイル（これを学習せよ）】
${referenceData}

---

### 【今回の作成依頼】
- 職業: ${job}
- 性格: ${personality}
- 指定口調: ${tone === 'polite' ? '敬語' : 'タメ語'}

### 【データ構造の鉄則】
- 名前: アタック(1-3)では名前を呼ばない。返信(1-3)では必ず「%send_nickname%」を使う。
- URL: 絶対に出力禁止。URL行は「空行」にすること。
- 固定行: 「私　⇔　○○さん」を維持する。

### 【出力フォーマット】
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "あなたはURLを削除し、指定の口調と長さで女性キャラデータを生成する専門マシンです。挨拶不要。" }
      ],
      temperature: 0.8, 
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
