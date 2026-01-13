import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; 

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";



const AddDrugModal = ({ token, fetchDrugs, closeModal }) => {
    const [newDrug, setNewDrug] = useState({ name: '', dosage: '', quantity: '', price: '', brand: '', location: '' });
    const [message, setMessage] = useState('');
    const API_URL = 'http://localhost:5000/api/drugs';

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewDrug({ ...newDrug, [name]: value });
    };

    const handleAddDrug = async (e) => {
        e.preventDefault();
        setMessage('');

        const drugData = {
            ...newDrug,
            quantity: parseInt(newDrug.quantity),
            price: parseFloat(newDrug.price),
        };

        if (!drugData.name || isNaN(drugData.quantity) || drugData.quantity <= 0 || isNaN(drugData.price) || drugData.price <= 0) {
            setMessage('Error: Please fill required fields correctly (Quantity/Price must be positive numbers).');
            return;
        }

        try {
            const response = await axios.post(API_URL, drugData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setMessage(`Success: ${response.data.name} added to inventory.`);
            setNewDrug({ name: '', dosage: '', quantity: '', price: '', brand: '', location: '' });
            fetchDrugs();
            setTimeout(closeModal, 1500); 

        } catch (error) {
            console.error('Add Drug Error:', error);
            setMessage(`Error: ${error.response?.data?.message || 'Failed to add drug.'}`);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <span className="close-button" onClick={closeModal}>&times;</span>
                <h3>Add New Drug to Inventory</h3>
                <form onSubmit={handleAddDrug} className="form-grid">
                    <input name="name" type="text" value={newDrug.name} onChange={handleInputChange} placeholder="Drug Name" className="form-control" required />
                    <input name="dosage" type="text" value={newDrug.dosage} onChange={handleInputChange} placeholder="Dosage (e.g., 500mg)" className="form-control" required />
                    <input name="quantity" type="number" min="1" value={newDrug.quantity} onChange={handleInputChange} placeholder="Quantity" className="form-control" required />
                    <input name="price" type="number" step="0.01" min="0.01" value={newDrug.price} onChange={handleInputChange} placeholder="Price (Rs.)" className="form-control" required />
                    <input name="brand" type="text" value={newDrug.brand} onChange={handleInputChange} placeholder="Brand/Manufacturer (Optional)" className="form-control" />
                    <input name="location" type="text" value={newDrug.location} onChange={handleInputChange} placeholder="Shelf/Location (Optional)" className="form-control" />
                    
                    <div className="form-actions">
                        <button type="submit" className="btn btn-success">Add Drug</button>
                        <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                    </div>
                </form>
                {message && <p className={message.startsWith('Success') ? 'message-success' : 'message-error'}>{message}</p>}
            </div>
        </div>
    );
};

const Login = ({ handleLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                username,
                password,
            });
            handleLogin(response);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid username or password');
        }
    };

    return (
        <div className="login-container">
            <h2>System Login</h2>
            <form onSubmit={handleSubmit} className="login-form">
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username (admin or cashier)" className="form-control" required />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (123456)" className="form-control" required />
                <button type="submit" className="btn btn-primary">Login</button>
                {error && <p className="message-error">{error}</p>}
            </form>
        </div>
    );
};

const RegisterUser = ({ token }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('cashier');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', 
                { username, password, role },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(`Success: ${response.data.message}`);
            setUsername('');
            setPassword('');
        } catch (err) {
            setMessage(`Error: ${err.response?.data?.message || 'Registration failed'}`);
        }
    };

    return (
        <div className="card register-card">
            <h4>Create New User/Admin Account</h4>
            <form onSubmit={handleSubmit} className="register-form">
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="form-control" required />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="form-control" required />
                <select value={role} onChange={(e) => setRole(e.target.value)} className="form-control">
                    <option value="cashier">Cashier</option>
                    <option value="admin">Admin</option>
                </select>
                <button type="submit" className="btn btn-warning">Register</button>
            </form>
            {message && <p className={message.startsWith('Success') ? 'message-success' : 'message-error'}>{message}</p>}
        </div>
    );
};

