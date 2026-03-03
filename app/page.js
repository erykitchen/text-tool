"use client";
import { useState, useEffect } from 'react';

export default function GeneratorPage() {
  const [job, setJob] = useState('');
  const [personality, setPersonality] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState(null);
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
        body: JSON.stringify({ job: job || 'random', personality: personality || 'random', template: "■キャラ名\n...\n" }),
      });
      const data = await res.json();
      const info = { job: data.selectedJob, personality: data.selectedPersonality, date: new Date().toLocaleString() };
      setResult(data.result);
      setSelectedInfo(info);
      const newHistory = [{ ...info, content: data.result }, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem('gen_history', JSON.stringify(newHistory));
    } catch (e) {
      alert("生成に失敗しました");
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f1f5f9', fontFamily: 'sans-serif' }}>
      
      {/* 左側サイドバー */}
      <aside style={{ width: '260px', backgroundColor: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #334155' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', letterSpacing: '0.1em', margin: 0 }}>生成履歴</h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {history.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#475569', textAlign: 'center', marginTop: '40px' }}>履歴はありません</p>
          ) : (
            history.map((item, i) => (
              <button key={i} onClick={() => {setResult(item.content); setSelectedInfo(item);}} style={{ width: '100%', textAlign: 'left', padding: '12px', borderRadius: '8px', backgroundColor: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', transition: '0.2s', marginBottom: '4px' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#334155'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.job}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>{item.personality}</div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* メインエリア */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          
          <header style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#22d3ee', margin: '0 0 8px 0' }}>キャラ・アーキテクト</h1>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>AIによる自動キャラクター生成エンジン</p>
          </header>

          <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', padding: '24px', borderRadius: '16px', marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <input type="text" placeholder="職業（空欄でランダム）" value={job} onChange={(e) => setJob(e.target.value)} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none' }} />
              <input type="text" placeholder="性格（空欄でランダム）" value={personality} onChange={(e) => setPersonality(e.target.value)} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none' }} />
            </div>

            <button onClick={generate} disabled={loading} style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: loading ? '#334155' : '#0891b2', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', transition: '0.3s' }}>
              {loading ? "生成中..." : "新しいキャラクターを生成"}
            </button>
          </div>

          {result && (
            <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: '#22d3ee', fontWeight: 'bold' }}>
                  展開中: {selectedInfo?.job} / {selectedInfo?.personality}
                </div>
                <button onClick={() => {navigator.clipboard.writeText(result); alert('コピーしました');}} style={{ fontSize: '10px', padding: '4px 12px', backgroundColor: '#334155', border: 'none', borderRadius: '4px', color: '#94a3b8', cursor: 'pointer' }}>コピー</button>
              </div>
              <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '32px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.6', color: '#e2e8f0', fontFamily: 'monospace' }}>{result}</pre>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
