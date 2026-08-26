/**
 * Daily WhatsApp Attendance Reminder Script
 * Checks Firebase RTDB to see if section in-charges have updated today's attendance.
 * If any section is pending at 9:00 AM (BST), it sends a direct WhatsApp @Mention reminder.
 * If all sections are updated, no message is sent.
 * 
 * Note: 'Anik' (Entry Sheet - Anik) is excluded as requested.
 */

const https = require('https');

// Configuration
const FIREBASE_URL = process.env.FIREBASE_DB_URL || 'https://whatsapp-c10ef-default-rtdb.firebaseio.com/mep_dashboard_state/history.json';
const INSTANCE_ID = process.env.GREEN_API_INSTANCE || '710722718282';
const API_TOKEN = process.env.GREEN_API_TOKEN || 'daeb1508fc4942fa86057c95ed74a695e2b75d6d0c424e2fad';
const CHAT_ID = process.env.WHATSAPP_CHAT_ID || '120363347313467988@g.us';

// Monitored In-Charges with WhatsApp Phone Numbers for @Mentions
const REQUIRED_SECTIONS = [
  { id: 'anwar', title: 'Entry Sheet (Anwar)', nameBn: 'আনোয়ার ভাই', phone: '8801708814289' },
  { id: 'takbir', title: 'Entry Sheet (Takbir)', nameBn: 'তাকবীর ভাই', phone: '8801324719430' },
  { id: 'monir', title: 'Entry Sheet (Monir)', nameBn: 'মনির ভাই', phone: '8801728415768' },
  { id: 'bikash', title: 'Entry Sheet (Bikash)', nameBn: 'বিকাশ ভাই', phone: '8801777843436' }
];

function fetchFirebaseHistory() {
  return new Promise((resolve, reject) => {
    https.get(FIREBASE_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (!data || data === 'null') return resolve([]);
          const parsed = JSON.parse(data);
          resolve(Array.isArray(parsed) ? parsed : Object.values(parsed));
        } catch (e) {
          reject(new Error(`Failed to parse Firebase JSON: ${e.message}`));
        }
      });
    }).on('error', (err) => {
      reject(new Error(`Firebase request failed: ${err.message}`));
    });
  });
}

function sendWhatsAppMessage(messageText) {
  return new Promise((resolve, reject) => {
    if (!INSTANCE_ID || !API_TOKEN || !CHAT_ID) {
      return reject(new Error('Missing required Green-API credentials.'));
    }

    const payload = JSON.stringify({
      chatId: CHAT_ID,
      message: messageText
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

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseBody);
        } else {
          reject(new Error(`Green-API returned status ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Green-API request error: ${err.message}`));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Build dynamic Bengali reminder message with WhatsApp @Mentions
 */
function buildReminderMessage(pendingList) {
  const mentions = pendingList.map(item => `@${item.phone} (${item.nameBn})`);

  if (mentions.length === 1) {
    return `${mentions[0]}, আপনার শাখার এটেন্ডেন্স শিটটি আপডেট করুন।`;
  }

  if (mentions.length === 2) {
    return `${mentions[0]} ও ${mentions[1]}, আপনাদের শাখার এটেন্ডেন্স শিটটি আপডেট করুন।`;
  }

  const allExceptLast = mentions.slice(0, -1).join(', ');
  const lastMention = mentions[mentions.length - 1];
  return `${allExceptLast} ও ${lastMention}, আপনাদের শাখার এটেন্ডেন্স শিটটি আপডেট করুন।`;
}

async function main() {
  const now = new Date();
  const bdTimeString = now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
  const bdNow = new Date(bdTimeString);
  const startOfToday = new Date(bdNow.getFullYear(), bdNow.getMonth(), bdNow.getDate()).getTime();

  console.log(`Checking attendance for: ${bdNow.toLocaleDateString('en-GB')} (Asia/Dhaka)`);
  const history = await fetchFirebaseHistory();

  const updatedTodayMap = {};
  history.forEach(entry => {
    if (entry && entry.page && entry.timestamp && entry.timestamp >= startOfToday) {
      updatedTodayMap[entry.page] = true;
    }
  });

  const pendingSections = REQUIRED_SECTIONS.filter(sec => !updatedTodayMap[sec.title]);

  if (pendingSections.length === 0) {
    console.log('✅ All monitored sections updated today! No message sent.');
    return;
  }

  const message = buildReminderMessage(pendingSections);

  console.log('Constructed Message with @Mentions:\n' + message);
  const res = await sendWhatsAppMessage(message);
  console.log('✅ Sent successfully to WhatsApp group!', res);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
