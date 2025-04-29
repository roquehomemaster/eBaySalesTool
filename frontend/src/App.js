import { BrowserRouter } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import ItemList from './components/ItemList';

function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="App">
                <Routes>
                    <Route path="/" element={<ItemList />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;