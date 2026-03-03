"use client";

import { useState } from 'react';

export default function Home() {
  const [template, setTemplate] = useState('');
  const [job, setJob] = useState(''); // 職業
  const [personality, setPersonality] = useState(''); // 性格
  const [tone, setTone] = useState('polite'); // 口調
  const [emoji, setEmoji] = useState('yes'); // 絵文字
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

  // 生成実行
  const generate = async () => {
    if (!template) {
      alert("まずはお手本ファイルを読み込んでください");
      return;
    }
    setLoading(true);
    setOutput("");

    try {
      const res = await fetch(`${window.location.origin}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          job, 
          personality, 
          tone, 
          emoji, 
          template // AIはこのお手本の「項目形式」を真似ます
        }),
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
      <h1 style={{ textAlign: 'center', color: '#0070f3' }}>高精度キャラ量産ツール</h1>
      
      {/* 1. お手本セクション */}
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #ddd' }}>
        <label style={{ fontWeight: 'bold' }}>1. お手本を読み込む (複数可):</label><br />
        <input type="file" accept=".txt" onChange={handleFileChange} style={{ marginTop: '10px' }} />
        <textarea 
          value={template} 
          onChange={(e) => setTemplate(e.target.value)}
          placeholder="お手本がここに蓄積されます。直接編集も可能です。"
          style={{ width: '100%', height: '100px', marginTop: '10px', fontSize: '0.8em', boxSizing: 'border-box' }}
        />
        <button onClick={() => setTemplate('')} style={{ fontSize: '0.7em', marginTop: '5px', cursor: 'pointer' }}>お手本をリセット</button>
      </div>

      {/* 2. キャラ設定セクション */}
      <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
        <div>
          <label style={{ fontWeight: 'bold' }}>2. キャラクターの職業:</label>
          <input type="text" value={job} onChange={(e) => setJob(e.target.value)} placeholder="例：冒険者、カフェ店員" style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontWeight: 'bold' }}>3. キャラクターの性格:</label>
          <input type="text" value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="例：自信満々、人見知り、毒舌" style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box' }} />
        </div>

        {/* 4. 口調（2択） */}
        <div>
          <label style={{ fontWeight: 'bold' }}>4. 口調:</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px' }}>
            <option value="polite">敬語</option>
            <option value="casual">タメ語</option>
          </select>
        </div>

        {/* 5. 絵文字（5択） */}
        <div>
          <label style={{ fontWeight: 'bold' }}>5. 絵文字・顔文字の設定:</label>
          <select value={emoji} onChange={(e) => setEmoji(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px' }}>
            <option value="使う">使う</option>
            <option value="使わない">使わない</option>
            <option value="多い">多い</option>
            <option value="少ない">少ない</option>
            <option value="顔文字">顔文字</option>
          </select>
        </div>
      </div>

      <button 
        type="button" 
        onClick={generate} 
        disabled={loading} 
        style={{ 
          width: '100%', padding: '20px', background: loading ? '#ccc' : '#0070f3', 
          color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2em' 
        }}
      >
        {loading ? "AIが解析＆執筆中..." : "お手本の形式で新規生成！"}
      </button>

      {output && (
        <div style={{ marginTop: '30px', padding: '20px', background: '#fff', border: '2px solid #0070f3', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
          <h2 style={{ marginTop: 0, color: '#0070f3' }}>生成されたキャラクター:</h2>
          {output}
        </div>
      )}
    </div>
  );
}
