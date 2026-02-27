import { useState } from 'react';

export default function Home() {
  const [theme, setTheme] = useState('');
  const [tone, setTone] = useState('タメ語');
  const [emoji, setEmoji] = useState('適宜使用する');
  const [template, setTemplate] = useState('');
  const [output, setOutput] = useState('お手本を読み込み、生成ボタンを押してください。');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => setTemplate(event.target.result);
    reader.readAsText(file);
  };

  const generate = async () => {
    if (!template) return alert("お手本ファイルをアップロードしてください");
    setLoading(true);
    setOutput("生成中...");

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, tone, emoji, template }),
      });
      const data = await res.json();
      setOutput(data.result || data.error);
    } catch (err) {
      setOutput("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>キャラ設定ジェネレーター Pro</h1>
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '10px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label>お手本ファイル: </label>
          <input type="file" onChange={handleFileUpload} accept=".txt" />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>テーマ: </label>
          <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="例：ツンデレ女子高生" style={{ width: '70%' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>口調: </label>
          <select value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="タメ語">タメ語</option>
            <option value="丁寧な敬語">敬語</option>
          </select>
          <label style={{ marginLeft: '20px' }}>絵文字: </label>
          <select value={emoji} onChange={(e) => setEmoji(e.target.value)}>
            <option value="適宜使用する">あり</option>
            <option value="一切使用しない">なし</option>
          </select>
        </div>
        <button onClick={generate} disabled={loading} style={{ width: '100%', padding: '10px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {loading ? '生成中...' : '新規キャラクターを生成'}
        </button>
      </div>
      <div style={{ marginTop: '20px', whiteSpace: 'pre-wrap', background: '#333', color: '#fff', padding: '20px', borderRadius: '10px' }}>
        {output}
      </div>
    </div>
  );
}
