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

    // 職業と性格を確定（空ならランダム）
    const finalJob = (!job || job === 'random') ? (getRandomLine('jobs.txt') || '錬金術師') : job;
    const finalPersonality = (!personality || personality === 'random') ? (getRandomLine('personalities.txt') || '冷静沈着') : personality;

    const refPath = path.join(process.cwd(), 'data', 'reference.txt');
    const referenceData = fs.existsSync(refPath) ? fs.readFileSync(refPath, 'utf8') : "";

    const prompt = `
### 【最優先指令：データ作成機として振る舞え】
1. キャラクターは【必ず女性】にすること。
2. お手本の「○○さん」は禁止。返信内では必ず【%send_nickname%】を使用せよ。
3. アタック(1-3)では相手の名前を【絶対に呼ぶな】。
4. URL行は文字を入れず、必ず【完全な空行】にせよ。
5. 口調は【${tone === 'polite' ? '敬語' : 'タメ語'}】。

### 【お手本フォーマット】
${referenceData}

---

### 【作成依頼】
- 職業: ${finalJob}
- 性格: ${finalPersonality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
※リリィやアレンのような「紹介文」は出力禁止。上記お手本の形式でセリフデータのみを出力せよ。

### 【出力フォーマット】
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "女性キャラデータ作成機。URL抹消、返信は%send_nickname%固定、アタックでの名前呼び禁止を死守。" }
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
