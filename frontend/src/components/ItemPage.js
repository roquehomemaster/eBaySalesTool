import React, { useState, useEffect } from 'react';
import './ItemPage.css';

const ItemPage = () => {
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        // Fetch items from the API
        const fetchItems = async () => {
            try {
                const response = await fetch('/api/items');
                console.log('API Response Status:', response.status); // Debugging log
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log('Fetched items:', data); // Debugging log
                setItems(data);
            } catch (error) {
                console.error('Error fetching items:', error);
            }
        };

        fetchItems();
    }, []);

    // Debugging log to confirm rendering
    console.log('Rendering items:', items);

    const handleItemClick = (item) => {
        setSelectedItem(item);
    };

    return (
        <div className="item-page">
            <header className="item-page-header">
                <h1>Item Details</h1>
                <nav>
                    <a href="/">Home</a>
                    <a href="/items">Items</a>
                    <a href="/sales">Sales</a>
                    <a href="/reports">Reports</a>
                </nav>
            </header>

            <div className="item-page-content">
                <section className="item-list">
                    <h2>Items</h2>
                    {items.length > 0 ? (
                        <ul>
                            {items.map((item) => (
                                <li key={item.item_id} onClick={() => handleItemClick(item)}>
                                    {item.description}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No items available.</p>
                    )}
                </section>

                <section className="item-details">
                    {selectedItem ? (
                        <div>
                            <h2>{selectedItem.description}</h2>
                            <p><strong>Manufacturer:</strong> {selectedItem.manufacturer_info}</p>
                            <p><strong>Size:</strong> {selectedItem.size}</p>
                            <p><strong>Weight:</strong> {selectedItem.weight}</p>
                            <p><strong>Condition:</strong> {selectedItem.item_condition}</p>
                            <p><strong>Category:</strong> {selectedItem.category}</p>
                            <p><strong>SKU/Barcode:</strong> {selectedItem.sku_barcode}</p>
                            <button>Save Changes</button>
                            <button>Delete Item</button>
                            <button>Generate Listing</button>
                        </div>
                    ) : (
                        <p>Select an item to view details</p>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ItemPage;