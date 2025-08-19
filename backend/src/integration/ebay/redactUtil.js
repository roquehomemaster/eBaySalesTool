/**
 * redactUtil.js
 * Simple redaction for sensitive auth tokens / secrets before persistence.
 */
const SENSITIVE_KEYS = ['authorization','auth','token','access_token','refresh_token','client_secret'];

function redactValue(v){
  if (v == null) { return v; }
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  if (s.length <= 8) { return '***'; }
  return s.slice(0,4) + '***' + s.slice(-4);
}

function redactObject(obj){
  if (!obj || typeof obj !== 'object') { return obj; }
  const clone = Array.isArray(obj) ? [] : {};
  Object.keys(obj).forEach(k => {
    const v = obj[k];
    if (SENSITIVE_KEYS.includes(k.toLowerCase())) {
      clone[k] = redactValue(v);
    } else if (v && typeof v === 'object') {
      clone[k] = redactObject(v);
    } else {
      clone[k] = v;
    }
  });
  return clone;
}

module.exports = { redactObject };
