import React, { useEffect, useMemo, useState } from 'react';
import apiService from '../services/apiService';

// Generic split-pane list + details layout with a locked, scrollable list of X rows
// Props:
// - title: string
// - fetchList: () => Promise<Array>
// - rowRenderer: (item) => ReactNode (for table row cells)
// - columns: string[] (column headers)
// - detailsRenderer: (item) => ReactNode (right pane contents)
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

  // Load list
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchList();
        if (!mounted) {
          return;
        }
        const list = Array.isArray(data) ? data : (data?.list || data?.rows || data?.data || data?.items || []);
        setItems(list);
        setSelected(list[0] || null);
        setMessage(list.length ? null : 'No data found');
      } catch (err) {
        if (!mounted) {
          return;
        }
        setMessage('Error loading data');
        setMessageType('error');
      }
    })();
    return () => { mounted = false; };
  }, [fetchList]);

  // Compute row height and container height from CSS variables inlined here
  const rowHeight = 36; // px per row (approx)
  const listHeight = useMemo(() => `${Math.max(1, pageSize) * rowHeight + 40}px`, [pageSize]); // + header

  return (
    <div className="split-layout">
      <div className="split-left" style={{ maxHeight: listHeight, overflowY: 'auto' }}>
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
      <div className="split-right">
        {selected ? (
          detailsRenderer(selected)
        ) : (
          <div style={{ padding: 16, color: '#777' }}>Select an item to see details</div>
        )}
      </div>
      <style>{`
        .split-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 16px; }
        .list-table { width: 100%; border-collapse: collapse; }
        .list-table th, .list-table td { border-bottom: 1px solid #e5e5e5; padding: 8px; text-align: left; }
        .list-table tr.selected { background: #f0f7ff; }
        .split-right { border-left: 1px solid #eee; padding-left: 12px; }
        .system-message.info { background: #eef6ff; color: #035388; padding: 8px; border-radius: 4px; margin-bottom: 8px; }
        .system-message.error { background: #ffefef; color: #8a041a; padding: 8px; border-radius: 4px; margin-bottom: 8px; }
      `}</style>
    </div>
  );
};

export default ListWithDetails;
