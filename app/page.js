"use client";

import { useState } from 'react';

export default function Home() {
  const [template, setTemplate] = useState('');
  const [job, setJob] = useState(''); 
  const [personality, setPersonality] = useState(''); 
  const [tone, setTone] = useState('polite'); 
  const [emoji, setEmoji] = useState('yes'); 
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  // お手本追加機能（選ぶたびに追加されます）
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newText = event.target.result;
      setTemplate((prev) => {
        const separator = prev ? "\n\n--------------------------------------\n\n" : "";
        return prev + separator + newText;
      });
      alert("お手本を追加しました！");
      e.target.value = ''; // 連続選択を可能にする
    };
    reader.readAsText(file);
  };

  const generate = async () => {
    if (!template.trim()) {
      alert("まずはお手本ファイルを読み込むか、直接入力してください");
      return;
    }
    setLoading(true);
    setOutput("");

    try {
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
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif', color: '#333' }}>
      <h1 style={{ textAlign: 'center', color: '#0070f3' }}>キャラ量産ツール</h1>
      
      {/* 1. お手本セクション */}
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #ddd' }}>
        <label style={{ fontWeight: 'bold' }}>1. お手本ファイルを読み込む (複数追加OK):</label><br />
        <input type="file" accept=".txt" onChange={handleFileChange} style={{ marginTop: '10px' }} />
        
        <textarea 
          value={template} 
          onChange={(e) => setTemplate(e.target.value)} 
          placeholder="読み込まれたお手本がここに蓄積されます。直接編集も可能です。"
          style={{ width: '100%', height: '150px', marginTop: '10px', boxSizing: 'border-box', fontSize: '12px', padding: '10px' }} 
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>現在のお手本量: {template.length} 文字</span>
          <button onClick={() => setTemplate('')} style={{ fontSize: '12px', cursor: 'pointer', background: 'none', border: '1px solid #ccc', borderRadius: '3px' }}>お手本をリセット</button>
        </div>
      </div>

      {/* 2. キャラ設定セクション */}
      <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
        <div>
          <label style={{ fontWeight: 'bold', fontSize: '14px' }}>2. 職業:</label>
          <input type="text" value={job} onChange={(e) => setJob(e.target.value)} placeholder="例：魔法使い、受付嬢" style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontWeight: 'bold', fontSize: '14px' }}>3. 性格:</label>
          <input type="text" value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="例：ツンデレ、真面目" style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box' }} />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>4. 口調:</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px' }}>
              <option value="polite">敬語</option>
              <option value="casual">タメ語</option>
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>5. 絵文字:</label>
            <select value={emoji} onChange={(e) => setEmoji(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px' }}>
              <option value="使う">使う</option>
              <option value="使わない">使わない</option>
              <option value="多い">多い</option>
              <option value="少ない">少ない</option>
              <option value="顔文字">顔文字</option>
            </select>
          </div>
        </div>
      </div>

      <button 
        type="button" 
        onClick={generate} 
        disabled={loading} 
        style={{ 
          width: '100%', padding: '20px', background: loading ? '#ccc' : '#0070f3', 
          color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', 
          fontWeight: 'bold', fontSize: '1.2em' 
        }}
      >
        {loading ? "AIが解析＆執筆中..." : "お手本の形式で新規生成！"}
      </button>

      {output && (
        <div style={{ marginTop: '30px', padding: '20px', background: '#fff', border: '2px solid #0070f3', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.1em', color: '#0070f3' }}>生成結果:</h2>
          {output}
        </div>
      )}
    </div>
  );
}
