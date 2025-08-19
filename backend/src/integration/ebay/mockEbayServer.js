/**
 * mockEbayServer.js
 * Lightweight configurable in-memory HTTP server to simulate eBay API behaviors for tests & chaos.
 * Scenarios configured via setNextResponses(array) or HTTP POST /__admin/next-responses.
 * Each response descriptor: { method:'POST'|'PUT', path:'/listings' or pattern '/listings/:id', status, headers, body }.
 * If nextResponses empty, default success behaviors for create/update.
 */
const express = require('express');

function createServer(options = {}){
  const app = express();
  app.use(express.json());
  let nextResponses = [];
  let calls = [];
  const chaos = { rateLimitEvery: options.rateLimitEvery || 0, injectDelayMs: options.injectDelayMs || 0 };

  function dequeueMatch(method, path){
    if(!nextResponses.length){ return null; }
    const idx = nextResponses.findIndex(r => (!r.method || r.method === method) && matchPath(r.path || '', path));
    if (idx === -1) { return null; }
    return nextResponses.splice(idx,1)[0];
  }

  function matchPath(pattern, actual){
    if (pattern === actual) { return true; }
    if (pattern.includes('/:')){
      const pParts = pattern.split('/');
      const aParts = actual.split('/');
      if (pParts.length !== aParts.length) { return false; }
      for(let i=0;i<pParts.length;i++){
        if (pParts[i].startsWith(':')) { continue; }
        if (pParts[i] !== aParts[i]) { return false; }
      }
      return true;
    }
    return false;
  }

  function buildDefaultResponse(method, path, body){
    if (method === 'POST' && path === '/listings'){
      return { status:201, body:{ id: 'MOCK-'+Date.now(), revision:'r1', ok:true, mock:true } };
    }
    if (method === 'PUT' && path.startsWith('/listings/')){
      const id = path.split('/').pop();
      return { status:200, body:{ id, revision:'r'+Date.now(), ok:true, mock:true } };
    }
    return { status:404, body:{ message:'not_found' } };
  }

  let callCount = 0;
  async function handle(method, path, req, res){
    callCount += 1;
    const match = dequeueMatch(method, path) || buildDefaultResponse(method, path, req.body);
    // Chaos: simulate artificial delay
    if (chaos.injectDelayMs) { await new Promise(r=>setTimeout(r, chaos.injectDelayMs)); }
    // Chaos: simulate rate limit (429) on cadence if no explicit programmed response
    if (!req.headers['x-chaos-skip'] && chaos.rateLimitEvery && (callCount % chaos.rateLimitEvery === 0) && !match._explicit){
      calls.push({ ts: Date.now(), method, path, status: 429, chaos: 'rate_limit' });
      res.setHeader('retry-after','1');
      return res.status(429).json({ message:'rate_limited', mock:true });
    }
    calls.push({ ts: Date.now(), method, path, status: match.status });
    if (match.headers){ Object.entries(match.headers).forEach(([k,v]) => res.setHeader(k, v)); }
    res.status(match.status).json(match.body);
  }

  app.post('/__admin/next-responses', (req,res)=>{
    nextResponses = Array.isArray(req.body) ? req.body.slice() : [];
    res.json({ accepted: nextResponses.length });
  });

  app.get('/__admin/state', (req,res)=>{ res.json({ pending: nextResponses.length, calls }); });

  app.post('/listings', (req,res)=> handle('POST','/listings', req,res));
  app.put('/listings/:id', (req,res)=> handle('PUT', `/listings/${req.params.id}`, req,res));

  let server;
  return {
    start(port=0){ return new Promise(resolve => { server = app.listen(port, () => resolve(server.address().port)); }); },
    stop(){ return new Promise(resolve => { if (!server) { return resolve(); } server.close(()=>resolve()); }); },
    setNextResponses(arr){ nextResponses = Array.isArray(arr) ? arr.slice() : []; },
    getCalls(){ return calls.slice(); }
  };
}

module.exports = { createServer };
