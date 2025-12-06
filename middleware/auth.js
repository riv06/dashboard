const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = {
    // Verify JWT token for any authenticated user
    verifyToken: (req, res, next) => {
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    },

    // Verify user is a super admin
    verifySuperAdmin: (req, res, next) => {
        if (req.user.type !== 'super_admin') {
            return res.status(403).json({ error: 'Super admin access required' });
        }
        next();
    },

    // Verify user is a company user
    verifyCompanyUser: (req, res, next) => {
        if (req.user.type !== 'company_user') {
            return res.status(403).json({ error: 'Company user access required' });
        }
        next();
    },

    // Verify company user can only access their own company data
    verifyCompanyOwnership: (req, res, next) => {
        const companyIdFromToken = req.user.companyId;
        const companyIdFromRequest = req.params.companyId || req.body.company_id || req.query.company_id;

        if (req.user.type === 'super_admin') {
            // Super admins can access any company
            next();
        } else if (companyIdFromToken && companyIdFromRequest && companyIdFromToken.toString() === companyIdFromRequest.toString()) {
            next();
        } else if (!companyIdFromRequest) {
            // If no specific company requested, allow (will filter in query)
            next();
        } else {
            return res.status(403).json({ error: 'Access denied to this company data' });
        }
    }
};

module.exports = authMiddleware;
