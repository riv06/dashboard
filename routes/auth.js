const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Super Admin Login
router.post('/login/super-admin', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const result = await pool.query(
            'SELECT * FROM super_admins WHERE username = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const admin = result.rows[0];
        const validPassword = await bcrypt.compare(password, admin.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin.id, username: admin.username, type: 'super_admin' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: admin.id,
                username: admin.username,
                name: admin.name,
                email: admin.email,
                type: 'super_admin'
            }
        });
    } catch (error) {
        console.error('Super admin login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Company User Login
router.post('/login/company', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const result = await pool.query(
            `SELECT cu.*, c.name as company_name 
       FROM company_users cu
       JOIN companies c ON cu.company_id = c.id
       WHERE cu.username = $1 AND c.status = 'active'`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                companyId: user.company_id,
                role: user.role,
                type: 'company_user'
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                company_id: user.company_id,
                company_name: user.company_name,
                type: 'company_user'
            }
        });
    } catch (error) {
        console.error('Company login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;
