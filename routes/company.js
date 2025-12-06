const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { verifyToken, verifyCompanyUser } = require('../middleware/auth');

// Apply authentication middleware
router.use(verifyToken);
router.use(verifyCompanyUser);

// Helper function to get company ID from token
const getCompanyId = (req) => req.user.companyId;

// ========== ROUTES ==========

// Get all routes for company
router.get('/routes', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const result = await pool.query(
            'SELECT * FROM routes WHERE company_id = $1 ORDER BY created_at DESC',
            [companyId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching routes:', error);
        res.status(500).json({ error: 'Failed to fetch routes' });
    }
});

// Create route
router.post('/routes', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const { name, origin, destination, price, duration_hours } = req.body;

        if (!name || !origin || !destination || !price) {
            return res.status(400).json({ error: 'Name, origin, destination, and price are required' });
        }

        const result = await pool.query(
            `INSERT INTO routes (company_id, name, origin, destination, price, duration_hours)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [companyId, name, origin, destination, price, duration_hours]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating route:', error);
        res.status(500).json({ error: 'Failed to create route' });
    }
});

// Update route
router.put('/routes/:id', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const { id } = req.params;
        const { name, origin, destination, price, duration_hours } = req.body;

        const result = await pool.query(
            `UPDATE routes 
       SET name = COALESCE($1, name),
           origin = COALESCE($2, origin),
           destination = COALESCE($3, destination),
           price = COALESCE($4, price),
           duration_hours = COALESCE($5, duration_hours)
       WHERE id = $6 AND company_id = $7 RETURNING *`,
            [name, origin, destination, price, duration_hours, id, companyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Route not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating route:', error);
        res.status(500).json({ error: 'Failed to update route' });
    }
});

// Delete route
router.delete('/routes/:id', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM routes WHERE id = $1 AND company_id = $2 RETURNING *',
            [id, companyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Route not found' });
        }

        res.json({ message: 'Route deleted successfully' });
    } catch (error) {
        console.error('Error deleting route:', error);
        res.status(500).json({ error: 'Failed to delete route' });
    }
});

// ========== BUSES ==========

// Get all buses
router.get('/buses', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const result = await pool.query(
            'SELECT * FROM buses WHERE company_id = $1 ORDER BY bus_number',
            [companyId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching buses:', error);
        res.status(500).json({ error: 'Failed to fetch buses' });
    }
});

// Create bus
router.post('/buses', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const { bus_number, plate_number, status } = req.body;

        if (!bus_number || !plate_number) {
            return res.status(400).json({ error: 'Bus number and plate number are required' });
        }

        const result = await pool.query(
            `INSERT INTO buses (company_id, bus_number, plate_number, capacity, status)
       VALUES ($1, $2, $3, 40, $4) RETURNING *`,
            [companyId, bus_number, plate_number, status || 'active']
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating bus:', error);
        res.status(500).json({ error: 'Failed to create bus' });
    }
});

// Update bus
router.put('/buses/:id', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const { id } = req.params;
        const { bus_number, plate_number, status } = req.body;

        const result = await pool.query(
            `UPDATE buses 
       SET bus_number = COALESCE($1, bus_number),
           plate_number = COALESCE($2, plate_number),
           status = COALESCE($3, status)
       WHERE id = $4 AND company_id = $5 RETURNING *`,
            [bus_number, plate_number, status, id, companyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Bus not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating bus:', error);
        res.status(500).json({ error: 'Failed to update bus' });
    }
});

// Delete bus
router.delete('/buses/:id', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM buses WHERE id = $1 AND company_id = $2 RETURNING *',
            [id, companyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Bus not found' });
        }

        res.json({ message: 'Bus deleted successfully' });
    } catch (error) {
        console.error('Error deleting bus:', error);
        res.status(500).json({ error: 'Failed to delete bus' });
    }
});

// ========== DRIVERS ==========

// Get all drivers
router.get('/drivers', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const result = await pool.query(
            'SELECT * FROM drivers WHERE company_id = $1 ORDER BY name',
            [companyId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({ error: 'Failed to fetch drivers' });
    }
});

// Create driver
router.post('/drivers', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const { name, license_number, phone, email, status } = req.body;

        if (!name || !license_number) {
            return res.status(400).json({ error: 'Name and license number are required' });
        }

        const result = await pool.query(
            `INSERT INTO drivers (company_id, name, license_number, phone, email, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [companyId, name, license_number, phone, email, status || 'active']
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating driver:', error);
        res.status(500).json({ error: 'Failed to create driver' });
    }
});

// Update driver
router.put('/drivers/:id', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const { id } = req.params;
        const { name, license_number, phone, email, status } = req.body;

        const result = await pool.query(
            `UPDATE drivers 
       SET name = COALESCE($1, name),
           license_number = COALESCE($2, license_number),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           status = COALESCE($5, status)
       WHERE id = $6 AND company_id = $7 RETURNING *`,
            [name, license_number, phone, email, status, id, companyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating driver:', error);
        res.status(500).json({ error: 'Failed to update driver' });
    }
});

