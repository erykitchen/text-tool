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
    let referenceData = fs.existsSync(refPath) ? fs.readFileSync(refPath, 'utf8') : "";

    // お手本の中の「○○さん」を、AIが真似しないよう「空欄」に置換
    referenceData = referenceData.replace(/○○さん/g, "　");

    const prompt = `
### 【データ構築の絶対ルール：背いた場合はエラー】
1. **アタック(1-3)での名前呼びは【死罪】**:
   - アタック文中に「%send_nickname%」「君」「あなた」「そちら」等の、特定の相手を指し示す言葉を含めることを【厳禁】とする。
   - ⭕ 良い質問：「最近はどんな映画を観た？」「美味しいお店とか知ってるかな？」
   - ❌ 悪い質問：「%send_nickname%は何が好き？」「君はどう思う？」
   - 相手の名前（変数）を入れずに問いかけを完結させよ。

2. **返信(1-3)での名前呼びは【必須】**:
   - 返信では必ず【%send_nickname%】を使い、親密に呼びかけよ。

3. **体格制限**: 体重は必ず【43kg〜50kg】。51以上は禁止。

4. **URL抹消**: インスタURL行は文字なしの【完全な空行】にせよ。

5. **文章量**: 全セリフ【3行以上】。

### 【お手本フォーマット（項目と順序を死守）】
${referenceData}

---

### 【設定】
- 職業: ${finalJob}
- 性格: ${finalPersonality}
- 口調: ${tone === 'polite' ? '敬語' : 'タメ語'}
- 性別: 女性
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "精密データ作成機。アタック1-3で相手を名前(%send_nickname%等)で呼ぶことはシステムエラーとして禁止。返信は%send_nickname%必須。体重50以下。" 
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
