-- Harden orders/order_items RLS (merchant and owner policies)

-- 1. RESTAURANTS POLICIES
DROP POLICY IF EXISTS "Merchant can insert own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Merchant can update own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Merchant can delete own restaurant" ON restaurants;

CREATE POLICY "Merchant can insert own restaurant"
  ON restaurants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Merchant can update own restaurant"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Merchant can delete own restaurant"
  ON restaurants FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);


-- 2. MENU_ITEMS POLICIES
DROP POLICY IF EXISTS "Merchant can insert own restaurant's menu items" ON menu_items;
DROP POLICY IF EXISTS "Merchant can update own restaurant's menu items" ON menu_items;
DROP POLICY IF EXISTS "Merchant can delete own restaurant's menu items" ON menu_items;

CREATE POLICY "Merchant can insert own restaurant's menu items"
  ON menu_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = menu_items.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Merchant can update own restaurant's menu items"
  ON menu_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = menu_items.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = menu_items.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Merchant can delete own restaurant's menu items"
  ON menu_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = menu_items.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );


-- 3. OFFERS POLICIES
DROP POLICY IF EXISTS "Public & Authenticated can insert offers" ON offers;
DROP POLICY IF EXISTS "Public & Authenticated can update offers" ON offers;
DROP POLICY IF EXISTS "Public & Authenticated can delete offers" ON offers;
DROP POLICY IF EXISTS "Merchant can insert own restaurant's offers" ON offers;
DROP POLICY IF EXISTS "Merchant can update own restaurant's offers" ON offers;
DROP POLICY IF EXISTS "Merchant can delete own restaurant's offers" ON offers;

CREATE POLICY "Merchant can insert own restaurant's offers"
  ON offers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = offers.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Merchant can update own restaurant's offers"
  ON offers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = offers.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = offers.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Merchant can delete own restaurant's offers"
  ON offers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = offers.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );


-- 4. ORDERS POLICIES
DROP POLICY IF EXISTS "Public & Authenticated can view orders" ON orders;
DROP POLICY IF EXISTS "Public & Authenticated can insert orders" ON orders;
DROP POLICY IF EXISTS "Public & Authenticated can update orders" ON orders;
DROP POLICY IF EXISTS "Users can select own orders, and merchants can select their own restaurant's orders" ON orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
DROP POLICY IF EXISTS "Merchants can update their own restaurant's orders" ON orders;

CREATE POLICY "Users can select own orders, and merchants can select their own restaurant's orders"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    OR
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Merchants can update their own restaurant's orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );


-- 5. ORDER_ITEMS POLICIES
DROP POLICY IF EXISTS "Public & Authenticated can view order items" ON order_items;
DROP POLICY IF EXISTS "Public & Authenticated can insert order items" ON order_items;
DROP POLICY IF EXISTS "Users can select own order items, and merchants can select their own restaurant's order items" ON order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;

CREATE POLICY "Users can select own order items, and merchants can select their own restaurant's order items"
  ON order_items FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()::text)
        OR
        EXISTS (
          SELECT 1 FROM restaurants
          WHERE restaurants.id = orders.restaurant_id
          AND restaurants.owner_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Anyone can insert order items"
  ON order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
