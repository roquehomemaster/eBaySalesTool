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

  const detailsRenderer = (listing) => {
    const Details = () => {
      const [data, setData] = React.useState(null);
      const [error, setError] = React.useState(null);

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
        })();
        return () => { active = false; };
      }, [listing.listing_id]);

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
      if (!data) {
        return <div className="system-message info">Loading details…</div>;
      }

      return (
        <div>
          <h3>Listing Details</h3>
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
