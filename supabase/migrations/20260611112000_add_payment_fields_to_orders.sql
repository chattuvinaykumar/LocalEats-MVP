-- Add payment integration fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'COD',
ADD COLUMN IF NOT EXISTS transaction_id text;
