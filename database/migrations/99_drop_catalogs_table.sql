-- Migration to ensure legacy Catalogs table is dropped if it exists
DROP TABLE IF EXISTS "public"."Catalogs" CASCADE;
