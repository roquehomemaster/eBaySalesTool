-- Ensure appconfig has per-page page_size keys; safe upserts
INSERT INTO appconfig (config_key, config_value, data_type)
VALUES
  ('listings.page_size', '12', 'integer'),
  ('catalog.page_size', '15', 'integer'),
  ('sales.page_size', '10', 'integer')
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value, data_type = EXCLUDED.data_type;
