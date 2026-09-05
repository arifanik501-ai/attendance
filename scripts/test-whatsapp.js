/**
 * Quick Test Script for WhatsApp Connection
 * Run this to immediately send a test message to your WhatsApp Group.
 * 
 * Usage in terminal:
 *   $env:GREEN_API_INSTANCE="your_instance"
 *   $env:GREEN_API_TOKEN="your_token"
 *   $env:WHATSAPP_CHAT_ID="your_group_id@g.us"
 *   node scripts/test-whatsapp.js
 */

const https = require('https');

const INSTANCE_ID = process.env.GREEN_API_INSTANCE;
const API_TOKEN = process.env.GREEN_API_TOKEN;
const CHAT_ID = process.env.WHATSAPP_CHAT_ID;

if (!INSTANCE_ID || !API_TOKEN || !CHAT_ID) {
  console.error('\n❌ ভুল: Green-API ক্রেডেনশিয়াল পাওয়া যায়নি!');
  console.error('অনুগ্রহ করে নিচের মত করে মানগুলো সেট করে রান করুন:\n');
  console.error('  $env:GREEN_API_INSTANCE="110182xxxx"');
  console.error('  $env:GREEN_API_TOKEN="your_token_here"');
  console.error('  $env:WHATSAPP_CHAT_ID="120363xxxxxx@g.us"');
  console.error('  node scripts/test-whatsapp.js\n');
  process.exit(1);
}

const payload = JSON.stringify({
  chatId: CHAT_ID,
  message: '🤖 *টেস্ট নোটিফিকেশন*\n\nআপনার MEP এটেন্ডেন্স WhatsApp বট সফলভাবে কানেক্ট হয়েছে! ✅'
});

const options = {
  hostname: 'api.green-api.com',
  path: `/waInstance${INSTANCE_ID}/sendMessage/${API_TOKEN}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log('📡 হোয়াটসঅ্যাপ গ্রুপে টেস্ট মেসেজ পাঠানো হচ্ছে...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ সফল! আপনার হোয়াটসঅ্যাপ গ্রুপ চেক করুন, টেস্ট মেসেজ চলে গেছে।');
      console.log('সার্ভার রেসপন্স:', data);
    } else {
      console.error(`❌ মেসেজ যায়নি (Status ${res.statusCode}):`, data);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ কানেকশন এরর:', err.message);
});

req.write(payload);
req.end();
