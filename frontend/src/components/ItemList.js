import { useEffect, useState } from 'react';
import axios from 'axios';

// Reminder: Since this project is running in Docker, any changes to npm dependencies or the build process require rebuilding the Docker containers.
// This includes running `docker-compose down && docker-compose up --build` to apply changes.

const ItemList = () => {
    const [items, setItems] = useState([]);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await axios.get('http://backend:5000/api/items');
                if (response.data.length === 0) {
                    console.warn('No items found. Displaying empty table headers.');
                }
                setItems(response.data);
            } catch (error) {
                console.error('Error fetching items:', error);
                setItems([]); // Ensure the page loads with empty data
            }
        };

        fetchItems();
    }, []);

    return (
        <div>
            <h1>Item List</h1>
            <ul>
                {items.map((item) => (
                    <li key={item._id}>{item.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default ItemList;