const ActivityLogViewer = ({ token }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/admin/logs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(response.data);
        } catch (error) {
            console.error('Error fetching logs:', error);
            alert('Could not fetch activity logs.');
        } finally {
            setLoading(false);
        }
    };
const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("User Activity History (Audit Trail)", 14, 15);

    autoTable(doc, {
        head: [["Time", "User", "Action Type", "Details"]],
        body: logs.map(log => [
            new Date(log.timestamp).toLocaleString(),
            log.username,
            log.action_type,
            log.details
        ]),
        startY: 25,
        styles: { fontSize: 9 }
    });

    doc.save("user-activity-audit-trail.pdf");
};


    useEffect(() => {
        fetchLogs();
    }, [token]);

    return (
        <div className="card log-viewer-card">
            <h4>User Activity History (Audit Trail)</h4>
            <button onClick={fetchLogs} disabled={loading} className="btn btn-secondary btn-sm">
                {loading ? 'Loading...' : 'Refresh Logs'}
            </button>
             <button
        onClick={generatePDF}
        disabled={logs.length === 0}
        className="btn btn-primary btn-sm ms-2"
    >
        Generate PDF
    </button>
            <div className="table-responsive">
                <table className="data-table">
                    <thead>
                        <tr><th>Time</th><th>User</th><th>Action Type</th><th>Details</th></tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr><td colSpan="4" className="text-center">No recent activity found.</td></tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id}>
                                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                                    <td>{log.username}</td>
                                    <td><span className={`log-type log-type-${log.action_type.toLowerCase().replace(/_/g, '-')}`}>{log.action_type}</span></td>
                                    <td>{log.details}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdminPanel = ({ drugs, fetchDrugs, token, username }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editDrug, setEditDrug] = useState(null);
//update
const EditDrugModal = ({ token, drug, fetchDrugs, closeModal }) => {
    const [formData, setFormData] = useState({ ...drug });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(
                `http://localhost:5000/api/drugs/${drug.id}`,
                {
                    ...formData,
                    quantity: parseInt(formData.quantity),
                    price: parseFloat(formData.price)
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage("Drug updated successfully.");
            fetchDrugs();
            setTimeout(closeModal, 1000);
        } catch (error) {
            console.error("Update error:", error);
            setMessage(error.response?.data?.message || "Update failed.");
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <span className="close-button" onClick={closeModal}>&times;</span>
                <h3>Edit Drug</h3>

                <form onSubmit={handleUpdate} className="form-grid">
                    <input name="name" value={formData.name} onChange={handleChange} className="form-control" />
                    <input name="dosage" value={formData.dosage} onChange={handleChange} className="form-control" />
                    <input name="quantity" type="number" value={formData.quantity} onChange={handleChange} className="form-control" />
                    <input name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} className="form-control" />
                    <input name="brand" value={formData.brand} onChange={handleChange} className="form-control" />
                    <input name="location" value={formData.location} onChange={handleChange} className="form-control" />

                    <div className="form-actions">
                        <button type="submit" className="btn btn-success">Update</button>
                        <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                    </div>
                </form>

                {message && <p className="message-success">{message}</p>}
            </div>
        </div>
    );
};


    //delete
