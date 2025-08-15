import React, { useEffect, useState, useMemo } from 'react';
import apiService from '../services/apiService';
import './AdminAppConfig.css';

/* AdminAppConfig
 * Lists all appconfig entries and allows inline editing of config_value & data_type.
 * Minimal optimistic UI with save & revert per row.
 */
const AdminAppConfig = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const STORAGE_KEY = 'adminAppConfigState';
  const [filters, setFilters] = useState({ key: '', value: '', type: '' });
  const [sortBy, setSortBy] = useState('config_key');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedKey, setSelectedKey] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState({ config_key: '', config_value: '', data_type: 'text' });

  // Load persisted UI state
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
  if (parsed.filters) { setFilters(parsed.filters); }
  if (parsed.sortBy) { setSortBy(parsed.sortBy); }
  if (parsed.sortDir) { setSortDir(parsed.sortDir); }
      }
    } catch (_) { /* ignore */ }
  }, []);

  // Persist state (debounced minimal)
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ filters, sortBy, sortDir })); } catch (_) {}
  }, [filters, sortBy, sortDir]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await apiService.getAllAppConfig();
        if (mounted) {
          // sort by key for consistency
            setItems(data.sort((a,b) => a.config_key.localeCompare(b.config_key)).map(r => ({ ...r, _original: { ...r }, _dirty: false, _saving: false })));
        }
      } catch (e) {
        setError(typeof e === 'string' ? e : (e?.message || 'Failed to load'));
      } finally {
        if (mounted) { setLoading(false); }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const adaptValueForType = (type, value) => {
    switch (type) {
      case 'int':
        return (/^-?\d+$/.test(String(value).trim())) ? String(value).trim() : '0';
      case 'bool': {
        const v = String(value).toLowerCase();
        if (v === 'true' || v === 'false') { return v; }
        return 'false';
      }
      case 'json': {
        try {
          if (typeof value === 'string') {
            JSON.parse(value); // validate only
            return value; // keep as is (user formatting) until they press Format
          }
          return JSON.stringify(value);
        } catch (_) {
          return '{}';
        }
      }
      default:
        return value == null ? '' : String(value);
    }
  };

  const updateField = (key, field, value) => {
    setItems(prev => prev.map(it => {
      if (it.config_key !== key) { return it; }
      let next = { ...it, [field]: value, _dirty: true };
      if (field === 'data_type') {
        next = { ...next, config_value: adaptValueForType(value, next.config_value) };
      }
      return next;
    }));
  };

  const validateRow = (row) => {
    const val = row.config_value == null ? '' : String(row.config_value);
    switch (row.data_type) {
      case 'int':
        return { valid: /^-?\d+$/.test(val.trim()), msg: 'Must be integer' };
      case 'bool': {
        const v = val.toLowerCase();
        const ok = (v === 'true' || v === 'false');
        return { valid: ok, msg: 'true or false' };
      }
      case 'json':
        try { JSON.parse(val); return { valid: true }; } catch (e) { return { valid: false, msg: 'Invalid JSON' }; }
      default:
        return { valid: true };
    }
  };

  const revertRow = (key) => {
    setItems(prev => prev.map(it => it.config_key === key ? { ...it._original, _original: { ...it._original }, _dirty: false, _saving: false } : it));
  };

  const saveRow = async (key) => {
    setItems(prev => prev.map(it => it.config_key === key ? { ...it, _saving: true } : it));
    const row = items.find(i => i.config_key === key);
    if (!row) { return; }
    const validation = validateRow(row);
    if (!validation.valid) {
      alert('Cannot save: ' + (validation.msg || 'Invalid value'));
      setItems(prev => prev.map(it => it.config_key === key ? { ...it, _saving: false } : it));
      return;
    }
    try {
      let outValue = row.config_value;
      if (row.data_type === 'json') {
        // Normalize JSON before save (minify to save space)
        try { outValue = JSON.stringify(JSON.parse(String(outValue))); } catch (_) { /* already validated */ }
      } else if (row.data_type === 'bool') {
        outValue = String(outValue).toLowerCase() === 'true' ? 'true' : 'false';
      } else if (row.data_type === 'int') {
        outValue = String(parseInt(outValue, 10));
      }
      const payload = { config_value: outValue, data_type: row.data_type };
      const saved = await apiService.updateAppConfig(key, payload);
      setItems(prev => prev.map(it => it.config_key === key ? { ...saved, _original: { ...saved }, _dirty: false, _saving: false } : it));
    } catch (e) {
      alert('Save failed: ' + (e?.message || e));
      setItems(prev => prev.map(it => it.config_key === key ? { ...it, _saving: false } : it));
    }
  };

  const filtered = useMemo(() => {
    let data = items;
    if (filters.key) {
      const k = filters.key.toLowerCase();
      data = data.filter(i => i.config_key.toLowerCase().includes(k));
    }
    if (filters.value) {
      const v = filters.value.toLowerCase();
      data = data.filter(i => (i.config_value || '').toLowerCase().includes(v));
    }
    if (filters.type) {
      data = data.filter(i => i.data_type === filters.type);
    }
    const dir = sortDir === 'asc' ? 1 : -1;
    const sorted = [...data].sort((a,b) => {
      const av = a[sortBy] ?? '';
      const bv = b[sortBy] ?? '';
      if (av < bv) { return -1 * dir; }
      if (av > bv) { return 1 * dir; }
      return 0;
    });
    return sorted;
  }, [items, filters, sortBy, sortDir]);

  const toggleSort = (field) => {
    setSortBy(prev => {
      if (prev === field) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortDir('asc');
      return field;
    });
  };

  const startAdd = () => {
    setAdding(true);
    setNewRow({ config_key: '', config_value: '', data_type: 'text' });
  };
  const cancelAdd = () => {
    setAdding(false);
  };
  const canCreate = () => {
    return newRow.config_key.trim().length > 0 && !items.some(i => i.config_key === newRow.config_key.trim());
  };
  const createRow = async () => {
  if (!canCreate()) { return; }
    // Reuse update endpoint only if backend supports create via PUT; if not, would need POST (not present). We'll optimistic add client-side.
    const payload = { config_value: newRow.config_value, data_type: newRow.data_type };
    try {
      // Attempt PUT create, else fallback to optimistic insert
      const saved = await apiService.updateAppConfig(newRow.config_key.trim(), payload);
      setItems(prev => [...prev, { ...saved, _original: { ...saved }, _dirty: false, _saving: false }]);
      setAdding(false);
    } catch (e) {
      // If fails, still add locally to allow user to edit then save later (flag dirty)
      setItems(prev => [...prev, { config_key: newRow.config_key.trim(), config_value: newRow.config_value, data_type: newRow.data_type, _original: { config_key: newRow.config_key.trim(), config_value: '', data_type: newRow.data_type }, _dirty: true, _saving: false }]);
      setAdding(false);
      alert('Created locally (backend create may have failed): ' + (e?.message || e));
    }
  };

  return (
    <div className="admin-appconfig">
      <h2>Application Configuration</h2>
      <div style={{ marginBottom: 8, display:'flex', gap:8, alignItems:'center' }}>
        <button onClick={startAdd} disabled={adding}>Add New</button>
        {(filters.key || filters.value || filters.type) && (
          <button style={{ fontSize:12 }} onClick={() => setFilters({ key:'', value:'', type:'' })}>Clear Filters</button>
        )}
      </div>
  {/* Filters moved to a dedicated second header row below */}
      {loading && <div>Loading...</div>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && (
        <table className="appconfig-table">
          <thead>
            <tr>
              <th style={{width:'30%', cursor:'pointer', background: filters.key ? '#eef6ff' : undefined}} onClick={() => toggleSort('config_key')}>
                Key {sortBy==='config_key' && (sortDir==='asc' ? '▲' : '▼')}
              </th>
              <th style={{width:'40%', cursor:'pointer', background: filters.value ? '#eef6ff' : undefined}} onClick={() => toggleSort('config_value')}>
                Value {sortBy==='config_value' && (sortDir==='asc' ? '▲' : '▼')}
              </th>
              <th style={{width:'10%', cursor:'pointer', background: filters.type ? '#eef6ff' : undefined}} onClick={() => toggleSort('data_type')}>
                Type {sortBy==='data_type' && (sortDir==='asc' ? '▲' : '▼')}
              </th>
              <th style={{width:'20%'}}>Actions</th>
            </tr>
            <tr className="filter-row">
              <th>
                <input
                  type="text"
                  placeholder="key"
                  value={filters.key}
                  onChange={e => setFilters(f => ({ ...f, key: e.target.value }))}
                  style={{ width: '100%', fontSize: 12 }}
                />
              </th>
              <th>
                <input
                  type="text"
                  placeholder="value"
                  value={filters.value}
                  onChange={e => setFilters(f => ({ ...f, value: e.target.value }))}
                  style={{ width: '100%', fontSize: 12 }}
                />
              </th>
              <th>
                <select
                  value={filters.type}
                  onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
                  style={{ width: '100%', fontSize: 12 }}
                >
                  <option value="">All</option>
                  <option value="text">text</option>
                  <option value="int">int</option>
                  <option value="json">json</option>
                  <option value="bool">bool</option>
                </select>
              </th>
              <th>
                {(filters.key || filters.value || filters.type) && (
                  <button style={{ fontSize: 11 }} onClick={() => setFilters({ key:'', value:'', type:'' })}>Clear</button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {adding && (
              <tr className="adding-row">
                <td>
                  <input
                    placeholder="new.config.key"
                    value={newRow.config_key}
                    onChange={e => setNewRow(r => ({ ...r, config_key: e.target.value }))}
                    style={{ width:'100%' }}
                  />
                </td>
                <td>
                  {newRow.data_type === 'bool' ? (
                    <select value={newRow.config_value} onChange={e => setNewRow(r => ({ ...r, config_value: e.target.value }))}>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : newRow.data_type === 'int' ? (
                    <input type="number" value={newRow.config_value} onChange={e => setNewRow(r => ({ ...r, config_value: e.target.value }))} />
                  ) : newRow.data_type === 'json' ? (
                    <textarea value={newRow.config_value} onChange={e => setNewRow(r => ({ ...r, config_value: e.target.value }))} style={{ width:'100%', minHeight: 60 }} />
                  ) : (
                    <input value={newRow.config_value} onChange={e => setNewRow(r => ({ ...r, config_value: e.target.value }))} />
                  )}
                </td>
                <td>
                  <select value={newRow.data_type} onChange={e => setNewRow(r => ({ ...r, data_type: e.target.value }))}>
                    <option value="text">text</option>
                    <option value="int">int</option>
                    <option value="json">json</option>
                    <option value="bool">bool</option>
                  </select>
                </td>
                <td>
                  <button onClick={createRow} disabled={!canCreate()}>Create</button>
                  <button onClick={cancelAdd}>Cancel</button>
                </td>
              </tr>
            )}
            {filtered.map(row => {
              const validation = validateRow(row);
              const invalid = !validation.valid;
              const commonInputStyle = { width: '100%', border: invalid ? '1px solid #d33' : undefined, fontFamily: row.data_type === 'json' ? 'monospace' : undefined };
              return (
                <tr key={row.config_key} className={(row._dirty ? 'dirty ' : '') + (invalid ? 'invalid ' : '') + (selectedKey === row.config_key ? 'selected-row' : '')} onClick={() => setSelectedKey(row.config_key)}>
                  <td>{row.config_key}</td>
                  <td>
                    {row.data_type === 'bool' ? (
                      <select
                        value={String(row.config_value).toLowerCase() === 'true' ? 'true' : 'false'}
                        onChange={e => updateField(row.config_key,'config_value', e.target.value)}
                        disabled={row._saving}
                        style={commonInputStyle}
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : row.data_type === 'int' ? (
                      <input
                        type="number"
                        value={row.config_value}
                        onChange={e => updateField(row.config_key,'config_value', e.target.value)}
                        disabled={row._saving}
                        style={commonInputStyle}
                      />
                    ) : row.data_type === 'json' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <textarea
                          value={row.config_value}
                          onChange={e => updateField(row.config_key,'config_value', e.target.value)}
                          disabled={row._saving}
                          style={{ ...commonInputStyle, minHeight: 70, resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            style={{ fontSize: 11 }}
                            disabled={row._saving || invalid}
                            onClick={() => {
                              try {
                                const pretty = JSON.stringify(JSON.parse(String(row.config_value)), null, 2);
                                updateField(row.config_key,'config_value', pretty);
                              } catch (_) { /* ignore */ }
                            }}
                          >Format</button>
                          <button
                            style={{ fontSize: 11 }}
                            disabled={row._saving || invalid}
                            onClick={() => {
                              try {
                                const compact = JSON.stringify(JSON.parse(String(row.config_value)));
                                updateField(row.config_key,'config_value', compact);
                              } catch (_) { /* ignore */ }
                            }}
                          >Minify</button>
                        </div>
                      </div>
                    ) : (
                      <input
                        value={row.config_value}
                        onChange={e => updateField(row.config_key,'config_value', e.target.value)}
                        disabled={row._saving}
                        style={commonInputStyle}
                      />
                    )}
                    {invalid && <div style={{ color: '#b50000', fontSize: 11, marginTop: 2 }}>{validation.msg}</div>}
                  </td>
                  <td>
                    <select
                      value={row.data_type}
                      onChange={e => updateField(row.config_key,'data_type', e.target.value)}
                      disabled={row._saving}
                    >
                      <option value="text">text</option>
                      <option value="int">int</option>
                      <option value="json">json</option>
                      <option value="bool">bool</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => saveRow(row.config_key)} disabled={!row._dirty || row._saving || invalid}>{row._saving ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => revertRow(row.config_key)} disabled={!row._dirty || row._saving}>Revert</button>
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr><td colSpan={4} style={{textAlign:'center', fontStyle:'italic'}}>No matching config keys</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminAppConfig;
