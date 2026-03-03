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
### 【最優先：絶対厳守ルール】
1. **アタックの禁止事項**: 【アタック1】【アタック2】【アタック3】の文章内で、相手を呼ぶこと（%send_nickname%、あなた、君、○○さん等）を【完全に禁止】する。
   - 悪い例：「%send_nickname%はどう思う？」「%send_nickname%に会いたいな」
   - 良い例：「私はこう思うな」「今日はこんなことがあったよ」「誰か聞いてくれるかな」
   - アタックは、主語を自分にするか、一般論にするか、相手を特定しない独り言形式にせよ。

2. **返信のルール**: 【返信1〜3】内では、逆に必ず【%send_nickname%】を使い、相手の名前を呼べ。

3. **URLの抹消**: インスタURL等のリンクは絶対に出力せず、その行は【完全な空行】にせよ。

4. **文章量**: すべてのセリフを【3行以上】で構成せよ。

### 【お手本フォーマット（形式・項目・順序を完コピせよ）】
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
          content: "女性キャラデータ作成機。アタック1-3では相手(名前)に一切言及するな。自分の話だけを3行以上書け。URLは空行。返信は%send_nickname%必須。" 
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
