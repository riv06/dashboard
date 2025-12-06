const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { verifyToken, verifySuperAdmin } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(verifyToken);
router.use(verifySuperAdmin);

// ========== SUPER ADMINS MANAGEMENT ==========

// Get all super admins
router.get('/super-admins', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, name, is_system_admin, created_at FROM super_admins ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching super admins:', error);
        res.status(500).json({ error: 'Failed to fetch super admins' });
    }
});

// Create new super admin
router.post('/super-admins', async (req, res) => {
    try {
        const { username, password, email, name } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO super_admins (username, password, email, name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, name, created_at',
            [username, hashedPassword, email, name]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.constraint === 'super_admins_username_key') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        console.error('Error creating super admin:', error);
        res.status(500).json({ error: 'Failed to create super admin' });
    }
});

// Update super admin
router.put('/super-admins/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { email, name, password } = req.body;

        let query, params;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query = `UPDATE super_admins 
               SET email = COALESCE($1, email),
                   name = COALESCE($2, name),
                   password = $3
               WHERE id = $4 
               RETURNING id, username, email, name, created_at`;
            params = [email, name, hashedPassword, id];
        } else {
            query = `UPDATE super_admins 
               SET email = COALESCE($1, email),
                   name = COALESCE($2, name)
               WHERE id = $3 
               RETURNING id, username, email, name, created_at`;
            params = [email, name, id];
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Super admin not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating super admin:', error);
        res.status(500).json({ error: 'Failed to update super admin' });
    }
});

// Delete super admin
router.delete('/super-admins/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting the last super admin
        const countResult = await pool.query('SELECT COUNT(*) as count FROM super_admins');
        if (parseInt(countResult.rows[0].count) <= 1) {
            return res.status(400).json({ error: 'Cannot delete the last super admin' });
        }

        const result = await pool.query(
            'DELETE FROM super_admins WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Super admin not found' });
        }

        res.json({ message: 'Super admin deleted successfully' });
    } catch (error) {
        console.error('Error deleting super admin:', error);
        res.status(500).json({ error: 'Failed to delete super admin' });
    }
});

// ========== COMPANIES MANAGEMENT ==========

// Get all companies
router.get('/companies', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM companies ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

// Create new company
router.post('/companies', async (req, res) => {
    try {
        const { name, email, phone, address, commission_percentage } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Company name is required' });
        }

        const result = await pool.query(
            `INSERT INTO companies (name, email, phone, address, commission_percentage, status)
       VALUES ($1, $2, $3, $4, $5, 'active') RETURNING *`,
            [name, email, phone, address, commission_percentage || 0]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({ error: 'Failed to create company' });
    }
});

// Update company
router.put('/companies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address, status } = req.body;

        const result = await pool.query(
            `UPDATE companies 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           status = COALESCE($5, status)
       WHERE id = $6 RETURNING *`,
            [name, email, phone, address, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ error: 'Failed to update company' });
    }
});

// Update company commission
router.put('/companies/:id/commission', async (req, res) => {
    try {
        const { id } = req.params;
        const { commission_percentage } = req.body;

        if (commission_percentage === undefined || commission_percentage < 0 || commission_percentage > 100) {
            return res.status(400).json({ error: 'Invalid commission percentage (0-100)' });
        }

        const result = await pool.query(
            'UPDATE companies SET commission_percentage = $1 WHERE id = $2 RETURNING *',
            [commission_percentage, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating commission:', error);
        res.status(500).json({ error: 'Failed to update commission' });
    }
});

// Delete company
router.delete('/companies/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM companies WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.json({ message: 'Company deleted successfully' });
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ error: 'Failed to delete company' });
    }
});

// Get all registered users (from all companies)
router.get('/users', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT cu.id, cu.username, cu.email, cu.name, cu.role, cu.created_at,
              c.name as company_name, c.id as company_id
       FROM company_users cu
       JOIN companies c ON cu.company_id = c.id
       ORDER BY cu.created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get all sales (tickets)
router.get('/sales', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT t.*, 
              c.name as company_name,
              r.name as route_name,
              r.origin, r.destination,
              b.bus_number,
              d.name as driver_name
       FROM tickets t
       JOIN companies c ON t.company_id = c.id
       LEFT JOIN routes r ON t.route_id = r.id
       LEFT JOIN buses b ON t.bus_id = b.id
       LEFT JOIN drivers d ON t.driver_id = d.id
       ORDER BY t.sale_date DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
});

// Get commission reports
router.get('/commissions', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.id, c.name, c.commission_percentage,
              COUNT(t.id) as total_tickets,
              COALESCE(SUM(t.price), 0) as total_sales,
              COALESCE(SUM(t.commission_amount), 0) as total_commissions
       FROM companies c
       LEFT JOIN tickets t ON c.id = t.company_id AND t.status = 'confirmed'
       GROUP BY c.id, c.name, c.commission_percentage
       ORDER BY total_commissions DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching commissions:', error);
        res.status(500).json({ error: 'Failed to fetch commissions' });
    }
});

module.exports = router;
