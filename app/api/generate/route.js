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

    // お手本ファイル（脳みそ）の読み込み
    const refPath = path.join(process.cwd(), 'data', 'reference.txt');
    const referenceData = fs.existsSync(refPath) ? fs.readFileSync(refPath, 'utf8') : "";

    const prompt = `
### 【最優先指令】
1. 生成するキャラクターは【必ず女性】にすること。
2. 下記の【お手本ファイル】の形式、構成、変数の使い方を【1文字の狂いもなく】継承せよ。

### 【お手本ファイル：この通りに作れ】
${referenceData}

---

### 【今回の作成依頼】
以下の設定に基づき、上記お手本の「書き方」で新作を1人分だけ書き下ろしてください。
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 装飾: ${emoji}
- 性別: 女性

### 【死守すべきルール】
- **URL**: URL行は何も書かず「空行」にすること。
- **アタック1〜3**: 相手の名前を呼ばない。
- **返信1〜3**: 相手の名前は必ず「%send_nickname%」と書く。
- **固定行**: 「私　⇔　○○さん」を維持する。
- **内容**: お手本の文章をコピペせず、${job}らしいエピソードを新規作成すること。

### 【出力フォーマット】
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "あなたは提供されたお手本ファイルを完璧にシミュレートするデータ作成機です。性別は必ず女性、形式はお手本通り。挨拶や説明は一切不要です。" 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.75, // ルール遵守と創造性のバランス
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
