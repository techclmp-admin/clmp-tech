-- Confirm email for techclmp@gmail.com
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE id = '3304fa3d-05b3-491f-95a6-72677f8ee4d1';