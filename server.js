const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/pages', express.static(path.join(__dirname, 'pages')));

// API Routes
const authRoutes = require('./routes/auth');
const superAdminRoutes = require('./routes/super-admin');
const companyRoutes = require('./routes/company');

app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/company', companyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/super-admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'super-admin-login.html'));
});

app.get('/company-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'company-login.html'));
});

app.get('/super-admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'super-admin-dashboard.html'));
});

app.get('/company-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'company-dashboard.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`\n📊 Dashboard URLs:`);
    console.log(`   Super Admin: http://localhost:${PORT}/super-admin-login`);
    console.log(`   Company:     http://localhost:${PORT}/company-login`);
    console.log(`\n✓ API endpoints ready at /api/*\n`);
});

module.exports = app;
