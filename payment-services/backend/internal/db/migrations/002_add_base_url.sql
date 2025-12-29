-- Add base_url column for Zuora connections to support different data centers
-- Examples: https://rest.sandbox.na.zuora.com, https://rest.eu.zuora.com, etc.
ALTER TABLE platform_connections ADD COLUMN IF NOT EXISTS base_url VARCHAR(255);

-- Set default base_url for existing Zuora sandbox connections (NA data center)
UPDATE platform_connections
SET base_url = 'https://rest.sandbox.na.zuora.com'
WHERE platform_type = 'zuora' AND is_sandbox = true AND base_url IS NULL;

-- Set default base_url for existing Zuora production connections (NA data center)
UPDATE platform_connections
SET base_url = 'https://rest.na.zuora.com'
WHERE platform_type = 'zuora' AND is_sandbox = false AND base_url IS NULL;
