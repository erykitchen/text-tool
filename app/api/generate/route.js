import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { job, personality, tone, emoji, template } = await req.json();

    // 絵文字の指示をより厳格に
    let emojiInstruction = "";
    if (emoji === "使わない") {
      emojiInstruction = "【厳守】絵文字、顔文字、特殊記号（💖、(*^^*)など）を一切使用せず、テキストのみで構成してください。文章中のどこにも記号を入れないでください。";
    } else if (emoji === "顔文字") {
      emojiInstruction = "絵文字は使わず、顔文字（例：(^_^)）のみを適度に使用してください。";
    } else {
      emojiInstruction = `絵文字を${emoji}使用してください。`;
    }

    const prompt = `
あなたはプロのシナリオライターです。
以下のルールを「死守」して、お手本の形式で新しいキャラクターを作成してください。

### 1. フォーマットの絶対ルール
- **Markdown形式（###など）は一切禁止**です。
- 各項目は必ず「■」から始めてください。例：× ### ■キャラ名 → ○ ■キャラ名
- 項目名や記号（■）は、お手本と一字一句同じにしてください。

### 2. 内容の書き換えルール
- **URL**: インスタ等のURLが含まれる箇所は、文字（「URL削除」など）を一切書かず、ただの【空行】にしてください。
- **絵文字**: 指示が「使わない」の場合、文章から絵文字・顔文字・記号を1つ残らず排除してください。
- **恋愛対象**: 生成キャラは女性のため、必ず「彼女」と表現し、「彼氏」は禁止です。
- **名前**: 相手を呼ぶ際は「%send_nickname%」を使う（アタック1-3は名前を呼ばない）。

### 3. 各項目の生成内容
■キャラ名：ランダムな姓名またはあだ名
■生年月日：24歳～35歳になるようランダム設定
■身長：150～165cmでランダム
■体重：43～51kgでランダム
■自己紹介：【職業：${job}】【性格：${personality}】【口調：${tone === 'polite' ? '敬語' : 'タメ語'}】で新しく書き下ろす。
■タメ語■：
  - タメ語か敬語か：${tone === 'polite' ? '敬語' : 'タメ語'}
  - カップ数：C~Fでランダム
  - 名前：ひらがなで記入
  - 職業：${job}
  - 設定：${personality}
  - 絵文字：使う か 使わない の2択

【アタック1～3】【返信1～3および追いメッセージ】：
お手本をコピペせず、設定に合わせたセリフを新しく作成してください。
※アタック3は名残惜しそうにお別れを告げる。

### 指示
装飾指示：${emojiInstruction}

### お手本フォーマット
${template}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Markdownのハッシュタグ（#）は絶対に使わないでください。項目は■から始めてください。URLは完全に消去して空行にしてください。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    return NextResponse.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
