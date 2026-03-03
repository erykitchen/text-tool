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

    // 入力があればそれを使用、なければランダム
    const finalJob = (!job || job === 'random') ? (getRandomLine('jobs.txt') || 'グラフィックデザイナー') : job;
    const finalPersonality = (!personality || personality === 'random') ? (getRandomLine('personalities.txt') || '明るくて社交的') : personality;

    const refPath = path.join(process.cwd(), 'data', 'reference.txt');
    const referenceData = fs.existsSync(refPath) ? fs.readFileSync(refPath, 'utf8') : "";

    const prompt = `
### 【警告：出力形式を絶対に崩すな】
あなたは提供された【お手本ファイル】を完璧に模倣するデータ生成マシンです。
「名前：〜〜 年齢：〜〜」といった紹介文やプロフィール解説をすることは、プログラム上の致命的なエラーと見なします。

### 【死守すべきルール】
1. キャラクターは【必ず女性】にする。
2. 出力項目は、下記の【お手本】にある項目（■キャラ名、アタック1-3、返信1-3等）のみを出し、1文字の狂いもなく形式と項目順を維持せよ。
3. 相手の呼び名は必ず【%send_nickname%】。
4. URL行は必ず【完全な空行】（改行のみ）。
5. アタック(1-3)では相手の名前を絶対に呼ばない。

### 【お手本（この形式・項目・記号を100%コピーせよ）】
${referenceData}

---

### 【今回使用する「美咲」の設定材料】
（※内容（デザイナー、22歳、社交的だが内向的等）だけを読み取り、形式は上記お手本に強制的に合わせろ）
- 職業: ${finalJob}
- 性格: ${finalPersonality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}

### 【最終命令】
お手本の「■キャラ名」から始まるデータのみを返せ。余計な解説やプロフィール紹介は一切不要。
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "女性キャラデータ作成機。■キャラ名 から開始し、お手本と同一の項目数・形式で出力せよ。プロフィール紹介文の出力は厳禁。URLは空行。" 
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
