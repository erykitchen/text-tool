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
  // Math.floor に修正しました（これで Max エラーは出ません）
  return lines.length > 0 ? lines[Math.floor(Math.random() * lines.length)] : null;
};

export async function POST(req) {
  try {
    const { job, personality, tone, template } = await req.json();

    const finalJob = (!job || job === 'random') ? (getRandomLine('jobs.txt') || 'デザイナー') : job;
    const finalPersonality = (!personality || personality === 'random') ? (getRandomLine('personalities.txt') || '明るい') : personality;

    const refPath = path.join(process.cwd(), 'data', 'reference.txt');
    let referenceData = fs.existsSync(refPath) ? fs.readFileSync(refPath, 'utf8') : "";
    
    // お手本の「○○さん」を消去
    referenceData = referenceData.replace(/○○さん/g, "　");

    const prompt = `
### 【絶対遵守：データ生成モード】
あなたはチャットボットではありません。入力された設定を「お手本の形式」に当てはめるだけの【データ作成機】です。
「名前を教えてください」等の対話は【絶対に禁止】です。エラーと見なします。

1. **体格制限**: 体重は必ず【43〜50kg】。
2. **アタック(1-3)の禁止事項**: 相手を呼ぶ言葉（%send_nickname%、あなた、君、○○さん、そちら等）を【1文字も使うな】。
   - 名前を呼ばずに「最近何してる？」「おすすめはある？」と質問せよ。
3. **返信(1-3)の必須事項**: 相手の呼び名は必ず【%send_nickname%】を使用せよ。
4. **URLの抹消**: インスタURL等のリンク行は、文字を入れず【完全な空行】にせよ。
5. **文章量**: すべてのセリフ（アタック・返信）を【3行以上】で構成せよ。

### 【お手本フォーマット（これを埋めろ）】
${referenceData}

---

### 【今回の材料】
職業:${finalJob} / 性格:${finalPersonality} / 口調:${tone === 'polite' ? '敬語' : 'タメ語'} / 性別:女性
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "あなたは精密なデータ作成機です。挨拶や対話は一切せず、■キャラ名 から始まるデータのみを出力してください。アタックでの名前呼びは厳禁です。" 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7, 
    });

    let resultText = response.choices[0].message.content;

    // ★【物理フィルター】アタックセクション内から名前呼びを強制除去
    // 万が一AIが名前を混ぜても、ここで消し去ります
    const attackLines = resultText.split('\n');
    let isInsideAttack = false;
    const filteredLines = attackLines.map(line => {
      if (line.includes('【アタック')) isInsideAttack = true;
      if (line.includes('■返信')) isInsideAttack = false;
      
      if (isInsideAttack) {
        return line.replace(/%send_nickname%(は|も|が|って|に|の)/g, "").replace(/%send_nickname%/g, "");
      }
      return line;
    });
    
    resultText = filteredLines.join('\n');

    return NextResponse.json({ 
      result: resultText,
      selectedJob: finalJob,
      selectedPersonality: finalPersonality
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
