import React from 'react';
import ListWithDetails from './ListWithDetails';
import apiService from '../services/apiService';

const CatalogTable = () => {
    const fetchList = async () => {
        const response = await apiService.getCatalog();
        if (Array.isArray(response)) {
            return response;
        }
        if (response && Array.isArray(response.catalog)) {
            return response.catalog;
        }
        if (response && response.data && Array.isArray(response.data.catalog)) {
            return response.data.catalog;
        }
        return [];
    };

    const columns = ['Description', 'SKU/Barcode', 'Category', 'Manufacturer', 'Model'];
    const rowRenderer = (entry) => (
        <>
            <td>{entry.description}</td>
            <td>{entry.sku_barcode}</td>
            <td>{entry.category || ''}</td>
            <td>{entry.manufacturer}</td>
            <td>{entry.model}</td>
        </>
    );

    const detailsRenderer = (entry) => {
        const Details = () => {
            const [relatedListings, setRelatedListings] = React.useState([]);
            const [error, setError] = React.useState(null);

            // Helpers (consistent with Listings page)
            const prettify = (k) => (k || '').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
            const omit = new Set(['id','created_at','updated_at']);
            const entriesFromObj = (obj, keysOrder) => {
                if (!obj) {
                    return [];
                }
                const entries = keysOrder && keysOrder.length
                    ? keysOrder.filter(k => obj[k] !== undefined && !omit.has(k)).map(k => [k, obj[k]])
                    : Object.entries(obj).filter(([k]) => !omit.has(k));
                return entries.map(([k, v]) => [prettify(k), v == null ? '-' : String(v)]);
            };

            const itemId = entry.item_id; // derive to satisfy exhaustive-deps without warning
            React.useEffect(() => {
                let active = true;
                (async () => {
                    try {
                        const resp = await apiService.getListings({ item_id: itemId, page: 1, limit: 50 });
                        const listings = Array.isArray(resp)
                            ? resp
                            : (resp?.listings || resp?.data?.listings || []);
                        if (active) {
                            setRelatedListings(listings);
                        }
                    } catch (e) {
                        if (active) {
                            setError('Failed to load related listings');
                        }
                    }
                })();
                return () => { active = false; };
            }, [itemId]); // itemId is stable primitive

            const Section = ({ title, rows }) => (
                <div style={{ marginTop: 12 }}>
                    <h4 style={{ margin: '6px 0' }}>{title}</h4>
                    <table className="kv-table"><tbody>
                        {(rows || []).map(([k, v]) => (
                            <tr key={k}><td className="kv-key">{String(k)}</td><td className="kv-val">{String(v)}</td></tr>
                        ))}
                    </tbody></table>
                </div>
            );

            return (
                <div>
                    <h3>Catalog Details</h3>
                    <div className="details-grid">
                        <div className="group">
                            <Section
                                title="Product Details"
                                rows={entriesFromObj(entry, ['description','manufacturer','model','serial_number','sku_barcode','category'])}
                            />
                        </div>

                        <div className="group">
                            <h4 style={{ margin: '6px 0' }}>Related Listings</h4>
                            {error && <div className="system-message error">{error}</div>}
                            {!error && relatedListings.length === 0 && (
                                <div className="system-message info">No related listings found.</div>
                            )}
                            {!error && relatedListings.length > 0 && (
                                <table className="kv-table">
                                    <thead>
                                        <tr>
                                            <td className="kv-key">Title</td>
                                            <td className="kv-key">Price</td>
                                            <td className="kv-key">Status</td>
                                            <td className="kv-key">Listing ID</td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {relatedListings.map(l => (
                                            <tr key={l.listing_id}>
                                                <td>{l.title}</td>
                                                <td>{l.listing_price}</td>
                                                <td>{l.status}</td>
                                                <td>{l.listing_id}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
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
            title="Catalog List"
            fetchList={fetchList}
            columns={columns}
            rowRenderer={rowRenderer}
            detailsRenderer={detailsRenderer}
            pageKey="catalog"
        />
    );
};

export default CatalogTable;
