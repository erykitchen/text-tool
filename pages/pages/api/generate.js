import { OpenAI } from "openai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Vercelの設定画面に入れたキーがここに入ります
  });

  try {
    const { theme, tone, emoji, template } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "プロのシナリオライターとして、お手本のフォーマットを完全に守って新キャラを生成してください。" },
        { role: "user", content: `テーマ: ${theme}\n口調: ${tone}\n絵文字: ${emoji}\n\n【お手本】\n${template}` }
      ],
    });

    res.status(200).json({ result: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
