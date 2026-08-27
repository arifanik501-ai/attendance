/**
 * MEP FAN LTD. - Industrial OEE Management System
 * Automated Monthly WhatsApp Reminder Script
 *
 * Schedule: Every 29th of the month at 09:00 AM & 07:00 PM (19:00)
 * Message: "সবাই অনুগ্রহ করে নিজেদের OEE Report পূরণ করে এখানে কনফার্মেশন করুন।"
 */

const https = require('https');

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION (GREEN-API / WHATSAPP API SETTINGS)
// ══════════════════════════════════════════════════════════════════════════════
const CONFIG = {
  // Option 1: Green-API (https://green-api.com)
  greenApi: {
    idInstance: process.env.GREEN_API_ID_INSTANCE || 'YOUR_ID_INSTANCE',
    apiTokenInstance: process.env.GREEN_API_TOKEN || 'YOUR_API_TOKEN_INSTANCE',
    // chatId can be an individual number '8801XXXXXXXXX@c.us' or a group 'XXXXXXXXXX@g.us'
    chatId: process.env.WHATSAPP_CHAT_ID || '8801XXXXXXXXX@c.us'
  },

  // Reminder Message
  message: `📢 *MEP FAN LTD. - OEE Reminder*

সবাই অনুগ্রহ করে নিজেদের OEE Report পূরণ করে এখানে কনফার্মেশন করুন।

🌐 OEE Portal: MEP Industrial Management System
⏰ Time: ${new Date().toLocaleTimeString('en-GB')} | ${new Date().toLocaleDateString('en-GB')}`
};

/**
 * Send WhatsApp Message via Green-API
 */
function sendWhatsAppMessageGreenApi(chatId, message) {
  return new Promise((resolve, reject) => {
    const idInstance = CONFIG.greenApi.idInstance;
    const apiTokenInstance = CONFIG.greenApi.apiTokenInstance;

    if (idInstance === 'YOUR_ID_INSTANCE' || apiTokenInstance === 'YOUR_API_TOKEN_INSTANCE') {
      console.log('⚠️ [WhatsApp] API credentials not set yet. Please provide idInstance and apiTokenInstance.');
      resolve({ status: 'unconfigured' });
      return;
    }

    const payload = JSON.stringify({
      chatId: chatId || CONFIG.greenApi.chatId,
      message: message
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
        try {
          const json = JSON.parse(data);
          console.log('✅ [WhatsApp] Message sent successfully:', json);
          resolve(json);
        } catch (e) {
          console.log('✅ [WhatsApp] Response:', data);
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ [WhatsApp] Error sending message:', err);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

// If executed directly from CLI or Cron
if (require.main === module) {
  console.log('🚀 Executing Monthly WhatsApp Reminder...');
  sendWhatsAppMessageGreenApi(CONFIG.greenApi.chatId, CONFIG.message)
    .then(() => console.log('Done.'))
    .catch((err) => console.error('Failed:', err));
}

module.exports = {
  sendWhatsAppMessageGreenApi,
  CONFIG
};
