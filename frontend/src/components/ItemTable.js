import React, { useEffect, useState } from 'react';
import apiService from '../services/apiService';
import SystemMessage from './SystemMessage';
import Page from './Page';

const CatalogTable = () => {
    const [catalog, setCatalog] = useState([]);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('info');

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                const response = await apiService.getCatalog();
                // Accepts: { catalog: [...] }, [...], or { ...paginated, catalog: [...] }
                let entries = [];
                if (Array.isArray(response)) {
                    entries = response;
                } else if (response && Array.isArray(response.catalog)) {
                    entries = response.catalog;
                } else if (response && response.data && Array.isArray(response.data.catalog)) {
                    entries = response.data.catalog;
                }
                setCatalog(entries);
                if (!entries.length) {
                    setMessage('No catalog entries available');
                    setMessageType('info');
                } else {
                    setMessage(null);
                }
            } catch (error) {
                setMessage('Error fetching catalog. Please try again later.');
                setMessageType('error');
                setCatalog([]);
            }
        };
        fetchCatalog();
    }, []);

    return (
        <Page title="Catalog List">
            <SystemMessage message={message} type={messageType} onClose={() => setMessage(null)} />
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>SKU/Barcode</th>
                        <th>Category</th>
                        <th>Manufacturer</th>
                        <th>Model</th>
                    </tr>
                </thead>
                <tbody>
                    {catalog.length > 0 ? (
                        catalog.map(entry => (
                            <tr key={entry.id || entry._id}>
                                <td>{entry.description}</td>
                                <td>{entry.sku_barcode}</td>
                                <td>{entry.category || ''}</td>
                                <td>{entry.manufacturer}</td>
                                <td>{entry.model}</td>
                            </tr>
                        ))
                    ) : null}
                </tbody>
            </table>
        </Page>
    );
};

export default CatalogTable;
