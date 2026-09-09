-- Modify orders INSERT policy to block new orders when restaurant is not OPEN

-- Drop existing insert policy and recreate with an extra check that restaurant is OPEN
DROP POLICY IF EXISTS "Authenticated users can insert own orders" ON orders;

CREATE POLICY "Authenticated users can insert own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM restaurants r WHERE r.id = orders.restaurant_id AND r.operating_status = 'OPEN'
    )
  );
