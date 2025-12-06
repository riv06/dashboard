-- Add is_system_admin column to super_admins table
ALTER TABLE super_admins 
ADD COLUMN IF NOT EXISTS is_system_admin BOOLEAN DEFAULT false;

-- Mark the first admin as system admin
UPDATE super_admins 
SET is_system_admin = true 
WHERE username = 'admin';
