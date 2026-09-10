-- Wire the seeded demo restaurants to the real merchant account created for LocalEats demo ownership.
-- Owner UUID captured from the remote Supabase auth.users row created during the demonstration pass.
UPDATE restaurants
SET owner_id = '5621a1ff-f6ee-4ec4-bf7d-7c5dcdba09b1'
WHERE id IN ('1', '2', '3', '4', '5', '6', '7', '8');
