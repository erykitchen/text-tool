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

    const finalJob = (!job || job === 'random') ? (getRandomLine('jobs.txt') || '女子大生') : job;
    const finalPersonality = (!personality || personality === 'random') ? (getRandomLine('personalities.txt') || 'おっとり') : personality;

    const refPath = path.join(process.cwd(), 'data', 'reference.txt');
    const referenceData = fs.existsSync(refPath) ? fs.readFileSync(refPath, 'utf8') : "";

    const prompt = `
### 【警告：あなたはデータ作成機です】
ユーザーが入力した「プロフィール（エリスなど）」は、セリフを作るための「材料」に過ぎません。
【お手本】の形式を無視して、キャラクター紹介や解説を書くことは【絶対禁止】です。

### 【死守ルール】
1. キャラクターは【必ず女性】。
2. 出力項目は、以下の【お手本】にある項目（■キャラ名、アタック1-3、返信1-3等）を【1文字も変えず】にそのまま使用せよ。
3. セリフ1つにつき【必ず3行以上】のボリュームを持たせること。
4. 【インスタURL】の行は、文字を消して必ず【完全な空行】にせよ。
5. 【アタック1〜3】の中では、相手の名前（%send_nickname%等）を【絶対に呼ぶな】。
6. 返信内の呼び名は【%send_nickname%】で固定せよ。

### 【お手本フォーマット（この形式・記号・順序を100%コピーせよ）】
${referenceData}

---

### 【今回の材料（セリフ内容に反映せよ）】
- 職業/設定: ${finalJob}
- 性格/特徴: ${finalPersonality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "あなたは指示された性格の女性になりきり、指定のデータ形式（■キャラ名〜）を埋める精密なプログラムです。紹介文や挨拶は一切禁止。■キャラ名 から開始してください。" 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.8, 
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
