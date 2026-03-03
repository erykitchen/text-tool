"use client";

import { useState } from 'react';

export default function Home() {
  const [template, setTemplate] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  // ファイル読み込み
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    setTemplate(text);
  };

  // 生成実行
  const generate = async () => {
    if (!template) {
      alert("お手本ファイルを読み込んでください");
      return;
    }
    setLoading(true);
    setOutput("");

    try {
      const res = await fetch(`${window.location.origin}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template }),
      });

      // サーバーが正常に返さなかった場合
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`サーバーエラー (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      setOutput(data.result);
    } catch (err) {
      setOutput("エラーが発生しました: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>キャラ量産ツール</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>1. お手本ファイル (.txt) を選択:</label><br />
        <input type="file" accept=".txt" onChange={handleFileChange} />
      </div>

      <button 
        type="button" 
        onClick={generate} 
        disabled={loading} 
        style={{ 
          width: '100%', padding: '15px', background: loading ? '#ccc' : '#0070f3', 
          color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' 
        }}
      >
        {loading ? "生成中..." : "新規キャラクターを生成"}
      </button>

      {output && (
        <div style={{ marginTop: '30px', padding: '20px', background: '#f5f5f5', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
          <h2>生成結果:</h2>
          {output}
        </div>
      )}
    </div>
  );
}
