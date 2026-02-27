"use client";

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
    if (!file) return;
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
      if (data.error) throw new Error(data.error);
      setOutput(data.result);
    } catch (err) {
      setOutput("エラーが発生しました: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#fff', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>キャラ設定ジェネレーター Pro</h1>
      
      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontWeight: 'bold' }}>1. お手本ファイル (.txt): </label><br/>
          <input type="file" onChange={handleFileUpload} accept=".txt" style={{ marginTop: '5px' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontWeight: 'bold' }}>2. 生成テーマ: </label>
          <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="例：ツンデレな女子大生" style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
          <div>
            <label style={{ fontWeight: 'bold' }}>口調: </label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ padding: '5px' }}>
              <option value="タメ語">タメ語</option>
              <option value="丁寧な敬語">敬語</option>
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 'bold' }}>絵文字: </label>
            <select value={emoji} onChange={(e) => setEmoji(e.target.value)} style={{ padding: '5px' }}>
              <option value="適宜使用する">あり</option>
              <option value="一切使用しない">なし</option>
            </select>
          </div>
        </div>

        <button onClick={generate} disabled={loading} style={{ width: '100%', padding: '12px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
          {loading ? 'AIが生成中...' : '新規キャラクターを生成'}
        </button>
      </div>

      <div style={{ marginTop: '20px', whiteSpace: 'pre-wrap', background: '#1e1e1e', color: '#d4d4d4', padding: '20px', borderRadius: '10px', fontSize: '14px', lineHeight: '1.6', minHeight: '200px' }}>
        {output}
      </div>
    </div>
  );
}
