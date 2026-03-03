// --- 抜粋：結果表示エリア ---
{result && (
  <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
      {/* ★ ここを修正：職業と性格を表示 */}
      <span style={{ fontSize: '12px', color: '#22d3ee', fontWeight: 'bold' }}>
        展開中: {selectedInfo?.job} 【{selectedInfo?.personality}】
      </span>
      <button onClick={() => {navigator.clipboard.writeText(result); alert('コピーしました');}} style={{ fontSize: '10px', backgroundColor: '#334155', border: 'none', borderRadius: '4px', color: '#fff', padding: '4px 12px', cursor: 'pointer' }}>コピー</button>
    </div>
    <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '32px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.8', color: '#e2e8f0', fontFamily: 'monospace' }}>{result}</pre>
    </div>
  </div>
)}
