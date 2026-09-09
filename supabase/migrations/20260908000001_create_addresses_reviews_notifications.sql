-- Create addresses, reviews, notifications, payment_events and platform_roles

-- 1. ADDRESSES
CREATE TABLE IF NOT EXISTS addresses (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text,
  recipient_name text,
  phone text,
  address_line text NOT NULL,
  city text,
  state text,
  postal_code text,
  latitude numeric,
  longitude numeric,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses"
  ON addresses FOR ALL
  TO authenticated
  USING (auth.uid()::uuid = user_id)
  WITH CHECK (auth.uid()::uuid = user_id);


-- 2. REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id text NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id text REFERENCES orders(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >=1 AND rating <=5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read of reviews
CREATE POLICY "Public can view reviews"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert rule: user can insert review only if they are the authenticated user AND they have an order matching this restaurant
CREATE POLICY "Users can insert own reviews if they ordered"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()::uuid
    AND EXISTS (
      SELECT 1 FROM orders o
      WHERE o.user_id = auth.uid()::text
      AND o.restaurant_id = reviews.restaurant_id
    )
  );

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid()::uuid = user_id)
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid()::uuid = user_id);


-- 3. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  category text,
  related_entity text,
  related_id text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (auth.uid()::uuid = user_id)
  WITH CHECK (auth.uid()::uuid = user_id);


-- 4. PAYMENT EVENTS
CREATE TABLE IF NOT EXISTS payment_events (
  id text PRIMARY KEY,
  order_id text REFERENCES orders(id) ON DELETE CASCADE,
  provider text,
  event_type text,
  payload jsonb,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform can insert payment events"
  ON payment_events FOR INSERT
  TO authenticated
  WITH CHECK (true);


-- 5. PLATFORM ROLES
CREATE TABLE IF NOT EXISTS platform_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own role"
  ON platform_roles FOR SELECT
  TO authenticated
  USING (auth.uid()::uuid = user_id);

-- Admin population and management should be done server-side by an operator.
