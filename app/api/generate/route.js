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
  return lines.length > 0 ? lines[Max.floor(Math.random() * lines.length)] : null;
};

export async function POST(req) {
  try {
    const { job, personality, tone, template } = await req.json();

    const finalJob = (!job || job === 'random') ? (getRandomLine('jobs.txt') || 'デザイナー') : job;
    const finalPersonality = (!personality || personality === 'random') ? (getRandomLine('personalities.txt') || '明るい') : personality;

    const refPath = path.join(process.cwd(), 'data', 'reference.txt');
    let referenceData = fs.existsSync(refPath) ? fs.readFileSync(refPath, 'utf8') : "";

    // 【防衛1】お手本から「○○さん」を消去し、AIの誤用を物理的に防ぐ
    referenceData = referenceData.replace(/○○さん/g, "[名前呼び禁止/返信時のみ%send_nickname%を使用]");

    const prompt = `
### 【絶対遵守命令：データ変換エンジン】
あなたは指示された設定を「お手本の形式」に流し込む精密なマシンです。

1. **体格制限**: 体重は必ず【43〜50】の範囲内で設定せよ。51以上は厳禁。
2. **アタック(1-3)の禁止事項**: 相手を呼ぶ言葉（%send_nickname%、あなた、君、○○さん、そちら等）を【一切使うな】。
   - 名前を呼ばない「質問」は積極的に行え。（例：「ホラーは好き？」「休日は何してる？」）
3. **返信(1-3)の必須事項**: 相手の呼び名は100%【%send_nickname%】を使用せよ。
4. **URLの抹消**: インスタURL等のリンク行は、文字を入れず【完全な空行】にせよ。
5. **文章量**: すべてのセリフ（アタック・返信）を【3行以上】で構成せよ。

### 【お手本フォーマット（形式・項目・順序を完コピ）】
${referenceData}

---

### 【今回の材料】
- 職業: ${finalJob}
- 性格: ${finalPersonality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 性別: 必ず女性
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "女性キャラデータ作成機。体重は50以下。アタックで名前呼び厳禁。返信は%send_nickname%必須。URLは空行。各3行以上。" 
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
