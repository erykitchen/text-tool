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
    referenceData = referenceData.replace(/○○さん/g, "　");

    const prompt = `
### 【絶対命令】
1. **アタック(1-3)**: 相手を呼ぶ言葉（%send_nickname%、あなた、君、そっち、○○さん等）を【1文字も使用禁止】。
   - 名前を呼ばずに「甘いものは好き？」「休日は何してる？」と聞け。
2. **返信(1-3)**: 必ず【%send_nickname%】を使って呼べ。
3. **体重**: 【43〜50kg】厳守。
4. **URL**: インスタURL行は【完全な空行】。
5. **文章量**: 各セリフ【3行以上】。

### 【お手本】
${referenceData}

### 【設定】
職業:${finalJob} / 性格:${finalPersonality} / 口調:${tone === 'polite' ? '敬語' : 'タメ語'} / 性別:女性
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "精密データ作成機。アタックでの名前呼びは致命的バグ。返信は名前呼び必須。体重50以下。" }
      ],
      temperature: 0.7, 
    });

    let resultText = response.choices[0].message.content;

    // ★【物理フィルター】アタックセクション内から名前呼びを強制除去
    // アタック1〜3の範囲を特定し、もし名前呼びが含まれていたら消去・置換する処理
    const attackMatch = resultText.match(/【アタック1】[\s\S]*【アタック3】[\s\S]*?(?=\n\n|---|$)/);
    if (attackMatch) {
      let filteredAttack = attackMatch[0]
        .replace(/%send_nickname%(は|も|が|って)/g, "") // 「名前は」などを消す
        .replace(/%send_nickname%/g, ""); // 単体の名前も消す
      resultText = resultText.replace(attackMatch[0], filteredAttack);
    }

    return NextResponse.json({ 
      result: resultText,
      selectedJob: finalJob,
      selectedPersonality: finalPersonality
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
