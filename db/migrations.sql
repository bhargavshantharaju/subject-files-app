-- Migration: add scan columns to files table

ALTER TABLE files
  ADD COLUMN IF NOT EXISTS scanned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS infected boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS scan_output text,
  ADD COLUMN IF NOT EXISTS scanned_at timestamptz;