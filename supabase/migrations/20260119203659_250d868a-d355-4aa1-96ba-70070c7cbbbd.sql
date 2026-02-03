-- Create profile for the existing user
INSERT INTO public.profiles (user_id, email, full_name)
VALUES ('3304fa3d-05b3-491f-95a6-72677f8ee4d1', 'techclmp@gmail.com', 'CLMP Admin')
ON CONFLICT (user_id) DO NOTHING;

-- Create trigger on auth.users to auto-create profiles (if not exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();