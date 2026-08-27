/**
 * MEP FAN LTD. - Industrial OEE Management System
 * Automated Monthly WhatsApp Reminder Script
 *
 * Schedule: Every 29th of the month at 09:00 AM & 07:00 PM (19:00 BST / UTC+6)
 * Message: "সবাই অনুগ্রহ করে নিজেদের OEE Report পূরণ করে এখানে কনফার্মেশন করুন।"
 */

const https = require('https');

// Read configuration from environment variables (GitHub Secrets)
const idInstance = (process.env.GREEN_API_ID_INSTANCE || '').trim();
const apiTokenInstance = (process.env.GREEN_API_TOKEN || '').trim();
let chatId = (process.env.WHATSAPP_CHAT_ID || '').trim();

// Auto-format phone number if @c.us or @g.us is missing
if (chatId && !chatId.includes('@')) {
  // Remove non-digit characters
  chatId = chatId.replace(/[^0-9]/g, '');
  // If starts with 01 (Bangladesh local format 017...), prepend 88
  if (chatId.startsWith('01')) {
    chatId = '88' + chatId;
  }
  chatId = chatId + '@c.us';
}

const messageText = `📢 *MEP FAN LTD. - OEE Reminder*

সবাই অনুগ্রহ করে নিজেদের OEE Report পূরণ করে এখানে কনফার্মেশন করুন।

🌐 OEE Portal: MEP Industrial Management System
⏰ Time: ${new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka' })} (BST) | ${new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka' })}`;

console.log('════════════════════════════════════════════════════════════════');
console.log(' MEP FAN LTD. - Monthly WhatsApp OEE Reminder Dispatcher');
console.log('════════════════════════════════════════════════════════════════');
console.log(`Target Chat ID: ${chatId || '(Not set)'}`);
console.log(`Instance ID   : ${idInstance ? idInstance.substring(0, 4) + '****' : '(Not set)'}`);
console.log(`API Token     : ${apiTokenInstance ? '********' : '(Not set)'}`);
console.log('────────────────────────────────────────────────────────────────');

if (!idInstance || !apiTokenInstance || !chatId) {
  console.error('❌ Error: Missing required GitHub Secrets!');
  console.error('Please configure the following in GitHub Settings ➔ Secrets and variables ➔ Actions:');
  if (!idInstance) console.error('  - GREEN_API_ID_INSTANCE');
  if (!apiTokenInstance) console.error('  - GREEN_API_TOKEN');
  if (!chatId) console.error('  - WHATSAPP_CHAT_ID');
  process.exit(1);
}

function sendWhatsAppMessage() {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      chatId: chatId,
      message: messageText
    });

    const options = {
      hostname: 'api.green-api.com',
      port: 443,
      path: `/waInstance${idInstance}/sendMessage/${apiTokenInstance}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`HTTP Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ WhatsApp message sent successfully!');
            console.log('Message ID:', json.idMessage || json);
            resolve(json);
          } else {
            console.error('❌ Green-API Error Response:', json);
            reject(new Error(`Green-API returned status ${res.statusCode}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Response:', data);
            resolve({ raw: data });
          } else {
            console.error('❌ Error Response:', data);
            reject(new Error(`HTTP error ${res.statusCode}: ${data}`));
          }
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Network Connection Error:', err.message);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

sendWhatsAppMessage()
  .then(() => {
    console.log('────────────────────────────────────────────────────────────────');
    console.log('🎉 Workflow completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('────────────────────────────────────────────────────────────────');
    console.error('❌ Failed to dispatch WhatsApp reminder:', err.message);
    process.exit(1);
  });
