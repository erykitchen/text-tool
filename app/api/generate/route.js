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

    // 未入力ならファイルからランダム取得
    const finalJob = (!job || job === 'random') ? (getRandomLine('jobs.txt') || '錬金術師') : job;
    const finalPersonality = (!personality || personality === 'random') ? (getRandomLine('personalities.txt') || '冷静沈着') : personality;

    const refPath = path.join(process.cwd(), 'data', 'reference.txt');
    const referenceData = fs.existsSync(refPath) ? fs.readFileSync(refPath, 'utf8') : "";

    const prompt = `
### 厳守ルール
1. 【必ず女性】のキャラクターとして作成せよ。
2. 出力形式は、以下の【お手本】の構成・記号・項目を【完全コピー】せよ。
3. 下記の「性格設定」は、セリフを作るための「ヒント」であり、そのまま出力してはならない。

### 今回の材料（セリフの性格に反映させよ）
- 職業: ${finalJob}
- 性格: ${finalPersonality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}

### お手本ファイル（この「形式」を死守し、URLは空行にせよ）
${referenceData}

### 指示
上記【お手本】の「■キャラ名」から始まるフォーマットを埋めなさい。
返信(1-3)では必ず相手を「%send_nickname%」と呼び、URL行は必ず「空行」にすること。
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "あなたは指示された性格の女性になりきり、指定のデータ形式（■キャラ名〜）を作成する専用マシンです。性格の紹介文を書くのではなく、その性格に基づいた「セリフデータ」を作成してください。" 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7, 
    });

    return NextResponse.json({ 
      result: response.choices[0].message.content,
      selectedJob: finalJob,
      selectedPersonality: finalPersonality 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
