import React from 'react';
import ListWithDetails from './ListWithDetails';
import apiService from '../services/apiService';

const ListingTable = () => {
  const fetchList = async () => {
    const response = await apiService.getListings();
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

  const columns = ['Title', 'Listing Price', 'Status', 'Item ID', 'Created At', 'Updated At'];
  const rowRenderer = (listing) => (
    <>
      <td>{listing.title}</td>
      <td>{listing.listing_price}</td>
      <td>{listing.status}</td>
      <td>{listing.item_id}</td>
      <td>{listing.created_at ? new Date(listing.created_at).toLocaleString() : ''}</td>
      <td>{listing.updated_at ? new Date(listing.updated_at).toLocaleString() : ''}</td>
    </>
  );

  const detailsRenderer = (listing, helpers) => {
    const Details = () => {
      const [data, setData] = React.useState(null);
      const [error, setError] = React.useState(null);
      const [createMode, setCreateMode] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', listing_price: '', item_id: '', ownership_id: '' });
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
      const entriesFromObj = (obj, keysOrder) => {
        if (!obj) {
          return [];
        }
        const entries = keysOrder && keysOrder.length
          ? keysOrder.filter(k => obj[k] !== undefined && !omit.has(k)).map(k => [k, obj[k]])
          : Object.entries(obj).filter(([k]) => !omit.has(k));
        return entries.map(([k, v]) => [prettify(k), fmtVal(k, v)]);
      };

      React.useEffect(() => {
        let active = true;
        (async () => {
          // Load default read-only details for selected listing
          if (!createMode && listing?.listing_id) {
            try {
              const resp = await apiService.getListingDetails(listing.listing_id);
              if (active) {
                setData(resp);
              }
            } catch (e) {
              if (active) {
                setError('Failed to load details');
              }
            }
          }
        })();
        return () => { active = false; };
      }, [listing.listing_id, createMode]);

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
  setForm({ title: '', listing_price: '', item_id: '', ownership_id: '' });
      };
      const cancelCreate = () => {
        setCreateMode(false);
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
            status: 'draft'
          };
          const created = await apiService.createListing(payload);
          // Refresh list and select the newly created listing
          await helpers?.refreshList?.((it) => (it.listing_id && created?.listing_id) ? it.listing_id === created.listing_id : (it.title === payload.title && it.item_id === payload.item_id));
          setCreateMode(false);
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
      // Header with Add button
      const Header = () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Listing Details</h3>
          {!createMode && (
            <button onClick={startCreate} style={{ padding: '6px 10px' }}>Add</button>
          )}
        </div>
      );

      if (createMode) {
        return (
          <div>
            <Header />
            <div className="details-grid">
              <div className="group">
                <h4 style={{ margin: '6px 0' }}>eBay Listing</h4>
                <div className="form-row"><label>* Title</label><input name="title" value={form.title} onChange={onChange} /></div>
                <div className="form-row"><label>* Listing Price</label><input name="listing_price" type="number" step="0.01" value={form.listing_price} onChange={onChange} /></div>
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
                      <option key={c.item_id} value={c.item_id}>{c.description} ({c.manufacturer} {c.model})</option>
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
                      <option key={o.ownership_id} value={o.ownership_id}>{`${o.first_name || ''} ${o.last_name || ''}`.trim() || o.email || `Owner ${o.ownership_id}`}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {error && <div className="system-message error" style={{ marginTop: 12 }}>{error}</div>}
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button onClick={save} disabled={!canSave()}>{saving ? 'Saving…' : 'Save'}</button>
              <button onClick={cancelCreate} disabled={saving}>Cancel</button>
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
                rows={entriesFromObj(data.listing, ['title','status','listing_price','payment_method','shipping_method','watchers','item_condition_description'])}
              />
            </div>
            <div className="group">
              <Section
                title="Product Details"
                rows={entriesFromObj(data.catalog, ['manufacturer','model','description','serial_number','sku_barcode'])}
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

  return (
    <ListWithDetails
      title="eBay Listings"
      fetchList={fetchList}
      columns={columns}
      rowRenderer={rowRenderer}
  detailsRenderer={detailsRenderer}
      pageKey="listings"
    />
  );
};

export default ListingTable;
