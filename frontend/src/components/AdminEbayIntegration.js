import React from 'react';
import apiService from '../services/apiService';
import axios from 'axios';

// Lightweight client for admin eBay endpoints (extend apiService or inline fetch)
const ADMIN_API_BASE = '/api/admin/ebay';
function adminHeaders(){ return { 'X-Admin-Auth': localStorage.getItem('ebayAdminKey') || '' }; }
async function fetchJson(path, params){
  const url = ADMIN_API_BASE + path + (params ? ('?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v])=> v!==undefined && v!==null && v!=='' ))).toString()) : '');
  const resp = await axios.get(url, { headers: adminHeaders() });
  return resp.data;
}

const SectionCard = ({ title, actions, children }) => (
  <div style={{ border:'1px solid #dfe3e8', borderRadius:8, padding:16, background:'#fff', boxShadow:'0 1px 2px rgba(0,0,0,0.05)' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
      <h3 style={{ margin:0, fontSize:16 }}>{title}</h3>
      <div style={{ display:'flex', gap:8 }}>{actions}</div>
    </div>
    <div style={{ fontSize:13 }}>{children}</div>
  </div>
);

const Table = ({ columns, rows, empty }) => (
  <div style={{ overflowX:'auto' }}>
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
      <thead>
        <tr>{columns.map(c => <th key={c.key||c} style={{ textAlign:'left', padding:'6px 8px', borderBottom:'1px solid #eee', background:'#fafbfc', fontWeight:600 }}>{c.label||c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr><td colSpan={columns.length} style={{ padding:12, textAlign:'center', color:'#666' }}>{empty || 'No data'}</td></tr>
        )}
        {rows.map((r,i) => (
          <tr key={r.id || r.queue_id || r.snapshot_id || r.drift_event_id || i} style={{ borderBottom:'1px solid #f1f3f5' }}>
            {columns.map(c => <td key={c.key||c} style={{ padding:'6px 8px', verticalAlign:'top' }}>{c.render ? c.render(r) : (r[c.key||c] ?? '')}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Badge = ({ kind='default', children }) => {
  const colors = {
    pending:'#947600', processing:'#0072ce', complete:'#2e7d32', error:'#c62828', dead:'#6d4c41', mapped:'#2e7d32', internal_only:'#1976d2', external_only:'#9c27b0', both_changed:'#ef6c00', snapshot_stale:'#455a64'
  };
  const bg = colors[kind] || '#555';
  return <span style={{ background:bg, color:'#fff', padding:'2px 6px', borderRadius:4, fontSize:11 }}>{children}</span>;
};

export default function AdminEbayIntegration(){
  const [loading,setLoading] = React.useState(false);
  const [error,setError] = React.useState(null);
  const [queue,setQueue] = React.useState([]);
  const [drift,setDrift] = React.useState([]);
  const [snapshots,setSnapshots] = React.useState([]);
  const [selectedSnapshots,setSelectedSnapshots] = React.useState([]); // up to 2 ids
  const [snapshotDiff,setSnapshotDiff] = React.useState(null);
  const [health,setHealth] = React.useState(null);
  const [metrics,setMetrics] = React.useState(null);
  const [dead,setDead] = React.useState({ deadQueue:[], failedEvents:[] });
  const [policy,setPolicy] = React.useState([]);
  const [view,setView] = React.useState('overview');
  const [retrieveIds,setRetrieveIds] = React.useState('1001,1002,1003');
  const [retrieveResult,setRetrieveResult] = React.useState(null);
  const [mapResult,setMapResult] = React.useState(null);
  const [queuePage,setQueuePage] = React.useState(0);
  const [queueHasMore,setQueueHasMore] = React.useState(false);
  const [autoRefresh,setAutoRefresh] = React.useState(false);
  const [driftPage,setDriftPage] = React.useState(0);
  const PAGE_LIMIT = 15;

  const adminKeyInput = React.useRef();
  const saveKey = () => { localStorage.setItem('ebayAdminKey', adminKeyInput.current.value||''); fetchAll(); };

  async function fetchAll(){
    setLoading(true); setError(null);
    try {
      const [q, d, s, h, m, dl, pc] = await Promise.all([
        fetchJson(`/api/admin/ebay/queue?limit=${PAGE_LIMIT}&offset=${queuePage*PAGE_LIMIT}`),
        fetchJson(`/api/admin/ebay/drift-events?limit=${PAGE_LIMIT}&offset=${driftPage*PAGE_LIMIT}`),
        fetchJson('/api/admin/ebay/snapshots?limit=15'),
        fetchJson('/api/admin/ebay/health'),
        fetchJson('/api/admin/ebay/metrics'),
        fetchJson('/api/admin/ebay/queue/dead-letter'),
        fetchJson('/api/admin/ebay/policies?limit=10')
      ]);
      setQueue(q.items||[]);
      setQueueHasMore((q.pagination?.count||0) === PAGE_LIMIT);
      setDrift(d.items||[]);
      setSnapshots(s.items||[]);
      setHealth(h.summary||h);
      setMetrics(m);
      setDead({ deadQueue: dl.deadQueue||[], failedEvents: dl.failedEvents||[] });
      setPolicy(pc.items||[]);
    } catch(e){ setError(e.message||String(e)); }
    setLoading(false);
  }

  async function triggerRetrieve(){
    setError(null); setRetrieveResult(null);
    try {
      const body = { itemIds: retrieveIds, dryRun: false };
  const { data: json } = await axios.post(`${ADMIN_API_BASE}/retrieve`, body, { headers:{ ...adminHeaders(), 'Content-Type':'application/json' } });
      setRetrieveResult(json);
      fetchAll(); // refresh after retrieve
    } catch(e){ setError(e.message); }
  }
  async function triggerMap(dry=true){
    setError(null); setMapResult(null);
    try {
  const { data: json } = await axios.post(`${ADMIN_API_BASE}/map/run`, { dryRun: dry }, { headers:{ ...adminHeaders(), 'Content-Type':'application/json' } });
      setMapResult(json);
      fetchAll();
    } catch(e){ setError(e.message); }
  }

  async function loadSnapshotDiff(){
    setSnapshotDiff(null);
    if(selectedSnapshots.length !== 2){ return; }
    const [a,b] = selectedSnapshots;
    try {
      const diff = await fetchJson(`/api/admin/ebay/snapshots/${a}/diff/${b}`);
      setSnapshotDiff(diff);
    } catch(e){ setSnapshotDiff({ error: e.message }); }
  }

  function toggleSnapshot(id){
    setSnapshotDiff(null);
    setSelectedSnapshots(prev => {
      let next = prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id];
      if(next.length > 2){ next = [next[1], next[2]]; }
      return next;
    });
  }

  React.useEffect(()=>{ fetchAll(); /* eslint-disable-next-line */ }, []);
  React.useEffect(()=>{ fetchAll(); /* refresh when page changes */ // eslint-disable-next-line
  }, [queuePage, driftPage]);
  React.useEffect(()=>{ 
    if(!autoRefresh){ return; }
    const id = setInterval(fetchAll, 8000); 
    return ()=>clearInterval(id); 
  }, [autoRefresh]);

  async function retryQueue(id){ try { await axios.post(`${ADMIN_API_BASE}/queue/${id}/retry`, {}, { headers: adminHeaders() }); fetchAll(); } catch(e){ setError(e.message); } }
  async function replayFailed(id){ try { await axios.post(`${ADMIN_API_BASE}/failed-events/${id}/replay`, {}, { headers: adminHeaders() }); fetchAll(); } catch(e){ setError(e.message); } }
  async function refreshPolicies(){ try { await axios.post(`${ADMIN_API_BASE}/policies/refresh`, {}, { headers: adminHeaders() }); fetchAll(); } catch(e){ setError(e.message); } }

  const overviewCards = (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
      <SectionCard title="Queue" actions={<button onClick={()=>setView('queue')}>Expand</button>}>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <strong>{queue.length}</strong> recent items
          <Table columns={[{key:'queue_id',label:'ID'},{key:'intent',label:'Intent'},{key:'status',label:'Status',render:r=><Badge kind={r.status}>{r.status}</Badge>},{key:'error_reason',label:'Error'}]} rows={queue.slice(0,5)} />
        </div>
      </SectionCard>
      <SectionCard title="Drift" actions={<button onClick={()=>setView('drift')}>Expand</button>}>
        <Table columns={[{key:'drift_event_id',label:'ID'},{key:'classification',label:'Class',render:r=> <Badge kind={r.classification}>{r.classification}</Badge>},{key:'created_at',label:'At',render:r=> new Date(r.created_at).toLocaleString()}]} rows={drift.slice(0,5)} />
      </SectionCard>
      <SectionCard title="Snapshots" actions={<button onClick={()=>setView('snapshots')}>Expand</button>}>
        <Table columns={[{key:'snapshot_id',label:'ID'},{key:'ebay_listing_id',label:'Listing'},{key:'source_event',label:'Source'},{key:'created_at',label:'At',render:r=> new Date(r.created_at).toLocaleString()}]} rows={snapshots.slice(0,5)} />
      </SectionCard>
      <SectionCard title="Policies" actions={<button onClick={()=>setView('policies')}>Expand</button>}>
        <Table columns={[{key:'policy_cache_id',label:'ID'},{key:'policy_type',label:'Type'},{key:'name',label:'Name'}]} rows={policy.slice(0,5)} />
      </SectionCard>
      <SectionCard title="Dead Letters" actions={<button onClick={()=>setView('dead')}>Expand</button>}>
        <Table columns={[{key:'queue_id',label:'Queue ID'},{key:'error_reason',label:'Error'}]} rows={dead.deadQueue.slice(0,5)} />
      </SectionCard>
      <SectionCard title="Health" actions={<button onClick={fetchAll}>Refresh</button>}>
        {health ? (
          <div style={{ fontSize:12 }}>
            <div>Queue depth: {health.queue_depth}</div>
            <div>Last publish success age (ms): {health.last_publish_success_age_ms ?? '—'}</div>
            <div>Dead queue: {health.dead_letters?.dead_queue_count}</div>
            <div>Failed events: {health.dead_letters?.failed_event_count}</div>
          </div>
        ) : '—'}
      </SectionCard>
      <SectionCard title="Metrics" actions={<button onClick={fetchAll}>Refresh</button>}>
        {metrics ? (
          <div style={{ fontSize:12, display:'flex', flexDirection:'column', gap:2 }}>
            <div>Publish attempts: {metrics.counters?.['publish.attempt']||0}</div>
            <div>Publish successes: {metrics.counters?.['publish.success']||0}</div>
            <div>Publish errors: {metrics.counters?.['publish.errors']||0}</div>
            <div>Recon drift events: {['internal_only','external_only','both_changed','snapshot_stale'].map(k=> (
              <span key={k} style={{ marginRight:6 }}>{k}:{metrics.counters?.[`recon.drift_${k}`]||0}</span>
            ))}</div>
          </div>
        ) : '—'}
      </SectionCard>
    </div>
  );

  const views = {
    overview: overviewCards,
    queue: <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <Table columns={[{key:'queue_id',label:'ID'},{key:'ebay_listing_id',label:'Listing'},{key:'intent',label:'Intent'},{key:'status',label:'Status',render:r=> <Badge kind={r.status}>{r.status}</Badge>},{key:'attempts',label:'Att'},{key:'error_reason',label:'Error'},{key:'_actions',label:'',render:r=> (r.status==='error'||r.status==='dead') && <button onClick={()=>retryQueue(r.queue_id)}>Retry</button>}]} rows={queue} empty="Queue empty" />
      <div style={{ display:'flex', gap:8 }}>
        <button disabled={queuePage===0} onClick={()=>setQueuePage(p=>Math.max(0,p-1))}>Prev</button>
        <span>Page {queuePage+1}</span>
        <button disabled={!queueHasMore} onClick={()=>setQueuePage(p=>p+1)}>Next</button>
      </div>
    </div>,
    drift: <Table columns={[{key:'drift_event_id',label:'ID'},{key:'ebay_listing_id',label:'Listing'},{key:'classification',label:'Class',render:r=> <Badge kind={r.classification}>{r.classification}</Badge>},{key:'local_hash',label:'Local Hash',render:r=> (r.local_hash||'').slice(0,8)},{key:'created_at',label:'At',render:r=> new Date(r.created_at).toLocaleString()}]} rows={drift} empty="No drift events" />,
  snapshots: <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
    <Table columns={[
      {key:'_sel', label:'', render:r=> <input type="checkbox" checked={selectedSnapshots.includes(r.snapshot_id)} onChange={()=>toggleSnapshot(r.snapshot_id)} />},
      {key:'snapshot_id',label:'ID'},
      {key:'ebay_listing_id',label:'Listing'},
      {key:'source_event',label:'Source'},
      {key:'snapshot_hash',label:'Hash',render:r=> (r.snapshot_hash||'').slice(0,8)},
      {key:'description_revision_count',label:'Rev'},
      {key:'created_at',label:'At',render:r=> new Date(r.created_at).toLocaleString()}
    ]} rows={snapshots} empty="No snapshots" />
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <span style={{ fontSize:12 }}>Select exactly two snapshots to diff.</span>
      <button disabled={selectedSnapshots.length!==2} onClick={loadSnapshotDiff}>Diff</button>
      {selectedSnapshots.length===2 && <span style={{ fontSize:11, color:'#555' }}>{selectedSnapshots[0]} vs {selectedSnapshots[1]}</span>}
    </div>
    {snapshotDiff && (
      snapshotDiff.error ? <div style={{ background:'#ffebee', padding:8, border:'1px solid #ffcdd2', borderRadius:4 }}>Diff error: {snapshotDiff.error}</div> :
      <div style={{ border:'1px solid #e0e0e0', borderRadius:4, maxHeight:300, overflow:'auto', fontSize:11 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:'#fafbfc' }}><th style={{ textAlign:'left', padding:4 }}>Path</th><th style={{ textAlign:'left', padding:4 }}>Before</th><th style={{ textAlign:'left', padding:4 }}>After</th></tr></thead>
          <tbody>
            {Object.entries(snapshotDiff.diff||{}).map(([path,change]) => (
              <tr key={path} style={{ borderBottom:'1px solid #f1f3f5' }}>
                <td style={{ padding:4, fontFamily:'monospace' }}>{path}</td>
                <td style={{ padding:4, color:'#b71c1c' }}>{JSON.stringify(change.before)}</td>
                <td style={{ padding:4, color:'#1b5e20' }}>{JSON.stringify(change.after)}</td>
              </tr>
            ))}
            {(!snapshotDiff.diff || Object.keys(snapshotDiff.diff).length===0) && <tr><td colSpan={3} style={{ padding:6, textAlign:'center' }}>No changes</td></tr>}
          </tbody>
        </table>
      </div>
    )}
  </div>,
    policies: <Table columns={[{key:'policy_cache_id',label:'ID'},{key:'policy_type',label:'Type'},{key:'name',label:'Name'},{key:'content_hash',label:'Hash',render:r=> (r.content_hash||'').slice(0,8)}]} rows={policy} empty="No policies" />,
    dead: <div style={{ display:'grid', gap:16 }}>
      <SectionCard title="Dead Queue"><Table columns={[{key:'queue_id',label:'ID'},{key:'intent',label:'Intent'},{key:'error_reason',label:'Error'},{key:'_actions',label:'',render:r=> <button onClick={()=>retryQueue(r.queue_id)}>Retry</button>}]} rows={dead.deadQueue} empty="None" /></SectionCard>
      <SectionCard title="Failed Events"><Table columns={[{key:'failed_event_id',label:'ID'},{key:'intent',label:'Intent'},{key:'last_error',label:'Last Error'},{key:'_act',label:'',render:r=> <button onClick={()=>replayFailed(r.failed_event_id)}>Replay</button>}]} rows={dead.failedEvents} empty="None" /></SectionCard>
    </div>
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <h2 style={{ margin:'4px 0' }}>eBay Integration</h2>
        <input ref={adminKeyInput} placeholder="Admin API Key" style={{ padding:'4px 8px' }} defaultValue={localStorage.getItem('ebayAdminKey')||''} />
        <button onClick={saveKey}>Set Key</button>
        <button onClick={()=>setView('overview')}>Overview</button>
        <button onClick={()=>setView('queue')}>Queue</button>
        <button onClick={()=>setView('drift')}>Drift</button>
        <button onClick={()=>setView('snapshots')}>Snapshots</button>
        <button onClick={()=>setView('policies')}>Policies</button>
        <button onClick={()=>setView('dead')}>Dead Letters</button>
        <button onClick={fetchAll} disabled={loading}>{loading? 'Refreshing…':'Refresh'}</button>
        <input value={retrieveIds} onChange={e=>setRetrieveIds(e.target.value)} style={{ padding:'4px 6px', width:180 }} />
        <button onClick={triggerRetrieve}>Retrieve</button>
  <button onClick={()=>triggerMap(true)}>Map (Dry)</button>
  <button onClick={()=>triggerMap(false)}>Map (Write)</button>
        <button onClick={refreshPolicies}>Refresh Policies</button>
        <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:12 }}>
          <input type="checkbox" checked={autoRefresh} onChange={e=>setAutoRefresh(e.target.checked)} /> Auto-refresh
        </label>
      </div>
      {error && <div style={{ background:'#ffebee', border:'1px solid #ffcdd2', padding:8, borderRadius:4, color:'#b71c1c' }}>{error}</div>}
      {retrieveResult && <div style={{ background:'#e3f2fd', border:'1px solid #90caf9', padding:8, borderRadius:4, fontSize:12 }}>Retrieve: {JSON.stringify(retrieveResult.summary)}</div>}
  {mapResult && <div style={{ background:'#f1f8e9', border:'1px solid #c5e1a5', padding:8, borderRadius:4, fontSize:12 }}>Map: exit {mapResult.exitCode} {mapResult.summary ? JSON.stringify(mapResult.summary) : ''}</div>}
      {views[view]}
      <div style={{ fontSize:11, color:'#666' }}>Auto-refresh not enabled (manual refresh only)</div>
    </div>
  );
}
