"use client";
import { useState } from 'react';

export default function GeneratorPage() {
  const [job, setJob] = useState('');
  const [personality, setPersonality] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState(null);

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
          template: "■キャラ名\n...\n" // テンプレートを渡す
        }),
      });
      const data = await res.json();
      setResult(data.result);
      setSelectedInfo({ job: data.selectedJob, personality: data.selectedPersonality });
    } catch (e) {
      alert("エラーが発生しました");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* ヘッダー */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
            AI Character Architect
          </h1>
          <p className="text-slate-500 uppercase tracking-widest text-xs">Automated Creation Engine</p>
        </header>

        {/* 入力エリア：シンプルにまとめる */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-1">
              <label className="text-xs text-slate-500 ml-1">Occupation</label>
              <input 
                type="text" 
                placeholder="RANDOM" 
                value={job} 
                onChange={(e) => setJob(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500 ml-1">Personality</label>
              <input 
                type="text" 
                placeholder="RANDOM" 
                value={personality} 
                onChange={(e) => setPersonality(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <button 
            onClick={generate}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold transition-all duration-300 transform active:scale-95 ${
              loading 
              ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
              : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/20"
            }`}
          >
            {loading ? "ARCHITECTING..." : "GENERATE CHARACTER"}
          </button>
        </div>

        {/* 生成結果エリア */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 mb-3 text-sm text-cyan-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Character Deployed: {selectedInfo?.job} / {selectedInfo?.personality}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 relative shadow-2xl">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono text-slate-300">
                {result}
              </pre>
              
              {/* コピーボタン（右上に配置） */}
              <button 
                onClick={() => navigator.clipboard.writeText(result)}
                className="absolute top-4 right-4 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-3 py-1 rounded transition-colors"
              >
                COPY
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
