import http from 'http';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const PORT = process.env.PORT || 8787;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RAZORPAY_SECRET = process.env.RAZORPAY_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RAZORPAY_SECRET) {
  console.error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RAZORPAY_SECRET');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function verifySignature(body, signature) {
  const hex = crypto.createHmac('sha256', RAZORPAY_SECRET).update(body).digest('hex');
  const b64 = crypto.createHmac('sha256', RAZORPAY_SECRET).update(body).digest('base64');
  return signature === hex || signature === b64;
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/razorpay-webhook') {
    res.writeHead(404); res.end(); return;
  }
  let raw = '';
  req.on('data', chunk => raw += chunk);
  req.on('end', async () => {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature || !verifySignature(raw, signature)) {
      res.writeHead(400); res.end('invalid signature'); return;
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (e) {
      res.writeHead(400); res.end('invalid json'); return;
    }

    // Extract payment id and order id
    const razorpayPaymentId = payload?.payload?.payment?.entity?.id || payload?.payload?.payment?.entity?.razorpay_payment_id;
    const razorpayOrderId = payload?.payload?.payment?.entity?.order_id;
    const status = payload?.event || 'payment.captured';

    try {
      // Find payment_event by transaction_id
      const { data } = await supabase.from('payment_events').select('*').eq('transaction_id', razorpayPaymentId).maybeSingle();
      if (data) {
        // Update payment_events verified flag and store payload
        await supabase.from('payment_events').update({ verified: true, payload }).eq('id', data.id);
        // Also mark order as paid
        if (data.order_id && (status.includes('captured') || status.includes('paid') || status.includes('authorized'))) {
          await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', data.order_id);
        }
      }
    } catch (e) {
      console.error('Webhook processing failed', e);
      res.writeHead(500); res.end('internal error'); return;
    }

    res.writeHead(200);
    res.end('ok');
  });
});

server.listen(PORT, () => console.log(`Razorpay webhook listening on ${PORT}`));
