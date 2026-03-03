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
2. 下記の【お手本】の形式を1文字も変えずに流用し、中身の文章だけを今回の設定（${finalJob} / ${finalPersonality}）に書き換えよ。
3. 【URLの抹消】: お手本に「https://」で始まるURLがあっても、それは絶対に出力するな。URLが書かれていた行は、文字を一切入れず【完全な空行（改行のみ）】にせよ。
4. 【アタックでの名前禁止】: 【アタック1】【アタック2】【アタック3】の中では、相手の名前（○○さんや%send_nickname%等）を【絶対に】呼ぶな。

### 【お手本フォーマット】
${referenceData}

---

### 【設定・口調】
- 職業: ${finalJob}
- 性格: ${finalPersonality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}

### 【鉄則】
- **返信(1-3)**: 相手の呼び名は必ず【%send_nickname%】に置換せよ。「○○さん」は使用禁止。
- **アタック(1-3)**: 相手に一切言及せず、自分の話や問いかけのみで構成せよ。
- **インスタURL行**: お手本の項目名は残しても良いが、URLそのものは消して【空行】にせよ。
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "女性キャラデータ作成機。URLは絶対に削除して空行にする。アタックでは絶対に相手の名前を呼ばない。返信は%send_nickname%固定。" 
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
