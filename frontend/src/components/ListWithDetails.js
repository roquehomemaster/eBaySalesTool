import React, { useEffect, useMemo, useState, useRef } from 'react';
import apiService from '../services/apiService';
import usePersistedTableState from '../hooks/usePersistedTableState';

// Generic split-pane list + details layout with a locked, scrollable list of X rows
// Props:
// - title: string
// - fetchList: () => Promise<Array>
// - rowRenderer: (item) => ReactNode (for table row cells)
// - columns: string[] (column headers)
// - detailsRenderer: (item, helpers?) => ReactNode (right pane contents). Helpers: { refreshList(selectPredicate?), selectItem(item) }
// - pageKey: string (e.g., 'listings', 'catalog', 'sales') used to get X from appconfig `${pageKey}.page_size`

const ListWithDetails = ({ title, fetchList, rowRenderer, columns, detailsRenderer, pageKey, headerRenderers = {}, filterConfig = {}, initialFilters = {} }) => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');
  const [pageSize, setPageSize] = useState(10);
  const [persisted, setPersisted] = usePersistedTableState(`tableState:${pageKey}`, { filters: initialFilters, sortBy: null, sortDir: 'asc' });
  const filterValues = persisted.filters || {};
  const [sortBy, setSortBy] = useState(persisted.sortBy || null);
  const [sortDir, setSortDir] = useState(persisted.sortDir || 'asc');
  const debounceTimers = useRef({});

  // Load per-page page size from appconfig
  useEffect(() => {
    let active = true;
    async function loadPageSize() {
      try {
        const config = await apiService.getAppConfigByKey(`${pageKey}.page_size`);
        const val = parseInt(config?.config_value, 10);
        if (active && !isNaN(val) && val > 0) {
          setPageSize(val);
        }
      } catch (_) { /* use default */ }
    }
    loadPageSize();
    return () => { active = false; };
  }, [pageKey]);

  // Load list (reusable)
  const loadList = React.useCallback(async (selectPredicate) => {
    try {
      const data = await fetchList();
      const list = Array.isArray(data) ? data : (data?.list || data?.rows || data?.data || data?.items || []);
      setItems(list);
      if (typeof selectPredicate === 'function') {
        const found = list.find(selectPredicate) || null;
        setSelected(found || list[0] || null);
      } else {
        setSelected(list[0] || null);
      }
      setMessage(list.length ? null : 'No data found');
    } catch (_) {
      setMessage('Error loading data');
      setMessageType('error');
    }
  }, [fetchList]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) { return; }
      await loadList();
    })();
    return () => { mounted = false; };
  }, [loadList]);

  // Compute row height and container height; lock to configured pageSize only
  const rowHeight = 36; // px per row (approx)
  const visibleRows = useMemo(() => Math.max(pageSize || 0, 1), [pageSize]);
  const listHeight = useMemo(() => `${visibleRows * rowHeight + 40}px`, [visibleRows]); // + header

  const helpers = useMemo(() => ({
    refreshList: (selectPredicate) => loadList(selectPredicate),
    selectItem: (item) => setSelected(item)
  }), [loadList]);

  // Apply client-side filters (simple contains / equality depending on config)
  const filteredItems = useMemo(() => {
    if (!items || !Array.isArray(items) || Object.keys(filterValues).length === 0) { return items; }
    return items.filter(item => {
      return Object.entries(filterValues).every(([col, val]) => {
        if (val == null || val === '') { return true; }
        const def = filterConfig[col];
        if (!def) { return true; }
        const accessor = def.accessor || ((row) => row[col.toLowerCase().replace(/\s+/g,'_')]);
        const raw = accessor(item);
        if (def.type === 'select') {
          if (def.allowAll && (val === def.allowAllValue)) { return true; }
          return String(raw) === String(val);
        }
        if (raw == null) { return false; }
        return String(raw).toLowerCase().includes(String(val).toLowerCase());
      });
    });
  }, [items, filterValues, filterConfig]);

  // Reselect if current selection filtered out
  useEffect(() => {
    if (selected && !filteredItems.includes(selected)) {
      setSelected(filteredItems[0] || null);
    }
  }, [filteredItems, selected]);

  const onFilterChange = (col, value) => {
    // Debounce each column input (250ms)
    if (debounceTimers.current[col]) { clearTimeout(debounceTimers.current[col]); }
    debounceTimers.current[col] = setTimeout(() => {
      setPersisted(prev => ({ ...prev, filters: { ...(prev.filters||{}), [col]: value } }));
    }, 250);
  };

  const toggleSort = (col) => {
    setSortBy(prev => {
      let nextDir = 'asc';
      let nextCol = col;
      if (prev === col) {
        nextDir = sortDir === 'asc' ? 'desc' : 'asc';
      }
      setSortDir(nextDir);
      setPersisted(prevState => ({ ...prevState, sortBy: nextCol, sortDir: nextDir }));
      return nextCol;
    });
  };

  return (
    <div className="stack-layout">
  <div className="stack-top" style={{ height: listHeight, overflowY: 'auto', marginBottom: 16 }}>
        <h2 style={{ margin: '8px 0' }}>{title}</h2>
        {message && (
          <div className={`system-message ${messageType}`}>{message}</div>
        )}
        <table className="list-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => toggleSort(col)}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  {headerRenderers[col] || col}{sortBy===col ? (sortDir==='asc' ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
            {Object.keys(filterConfig).length > 0 && (
              <tr className="filter-row">
                {columns.map(col => {
                  const def = filterConfig[col];
                  if (!def) { return <th key={col}></th>; }
                  if (def.type === 'select') {
                    const opts = def.options || [];
                    return (
                      <th key={col}>
                        <select
                          value={filterValues[col] ?? (def.defaultValue ?? '')}
                          onChange={(e) => onFilterChange(col, e.target.value)}
                          style={{ width: '100%', fontSize: 12 }}
                        >
                          {def.allowAll && <option value={def.allowAllValue}>{def.allowAllLabel || 'ALL'}</option>}
                          {opts.map(o => (
                            <option key={String(o.value ?? o)} value={o.value ?? o}>{o.label ?? o}</option>
                          ))}
                        </select>
                      </th>
                    );
                  }
                  // default text filter
                  return (
                    <th key={col}>
                      <div style={{ display: 'flex', alignItems:'center', gap:4 }}>
                        <input
                          type="text"
                          placeholder={def.placeholder || 'filter'}
                          defaultValue={filterValues[col] ?? ''}
                          onChange={(e) => onFilterChange(col, e.target.value)}
                          style={{ width: '100%', fontSize: 12 }}
                        />
                        {filterValues[col] && (
                          <button
                            onClick={() => onFilterChange(col, '')}
                            style={{ fontSize:10, padding:'2px 4px' }}
                            title="Clear"
                          >×</button>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            )}
          </thead>
          <tbody>
            {filteredItems.map((item, idx) => (
              <tr
                key={item.id || item.listing_id || item.item_id || item.sale_id || idx}
                onClick={() => setSelected(item)}
                className={selected === item ? 'selected' : ''}
                style={{ cursor: 'pointer' }}
              >
                {rowRenderer(item)}
              </tr>
            ))}
          </tbody>
        </table>
        {Object.values(filterValues).some(v => v) && (
          <div style={{ marginTop:4 }}>
            <button style={{ fontSize:12 }} onClick={() => setPersisted(prev => ({ ...prev, filters: {} }))}>Clear All Filters</button>
          </div>
        )}
      </div>
      <div className="stack-bottom">
        {selected ? (
          detailsRenderer(selected, helpers)
        ) : (
          <div style={{ padding: 16, color: '#777' }}>Select an item to see details</div>
        )}
      </div>
      <style>{`
        .list-table { width: 100%; border-collapse: collapse; }
        .list-table th, .list-table td { border-bottom: 1px solid #e5e5e5; padding: 8px; text-align: left; }
        .list-table tr.selected { background: #f0f7ff; }
        .list-table thead .filter-row th { background: #fafafa; }
        
        .system-message.info { background: #eef6ff; color: #035388; padding: 8px; border-radius: 4px; margin-bottom: 8px; }
        .system-message.error { background: #ffefef; color: #8a041a; padding: 8px; border-radius: 4px; margin-bottom: 8px; }

  .stack-layout { display: flex; flex-direction: column; }
  .stack-top { flex: 0 0 auto; }
  .stack-bottom { flex: 0 0 auto; }
      `}</style>
    </div>
  );
};

export default ListWithDetails;
