DROP TABLE IF EXISTS appconfig;
CREATE TABLE appconfig (
    config_key VARCHAR PRIMARY KEY,
    config_value TEXT NOT NULL,
    data_type VARCHAR NOT NULL DEFAULT 'string'
);
