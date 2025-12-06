const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initializeDatabase() {
    const client = await pool.connect();

    try {
        console.log('🔧 Initializing database...\n');

        // Read and execute SQL schema
        const sqlPath = path.join(__dirname, 'init-db.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📋 Creating tables...');
        await client.query(sql);
        console.log('✓ Tables created successfully\n');

        // Create default super admin
        const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
        const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('👤 Creating default super admin...');
        await client.query(
            'INSERT INTO super_admins (username, password, email, name) VALUES ($1, $2, $3, $4)',
            [username, hashedPassword, 'admin@tepia.com', 'System Administrator']
        );
        console.log(`✓ Super admin created: ${username}\n`);

        // Create sample company for testing
        console.log('🏢 Creating sample company...');
        const companyResult = await client.query(
            `INSERT INTO companies (name, email, phone, address, commission_percentage, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            ['Transportes Demo', 'demo@example.com', '555-0100', 'Av. Principal 123', 5.00, 'active']
        );
        const companyId = companyResult.rows[0].id;
        console.log('✓ Sample company created\n');

        // Create sample company user
        console.log('👥 Creating sample company user...');
        const companyPassword = await bcrypt.hash('demo123', 10);
        await client.query(
            `INSERT INTO company_users (company_id, username, password, email, name, role)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [companyId, 'demo', companyPassword, 'demo@transportes.com', 'Demo User', 'admin']
        );
        console.log('✓ Sample company user created: demo\n');

        // Create sample bus
        console.log('🚌 Creating sample bus...');
        const busResult = await client.query(
            `INSERT INTO buses (company_id, bus_number, plate_number, capacity, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [companyId, 'BUS-001', 'ABC-1234', 40, 'active']
        );
        const busId = busResult.rows[0].id;
        console.log('✓ Sample bus created\n');

        // Create bus sections
        console.log('💺 Creating bus sections...');
        await client.query(
            `INSERT INTO bus_sections (bus_id, section_name, seat_start, seat_end) VALUES
       ($1, 'Front Section', 1, 15),
       ($1, 'Middle Section', 16, 30),
       ($1, 'Back Section', 31, 40)`,
            [busId]
        );
        console.log('✓ Bus sections created\n');

        console.log('✅ Database initialization completed successfully!\n');
        console.log('📝 Login credentials:');
        console.log(`   Super Admin - Username: ${username}, Password: ${password}`);
        console.log('   Company User - Username: demo, Password: demo123\n');
        console.log('⚠️  Please change these passwords after first login!\n');

    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run initialization
initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
