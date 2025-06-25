import React, { useEffect, useState } from 'react';
import apiService from '../services/apiService';
import SystemMessage from './SystemMessage';
import Page from './Page';

const ItemTable = () => {
    const [items, setItems] = useState([]);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('info');

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await apiService.getItems();
                setItems(response.items || response); // handle both {items:[]} and []
                if ((response.items && response.items.length === 0) || (Array.isArray(response) && response.length === 0)) {
                    setMessage('No items available');
                    setMessageType('info');
                } else {
                    setMessage(null); // clear any previous error or info
                }
            } catch (error) {
                setMessage('Error fetching items. Please try again later.');
                setMessageType('error');
                setItems([]);
            }
        };
        fetchItems();
    }, []);

    return (
        <Page title="Item List">
            <SystemMessage message={message} type={messageType} onClose={() => setMessage(null)} />
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>SKU/Barcode</th>
                        <th>Price</th>
                        <th>Category</th>
                        <th>Manufacturer</th>
                        <th>Model</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length > 0 ? (
                        items.map(item => (
                            <tr key={item.id || item._id}>
                                <td>{item.name}</td>
                                <td>{item.sku_barcode}</td>
                                <td>{item.price}</td>
                                <td>{item.category}</td>
                                <td>{item.manufacturer}</td>
                                <td>{item.model}</td>
                            </tr>
                        ))
                    ) : null}
                </tbody>
            </table>
        </Page>
    );
};

export default ItemTable;
