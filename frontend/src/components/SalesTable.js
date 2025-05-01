import React, { useEffect, useState } from 'react';
import apiService from '../services/apiService';

const SalesTable = () => {
    const [sales, setSales] = useState([]);

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const response = await apiService.getSales();
                setSales(response.data);
            } catch (error) {
                console.error('Error fetching sales data:', error);
            }
        };

        fetchSales();
    }, []);

    const handleDelete = async (id) => {
        try {
            await apiService.deleteSale(id);
            setSales(sales.filter(sale => sale.id !== id));
        } catch (error) {
            console.error('Error deleting sale:', error);
        }
    };

    return (
        <div>
            <h2>Sales Table</h2>
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Price</th>
                        <th>Sold Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.length > 0 ? (
                        sales.map(sale => (
                            <tr key={sale.id}>
                                <td>{sale.item}</td>
                                <td>{sale.price}</td>
                                <td>{new Date(sale.soldDate).toLocaleDateString()}</td>
                                <td>
                                    <button onClick={() => handleDelete(sale.id)}>Delete</button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" style={{ textAlign: 'center' }}>No sales data available</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default SalesTable;