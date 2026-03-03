import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    let emojiInstruction = "";
    if (emoji === "使わない") {
      emojiInstruction = "絵文字や顔文字は一切使用しないでください。";
    } else if (emoji === "顔文字") {
      emojiInstruction = "絵文字は使わず、顔文字（(^_^)など）を適度に使用してください。";
    } else {
      emojiInstruction = `絵文字を${emoji}使用してください。`;
    }

    const prompt = `
あなたはプロのキャラクター設定師兼ライターです。
以下の【絶対ルール】と【各項目の作成ルール】を厳守し、お手本のフォーマットを維持したまま、中身を完全に新しく書き下ろしてください。

### 絶対ルール
1. **記号・項目名を一切変えない**: 「■」を「###」に変えたり、項目名を書き換えたりしないでください。お手本にある記号をそのまま出力してください。
2. **女性キャラ限定**: 恋愛対象は「彼女」とし、「彼氏」という言葉は使わない。
3. **URL削除**: URLは完全に消し、空白にしてください（注釈不要）。
4. **そのまま維持**: 「私　⇔　○○さん（または君）」「※テンプレ 返信3まで」などの管理用文言や区切り線はそのまま維持してください。

### 各項目の作成ルール
■キャラ名：日本の20～30代に実在しそうな名前やあだ名を、漢字・ひらがな・カタカナ・ローマ字からランダムで作成。
■生年月日：24歳～35歳になるよう逆算してランダムな日付を設定。
■身長：150～165cmの間でランダム。
■体重：43～51kgの間でランダム。
■自己紹介：【職業：${job}】【性格：${personality}】に基づき、設定された【口調：${tone === 'polite' ? '敬語' : 'タメ語'}】と【装飾：${emojiInstruction}】を守って魅力的に書き下ろしてください。
■タメ語■：以下の形式で記入。
  - タメ語か敬語か：${tone === 'polite' ? '敬語' : 'タメ語'}
  - カップ数：C~Fでランダム
  - 名前：上記「■キャラ名」の読みを【ひらがな】で記入
  - 職業：${job}
  - 設定：${personality}、および追加の設定
  - 絵文字：使う か 使わない の2択で記入

【アタック1～3】【返信1～3および追いメッセージ】：
お手本をコピペせず、設定に合わせたセリフを新しく作成してください。
- 相手を呼ぶ際は「%send_nickname%」を使う（アタック1-3は名前を呼ばない）。
- アタック3は、名残惜しそうにお別れを告げる内容にする。

### お手本（このフォーマットを崩さないこと）
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "あなたは指示を忠実に守り、指定された記号やフォーマットを1文字も変えずに内容だけを魅力的に書き換える専門家です。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
