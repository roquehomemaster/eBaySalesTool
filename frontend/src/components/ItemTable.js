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

    const detailsRenderer = (entry) => (
        <div>
            <h3>{entry.description}</h3>
            <p><strong>Manufacturer:</strong> {entry.manufacturer}</p>
            <p><strong>Model:</strong> {entry.model}</p>
            <p><strong>SKU/Barcode:</strong> {entry.sku_barcode}</p>
            {entry.category && <p><strong>Category:</strong> {entry.category}</p>}
        </div>
    );

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
