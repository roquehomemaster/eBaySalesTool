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
    // Fetch aggregated details on-demand per selected listing
    // Simple client component below to display grouped data
    const Details = () => {
      const [data, setData] = React.useState(null);
      const [error, setError] = React.useState(null);
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
            {(rows || Object.entries(obj || {})).map(([k, v]) => (
              <tr key={k}><td className="kv-key">{String(k)}</td><td className="kv-val">{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '-')}</td></tr>
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
          <Section title="Listing" obj={data.listing} />
          <Section title="Catalog Item" obj={data.catalog} />
          <Section title="Shipping Log" rows={(data.shippinglog||[]).flatMap((r, i) => Object.entries(r).map(([k,v]) => [[`${i+1}.${k}`, v]] )).flat()} />
          <Section title="Order Details" rows={(data.order_details||[]).flatMap((r, i) => Object.entries(r).map(([k,v]) => [[`${i+1}.${k}`, v]] )).flat()} />
          <Section title="Financial Tracking" rows={(data.financialtracking||[]).flatMap((r, i) => Object.entries(r).map(([k,v]) => [[`${i+1}.${k}`, v]] )).flat()} />
          <Section title="Returns" rows={(data.returnhistory||[]).flatMap((r, i) => Object.entries(r).map(([k,v]) => [[`${i+1}.${k}`, v]] )).flat()} />
          <Section title="Performance Metrics" obj={data.performancemetrics} />
          <div style={{ marginTop: 12 }}>
            <h4 style={{ margin: '6px 0' }}>Sales and Ownership</h4>
            {(data.sales || []).map((s, idx) => (
              <div key={s.sale_id || idx} style={{ marginBottom: 10 }}>
                <Section title={`Sale #${s.sale_id || idx+1}`} obj={s} />
                {/* Ownership for this sale if ownership_id present */}
                {s.ownership_id && (
                  <Section
                    title={`Ownership (ID ${s.ownership_id})`}
                    obj={(data.ownerships || []).find(o => o.ownership_id === s.ownership_id) || {}}
                  />
                )}
                {s.ownership_id && (
                  <Section
                    title={`Ownership Agreement(s)`}
                    rows={(data.ownershipagreements || []).filter(a => a.ownership_id === s.ownership_id)
                      .flatMap((r, i) => Object.entries(r).map(([k,v]) => [[`${i+1}.${k}`, v]] )).flat()}
                  />
                )}
              </div>
            ))}
          </div>
          <style>{`
            .kv-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            .kv-table td { border-bottom: 1px solid #eee; padding: 6px 8px; vertical-align: top; }
            .kv-key { width: 240px; font-weight: 600; color: #334e68; background: #f9fbfd; }
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
