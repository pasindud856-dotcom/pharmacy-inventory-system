const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 5000;

const jwtSecret = 'A_VERY_STRONG_RANDOM_SECRET_FOR_PHARMACY_APP_2025_#$@!'; 
const saltRounds = 10;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'pharmacy_db',
    password: 'root',
    port: 5432,
});

app.use(cors());
app.use(express.json());

const logActivity = async (userId, username, actionType, details) => {
    try {
        await pool.query(
            'INSERT INTO activity_logs (user_id, username, action_type, details) VALUES ($1, $2, $3, $4)',
            [userId, username, actionType, details]
        );
    } catch (err) {
        console.error('Error logging activity:', err);
    }
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); 

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.sendStatus(403); 
        req.user = user;
        next();
    });
};

const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied. Insufficient role permissions.' });
    }
    next();
};

app.post('/api/auth/register', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { username: newUsername, password, role } = req.body;
    if (!['admin', 'cashier'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [newUsername, hashedPassword, role]
        );
        
        await logActivity(req.user.id, req.user.username, 'USER_CREATED', `Admin created new user: ${newUsername} with role ${role}`);

        res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') { 
            return res.status(409).json({ message: 'Username already exists.' });
        }
        console.error(err);
        res.status(500).send('Registration Error');
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, jwtSecret, { expiresIn: '1h' });
        
        res.json({ token, role: user.role, username: user.username });

    } catch (err) {
        console.error(err);
        res.status(500).send('Login Error');
    }
});

app.get('/api/drugs', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM drugs ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.post('/api/drugs', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { name, dosage, quantity, price, brand, location } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO drugs (name, dosage, quantity, price, brand, location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, dosage, quantity, price, brand, location]
        );
        
        await logActivity(req.user.id, req.user.username, 'STOCK_ADDED', `Admin added new drug: ${name} (Qty: ${quantity}, Price: ${price})`);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(400).send('Invalid data or request');
    }
});

app.put('/api/drugs/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    const { name, dosage, quantity, price, brand, location } = req.body;
    try {
        const result = await pool.query(
            'UPDATE drugs SET name = $1, dosage = $2, quantity = $3, price = $4, brand = $5, location = $6 WHERE id = $7 RETURNING *',
            [name, dosage, quantity, price, brand, location, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).send('Drug not found');
        }

        await logActivity(req.user.id, req.user.username, 'STOCK_UPDATED', `Admin updated drug ID ${id}: ${name} (New Qty: ${quantity})`);

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(400).send('Invalid data or request');
    }
});

app.delete('/api/drugs/:id', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
        const drugResult = await pool.query('SELECT name FROM drugs WHERE id = $1', [id]);
        if (drugResult.rowCount === 0) {
            return res.status(404).send('Drug not found');
        }
        const drugName = drugResult.rows[0].name;

        await pool.query('DELETE FROM drugs WHERE id = $1', [id]);
        
        await logActivity(req.user.id, req.user.username, 'STOCK_DELETED', `Admin deleted drug: ${drugName} (ID: ${id})`);

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.put('/api/drugs/sell/:id', authenticateToken, checkRole(['admin', 'cashier']), async (req, res) => {
    const { id } = req.params;
    const { quantitySold } = req.body;
    const saleQuantity = parseInt(quantitySold);

    if (isNaN(saleQuantity) || saleQuantity <= 0) {
        return res.status(400).json({ message: 'Invalid quantity specified.' });
    }

    try {
        const drugResult = await pool.query('SELECT quantity, name FROM drugs WHERE id = $1', [id]);
        if (drugResult.rowCount === 0) {
            return res.status(404).json({ message: `Drug ID ${id} not found.` });
        }
        
        const { quantity: currentQuantity, name: drugName } = drugResult.rows[0];
        const newQuantity = currentQuantity - saleQuantity;

        if (newQuantity < 0) {
            return res.status(400).json({ message: `Insufficient stock. Current stock is ${currentQuantity}. Cannot sell ${saleQuantity}.` });
        }

        const updateResult = await pool.query(
            'UPDATE drugs SET quantity = $1 WHERE id = $2 RETURNING *',
            [newQuantity, id]
        );
        
        await logActivity(req.user.id, req.user.username, 'DRUG_SOLD', `${req.user.role} sold ${saleQuantity} units of ${drugName} (ID: ${id})`);

        res.json(updateResult.rows[0]);

    } catch (err) {
        console.error("Error processing sale:", err);
        res.status(500).send('Server Error during sale processing');
    }
});

app.get('/api/admin/logs', authenticateToken, checkRole(['admin']), async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 50');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching logs');
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});