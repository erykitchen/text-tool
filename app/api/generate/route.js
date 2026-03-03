import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ファイルからランダムに行を抽出する関数
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

    // 職業と性格が空、もしくは「random」ならファイルから抽選
    if (!job || job === 'random') job = getRandomLine('jobs.txt') || 'アパレル店員';
    if (!personality || personality === 'random') personality = getRandomLine('personalities.txt') || '元気いっぱい';

    // お手本集（reference.txt）を読み込む
    const refPath = path.join(process.cwd(), 'data', 'reference.txt');
    let referenceData = "";
    if (fs.existsSync(refPath)) {
      referenceData = fs.readFileSync(refPath, 'utf8');
    }

    const prompt = `
# 命令:
【過去の成功事例集】の書き方を学習し、今回のお題で【新しいキャラクター1人分】のデータを生成せよ。

# 今回のランダム選定お題:
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emoji}

# 学習用事例集（URL消去や名前のルールをここから学べ）:
${referenceData}

# 鉄則:
1. **URL抹消**: URLがある行は完全に削除し、空行にせよ。
2. **名前固定**: 【アタック】は名前禁止、【返信】は必ず「%send_nickname%」を使え。
3. **固定行**: 「私　⇔　○○さん」を維持せよ。
4. **新作**: 事例集の文章をコピペせず、${job}と${personality}に合わせてゼロから書け。

# 出力フォーマット:
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "あなたはゲームシナリオ生成機です。指示された職業と性格に基づき、1人分のキャラデータを生成してください。挨拶不要。" }
      ],
      temperature: 0.9, // ランダム性を活かすため少し高めに設定
    });

    return NextResponse.json({ 
      result: response.choices[0].message.content,
      selectedJob: job, // UI側で何が選ばれたか確認したい場合用
      selectedPersonality: personality 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
