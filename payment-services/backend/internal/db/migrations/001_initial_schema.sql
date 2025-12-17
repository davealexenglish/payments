-- Platform Connections - Store API credentials for each platform
CREATE TABLE IF NOT EXISTS platform_connections (
    id              BIGSERIAL PRIMARY KEY,
    platform_type   VARCHAR(20) NOT NULL,  -- 'maxio', 'zuora', 'stripe'
    name            VARCHAR(100) NOT NULL,
    subdomain       VARCHAR(100),          -- For Maxio: {subdomain}.chargify.com
    is_sandbox      BOOLEAN NOT NULL DEFAULT true,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, connected, error
    error_message   TEXT,
    last_sync_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(platform_type, name)
);

-- Platform Credentials - Storage for API keys
CREATE TABLE IF NOT EXISTS platform_credentials (
    id                    BIGSERIAL PRIMARY KEY,
    connection_id         BIGINT NOT NULL REFERENCES platform_connections(id) ON DELETE CASCADE,
    credential_type       VARCHAR(50) NOT NULL,  -- 'api_key', 'client_id', 'client_secret'
    credential_value      TEXT NOT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(connection_id, credential_type)
);

-- Cached Customers - Local cache of customer data
CREATE TABLE IF NOT EXISTS cached_customers (
    id                    BIGSERIAL PRIMARY KEY,
    connection_id         BIGINT NOT NULL REFERENCES platform_connections(id) ON DELETE CASCADE,
    external_id           VARCHAR(100) NOT NULL,
    reference             VARCHAR(100),
    first_name            VARCHAR(100),
    last_name             VARCHAR(100),
    email                 VARCHAR(255),
    organization          VARCHAR(255),
    raw_data              JSONB,
    synced_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(connection_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_cached_customers_connection ON cached_customers(connection_id);
CREATE INDEX IF NOT EXISTS idx_cached_customers_email ON cached_customers(email);

-- Cached Subscriptions - Local cache of subscription data
CREATE TABLE IF NOT EXISTS cached_subscriptions (
    id                    BIGSERIAL PRIMARY KEY,
    connection_id         BIGINT NOT NULL REFERENCES platform_connections(id) ON DELETE CASCADE,
    external_id           VARCHAR(100) NOT NULL,
    customer_external_id  VARCHAR(100),
    product_name          VARCHAR(255),
    state                 VARCHAR(50),
    current_period_start  TIMESTAMPTZ,
    current_period_end    TIMESTAMPTZ,
    raw_data              JSONB,
    synced_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(connection_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_cached_subscriptions_connection ON cached_subscriptions(connection_id);
CREATE INDEX IF NOT EXISTS idx_cached_subscriptions_customer ON cached_subscriptions(customer_external_id);

-- User Preferences - Store UI state and preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id                    BIGSERIAL PRIMARY KEY,
    preference_key        VARCHAR(100) NOT NULL UNIQUE,
    preference_value      JSONB NOT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default preferences
INSERT INTO user_preferences (preference_key, preference_value)
VALUES
    ('expanded_nodes', '[]'::jsonb),
    ('selected_platform', 'null'::jsonb),
    ('tree_panel_width', '280'::jsonb)
ON CONFLICT (preference_key) DO NOTHING;
