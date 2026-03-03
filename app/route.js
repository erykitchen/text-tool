"use client";

import { useState } from 'react';

export default function Home() {
  const [template, setTemplate] = useState('');
  const [job, setJob] = useState(''); // 職業
  const [personality, setPersonality] = useState(''); // 性格
  const [tone, setTone] = useState('polite'); // 口調（敬語/タメ語）
  const [emoji, setEmoji] = useState('yes'); // 絵文字（5択）
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  // ファイル読み込み（追記型）
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    setTemplate(prev => prev ? prev + "\n\n" + text : text);
    alert("お手本を追加しました！");
  };

  const generate = async () => {
    if (!template) {
      alert("まずはお手本ファイルを読み込んでください");
      return;
    }
    setLoading(true);
    setOutput("");

    try {
      // 405エラー対策のため、パスを修正
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, personality, tone, emoji, template }),
      });

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
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#0070f3' }}>高精度キャラ量産ツール</h1>
      
      {/* お手本読み込み */}
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
        <label style={{ fontWeight: 'bold' }}>1. お手本ファイルを読み込む (複数可):</label><br />
        <input type="file" accept=".txt" onChange={handleFileChange} style={{ marginTop: '10px' }} />
        <textarea 
          value={template} 
          onChange={(e) => setTemplate(e.target.value)}
          placeholder="読み込まれたお手本がここに蓄積されます。"
          style={{ width: '100%', height: '80px', marginTop: '10px' }}
        />
        <button onClick={() => setTemplate('')} style={{ fontSize: '0.7em', marginTop: '5px' }}>リセット</button>
      </div>

      {/* 設定 */}
      <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
        <input type="text" value={job} onChange={(e) => setJob(e.target.value)} placeholder="キャラクターの職業" style={{ width: '100%', padding: '10px' }} />
        <input type="text" value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="キャラクターの性格" style={{ width: '100%', padding: '10px' }} />

        <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ width: '100%', padding: '10px' }}>
          <option value="polite">口調：敬語</option>
          <option value="casual">口調：タメ語</option>
        </select>

        <select value={emoji} onChange={(e) => setEmoji(e.target.value)} style={{ width: '100%', padding: '10px' }}>
          <option value="yes">絵文字：使う</option>
          <option value="no">絵文字：使わない</option>
          <option value="多い">絵文字：多い</option>
          <option value="少ない">絵文字：少ない</option>
          <option value="顔文字">絵文字：顔文字</option>
        </select>
      </div>

      <button 
        type="button" 
        onClick={generate} 
        disabled={loading} 
        style={{ width: '100%', padding: '20px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
      >
        {loading ? "AIが解析中..." : "お手本の形式で新規生成！"}
      </button>

      {output && (
        <div style={{ marginTop: '30px', padding: '20px', background: '#eee', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
          {output}
        </div>
      )}
    </div>
  );
}
