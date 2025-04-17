import React, { useState } from 'react';

const SalesForm = ({ onSubmit }) => {
    const [item, setItem] = useState('');
    const [price, setPrice] = useState('');
    const [soldDate, setSoldDate] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const saleData = { item, price, soldDate };
        onSubmit(saleData);
        setItem('');
        setPrice('');
        setSoldDate('');
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="item">Item:</label>
                <input
                    type="text"
                    id="item"
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="price">Price:</label>
                <input
                    type="number"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="soldDate">Sold Date:</label>
                <input
                    type="date"
                    id="soldDate"
                    value={soldDate}
                    onChange={(e) => setSoldDate(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Submit Sale</button>
        </form>
    );
};

export default SalesForm;