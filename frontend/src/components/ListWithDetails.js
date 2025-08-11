import React, { useEffect, useMemo, useState } from 'react';
import apiService from '../services/apiService';

// Generic split-pane list + details layout with a locked, scrollable list of X rows
// Props:
// - title: string
// - fetchList: () => Promise<Array>
// - rowRenderer: (item) => ReactNode (for table row cells)
// - columns: string[] (column headers)
// - detailsRenderer: (item, helpers?) => ReactNode (right pane contents). Helpers: { refreshList(selectPredicate?), selectItem(item) }
// - pageKey: string (e.g., 'listings', 'catalog', 'sales') used to get X from appconfig `${pageKey}.page_size`

const ListWithDetails = ({ title, fetchList, rowRenderer, columns, detailsRenderer, pageKey }) => {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');
  const [pageSize, setPageSize] = useState(10);

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
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
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