const handleDeleteDrug = async (id) => {
    if (!window.confirm("Are you sure you want to delete this drug?")) return;

    try {
        await axios.delete(`http://localhost:5000/api/drugs/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        alert("Drug deleted successfully.");
        fetchDrugs(); // refresh inventory
    } catch (error) {
        console.error("Delete error:", error);
        alert(error.response?.data?.message || "Failed to delete drug.");
    }
};

    
    return (
        <div className="panel admin-panel">
            <header className="panel-header">
                <h3>Admin Dashboard (Full Access)</h3>
                <p>Welcome, <strong>{username}</strong>. You have full control (Add, Edit, Delete, View, Sell, Manage Users, Audit Logs).</p>
            </header>
            
            <div className="admin-content-grid">
                <RegisterUser token={token} /> 

                <div className="card inventory-card">
                    <h4>Inventory Management (Stock Update)</h4>
                    <div className="inventory-controls">
                        <button onClick={fetchDrugs} className="btn btn-info">Refresh Drug Inventory</button>
                        <button 
                            onClick={() => setIsAddModalOpen(true)} 
                            className="btn btn-primary"
                        >
                            <i className="fas fa-plus"></i> Add New Drug
                        </button>
                    </div>
                    
                    <h4 className="section-title">Current Inventory</h4>
                    {drugs.length === 0 ? (
                        <p className="text-center">No drugs found. Click 'Add New Drug' to add stock.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr><th>ID</th><th>Name</th><th>Quantity</th><th>Price</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {drugs.map(drug => (
                                        <tr key={drug.id}>
                                            <td>{drug.id}</td>
                                            <td>{drug.name}</td>
                                            <td>{drug.quantity}</td>
                                            <td>Rs. {parseFloat(drug.price).toFixed(2)}</td>
                                            <td>
<button 
    onClick={() => setEditDrug(drug)} 
    className="btn btn-warning btn-sm"
>
    Edit
</button>
                                                <button 
                                                    onClick={() => handleDeleteDrug(drug.id)} 
                                                    className="btn btn-danger btn-sm"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            
            <ActivityLogViewer token={token} />

            {isAddModalOpen && (
                <AddDrugModal 
                    token={token} 
                    fetchDrugs={fetchDrugs} 
                    closeModal={() => setIsAddModalOpen(false)} 
                />
            )}
             {editDrug && (
            <EditDrugModal
                token={token}
                drug={editDrug}
                fetchDrugs={fetchDrugs}
                closeModal={() => setEditDrug(null)}
            />
        )}
        </div>
    );
};

const CashierPanel = ({ drugs, fetchDrugs, handleSale, username, token }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [quickSellId, setQuickSellId] = useState('');
    const [quickSellQuantity, setQuickSellQuantity] = useState('');
    const [quickSellMessage, setQuickSellMessage] = useState('');

    const filteredDrugs = drugs.filter(drug => 
        drug.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        String(drug.id).includes(searchTerm)
    );

    const handleQuickSellById = async (e) => {
        e.preventDefault();
        setQuickSellMessage('');

        const id = parseInt(quickSellId);
        const quantity = parseInt(quickSellQuantity);
        
        if (isNaN(id) || isNaN(quantity) || quantity <= 0) {
            setQuickSellMessage('Error: Please enter valid Drug ID and positive Quantity.');
            return;
        }

        const drug = drugs.find(d => d.id === id);

        if (!drug) {
            setQuickSellMessage(`Error: Drug ID ${id} not found.`);
            return;
        }
        
        if (drug.quantity === 0) {
            setQuickSellMessage(`Error: ${drug.name} is out of stock.`);
            return;
        }
        
        if (quantity > drug.quantity) {
            setQuickSellMessage(`Error: Quantity (${quantity}) exceeds current stock (${drug.quantity}).`);
            return;
        }

        await handleSale(id, quantity);
        setQuickSellMessage(`Success: Sold ${quantity} units of ${drug.name}.`);
        setQuickSellId('');
        setQuickSellQuantity('');
        
        setTimeout(() => setQuickSellMessage(''), 3000);
    };


    return (
        <div className="panel cashier-panel">
            <header className="panel-header">
                <h3>Cashier Dashboard (Limited Access)</h3>
                <p>Welcome, <strong>{username}</strong>. You can View and Sell drugs.</p>
            </header>
            
            <div className="card cashier-controls-card">
                
                <form onSubmit={handleQuickSellById} className="quick-sell-form">
                    <h4>Quick Sell Action:</h4>
                    <input 
                        type="number"
                        placeholder="Drug ID"
                        value={quickSellId}
                        onChange={(e) => setQuickSellId(e.target.value)}
                        className="form-control form-control-sm"
                        min="1"
                        required
                    />
                    <input 
                        type="number"
                        placeholder="Quantity"
                        value={quickSellQuantity}
                        onChange={(e) => setQuickSellQuantity(e.target.value)}
                        className="form-control form-control-sm"
                        min="1"
                        required
                    />
                    <button type="submit" className="btn btn-warning btn-sm">Process Sale</button>
                </form>
                {quickSellMessage && <p className={quickSellMessage.startsWith('Success') ? 'message-success-small' : 'message-error-small'}>{quickSellMessage}</p>}
                
                <div className="inventory-controls search-bar-container" style={{ marginTop: '20px' }}>
                    <input 
                        type="text"
                        placeholder="Search by Name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-control search-input"
                    />
                    <button onClick={fetchDrugs} className="btn btn-info btn-refresh">Refresh Inventory</button>
                </div>

                <h4 className="section-title">Current Inventory (Sales View)</h4>
                
                {filteredDrugs.length === 0 && searchTerm !== '' ? (
                    <p className="text-center">No drugs found matching "{searchTerm}".</p>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDrugs.map(drug => (
                                    <tr key={drug.id} className={drug.quantity < 10 ? 'low-stock-row' : ''}>
                                        <td>{drug.id}</td>
                                        <td>{drug.name}</td>
                                        <td>
                                            {drug.quantity}
                                            {drug.quantity < 10 && <span className="stock-warning"> (Low Stock)</span>}
                                        </td>
                                        <td>Rs. {parseFloat(drug.price).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

function App() {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [role, setRole] = useState(localStorage.getItem('role') || null);
    const [username, setUsername] = useState(localStorage.getItem('username') || null);
    const [drugs, setDrugs] = useState([]);
    const [loading, setLoading] = useState(false);
    const API_URL = 'http://localhost:5000/api/drugs';

    const handleLogin = (response) => {
        const { token, role, username } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('username', username);

        setToken(token);
        setRole(role);
        setUsername(username);
    };

    const handleLogout = () => {
        localStorage.clear();
        setToken(null);
        setRole(null);
        setUsername(null);
        setDrugs([]);
    };
    
    const fetchDrugs = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDrugs(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                handleLogout();
                alert("Session expired or access denied. Please log in again.");
            }
            setDrugs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSale = async (drugId, quantitySold) => {
        if (!token) return;
        try {
            const response = await axios.put(`${API_URL}/sell/${drugId}`, { quantitySold }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setDrugs(drugs.map(drug => 
                drug.id === drugId ? response.data : drug
            ));
            alert(`Successfully sold ${quantitySold} units of ${response.data.name}`);

        } catch (error) {
            console.error('Sale error:', error);
            alert(error.response?.data?.message || 'Sale failed.');
        }
    };
    
    useEffect(() => {
        if (token) {
            fetchDrugs();
        }
    }, [token]);

    return (
        <div className="App">
            <h1>Pharmacy Inventory System</h1>
            
            {!token && (
                <Login handleLogin={handleLogin} />
            )}

            {token && (
                <>
                    <header className="main-header">
                        <div className="header-info">Logged in as: <strong>{username}</strong> ({role})</div>
                        <button onClick={handleLogout} className="btn btn-danger">Logout</button>
                    </header>

                    {loading && <p className="loading-message">Loading inventory...</p>}

                    {role === 'admin' && (
                        <AdminPanel 
                            drugs={drugs} 
                            fetchDrugs={fetchDrugs}
                            token={token}
                            username={username}
                        />
                    )}

                    {role === 'cashier' && (
                        <CashierPanel 
                            drugs={drugs}
                            fetchDrugs={fetchDrugs}s
                            handleSale={handleSale}
                            token={token}
                            username={username}
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default App;