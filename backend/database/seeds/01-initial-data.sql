-- Seed data for Love OKLCH Freemium Entitlement System
-- Creates initial data for 3 user types: Free, Basic, Pro

BEGIN;

-- Insert default plans
INSERT INTO plans (plan_id, name, slug, description, price, currency, billing_interval, is_active, sort_order, metadata) VALUES
(
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Free',
    'free',
    'Free plan with basic features',
    0.00,
    'USD',
    NULL,
    true,
    1,
    '{"trial_days": 0, "popular": false}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000002'::uuid,
    'Basic',
    'basic',
    'Basic plan with expanded features',
    9.99,
    'USD',
    'monthly',
    true,
    2,
    '{"trial_days": 14, "popular": true}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000003'::uuid,
    'Pro',
    'pro',
    'Professional plan with all features',
    19.99,
    'USD',
    'monthly',
    true,
    3,
    '{"trial_days": 14, "popular": false}'::jsonb
);

-- Insert features
INSERT INTO features (feature_id, key_name, display_name, description, category, is_boolean, default_value, validation_schema, is_active) VALUES
(
    '10000000-0000-0000-0000-000000000001'::uuid,
    'COLOR_PALETTE_STORAGE',
    'Color Palette Storage',
    'Number of color palettes that can be stored',
    'storage',
    false,
    '{"limit": 5}'::jsonb,
    '{"type": "object", "properties": {"limit": {"type": "integer", "minimum": 0}}}'::jsonb,
    true
),
(
    '10000000-0000-0000-0000-000000000002'::uuid,
    'EXPORT_FORMATS',
    'Export Formats',
    'Available export formats for color palettes',
    'export',
    false,
    '{"formats": ["css"]}'::jsonb,
    '{"type": "object", "properties": {"formats": {"type": "array", "items": {"type": "string"}}}}'::jsonb,
    true
),
(
    '10000000-0000-0000-0000-000000000003'::uuid,
    'ADVANCED_COLOR_TOOLS',
    'Advanced Color Tools',
    'Access to advanced color manipulation tools',
    'tools',
    true,
    '{"enabled": false}'::jsonb,
    '{"type": "object", "properties": {"enabled": {"type": "boolean"}}}'::jsonb,
    true
),
(
    '10000000-0000-0000-0000-000000000004'::uuid,
    'API_ACCESS',
    'API Access',
    'Access to the OKLCH API',
    'integration',
    true,
    '{"enabled": false}'::jsonb,
    '{"type": "object", "properties": {"enabled": {"type": "boolean"}}}'::jsonb,
    true
),
(
    '10000000-0000-0000-0000-000000000005'::uuid,
    'MONTHLY_EXPORTS',
    'Monthly Exports',
    'Number of exports allowed per month',
    'usage',
    false,
    '{"limit": 10}'::jsonb,
    '{"type": "object", "properties": {"limit": {"type": "integer", "minimum": 0}}}'::jsonb,
    true
),
(
    '10000000-0000-0000-0000-000000000006'::uuid,
    'PRIORITY_SUPPORT',
    'Priority Support',
    'Access to priority customer support',
    'support',
    true,
    '{"enabled": false}'::jsonb,
    '{"type": "object", "properties": {"enabled": {"type": "boolean"}}}'::jsonb,
    true
),
(
    '10000000-0000-0000-0000-000000000007'::uuid,
    'COLLABORATION',
    'Team Collaboration',
    'Share palettes and collaborate with team members',
    'collaboration',
    true,
    '{"enabled": false}'::jsonb,
    '{"type": "object", "properties": {"enabled": {"type": "boolean"}}}'::jsonb,
    true
);

