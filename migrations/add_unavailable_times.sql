-- Migration: Add unavailableTimes column to teachers table
-- Run this SQL in your MySQL database before using the new features

ALTER TABLE teachers 
ADD COLUMN unavailableTimes JSON NULL 
COMMENT 'JSON array of unavailable time slots, format: [{"day":1,"periods":[1,2]}]';

-- Example: Update a teacher with unavailable times
-- UPDATE teachers SET unavailableTimes = '[{"day":1,"periods":[1,2]},{"day":3,"periods":[7,8,9]}]' WHERE teacherId = 'T001';
