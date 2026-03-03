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
  return lines.length > 0 ? lines[Math.floor(Math.random() * lines.length)] : null;
};

export async function POST(req) {
  try {
    const { job, personality, tone, template } = await req.json();

    const finalJob = (!job || job === 'random') ? (getRandomLine('jobs.txt') || 'デザイナー') : job;
    const finalPersonality = (!personality || personality === 'random') ? (getRandomLine('personalities.txt') || '明るい') : personality;

    const refPath = path.join(process.cwd(), 'data', 'reference.txt');
    const referenceData = fs.existsSync(refPath) ? fs.readFileSync(refPath, 'utf8') : "";

    const prompt = `
### 【絶対遵守命令：データ変換エンジン】
1. キャラクターは【必ず女性】。
2. 【文章量】: 1つ1つのセリフ（アタック、返信等）は【最低3行以上】で構成せよ。状況描写、感情、相手への問いかけを混ぜ、読み応えのある長さにすること。
3. 【URLの抹消】: インスタURL等の「https://」で始まるURLは【絶対に出力禁止】。URLが書かれていた行は【完全な空行（改行のみ）】にせよ。
4. 【アタックでの名前禁止】: 【アタック1〜3】の中では、相手の名前（%send_nickname%等）を【絶対に呼ぶな】。
5. 【返信での名前固定】: 返信(1-3)内の相手の呼び名は必ず【%send_nickname%】に置換せよ。

### 【お手本フォーマット】
${referenceData}

---

### 【設定・口調】
- 職業: ${finalJob}
- 性格: ${finalPersonality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}

### 【出力指示】
お手本の「■キャラ名」からの形式を完コピし、中身だけを上記の設定で書き換えよ。
紹介文や解説は一切不要。データのみを出力せよ。
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "女性キャラデータ作成機。セリフは1つにつき3行以上のボリュームを持たせること。URLは空行。アタックで名前を呼ぶのは禁止。" }
      ],
      temperature: 0.8, // 表現を豊かにするため少し上げました
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
