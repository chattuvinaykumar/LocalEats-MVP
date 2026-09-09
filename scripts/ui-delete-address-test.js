/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

function loadEnv(file) {
  const env = {};
  const content = fs.readFileSync(file, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=([\s\S]*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

(async () => {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local not found');
    process.exit(1);
  }
  const env = loadEnv(envPath);
  const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    console.error('Supabase keys not found in .env.local');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

  // create a test user via Supabase; we'll perform UI login below
  const testEmail = `ui-delete-test+${Date.now()}@example.com`;
  const testPassword = 'Testpass123!';

  console.log('Creating test user:', testEmail);
  let createdUserId = null;
  try {
    const { data, error } = await supabase.auth.signUp({ email: testEmail, password: testPassword });
    if (error && !/already exists/.test(String(error.message))) console.warn('signUp warning:', error.message);
    if (data && data.user) createdUserId = data.user.id;
  } catch (err) {
    console.error('Auth signup failed', err);
    process.exit(1);
  }

  const appUrl = process.env.APP_URL || 'http://localhost:19006';

  // Run headed with slowMo for visibility during debugging
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));
  page.on('response', resp => {
    try {
      const url = resp.url();
      if (url.includes('supabase.co')) {
        console.log('SUPABASE RESP:', resp.status(), url);
      }
    } catch (e) { console.warn('response event handler failed', e); }
  });

  // Do not auto-accept confirm dialogs; we use in-UI modal flows now.

  console.log('Opening app at', appUrl);
  await page.goto(`${appUrl}/auth/login`, { waitUntil: 'networkidle' });

  // Perform UI login to ensure the in-app Supabase client is authenticated
  await page.fill('input[placeholder="Email Address"]', testEmail);
  await page.fill('input[placeholder="Password"]', testPassword);
  await page.locator('text=Sign In').first().click();
  // wait for auth token response to ensure login succeeded
  try {
    await page.waitForResponse(resp => resp.url().includes('/auth/v1/token') && resp.status() === 200, { timeout: 8000 });
  } catch (e) {
    console.error('Login did not complete (no auth token response)');
    // capture snapshot for debugging
    const snapPath = path.resolve(process.cwd(), 'debug-after-login.png');
    await page.screenshot({ path: snapPath, fullPage: true });
  }

  // Navigate to delivery addresses page
  await page.goto(`${appUrl}/delivery-addresses`, { waitUntil: 'networkidle' });

  // Click Add Address
  await page.locator('text=Add Address').first().click();

  const label = `UI Test Addr ${Date.now()}`;
  await page.fill('input[placeholder="Label (e.g. Home, Work)"]', label);
  await page.fill('input[placeholder="Address line 1"]', '123 Test St');
  await page.fill('input[placeholder="Area / Locality"]', 'Test Area');
  await page.fill('input[placeholder="City"]', 'Test City');
  await page.fill('input[placeholder="State"]', 'TS');
  await page.fill('input[placeholder="ZIP / Postal Code"]', '12345');
  await page.fill('input[placeholder="Phone number"]', '9999999999');

  await page.locator('text=Save Address').first().click();
  // Wait for the Supabase insert to complete, then for the address to appear
  try {
    await page.waitForResponse(resp => resp.url().includes('/rest/v1/addresses') && resp.status() === 201, { timeout: 10000 });
  } catch (err) {
    console.error('No 201 response from Supabase after save; capturing debug snapshot');
    try {
      const snapPath = path.resolve(process.cwd(), 'debug-after-save.png');
      await page.screenshot({ path: snapPath, fullPage: true });
      const html = await page.content();
      fs.writeFileSync(path.resolve(process.cwd(), 'debug-after-save.html'), html, 'utf8');
      console.error('Wrote', snapPath, 'and debug-after-save.html');
    } catch (e) {
      console.error('Failed to capture debug snapshot', e);
    }
    await browser.close();
    process.exit(7);
  }

  try {
    await page.waitForSelector(`text=${label}`, { timeout: 10000 });
  } catch (err) {
    console.error('Timeout waiting for address label; capturing debug snapshot');
    try {
      const snapPath = path.resolve(process.cwd(), 'debug-after-save.png');
      await page.screenshot({ path: snapPath, fullPage: true });
      const html = await page.content();
      fs.writeFileSync(path.resolve(process.cwd(), 'debug-after-save.html'), html, 'utf8');
      console.error('Wrote', snapPath, 'and debug-after-save.html');
    } catch (e) {
      console.error('Failed to capture debug snapshot', e);
    }
    await browser.close();
    process.exit(6);
  }

  // Debug: count matching label nodes
  const matchCount = await page.locator(`text=${label}`).count();
  console.log('Label match count:', matchCount);

  // Click Delete within the same card: find element that contains the label, then click the following Delete button
  // Click the first Delete button on the page (should correspond to our single new address)
  await page.locator('text=Delete').first().click();

  // Confirm deletion in the modal
  await page.fill('input[placeholder="Type DELETE to confirm"]', 'DELETE');
  const val = await page.$eval('input[placeholder="Type DELETE to confirm"]', el => el.value).catch(() => null);
  console.log('Confirm input value:', val);
  await page.locator('text=Confirm Delete').first().click();

  // Wait for the label to disappear
  try {
    await page.waitForSelector(`text=${label}`, { state: 'detached', timeout: 10000 });
  } catch (e) {
    console.error('Address still present after delete in UI');
    await browser.close();
    process.exit(2);
  }

  // Reload and verify remains deleted
  await page.reload({ waitUntil: 'networkidle' });
  const still = await page.locator(`text=${label}`).count();
  if (still > 0) {
    console.error('Address reappeared after reload');
    await browser.close();
    process.exit(3);
  }

  // Verify Supabase that address is deleted
  try {
    // Query Supabase for any addresses matching the test address and user
    const q = supabase.from('addresses').select('*').eq('address_line', '123 Test St');
    if (createdUserId) q.eq('user_id', createdUserId);
    const { data: rows, error } = await q;
    if (error) throw error;
    if (rows && rows.length === 0) {
      console.log('SUCCESS: Address deleted from Supabase and UI');
      await browser.close();
      process.exit(0);
    } else {
      console.error('Address still present in Supabase after UI delete');
      await browser.close();
      process.exit(4);
    }
  } catch (err) {
    console.error('Error querying Supabase for address verification', err);
    await browser.close();
    process.exit(5);
  }

})();
