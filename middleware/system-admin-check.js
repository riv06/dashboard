// Middleware to check if user can modify a super admin
async function canModifySuperAdmin(req, res, next) {
  try {
    const { id } = req.params;
    
    // Check if target is system admin
    const targetAdmin = await pool.query(
      'SELECT is_system_admin FROM super_admins WHERE id = $1',
      [id]
    );
    
    if (targetAdmin.rows.length === 0) {
      return res.status(404).json({ error: 'Super admin not found' });
    }
    
    // Check if current user is system admin
    const currentUser = await pool.query(
      'SELECT is_system_admin FROM super_admins WHERE id = $1',
      [req.user.id]
    );
    
    // If target is system admin and current user is NOT system admin, deny
    if (targetAdmin.rows[0].is_system_admin && !currentUser.rows[0].is_system_admin) {
      return res.status(403).json({ error: 'No tienes permisos para modificar al System Admin' });
    }
    
    next();
  } catch (error) {
    console.error('Error checking permissions:', error);
    res.status(500).json({ error: 'Failed to check permissions' });
  }
}

module.exports = { canModifySuperAdmin };
