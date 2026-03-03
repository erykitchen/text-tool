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

    // ★ 性格と職業をここで確定（未入力ならランダム）
    const finalJob = (!job || job === 'random') ? (getRandomLine('jobs.txt') || '錬金術師') : job;
    const finalPersonality = (!personality || personality === 'random') ? (getRandomLine('personalities.txt') || '冷静沈着') : personality;

    // 文章量のランダム化
    const lengths = ["簡潔に", "標準的な量で", "セリフと感情描写をたっぷりと長く"];
    const chosenLength = lengths[Math.floor(Math.random() * lengths.length)];

    const refPath = path.join(process.cwd(), 'data', 'reference.txt');
    const referenceData = fs.existsSync(refPath) ? fs.readFileSync(refPath, 'utf8') : "";

    const prompt = `
### 【絶対遵守のシステム命令】
1. キャラクターは【必ず女性】にすること。
2. お手本の「○○さん」という表記は【禁止】。返信内では必ず【%send_nickname%】に置換せよ。
3. アタック(1-3)では相手の名前を【絶対に呼ぶな】。
4. URL行は、文字を入れず必ず【完全な空行】にせよ。
5. 口調は【${tone === 'polite' ? '敬語' : 'タメ語'}】、文章量は【${chosenLength}】。

### 【お手本フォーマット（形式のみを学習せよ）】
${referenceData}

---

### 【今回の作成依頼】
- 職業: ${finalJob}
- 性格: ${finalPersonality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- ※リリィやアレンのような箇条書きの紹介文は【出力禁止】。上記お手本の形式でセリフを作成せよ。

### 【出力フォーマット】
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "データ作成機。女性限定。URLは空行。返信は%send_nickname%固定。アタックで名前を呼ぶのは禁止。" }
      ],
      temperature: 0.7, 
    });

    return NextResponse.json({ 
      result: response.choices[0].message.content,
      selectedJob: finalJob,
      selectedPersonality: finalPersonality // ★フロントに性格も返す
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
