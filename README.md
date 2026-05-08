# <img height=30 width=30 src="https://telegram.org/img/t_logo.png" alt="TGL"> Telegram-to-Discord Monitor Event

**Important Note:** This is **not a Discord bot** itself. It is a standalone event module designed to be integrated into an existing Discord.js bot. This module monitors Telegram channels and forwards messages to a Discord webhook.

A specialized event module for Discord.js bots that monitors specific Telegram activities and bridges them to Discord via webhooks. This module is designed to be easily integrated into existing bot structures.

## 📂 Project Structure

To use this module, ensure your bot's directory is organized as follows:

```bash
your-bot/
├── index.js             # Your main bot file
├── config.json          # Configuration file (Root)
└── events/
    └── TGMonitor.js     # This event file
```

## ⚙️ Installation & Setup

### 1. File Placement
Move the `TGMonitor.js` file into your bot's `events/` folder. This is a single, standalone event that will be loaded by your Discord.js bot's event handler.

### 2. Configuration
Open your existing `config.json` in the root directory and add the necessary credentials. It should look like this:

```json
{
  "TG_API_ID": "YOUR_API_ID",
  "TG_API_HASH": "YOUR_API_HASH",
  "TG_SESSION": "YOUR_DB_CONNECTION_STRING",
  "DISCORD_Telegram_News_WEBHOOK": "YOUR_DISCORD_WEBHOOK_URL"
}
```

Note: If your `config.json` is located in a different directory, you must update the path on Line 7 of `TGMonitor.js`:
```js
const config = require('../config.json'); // Adjust the path here if needed
```

#### Channel Configuration
You must specify the Telegram channel usernames to monitor in the `TGMonitor.js` file. Edit the `channelNames` array on Line 13:

```js
const channelNames = ['IranintlTV', 'another_channel', 'third_channel'];
```

**Example:**
- For a channel like `https://t.me/example_channel`, use `'example_channel'`
- Add multiple channels as comma-separated strings in the array

### 3. Install Dependencies
This module requires several dependencies for Telegram API interaction and date handling. Run the following command in your terminal:
```bash
npm install telegram axios luxon jalaali-js chalk
```

## 🚀 How to Run
Once the file is placed correctly and dependencies are installed, simply start your bot:
```bash
node index.js
```
The event loader in your main file will automatically detect and execute the `TGMonitor.js` logic.
