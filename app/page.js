"use client";
import { useState, useEffect } from 'react';

export default function GeneratorPage() {
  const [job, setJob] = useState('');
  const [personality, setPersonality] = useState('');
  const [tone, setTone] = useState('polite');
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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb', color: '#1f2937', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }}>
      
      {/* サイドバー：洗練されたライトグレー */}
      <aside style={{ width: '280px', backgroundColor: '#ffffff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
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
              style={{ width: '100%', textAlign: 'left', padding: '16px', borderRadius: '12px', backgroundColor: 'transparent', border: 'none', color: '#4b5563', cursor: 'pointer', marginBottom: '8px', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{item.job}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{item.personality}</div>
            </button>
          ))}
        </div>
      </aside>

      {/* メイン：クリーンなホワイトエリア */}
      <main style={{ flex: 1, padding: '60px 20px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <header style={{ marginBottom: '48px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>
              Character <span style={{ color: '#3b82f6' }}>Architect</span>
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>洗練されたキャラクターデータを構築します</p>
          </header>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', padding: '32px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px', marginLeft: '4px' }}>職業</label>
                <input 
                  type="text" 
                  placeholder="空白ならランダム生成" 
                  value={job} 
                  onChange={(e) => setJob(e.target.value)} 
                  style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px', color: '#111827', fontSize: '14px', outline: 'none' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px', marginLeft: '4px' }}>性格</label>
                <input 
                  type="text" 
                  placeholder="空白ならランダム生成" 
                  value={personality} 
                  onChange={(e) => setPersonality(e.target.value)} 
                  style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px', color: '#111827', fontSize: '14px', outline: 'none' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px', marginLeft: '4px' }}>口調</label>
                <select 
                  value={tone} 
                  onChange={(e) => setTone(e.target.value)} 
                  style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px', color: '#111827', fontSize: '14px', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="polite">敬語</option>
                  <option value="casual">タメ語</option>
                </select>
              </div>
            </div>
            <button 
              onClick={generate} 
              disabled={loading} 
              style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: loading ? '#9ca3af' : '#111827', color: '#ffffff', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '15px', transition: 'all 0.3s ease', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#374151')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#111827')}
            >
              {loading ? "Generating..." : "キャラクターを構築する"}
            </button>
          </div>

          {/* 生成結果表示：清潔感のあるカード形式 */}
          {result && (
            <div style={{ animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center', padding: '0 8px' }}>
                <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '700' }}>
                  {selectedInfo.job} <span style={{ color: '#9ca3af', fontWeight: '400', margin: '0 4px' }}>/</span> {selectedInfo.personality}
                </span>
                <button 
                  onClick={() => {navigator.clipboard.writeText(result); alert('クリップボードにコピーしました');}} 
                  style={{ fontSize: '11px', backgroundColor: '#ffffff', color: '#111827', border: '1px solid #e5e7eb', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', transition: '0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  Copy Data
                </button>
              </div>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '15px', lineHeight: '2', color: '#374151', fontFamily: '"SF Mono", Menlo, Consolas, monospace', letterSpacing: '0.02em' }}>{result}</pre>
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        body { margin: 0; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>
    </div>
  );
}
