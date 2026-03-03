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
### 【絶対遵守：データ構築ルール】
1. **アタックの質問ルール**: 【アタック1〜3】で相手に質問をするのは【OK】。ただし、相手を呼ぶ言葉（%send_nickname%、あなた、君、そっち等）は【1文字も使うな】。
   - ❌ ダメな例：「%send_nickname%は何が好き？」「君の趣味は？」
   - ⭕ 良い例：「どんなファッションが好きなのかな？」「おすすめのカフェとかあったら知りたいな！」「最近はどんなことにハマってる？」
   - 「名前を呼ばずに、相手の事を聞く」という高度な文章を作れ。

2. **文章量**: 全てのセリフを【3行以上】で構成せよ。1行や2行の短い文章は禁止。

3. **URLの抹消**: インスタURL等のリンク行は、文字を入れず必ず【完全な空行】にせよ。

4. **返信のルール**: 【返信1〜3】内では、必ず【%send_nickname%】を使って親密に呼びかけよ。

### 【お手本フォーマット（形式・項目・順序を100%コピー）】
${referenceData}

---

### 【設定材料】
- 職業: ${finalJob}
- 性格: ${finalPersonality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "女性キャラデータ作成機。アタックでは相手を名前で呼ばずに質問を含め、3行以上書くこと。URLは空行。返信は%send_nickname%必須。" 
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