// Delete driver
router.delete('/drivers/:id', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM drivers WHERE id = $1 AND company_id = $2 RETURNING *',
            [id, companyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        res.json({ message: 'Driver deleted successfully' });
    } catch (error) {
        console.error('Error deleting driver:', error);
        res.status(500).json({ error: 'Failed to delete driver' });
    }
});

// ========== COMPANY USERS ==========

// Get all company users
router.get('/users', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const result = await pool.query(
            'SELECT id, username, email, name, role, created_at FROM company_users WHERE company_id = $1 ORDER BY created_at DESC',
            [companyId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create company user
router.post('/users', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const { username, password, email, name, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO company_users (company_id, username, password, email, name, role)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, name, role, created_at`,
            [companyId, username, hashedPassword, email, name, role || 'staff']
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.constraint === 'company_users_username_key') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update company user
router.put('/users/:id', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const { id } = req.params;
        const { email, name, role, password } = req.body;

        let query, params;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query = `UPDATE company_users 
               SET email = COALESCE($1, email),
                   name = COALESCE($2, name),
                   role = COALESCE($3, role),
                   password = $4
               WHERE id = $5 AND company_id = $6 
               RETURNING id, username, email, name, role, created_at`;
            params = [email, name, role, hashedPassword, id, companyId];
        } else {
            query = `UPDATE company_users 
               SET email = COALESCE($1, email),
                   name = COALESCE($2, name),
                   role = COALESCE($3, role)
               WHERE id = $4 AND company_id = $5 
               RETURNING id, username, email, name, role, created_at`;
            params = [email, name, role, id, companyId];
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete company user
router.delete('/users/:id', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM company_users WHERE id = $1 AND company_id = $2 RETURNING *',
            [id, companyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// ========== TICKETS ==========

// Get all tickets
router.get('/tickets', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const result = await pool.query(
            `SELECT t.*, 
              r.name as route_name, r.origin, r.destination,
              b.bus_number,
              d.name as driver_name
       FROM tickets t
       LEFT JOIN routes r ON t.route_id = r.id
       LEFT JOIN buses b ON t.bus_id = b.id
       LEFT JOIN drivers d ON t.driver_id = d.id
       WHERE t.company_id = $1
       ORDER BY t.sale_date DESC`,
            [companyId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

// Create ticket (sell ticket)
router.post('/tickets', async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const companyId = getCompanyId(req);
        const { route_id, bus_id, driver_id, passenger_name, seat_number, travel_date, price } = req.body;

        if (!passenger_name || !seat_number || !travel_date || !price) {
            throw new Error('Passenger name, seat number, travel date, and price are required');
        }

        // Validate seat number (1-40)
        if (seat_number < 1 || seat_number > 40) {
            throw new Error('Seat number must be between 1 and 40');
        }

        // Check if seat is already taken for this bus on this date
        const seatCheck = await client.query(
            `SELECT id FROM tickets 
       WHERE bus_id = $1 AND travel_date = $2 AND seat_number = $3 AND status = 'confirmed'`,
            [bus_id, travel_date, seat_number]
        );

        if (seatCheck.rows.length > 0) {
            throw new Error('This seat is already booked');
        }

        // Get company commission percentage
        const companyResult = await client.query(
            'SELECT commission_percentage FROM companies WHERE id = $1',
            [companyId]
        );

        const commissionPercentage = companyResult.rows[0]?.commission_percentage || 0;
        const commissionAmount = (price * commissionPercentage) / 100;

        // Create ticket
        const result = await client.query(
            `INSERT INTO tickets (company_id, route_id, bus_id, driver_id, passenger_name, seat_number, price, commission_amount, travel_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'confirmed') RETURNING *`,
            [companyId, route_id, bus_id, driver_id, passenger_name, seat_number, price, commissionAmount, travel_date]
        );

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating ticket:', error);
        res.status(400).json({ error: error.message || 'Failed to create ticket' });
    } finally {
        client.release();
    }
});

// ========== BUS SECTIONS ==========

// Get bus sections
router.get('/bus-sections/:busId', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const { busId } = req.params;

        // Verify bus belongs to company
        const busCheck = await pool.query(
            'SELECT id FROM buses WHERE id = $1 AND company_id = $2',
            [busId, companyId]
        );

        if (busCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Bus not found' });
        }

        const result = await pool.query(
            'SELECT * FROM bus_sections WHERE bus_id = $1 ORDER BY seat_start',
            [busId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching bus sections:', error);
        res.status(500).json({ error: 'Failed to fetch bus sections' });
    }
});

// Create bus section
router.post('/bus-sections', async (req, res) => {
    try {
        const companyId = getCompanyId(req);
        const { bus_id, section_name, seat_start, seat_end } = req.body;

        // Verify bus belongs to company
        const busCheck = await pool.query(
            'SELECT id FROM buses WHERE id = $1 AND company_id = $2',
            [bus_id, companyId]
        );

        if (busCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Bus not found' });
        }

        if (!section_name || !seat_start || !seat_end) {
            return res.status(400).json({ error: 'Section name, seat start, and seat end are required' });
        }

        const result = await pool.query(
            `INSERT INTO bus_sections (bus_id, section_name, seat_start, seat_end)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [bus_id, section_name, seat_start, seat_end]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating bus section:', error);
        res.status(500).json({ error: 'Failed to create bus section' });
    }
});

module.exports = router;
