"use client";
import { useState, useEffect } from 'react';

export default function GeneratorPage() {
  const [job, setJob] = useState('');
  const [personality, setPersonality] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [history, setHistory] = useState([]); // 履歴保存用

  // 初回読み込み時にローカルストレージから履歴を取得
  useEffect(() => {
    const savedHistory = localStorage.getItem('gen_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
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
          template: "■キャラ名\n...\n" 
        }),
      });
      const data = await res.json();
      const newResult = data.result;
      const info = { job: data.selectedJob, personality: data.selectedPersonality, date: new Date().toLocaleString() };
      
      setResult(newResult);
      setSelectedInfo(info);

      // 履歴に追加
      const newHistory = [{ ...info, content: newResult }, ...history].slice(0, 20); // 最大20件
      setHistory(newHistory);
      localStorage.setItem('gen_history', JSON.stringify(newHistory));

    } catch (e) {
      alert("エラーが発生しました");
    }
    setLoading(false);
  };

  // 履歴から復元
  const restoreFromHistory = (item) => {
    setResult(item.content);
    setSelectedInfo({ job: item.job, personality: item.personality });
  };

  // 履歴をクリア
  const clearHistory = () => {
    if(confirm("履歴をすべて削除しますか？")) {
      setHistory([]);
      localStorage.removeItem('gen_history');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans">
      
      {/* --- 左側サイドバー --- */}
      <aside className="w-64 bg-slate-900/80 border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-sm font-bold tracking-widest text-slate-500 uppercase">History</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {history.length === 0 ? (
            <p className="text-xs text-slate-600 text-center mt-10 italic">No history yet</p>
          ) : (
            history.map((item, index) => (
              <button
                key={index}
                onClick={() => restoreFromHistory(item)}
                className="w-full text-left p-3 rounded-lg hover:bg-slate-800 transition-colors group"
              >
                <p className="text-sm font-medium text-slate-300 truncate group-hover:text-cyan-400">
                  {item.job}
                </p>
                <p className="text-[10px] text-slate-500">{item.personality} • {item.date.split(' ')[0]}</p>
              </button>
            ))
          )}
        </div>
        {history.length > 0 && (
          <button onClick={clearHistory} className="p-4 text-xs text-slate-600 hover:text-red-400 text-center transition-colors">
            Clear All History
          </button>
        )}
      </aside>

      {/* --- メインコンテンツ --- */}
      <main className="flex-1 p-4 md:p-12 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          
          <header className="mb-10">
            <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent inline-block">
              CHARACTER ARCHITECT
            </h1>
          </header>

          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input 
                type="text" placeholder="Job (Random)" value={job} 
                onChange={(e) => setJob(e.target.value)}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500/50 outline-none"
              />
              <input 
                type="text" placeholder="Personality (Random)" value={personality} 
                onChange={(e) => setPersonality(e.target.value)}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>

            <button 
              onClick={generate}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold transition-all ${
                loading ? "bg-slate-800 text-slate-500" : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20"
              }`}
            >
              {loading ? "GENERATING..." : "GENERATE NEW CHARACTER"}
            </button>
          </div>

          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end mb-3">
                <div className="text-xs text-cyan-400 font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  Active: {selectedInfo?.job} / {selectedInfo?.personality}
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 px-3 py-1 rounded"
                >
                  COPY TEXT
                </button>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono text-slate-300">
                  {result}
                </pre>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
