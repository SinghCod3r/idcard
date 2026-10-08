-- Insert users into auth.users (requires uuid extension and pgcrypto)
-- Using predefined UUIDs for test users

-- Super Admin
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) (
  SELECT
    '00000000-0000-0000-0000-000000000000',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'authenticated',
    'authenticated',
    'admin@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    null,
    null,
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- School Admin
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) (
  SELECT
    '00000000-0000-0000-0000-000000000000',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'authenticated',
    'authenticated',
    'schooladmin@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    null,
    null,
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- Staff Member
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) (
  SELECT
    '00000000-0000-0000-0000-000000000000',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'authenticated',
    'authenticated',
    'staff@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    null,
    null,
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- Profiles are usually created by trigger, but because we are bypassing the API, the trigger might not fire or we can just update the roles explicitly.
-- The trigger creates them as 'STAFF'. We just update them here:
UPDATE profiles SET role = 'SUPER_ADMIN', first_name = 'Super', last_name = 'Admin' WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
UPDATE profiles SET role = 'SCHOOL_ADMIN', first_name = 'School', last_name = 'Admin' WHERE id = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
UPDATE profiles SET role = 'STAFF', first_name = 'Staff', last_name = 'Member' WHERE id = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

-- Insert Demo School
INSERT INTO schools (id, name, code, contact_email) 
VALUES ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Demo High School', 'DHS', 'contact@demohigh.edu');

-- Assign School Admin and Staff to School
INSERT INTO school_members (school_id, user_id, role) 
VALUES ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'SCHOOL_ADMIN');

INSERT INTO school_members (school_id, user_id, role) 
VALUES ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'STAFF');

