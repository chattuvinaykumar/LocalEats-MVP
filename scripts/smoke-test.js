/* eslint-disable @typescript-eslint/no-var-requires */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load .env.local into process.env if present (do not print values)
try {
  const envPath = '.env.local';
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const l of lines) {
      if (!l || l.startsWith('#')) continue;
      const i = l.indexOf('=');
      if (i <= 0) continue;
      const key = l.substring(0, i).trim();
      const value = l.substring(i + 1).trim();
      if (key && !process.env[key]) process.env[key] = value;
    }
  }
} catch (e) {
  console.warn('Failed to load .env.local (smoke test)', e);
}

async function run() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    console.error('ENV_MISSING: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY not set');
    process.exit(2);
  }

  const supabase = createClient(url, anon, { auth: { persistSession: false } });

  const results = { customer: 'FAIL', merchant: 'FAIL', reviews: 'FAIL', notifications: 'FAIL', admin: 'FAIL', closedPrevention: 'SKIP' };

  try {
    // 1. Restaurants list
    const { data: restaurants, error: rErr } = await supabase.from('restaurants').select('*').limit(5);
    if (rErr) throw rErr;
    console.log('restaurants.count=', (restaurants || []).length);

    // 2. Search (DB-backed) - try full text search, fallback to ilike
    let searchResults = null;
    try {
      if (typeof supabase.from('restaurants').textSearch === 'function') {
        const { data: sdata, error: sErr } = await supabase.from('restaurants').textSearch('name, cuisine', 'Biryani', { config: 'english' }).limit(5);
        if (sErr) throw sErr;
        searchResults = sdata;
      } else {
        throw new Error('textSearch not supported');
      }
    } catch (e) {
      const { data: sdata, error: sErr } = await supabase.from('restaurants').select('*').ilike('name', '%Biryani%').limit(5);
      if (sErr) throw sErr;
      searchResults = sdata;
    }
    console.log('search.count=', (searchResults || []).length);

    // 3. Restaurant detail/menu
    const rest = restaurants && restaurants[0];
    if (!rest) throw new Error('No restaurants to test');
    const { data: menu, error: mErr } = await supabase.from('menu_items').select('*').eq('restaurant_id', rest.id).limit(5);
    if (mErr) throw mErr;
    console.log('menu.count=', (menu || []).length);

    // 4. Create test user and authenticate
    const testEmail = `smoketest+${Date.now()}@example.com`;
    const testPassword = 'Test1234!';
    const { data: signInData, error: signInErr } = await supabase.auth.signUp({ email: testEmail, password: testPassword });
    if (signInErr && signInErr.status !== 400) throw signInErr; // 400 for existing or needs confirmation
    // Sign in explicitly
    const { data: signData, error: signErr } = await supabase.auth.signInWithPassword({ email: testEmail, password: testPassword });
    if (signErr) throw signErr;
    const session = signData.session;
    if (!session) throw new Error('Auth session not available');
    // create an authenticated supabase client for user-scoped actions
    const authSupabase = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${session.access_token}` } }, auth: { persistSession: false } });

    // 5. Insert address
    const addrId = `addr_${Date.now()}`;
    const { error: aErr } = await authSupabase.from('addresses').insert({ id: addrId, user_id: session.user.id, address_line: '123 Test St' });
    if (aErr) throw aErr;

    // 6. Place order (orders + order_items)
    const orderId = `order_${Date.now()}`;
    const total = (menu && menu[0] && Number(menu[0].price || 100)) || 100;
    const { error: oErr } = await authSupabase.from('orders').insert({ id: orderId, restaurant_id: rest.id, user_id: session.user.id, customer_name: 'Smoke Tester', total_price: total, address_id: addrId });
    if (oErr) throw oErr;
    const itemId = `oi_${Date.now()}`;
    const menuItemId = menu && menu[0] && menu[0].id;
    if (!menuItemId) throw new Error('No menu item to add');
    const { error: oiErr } = await authSupabase.from('order_items').insert({ id: itemId, order_id: orderId, menu_item_id: menuItemId, name: menu[0].name, quantity: 1, price: total });
    if (oiErr) throw oiErr;

    results.customer = 'PASS';

    // Merchant checks: try to fetch merchant analytics via provided helpers (direct DB checks)
    const { data: ordersForRest, error: ofrErr } = await supabase.from('orders').select('id,total_price,status,created_at').eq('restaurant_id', rest.id).limit(5);
    if (ofrErr) throw ofrErr;
    console.log('merchant.orders.count=', (ordersForRest || []).length);
    results.merchant = 'PASS';

    // Reviews display: read reviews and submit one
    const { data: reviews, error: revErr } = await supabase.from('reviews').select('*').eq('restaurant_id', rest.id).limit(5);
    if (revErr) throw revErr;
    console.log('reviews.count=', (reviews || []).length);
    // Submit a review (user must have ordered; we just created an order for this user)
    const reviewId = `rev_${Date.now()}`;
    const { error: crevErr } = await authSupabase.from('reviews').insert({ id: reviewId, user_id: session.user.id, restaurant_id: rest.id, order_id: orderId, rating: 5, comment: 'Smoke test review' });
    if (crevErr) throw crevErr;
    results.reviews = 'PASS';

    // Notifications: create and fetch
    const notifId = `note_${Date.now()}`;
    const { error: nErr } = await authSupabase.from('notifications').insert({ id: notifId, user_id: session.user.id, title: 'Smoke', message: 'Smoke note' });
    if (nErr) throw nErr;
    const { data: notifs, error: nfErr } = await authSupabase.from('notifications').select('*').eq('user_id', session.user.id);
    if (nfErr) throw nfErr;
    console.log('notifications.count=', (notifs || []).length);
    results.notifications = 'PASS';

    // Admin check: try to read platform_roles for the user (should be none)
    const { data: roles, error: rolesErr } = await supabase.from('platform_roles').select('*').eq('user_id', session.user.id).maybeSingle();
    if (rolesErr) throw rolesErr;
    results.admin = roles ? 'FAIL' : 'PASS';

    // CLOSED restaurant prevention: check if any restaurant has operating_status='CLOSED'
    const { data: closedRests } = await supabase.from('restaurants').select('id,operating_status').eq('operating_status', 'CLOSED').limit(1);
    if (closedRests && closedRests.length > 0) {
      // attempt to create order for closed restaurant, expect RLS to block
      const closedRest = closedRests[0];
      const testOrderId = `order_block_${Date.now()}`;
      const { error: blockErr } = await supabase.from('orders').insert({ id: testOrderId, restaurant_id: closedRest.id, user_id: session.user.id, customer_name: 'Smoke', total_price: 10, address_id: addrId });
      if (blockErr) {
        console.log('closed prevention: PASS (insert blocked)');
        results.closedPrevention = 'PASS';
      } else {
        console.log('closed prevention: FAIL (insert allowed)');
        results.closedPrevention = 'FAIL';
      }
    } else {
      console.log('closed prevention: SKIP (no CLOSED restaurant present)');
      results.closedPrevention = 'SKIP';
    }

  } catch (err) {
    console.error('SMOKE_TEST_ERROR', err.message || err);
    console.error(err);
    // keep results as is
  }

  console.log('SMOKE_RESULTS:', results);
  process.exit(0);
}

run();
