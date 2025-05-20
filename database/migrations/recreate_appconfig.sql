DROP TABLE IF EXISTS "AppConfig";
CREATE TABLE "AppConfig" (
    config_key VARCHAR(255) PRIMARY KEY,
    config_value TEXT NOT NULL,
    data_type VARCHAR(50) NOT NULL DEFAULT 'string'
);
