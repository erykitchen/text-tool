"use client";
import { useState, useEffect } from 'react';

export default function GeneratorPage() {
  const [job, setJob] = useState('');
  const [personality, setPersonality] = useState('');
  const [tone, setTone] = useState('polite');
  const [emojiConfig, setEmojiConfig] = useState('use'); // 追加：絵文字設定
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
          // template の中身や emojiConfig の渡し方は元の中身を維持
          template: { emoji: emojiConfig === 'use' ? 'つかう' : 'なし' },
          emojiConfig: emojiConfig 
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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb', color: '#1f2937', fontFamily: '"Inter", sans-serif' }}>
      
      {/* サイドバー：スマホ時は display: none になるよう style 調整 */}
      <aside className="sidebar-mobile-hide" style={{ width: '280px', backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb', flexShrink: 0 }}>
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
              onClick={() => {setResult(item.content); setSelectedInfo(item);}} 
              style={{ width: '100%', textAlign: 'left', padding: '16px', borderRadius: '12px', backgroundColor: 'transparent', border: 'none', color: '#4b5563', cursor: 'pointer', marginBottom: '8px' }}
            >
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{item.job}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{item.personality}</div>
            </button>
          ))}
        </div>
      </aside>

      {/* メインエリア */}
      <main style={{ flex: 1, padding: '40px 16px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <header style={{ marginBottom: '48px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', margin: 0 }}>
              Character <span style={{ color: '#3b82f6' }}>Architect</span>
            </h1>
          </header>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '40px' }}>
            <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>職業</label>
                <input type="text" placeholder="ランダム" value={job} onChange={(e) => setJob(e.target.value)} style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>性格</label>
                <input type="text" placeholder="ランダム" value={personality} onChange={(e) => setPersonality(e.target.value)} style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>口調</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px' }}>
                  <option value="polite">敬語</option>
                  <option value="casual">タメ語</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>絵文字</label>
                <select value={emojiConfig} onChange={(e) => setEmojiConfig(e.target.value)} style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px' }}>
                  <option value="use">つかう</option>
                  <option value="none">なし</option>
                </select>
              </div>
            </div>
            <button onClick={generate} disabled={loading} style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: loading ? '#9ca3af' : '#111827', color: '#fff', fontWeight: '700', border: 'none', cursor: 'pointer' }}>
              {loading ? "Generating..." : "キャラクターを構築する"}
            </button>
          </div>

          {result && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '700' }}>{selectedInfo.job} / {selectedInfo.personality}</span>
                <button onClick={() => {navigator.clipboard.writeText(result); alert('コピーしました');}} style={{ fontSize: '11px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }}>Copy</button>
              </div>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', padding: '24px', borderRadius: '24px' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '15px', lineHeight: '1.8', color: '#374151' }}>{result}</pre>
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        body { margin: 0; }
        @media (max-width: 768px) {
          .sidebar-mobile-hide { display: none !important; }
          .grid-responsive { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
