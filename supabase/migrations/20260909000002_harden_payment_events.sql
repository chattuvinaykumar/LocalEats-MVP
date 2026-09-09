-- Harden payment_events insert policy: only allow creating unverified events tied to orders the user owns or for merchants

DROP POLICY IF EXISTS "Platform can insert payment events" ON payment_events;

CREATE POLICY "Authenticated can insert payment events for their orders or merchant restaurants"
  ON payment_events FOR INSERT
  TO authenticated
  WITH CHECK (
    verified = false
    AND (
      -- order owner creating payment event
      (order_id IS NOT NULL AND EXISTS (SELECT 1 FROM orders o WHERE o.id = payment_events.order_id AND o.user_id = auth.uid()::text))
      OR
      -- restaurant owner creating payment event (merchant)
      (order_id IS NOT NULL AND EXISTS (SELECT 1 FROM orders o JOIN restaurants r ON r.id = o.restaurant_id WHERE o.id = payment_events.order_id AND r.owner_id = auth.uid()))
    )
  );
