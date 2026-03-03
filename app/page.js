"use client";
import { useState, useEffect } from 'react';

export default function GeneratorPage() {
  const [job, setJob] = useState('');
  const [personality, setPersonality] = useState('');
  const [tone, setTone] = useState('polite');
  const [emojiConfig, setEmojiConfig] = useState('use'); // 絵文字設定を追加
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState({ job: '', personality: '' });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('gen_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const generate = async () => {
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          job: job || 'random', 
          personality: personality || 'random', 
          tone: tone,
          emojiConfig: emojiConfig, // APIに送信
          template: "■キャラ名\n\n【アタック1】\n...\n" 
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const info = { 
        job: data.selectedJob, 
        personality: data.selectedPersonality, 
        date: new Date().toLocaleString() 
      };
      
      setResult(data.result);
      setSelectedInfo(info);

      const newHistory = [{ ...info, content: data.result }, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem('gen_history', JSON.stringify(newHistory));
    } catch (e) { 
      alert("生成失敗: " + e.message); 
    }
    setLoading(false);
  };

  return (
    <div className="container">
      
      {/* サイドバー：スマホでは非表示 */}
      <aside className="sidebar">
        <div style={{ padding: '32px 24px', borderBottom: '1px solid #f3f4f6' }}>
          <h2 style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>History</h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {history.length === 0 && (
            <div style={{ padding: '20px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>No history yet</div>
          )}
          {history.map((item, i) => (
            <button 
              key={i} 
              onClick={() => {setResult(item.content); setSelectedInfo(item); window.scrollTo({top: 0, behavior: 'smooth'});}} 
              className="history-item"
            >
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{item.job}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{item.personality}</div>
            </button>
          ))}
        </div>
      </aside>

      {/* メインエリア */}
      <main className="main-content">
        <div className="content-inner">
          <header style={{ marginBottom: '48px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
              Character <span style={{ color: '#3b82f6' }}>Architect</span>
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>洗練されたキャラクターデータを構築します</p>
          </header>

          <div className="input-card">
            <div className="grid-inputs">
              <div className="input-group">
                <label className="label">職業</label>
                <input 
                  type="text" 
                  placeholder="ランダム生成" 
                  value={job} 
                  onChange={(e) => setJob(e.target.value)} 
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <label className="label">性格</label>
                <input 
                  type="text" 
                  placeholder="ランダム生成" 
                  value={personality} 
                  onChange={(e) => setPersonality(e.target.value)} 
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <label className="label">口調</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="input-field">
                  <option value="polite">敬語</option>
                  <option value="casual">タメ語</option>
                </select>
              </div>
              <div className="input-group">
                <label className="label">絵文字</label>
                <select value={emojiConfig} onChange={(e) => setEmojiConfig(e.target.value)} className="input-field">
                  <option value="use">つかう</option>
                  <option value="none">なし</option>
                </select>
              </div>
            </div>
            <button onClick={generate} disabled={loading} className="generate-btn">
              {loading ? "Generating..." : "キャラクターを構築する"}
            </button>
          </div>

          {result && (
            <div className="result-area">
              <div className="result-header">
                <span className="info-badge">
                  {selectedInfo.job} <span style={{ color: '#9ca3af', fontWeight: '400', margin: '0 4px' }}>/</span> {selectedInfo.personality}
                </span>
                <button 
                  onClick={() => {navigator.clipboard.writeText(result); alert('クリップボードにコピーしました');}} 
                  className="copy-btn"
                >
                  Copy Data
                </button>
              </div>
              <div className="result-card">
                <pre className="result-text">{result}</pre>
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        body { margin: 0; background-color: #f9fafb; font-family: 'Inter', sans-serif; }
        
        .container { display: flex; min-height: 100vh; }
        
        .sidebar { 
          width: 280px; 
          background: #fff; 
          border-right: 1px solid #e5e7eb; 
          display: flex; 
          flex-direction: column; 
        }

        .main-content { flex: 1; padding: 40px 16px; overflow-y: auto; }
        .content-inner { maxWidth: 840px; margin: 0 auto; }

        .input-card { 
          background: #fff; 
          border: 1px solid #e5e7eb; 
          padding: 24px; 
          border-radius: 20px; 
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); 
          margin-bottom: 32px;
        }

        .grid-inputs { 
          display: grid; 
          grid-template-columns: repeat(2, 1fr); 
          gap: 16px; 
          margin-bottom: 20px; 
        }

        .label { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 8px; margin-left: 4px; display: block; }
        .input-field { 
          background: #f9fafb; 
          border: 1px solid #e5e7eb; 
          border-radius: 12px; 
          padding: 12px; 
          font-size: 14px; 
          width: 100%; 
          box-sizing: border-box; 
          outline: none;
        }

        .generate-btn { 
          width: 100%; 
          padding: 16px; 
          border-radius: 12px; 
          background: #111827; 
          color: #fff; 
          border: none; 
          font-weight: 700; 
          cursor: pointer; 
          transition: all 0.2s;
        }

        .result-card { 
          background: #fff; 
          border: 1px solid #e5e7eb; 
          padding: 24px; 
          border-radius: 20px; 
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); 
        }

        .result-text { 
          margin: 0; 
          white-space: pre-wrap; 
          word-break: break-all; 
          font-size: 14px; 
          line-height: 1.8; 
          color: #374151; 
          font-family: monospace; 
        }

        .history-item { 
          width: 100%; 
          text-align: left; 
          padding: 12px; 
          border-radius: 10px; 
          background: transparent; 
          border: none; 
          cursor: pointer; 
          transition: 0.2s;
        }
        .history-item:hover { background: #f3f4f6; }

        .result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .copy-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; font-size: 12px; font-weight: 600; }

        /* スマホ用レスポンシブ設定 */
        @media (max-width: 768px) {
          .sidebar { display: none; } /* サイドバーを隠す */
          .grid-inputs { grid-template-columns: 1fr; } /* 入力を1列にする */
          .main-content { padding: 20px 12px; }
          .result-card { padding: 16px; }
          .result-text { font-size: 13px; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .result-area { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
}
