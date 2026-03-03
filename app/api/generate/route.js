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

    // 文章の長さをランダムで決定（短め・普通・長め）
    const lengths = ["簡潔に", "標準的な長さで", "たっぷりと詳細に"];
    const chosenLength = lengths[Math.floor(Math.random() * lengths.length)];

    const refPath = path.join(process.cwd(), 'data', 'reference.txt');
    const referenceData = fs.existsSync(refPath) ? fs.readFileSync(refPath, 'utf8') : "";

    const prompt = `
### 【最優先指令】
1. キャラクターは【必ず女性】にすること。
2. 口調は必ず【${tone === 'polite' ? '敬語（です・ます調）' : 'タメ語（親和性の高い口語）'}】にせよ。
3. 文章のボリュームは【${chosenLength}】作成せよ。特に「長め」の指示の場合は、セリフの背景や感情表現を豊かに膨らませること。
4. 下記の【お手本ファイル】の形式・構成を【1文字の狂いもなく】継承せよ。URLは必ず【完全な空行】にせよ。

### 【お手本ファイル】
${referenceData}

---

### 【今回の作成依頼】
- 職業: ${job}
- 性格: ${personality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}

### 【鉄則】
- 名前: アタックは名前禁止。返信は必ず「%send_nickname%」を使う。
- URL: 絶対に出力禁止。URL行は「空行」にすること。
- 変化: ${chosenLength}という指示に従い、毎回文章の量や言い回しに変化をつけ、読み応えのある内容にせよ。

### 【出力フォーマット】
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "データ作成機。女性限定。URLは空行。指定された口調と長さを厳守。" }
      ],
      temperature: 0.85, // 表現の幅を広げるため少し上げる
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
