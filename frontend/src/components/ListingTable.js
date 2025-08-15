import React from 'react';
import ListWithDetails from './ListWithDetails';
import apiService from '../services/apiService';

const ListingTable = () => {
  const ALL_VALUE = '__ALL__';
  const [statusOptions, setStatusOptions] = React.useState([]);
  const [workflowLoaded, setWorkflowLoaded] = React.useState(false);

  // Load workflow & default status once
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const wf = await apiService.getListingStatusWorkflow();
  if (!active) { return; }
  const options = Array.isArray(wf?.nodes) ? wf.nodes.map(n => n.status) : Object.keys(wf?.graph || {});
        const unique = [...new Set(options)].sort();
        setStatusOptions(unique);
        const def = (wf && wf.default_status) ? wf.default_status : 'draft';
  // status default captured via filter row by defaultValue in filterConfig when we wire it
      } catch (_) {
        setStatusOptions(['draft']);
      } finally {
  if (active) { setWorkflowLoaded(true); }
      }
    })();
    return () => { active = false; };
  }, []);

  const fetchList = async () => {
    const params = {};
  // Status filtering handled by backend only if provided by query param; we read it from localStorage persisted state when available.
  try {
    const persisted = JSON.parse(window.localStorage.getItem('tableState:listings')||'{}');
    const statusVal = persisted?.filters?.Status;
    if (statusVal && statusVal !== ALL_VALUE) { params.status = statusVal; }
  } catch(_) {}
    const response = await apiService.getListings(params);
    if (Array.isArray(response)) {
      return response;
    }
    if (response?.listings) {
      return response.listings;
    }
    if (response?.data?.listings) {
      return response.data.listings;
    }
    return [];
  };

  const STATUS_COL = 'Status';
  const columns = ['Title', 'Listing Price', STATUS_COL, 'Item ID', 'Created'];
  const rowRenderer = (listing) => (
    <>
      <td>{listing.title}</td>
      <td>{listing.listing_price}</td>
      <td>{listing.status}</td>
      <td>{listing.item_id}</td>
  <td>{listing.created_at ? new Date(listing.created_at).toLocaleString() : ''}</td>
    </>
  );

  const detailsRenderer = (listing, helpers) => {
    const Details = () => {
  const [data, setData] = React.useState(null);
  const [historyOffset, setHistoryOffset] = React.useState(0);
  const [historyLoading, setHistoryLoading] = React.useState(false);
      const [error, setError] = React.useState(null);
  const [createMode, setCreateMode] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', listing_price: '', item_id: '', ownership_id: '', serial_number: '', manufacture_date: '' });
      const [saving, setSaving] = React.useState(false);
      const [catalog, setCatalog] = React.useState([]);
  const [ownerships, setOwnerships] = React.useState([]);

      // Helpers
      const prettify = (k) => (k || '').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
      const omit = new Set(['created_at','updated_at','id','listing_id','item_id','sale_id','ownership_id','ownershipagreement_id','performancemetric_id','shippinglog_id','financialtracking_id','customerdetail_id']);
      const currency = new Set(['listing_price','sold_price','sold_shipping_collected','taxes','negotiated_terms_calculation','shipping_collected','shipping_label_costs','additional_shipping_costs_material','shipping_total','sold_total','taxes_collected','actual_shipping_costs','net_proceeds_calculation','final_evaluation_calculation_used','terms_calculation','customer_payout','our_profit','minimum_sale_price','total_sales','average_sale_price']);
      const looksLikeDateKey = (k) => /date|_at$|date$|time$/i.test(k);
      const fmtCurrency = (v) => {
        const num = typeof v === 'string' ? Number(v) : v;
        return Number.isFinite(num) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num) : v;
      };
      const fmtVal = (k, v) => {
        if (v == null) {
          return '-';
        }
        if (currency.has(k)) {
          return fmtCurrency(v);
        }
        if (typeof v === 'string') {
          const d = new Date(v);
          if ((looksLikeDateKey(k) || /\d{4}-\d{2}-\d{2}/.test(v)) && !isNaN(d.getTime())) {
            return d.toLocaleString();
          }
        }
        return String(v);
      };
      // Helpers for change history rendering (defined at component scope for JSX use)
      function pickFields(obj, fields) {
        if (!obj) {
          return {};
        }
        if (!Array.isArray(fields) || fields.length === 0) {
          return obj;
        }
        const out = {};
        fields.forEach(f => {
          if (Object.prototype.hasOwnProperty.call(obj, f)) {
            out[f] = obj[f];
          }
        });
        return out;
      }
      function diffChanges(before, after, fields) {
        if (!before || !after) {
          return {};
        }
        const keys = Array.isArray(fields) && fields.length ? fields : Object.keys(after);
        const diff = {};
        keys.forEach(k => {
          if (before[k] !== after[k]) {
            diff[k] = { before: before[k], after: after[k] };
          }
        });
        return diff;
      }
      const entriesFromObj = (obj, keysOrder) => {
        if (!obj) {
          return [];
        }
        const entries = keysOrder && keysOrder.length
          ? keysOrder.filter(k => obj[k] !== undefined && !omit.has(k)).map(k => [k, obj[k]])
          : Object.entries(obj).filter(([k]) => !omit.has(k));
        return entries.map(([k, v]) => [prettify(k), fmtVal(k, v)]);
      };

      const listingId = listing?.listing_id; // stabilize for effect deps
      React.useEffect(() => {
        let active = true;
        (async () => {
          if (!createMode && listingId) {
            try {
              const resp = await apiService.getListingDetails(listingId, { history_offset: 0 });
              if (active) {
                setData(resp);
                setHistoryOffset(0);
              }
            } catch (e) {
              if (active) {
                setError('Failed to load details');
              }
            }
          }
        })();
        return () => { active = false; };
  }, [listingId, createMode]);

      // Preload catalog and ownerships for selection in create mode
      React.useEffect(() => {
        let mounted = true;
        (async () => {
          try {
            const res = await apiService.getCatalog();
            const list = Array.isArray(res) ? res : (res?.catalog || res?.data?.catalog || []);
            if (mounted) { setCatalog(list); }
          } catch (_) { /* ignore */ }
          try {
            const own = await apiService.getOwnerships();
            const list = Array.isArray(own?.ownerships) ? own.ownerships : (Array.isArray(own) ? own : (own?.data?.ownerships || []));
            if (mounted) { setOwnerships(list); }
          } catch (_) { /* ignore */ }
        })();
        return () => { mounted = false; };
      }, []);

      const startCreate = () => {
        setCreateMode(true);
        setError(null);
  setForm({ title: '', listing_price: '', item_id: '', ownership_id: '', serial_number: '', manufacture_date: '' });
      };
      const startEdit = () => {
        if (!data?.listing && !listing) { return; }
        setEditMode(true);
        setError(null);
        const listingDetail = data?.listing || {};
        // Fallbacks: use row listing fields if detail not yet populated
        const fallbackItemId = listingDetail.item_id != null ? listingDetail.item_id : listing?.item_id;
        const fallbackOwnershipId = listingDetail.ownership_id != null ? listingDetail.ownership_id : listing?.ownership_id;
        setForm({
          title: listingDetail.title || listing?.title || '',
          listing_price: listingDetail.listing_price != null ? String(listingDetail.listing_price) : (listing?.listing_price != null ? String(listing.listing_price) : ''),
          item_id: fallbackItemId != null ? String(fallbackItemId) : '',
          ownership_id: fallbackOwnershipId != null ? String(fallbackOwnershipId) : '',
          serial_number: listingDetail.serial_number || '',
          manufacture_date: listingDetail.manufacture_date || ''
        });
      };
      const cancelCreate = () => {
        setCreateMode(false);
        setError(null);
      };
      const cancelEdit = () => {
        setEditMode(false);
        setError(null);
      };
      const onChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
      };
      const canSave = () => {
  return Boolean(form.title && form.item_id && form.listing_price && form.ownership_id && !saving);
      };
      const save = async () => {
        if (!canSave()) { return; }
        setSaving(true);
        try {
          const payload = {
            title: form.title,
            listing_price: Number(form.listing_price),
            item_id: Number(form.item_id),
            ownership_id: Number(form.ownership_id),
            serial_number: form.serial_number || undefined,
            manufacture_date: form.manufacture_date || undefined
          };
          // Only set initial status when creating (avoid clobbering existing status on edit)
          if (createMode) {
            payload.status = 'draft';
          }
          if (createMode) {
            const created = await apiService.createListing(payload);
            await helpers?.refreshList?.((it) => (it.listing_id && created?.listing_id) ? it.listing_id === created.listing_id : (it.title === payload.title && it.item_id === payload.item_id));
            setCreateMode(false);
          } else if (editMode && listing?.listing_id) {
            await apiService.updateListing(listing.listing_id, payload);
            // Refresh list to ensure updated values in list view
            await helpers?.refreshList?.((it) => it.listing_id === listing.listing_id);
            // Fetch updated details (ownership + sales linkage) explicitly since listing_id is unchanged
            try {
              const updatedDetails = await apiService.getListingDetails(listing.listing_id, { history_offset: 0 });
              setData(updatedDetails);
              setHistoryOffset(0);
            } catch (_) { /* ignore details refresh error */ }
            setEditMode(false);
          }
          setSaving(false);
        } catch (e) {
          setSaving(false);
          const msg = (e && (e.message || e.error || e.msg || e.message)) || 'Failed to create listing';
          setError(typeof e === 'string' ? e : msg);
        }
      };

      const Section = ({ title, obj, rows }) => (
        <div style={{ marginTop: 12 }}>
          <h4 style={{ margin: '6px 0' }}>{title}</h4>
          <table className="kv-table"><tbody>
            {(rows || entriesFromObj(obj)).map(([k, v]) => (
              <tr key={k}><td className="kv-key">{String(k)}</td><td className="kv-val">{String(v)}</td></tr>
            ))}
          </tbody></table>
        </div>
      );

      if (error) {
        return <div className="system-message error">{error}</div>;
      }
      // Header with Add/Edit buttons
      const Header = () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Listing Details</h3>
          {!(createMode || editMode) && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={startCreate} style={{ padding: '6px 10px' }}>Add</button>
              <button onClick={startEdit} style={{ padding: '6px 10px' }} disabled={!data?.listing}>Edit</button>
            </div>
          )}
        </div>
      );

  if (createMode || editMode) {
        return (
          <div>
            <Header />
            <div className="details-grid">
              <div className="group">
                <h4 style={{ margin: '6px 0' }}>eBay Listing</h4>
                <div className="form-row"><label>* Title</label><input name="title" value={form.title} onChange={onChange} /></div>
                <div className="form-row"><label>* Listing Price</label><input name="listing_price" type="number" step="0.01" value={form.listing_price} onChange={onChange} /></div>
                <div className="form-row"><label>Serial Number</label><input name="serial_number" value={form.serial_number} onChange={onChange} placeholder="e.g. SN123" /></div>
                <div className="form-row"><label>Manufacture Date</label><input name="manufacture_date" type="date" value={form.manufacture_date} onChange={onChange} /></div>
                <div className="form-row"><label>Payment Method</label><input name="payment_method" disabled placeholder="Optional (later)" /></div>
                <div className="form-row"><label>Shipping Method</label><input name="shipping_method" disabled placeholder="Optional (later)" /></div>
              </div>
              <div className="group">
                <h4 style={{ margin: '6px 0' }}>Product Details</h4>
                <div className="form-row">
                  <label>* Catalog Item</label>
                  <select name="item_id" value={form.item_id} onChange={onChange}>
                    <option value="">Select item…</option>
                    {catalog.map((c) => (
                      <option key={c.item_id} value={String(c.item_id)}>{c.description} ({c.manufacturer} {c.model})</option>
                    ))}
                  </select>
                </div>
                <div className="form-row"><label>Condition</label><input name="item_condition_description" disabled placeholder="Optional (later)" /></div>
              </div>
              <div className="group">
                <h4 style={{ margin: '6px 0' }}>Ownership</h4>
                <div className="form-row">
                  <label>* Owner</label>
                   <select name="ownership_id" value={form.ownership_id} onChange={onChange}>
                    <option value="">Select owner…</option>
                    {ownerships.map((o) => (
                      <option key={o.ownership_id} value={String(o.ownership_id)}>{`${o.first_name || ''} ${o.last_name || ''}`.trim() || o.email || `Owner ${o.ownership_id}`}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {error && <div className="system-message error" style={{ marginTop: 12 }}>{error}</div>}
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button onClick={save} disabled={!canSave()}>{saving ? 'Saving…' : 'Save'}</button>
              {createMode ? (
                <button onClick={cancelCreate} disabled={saving}>Cancel</button>
              ) : (
                <button onClick={cancelEdit} disabled={saving}>Cancel</button>
              )}
            </div>
            <style>{`
              .details-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
              .details-grid .group { grid-column: span 2; }
              .form-row { display: flex; flex-direction: column; margin-bottom: 8px; }
              .form-row label { font-weight: 600; margin-bottom: 4px; }
              .form-row input, .form-row select { padding: 6px 8px; }
            `}</style>
          </div>
        );
      }

      if (!data) {
        return (
          <div>
            <Header />
            <div className="system-message info" style={{ marginTop: 8 }}>Loading details…</div>
          </div>
        );
      }

      return (
        <div>
          <Header />
          <div className="details-grid">
            <div className="group">
              <Section
                title="eBay Listing"
                rows={entriesFromObj(data.listing, ['title','status','listing_price','serial_number','manufacture_date','payment_method','shipping_method','watchers','item_condition_description'])}
              />
            </div>
            <div className="group">
              <Section
                title="Product Details"
                rows={entriesFromObj(data.catalog, ['manufacturer','model','description','sku','barcode'])}
              />
            </div>

            {(data.ownerships || []).length > 0 && (
              <div className="group">
                <h4 style={{ margin: '6px 0' }}>Ownership Details</h4>
                {(data.ownerships || []).map((o, i) => (
                  <Section
                    key={o.ownership_id || i}
                    title={`Owner ${`${o.first_name || ''} ${o.last_name || ''}`.trim() || i+1}`}
                    rows={entriesFromObj(o, ['ownership_type','first_name','last_name','email','telephone','address','company_name'])}
                  />
                ))}
              </div>
            )}

            {(data.ownershipagreements || []).length > 0 && (
              <div className="group">
                <h4 style={{ margin: '6px 0' }}>Contract Details</h4>
                {(data.ownershipagreements || []).map((a, i) => (
                  <Section
                    key={a.ownershipagreement_id || i}
                    title={`Agreement ${a.ownershipagreement_id || i+1}`}
                    rows={entriesFromObj(a, ['commission_percentage','minimum_sale_price','duration_of_agreement','renewal_terms'])}
                  />
                ))}
              </div>
            )}

            {(data.change_history || []).length > 0 && (
              <div className="group">
                <h4 style={{ margin: '6px 0' }}>Change History <span style={{ fontWeight: 400, fontSize: 12 }}>(showing {data.change_history.length} of {data.change_history_total}{data.change_history_total > data.change_history.length ? `, limit ${data.change_history_limit}` : ''})</span></h4>
                <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e1e8ed', borderRadius: 4 }}>
                  <table className="kv-table" style={{ margin: 0 }}><tbody>
                    {data.change_history.map((h, idx) => (
                      <tr key={h.id || idx}>
                        <td className="kv-key" style={{ width: 80 }}>#{idx+1}</td>
                        <td className="kv-val">
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: 12 }}>
                            <span><strong>Page:</strong> Listing</span>
                            <span><strong>Function:</strong> {h.action}</span>
                            <span><strong>At:</strong> {h.created_at ? new Date(h.created_at).toLocaleString() : 'n/a'}</span>
                            {Array.isArray(h.changed_fields) && h.changed_fields.length > 0 && (
                              <span><strong>Fields:</strong> {h.changed_fields.join(', ')}</span>
                            )}
                          </div>
                          {(h.action === 'update' && h.before_data && h.after_data) && (
                            <details style={{ marginTop: 4 }}>
                              <summary style={{ cursor: 'pointer' }}>Value Changes</summary>
                              <pre style={{ fontSize: 11, background: '#f6f8fa', padding: 6, maxHeight: 240, overflow: 'auto' }}>{JSON.stringify(diffChanges(h.before_data, h.after_data, h.changed_fields), null, 2)}</pre>
                            </details>
                          )}
                          {(h.action === 'create' && h.after_data) && (
                            <details style={{ marginTop: 4 }}>
                              <summary style={{ cursor: 'pointer' }}>Created Values</summary>
                              <pre style={{ fontSize: 11, background: '#f6f8fa', padding: 6, maxHeight: 240, overflow: 'auto' }}>{JSON.stringify(pickFields(h.after_data, h.changed_fields), null, 2)}</pre>
                            </details>
                          )}
                          {(h.action === 'delete' && h.before_data) && (
                            <details style={{ marginTop: 4 }}>
                              <summary style={{ cursor: 'pointer' }}>Deleted Values</summary>
                              <pre style={{ fontSize: 11, background: '#f6f8fa', padding: 6, maxHeight: 240, overflow: 'auto' }}>{JSON.stringify(pickFields(h.before_data, h.changed_fields), null, 2)}</pre>
                            </details>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody></table>
                </div>
                {data.change_history_total > (historyOffset + data.change_history.length) && (
                  <div style={{ marginTop: 8 }}>
                    <button disabled={historyLoading} onClick={async () => {
                      if (!listing?.listing_id) { return; }
                      setHistoryLoading(true);
                      try {
                        const nextOffset = historyOffset + data.change_history.length;
                        const resp = await apiService.getListingDetails(listing.listing_id, { history_offset: nextOffset, history_limit: data.change_history_effective_limit || data.change_history_limit });
                        // Append new slice (avoid duplicates by id)
                        const existingIds = new Set((data.change_history || []).map(r => r.id));
                        const merged = [...data.change_history];
                        (resp.change_history || []).forEach(r => { if (!existingIds.has(r.id)) { merged.push(r); } });
                        setData({ ...data, change_history: merged });
                        setHistoryOffset(nextOffset);
                      } catch (_) { /* ignore */ }
                      setHistoryLoading(false);
                    }}>{historyLoading ? 'Loading…' : 'Load More'}</button>
                  </div>
                )}
              </div>
            )}

            {(data.sales || []).length > 0 && (
              <div className="group">
                <h4 style={{ margin: '6px 0' }}>Sales Details</h4>
                {(data.sales || []).map((s, idx) => {
                  const fin = (data.financialtracking || []).filter(f => f.sale_id === s.sale_id);
                  const ship = (data.shippinglog || []);
                  const order = (data.order_details || []);
                  const ret = (data.returnhistory || []);
                  return (
                    <div key={s.sale_id || idx} style={{ marginBottom: 12 }}>
                      <Section
                        title={`Sale ${s.sale_id ? `#${s.sale_id}` : `#${idx+1}`}`}
                        rows={entriesFromObj(s, ['sold_price','sold_date','sold_shipping_collected','taxes','sales_channel','customer_feedback','negotiated_terms','negotiated_terms_calculation'])}
                      />
                      {fin.length > 0 && (
                        <Section
                          title="Financial Summary"
                          rows={entriesFromObj(fin[0], ['sold_total','taxes_collected','actual_shipping_costs','net_proceeds_calculation','customer_payout','our_profit'])}
                        />
                      )}
                      {idx === 0 && ship.length > 0 && (
                        <Section
                          title="Shipping"
                          rows={entriesFromObj(ship[0], ['shipping_collected','shipping_label_costs','additional_shipping_costs_material','shipping_total'])}
                        />
                      )}
                      {idx === 0 && order.length > 0 && (
                        <Section
                          title="Order"
                          rows={entriesFromObj(order[0], ['purchase_date','date_shipped','date_received','date_out_of_warranty','purchase_method','shipping_preferences'])}
                        />
                      )}
                      {idx === 0 && ret.length > 0 && (
                        <Section
                          title="Return"
                          rows={entriesFromObj(ret[0], ['return_reasoning','return_request_date','return_approved_date','return_received_date','return_decision_notes'])}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <style>{`
            .kv-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            .kv-table td { border-bottom: 1px solid #eee; padding: 6px 8px; vertical-align: top; }
            .kv-key { width: 240px; font-weight: 600; color: #334e68; background: #f9fbfd; }
            .details-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
            .details-grid .group { grid-column: span 2; }
          `}</style>
        </div>
      );
    };
    return <Details/>;
  };

  // Provide status options to generic filter row once loaded
  const filterConfig = React.useMemo(() => ({
    Title: { type: 'text', placeholder: 'title contains' },
    'Listing Price': { type: 'text', placeholder: 'price' },
    Status: workflowLoaded ? {
      type: 'select',
      options: statusOptions.map(s => ({ value: s, label: s })),
      allowAll: true,
      allowAllValue: ALL_VALUE,
      allowAllLabel: 'ALL'
    } : undefined,
  'Item ID': { type: 'text', placeholder: 'item id' },
  'Created': { type: 'text', placeholder: 'date' }
  }), [workflowLoaded, statusOptions]);

  // Determine initial default filters (only applied if no persisted state yet)
  const initialFiltersRef = React.useRef(null);
  if (initialFiltersRef.current === null) {
    try {
      const existing = JSON.parse(window.localStorage.getItem('tableState:listings')||'{}');
      if (existing && existing.filters && Object.keys(existing.filters).length > 0) {
        initialFiltersRef.current = existing.filters; // respect existing
      } else {
        // set default status if workflow provided one
        // We'll read default from statusOptions presence (workflowLoaded) but we captured it earlier as 'def' variable; replicate logic
        // Simpler: attempt to parse workflow default from a cached key if stored by backend (not stored), fallback 'draft'
        initialFiltersRef.current = { Status: 'draft' };
      }
    } catch(_) {
      initialFiltersRef.current = { Status: 'draft' };
    }
  }

  return (
    <ListWithDetails
      title="eBay Listings"
      fetchList={fetchList}
      columns={columns}
      rowRenderer={rowRenderer}
      detailsRenderer={detailsRenderer}
      pageKey="listings"
      filterConfig={filterConfig}
      initialFilters={initialFiltersRef.current || {}}
    />
  );
};

export default ListingTable;
