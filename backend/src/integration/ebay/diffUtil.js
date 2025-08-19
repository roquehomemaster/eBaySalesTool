/**
 * diffUtil.js
 * Minimal recursive diff utility for plain objects/arrays.
 * Produces flat map of changes keyed by JSON pointer-ish paths.
 */
function isObject(v){return v && typeof v==='object' && !Array.isArray(v);} 

function diffObjects(prev, next, basePath=''){ 
  const changes = {}; 
  if(prev === next){ return { changes }; }
  // Handle primitive or type change
  if(!isObject(prev) || !isObject(next)){ 
    if(JSON.stringify(prev) !== JSON.stringify(next)){
      changes[basePath || '/'] = { before: prev, after: next };
    }
    return { changes };
  }
  // Collect keys
  const keys = new Set([...Object.keys(prev||{}), ...Object.keys(next||{})]);
  for(const k of keys){
    const p = basePath ? basePath + '/' + k : '/' + k;
    if(!(k in next)){ changes[p] = { before: prev[k], after: undefined }; continue; }
    if(!(k in prev)){ changes[p] = { before: undefined, after: next[k] }; continue; }
    if(isObject(prev[k]) && isObject(next[k])){ 
      const nested = diffObjects(prev[k], next[k], p); 
      Object.assign(changes, nested.changes);
    } else if(Array.isArray(prev[k]) && Array.isArray(next[k])) { 
      if(JSON.stringify(prev[k]) !== JSON.stringify(next[k])){
        changes[p] = { before: prev[k], after: next[k] };
      }
    } else if(prev[k] !== next[k]){ 
      changes[p] = { before: prev[k], after: next[k] }; 
    }
  }
  return { changes };
}

module.exports = { diffObjects };
