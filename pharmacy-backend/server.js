// -------------------- Imports --------------------
const express = require('express');          // Express framework
const { Pool } = require('pg');               // PostgreSQL client
const cors = require('cors');                 // Enable CORS
const bcrypt = require('bcrypt');             // Password hashing
const jwt = require('jsonwebtoken');          // JWT authentication

// -------------------- App Setup --------------------
const app = express();
const port = 5000;

// JWT secret key (should ideally be stored in environment variables)
const jwtSecret = 'A_VERY_STRONG_RANDOM_SECRET_FOR_PHARMACY_APP_2025_#$@!';
const saltRounds = 10; // Bcrypt salt rounds

// -------------------- Database Connection --------------------
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'pharmacy_db',
    password: 'root',
    port: 5432,
});

// -------------------- Middleware --------------------
app.use(cors());              // Allow cross-origin requests
app.use(express.json());      // Parse JSON request bodies

// -------------------- Activity Logger --------------------
// Logs important user activities into activity_logs table
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

// -------------------- Authentication Middleware --------------------
// Verifies JWT token sent in Authorization header
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); // No token

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.sendStatus(403); // Invalid token
        req.user = user;                     // Attach user data to request
        next();
    });
};

// -------------------- Role Authorization Middleware --------------------
// Checks whether user role is allowed to access route
const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied. Insufficient role permissions.' });
    }
    next();
};

// -------------------- User Registration (Admin Only) --------------------
app.post('/api/auth/register', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { username: newUsername, password, role } = req.body;

    // Validate role
    if (!['admin', 'cashier'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role.' });
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert user
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [newUsername, hashedPassword, role]
        );

        // Log admin action
        await logActivity(req.user.id, req.user.username, 'USER_CREATED',
            `Admin created new user: ${newUsername} with role ${role}`
        );

        res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            return res.status(409).json({ message: 'Username already exists.' });
        }
        console.error(err);
        res.status(500).send('Registration Error');
    }
});

// -------------------- Login --------------------
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Fetch user by username
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Compare password
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            jwtSecret,
            { expiresIn: '1h' }
        );

        res.json({ token, role: user.role, username: user.username });
    } catch (err) {
        console.error(err);
        res.status(500).send('Login Error');
    }
});

// -------------------- Get All Drugs --------------------
app.get('/api/drugs', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM drugs ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// -------------------- Add New Drug (Admin) --------------------
app.post('/api/drugs', authenticateToken, checkRole(['admin']), async (req, res) => {
    const { name, dosage, quantity, price, brand, location } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO drugs (name, dosage, quantity, price, brand, location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, dosage, quantity, price, brand, location]
        );

        await logActivity(req.user.id, req.user.username, 'STOCK_ADDED',
            `Admin added new drug: ${name} (Qty: ${quantity}, Price: ${price})`
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(400).send('Invalid data or request');
    }
});

// -------------------- Server Start --------------------
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
