const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { NewMessage } = require('telegram/events');
const axios = require('axios');
const { DateTime } = require('luxon');
const jalaali = require('jalaali-js');
const config = require('../config.json'); 
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

/* ========= CONFIG & CHANNELS ========= */
const channelNames = []; 

const apiId = Number(config.TG_API_ID);
const apiHash = config.TG_API_HASH;
const stringSession = new StringSession(config.TG_SESSION || "");
const DISCORD_WEBHOOK = config.DISCORD_Telegram_News_WEBHOOK;
const SEND_DELAY_MS = 4000; 
const TELEGRAM_LOGO = "https://telegram.org/img/t_logo.png";
const TELEGRAM_BLUE = 0x0088cc;

/* ========= UTILS ========= */
function getJalaaliTimestamp(messageDate) {
    const now = DateTime.fromSeconds(messageDate).setZone('Asia/Tehran');
    
    // (1/7/2026)
    const gregorianStr = `${now.month}/${now.day}/${now.year}`;
    
    // (1404/10/17)
    const gDate = { gy: now.year, gm: now.month, gd: now.day };
    const jDate = jalaali.toJalaali(gDate.gy, gDate.gm, gDate.gd);
    const shamsiStr = `${jDate.jy}/${String(jDate.jm).padStart(2, '0')}/${String(jDate.jd).padStart(2, '0')}`;
    
    // (20:30)
    const timeStr = now.toFormat('HH:mm');
    
    return `${gregorianStr} - ${shamsiStr} | ${timeStr}`;
}

const queue = [];
let sending = false;

async function processQueue() {
    if (sending || queue.length === 0) return;
    sending = true;

    const job = queue.shift();
    try {
        await axios.post(DISCORD_WEBHOOK, job.payload);
        console.log(chalk.cyan(`[Telegram GetWay] Forwarded: ${job.title}`));
        console.info(chalk.blue(`================================`));
    } catch (e) {
        console.error(chalk.red(`[Telegram GetWay] Webhook Error: ${e.message}`));
        console.info(chalk.blue(`================================`));
    }

    setTimeout(() => {
        sending = false;
        processQueue();
    }, SEND_DELAY_MS);
}

/* ========= EVENT EXPORT ========= */
module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        console.info(chalk.green('Starting Telegram GetWay...'));

        const tgClient = new TelegramClient(stringSession, apiId, apiHash, {
            connectionRetries: 5,
        });

        try {
            await tgClient.start({
                phoneNumber: async () => await new Promise(resolve => {
                    const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
                    readline.question(chalk.yellow('Phone (+98...): '), (phone) => { readline.close(); resolve(phone); });
                }),
                password: async () => await new Promise(resolve => {
                    const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
                    readline.question(chalk.yellow('2FA Password: '), (pass) => { readline.close(); resolve(pass); });
                }),
                phoneCode: async () => await new Promise(resolve => {
                    const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
                    readline.question(chalk.yellow('Code: '), (code) => { readline.close(); resolve(code); });
                }),
                onError: (err) => console.log(chalk.red(err.message)),
            });

            console.info(chalk.green('✅ Telegram GetWay is Online!'));
            console.info(chalk.blue(`================================`));

            const sessionStr = tgClient.session.save();
            if (config.TG_SESSION !== sessionStr) {
                config.TG_SESSION = sessionStr;
                const configPath = path.join(__dirname, '../config.json');
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                console.log(chalk.magenta('💾 New Session saved to config.json!'));
            }

            tgClient.addEventHandler(async (event) => {
                const msg = event.message;
                if (!msg) return;

                const chat = await msg.getChat();
                const channelUsername = chat.username || "Private Channel";
                
                let description = msg.message || "";
                if (msg.media && !description) description = "📎 [Media / File]";

                const jaliTime = getJalaaliTimestamp(msg.date);

                const payload = {
                    username: `TG: ${channelUsername}`,
                    avatar_url: TELEGRAM_LOGO,
                    content: "\u200B",
                    embeds: [{
                        title: `📢 پست جدید از ${chat.title || channelUsername}`,
                        description: description,
                        url: chat.username ? `https://t.me/${chat.username}/${msg.id}` : null,
                        color: TELEGRAM_BLUE,
                        footer: {
                            text: jaliTime,
                            icon_url: TELEGRAM_LOGO,
                        },
                    }],
                };

                queue.push({
                    title: `${channelUsername}#${msg.id}`,
                    payload,
                });

                processQueue();

            }, new NewMessage({ chats: channelNames }));

            console.info(chalk.white(`👀 Monitoring: ${channelNames.join(', ')}`));
            console.info(chalk.blue(`================================`));

        } catch (error) {
            console.error(chalk.red(`❌ Telegram Error: ${error.message}`));
        }
    }
};