-- Configure plan features for Free plan
INSERT INTO plan_features (plan_id, feature_id, value, is_enabled) VALUES
('00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, '{"limit": 5}'::jsonb, true),
('00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, '{"formats": ["css"]}'::jsonb, true),
('00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000003'::uuid, '{"enabled": false}'::jsonb, false),
('00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000004'::uuid, '{"enabled": false}'::jsonb, false),
('00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000005'::uuid, '{"limit": 10}'::jsonb, true),
('00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000006'::uuid, '{"enabled": false}'::jsonb, false),
('00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000007'::uuid, '{"enabled": false}'::jsonb, false);

-- Configure plan features for Basic plan
INSERT INTO plan_features (plan_id, feature_id, value, is_enabled) VALUES
('00000000-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, '{"limit": 50}'::jsonb, true),
('00000000-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, '{"formats": ["css", "scss", "json", "adobe-ase"]}'::jsonb, true),
('00000000-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000003'::uuid, '{"enabled": true}'::jsonb, true),
('00000000-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000004'::uuid, '{"enabled": false}'::jsonb, false),
('00000000-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000005'::uuid, '{"limit": 100}'::jsonb, true),
('00000000-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000006'::uuid, '{"enabled": true}'::jsonb, true),
('00000000-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000007'::uuid, '{"enabled": true}'::jsonb, true);

-- Configure plan features for Pro plan
INSERT INTO plan_features (plan_id, feature_id, value, is_enabled) VALUES
('00000000-0000-0000-0000-000000000003'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, '{"limit": -1}'::jsonb, true), -- -1 means unlimited
('00000000-0000-0000-0000-000000000003'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, '{"formats": ["css", "scss", "json", "adobe-ase", "sketch", "figma", "pdf"]}'::jsonb, true),
('00000000-0000-0000-0000-000000000003'::uuid, '10000000-0000-0000-0000-000000000003'::uuid, '{"enabled": true}'::jsonb, true),
('00000000-0000-0000-0000-000000000003'::uuid, '10000000-0000-0000-0000-000000000004'::uuid, '{"enabled": true}'::jsonb, true),
('00000000-0000-0000-0000-000000000003'::uuid, '10000000-0000-0000-0000-000000000005'::uuid, '{"limit": -1}'::jsonb, true), -- unlimited exports
('00000000-0000-0000-0000-000000000003'::uuid, '10000000-0000-0000-0000-000000000006'::uuid, '{"enabled": true}'::jsonb, true),
('00000000-0000-0000-0000-000000000003'::uuid, '10000000-0000-0000-0000-000000000007'::uuid, '{"enabled": true}'::jsonb, true);

-- Insert sample users for testing
INSERT INTO users (user_id, email, password_hash, name, is_active) VALUES
(
    '20000000-0000-0000-0000-000000000001'::uuid,
    'free.user@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMtJPBOY1VSCVJ.', -- password: 'password123'
    'Free User',
    true
),
(
    '20000000-0000-0000-0000-000000000002'::uuid,
    'basic.user@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMtJPBOY1VSCVJ.', -- password: 'password123'
    'Basic User',
    true
),
(
    '20000000-0000-0000-0000-000000000003'::uuid,
    'pro.user@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMtJPBOY1VSCVJ.', -- password: 'password123'
    'Pro User',
    true
),
(
    '20000000-0000-0000-0000-000000000004'::uuid,
    'admin@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMtJPBOY1VSCVJ.', -- password: 'password123'
    'System Administrator',
    true
),
(
    '20000000-0000-0000-0000-000000000005'::uuid,
    'default@default.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMtJPBOY1VSCVJ.', -- password: 'password123'
    'Default User',
    true
),
(
    '20000000-0000-0000-0000-000000000006'::uuid,
    'subscription@default.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewMtJPBOY1VSCVJ.', -- password: 'password123'
    'Subscription User',
    true
);

-- Create subscriptions for test users
INSERT INTO subscriptions (user_id, plan_id, status, payment_type, start_date, end_date, grace_period_end) VALUES
(
    '20000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'active',
    'one_time',
    CURRENT_TIMESTAMP,
    NULL, -- free plan never expires
    NULL
),
(
    '20000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    'active',
    'recurring',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 month',
    CURRENT_TIMESTAMP + INTERVAL '1 month' + INTERVAL '7 days'
),
(
    '20000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid,
    'active',
    'recurring',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 month',
    CURRENT_TIMESTAMP + INTERVAL '1 month' + INTERVAL '7 days'
),
(
    '20000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid, -- Pro plan for default user
    'active',
    'recurring',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 month',
    CURRENT_TIMESTAMP + INTERVAL '1 month' + INTERVAL '7 days'
),
(
    '20000000-0000-0000-0000-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid, -- Pro plan for subscription user
    'active',
    'recurring',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 month',
    CURRENT_TIMESTAMP + INTERVAL '1 month' + INTERVAL '7 days'
);

-- Create admin roles
INSERT INTO admin_roles (user_id, role_name, permissions, granted_by) VALUES
(
    '20000000-0000-0000-0000-000000000004'::uuid,
    'super_admin',
    '{"can_edit_plans": true, "can_view_billing": true, "can_manage_users": true, "can_edit_features": true, "can_assign_roles": true}'::jsonb,
    NULL -- self-granted or system-granted
);

COMMIT;

-- Log successful seeding
SELECT 'Database seeded successfully with 3 plans, 7 features, 6 users, 5 subscriptions, and 1 admin role' AS result;