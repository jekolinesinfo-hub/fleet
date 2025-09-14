-- Clear all test/example data from tables
DELETE FROM gps_tracking;
DELETE FROM driver_devices;
DELETE FROM speed_violations;
DELETE FROM user_organizations;
DELETE FROM organizations;

-- Reset any demo users except the admin
DELETE FROM user_roles WHERE role != 'admin';
DELETE FROM profiles WHERE email != 'nurchi.md@gmail.com';

-- Clean up any orphaned records
DELETE FROM user_organizations WHERE user_id NOT IN (SELECT id FROM profiles);
DELETE FROM user_roles WHERE user_id NOT IN (SELECT id FROM profiles);