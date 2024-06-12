# Discord Bot Template

## Setup

1. **Install Dependencies**: Make sure you have Node.js installed. Then, install the necessary dependencies by running:
    ```
    npm install
    ```

2. **Create a `.env` File**: Place a `.env` file in the same directory as `bot.js` with your Discord bot authentication token. You can find this token in the [Discord Developer Portal](https://discord.com/developers/applications). The `.env` file should contain a single line like this:
    ```
    TOKEN="YOUR_BOT_TOKEN"
    ```

3. **Configuration**: Fill out the developer section in the `config.js` file.

## Start Up

Start the bot by running:
```
node bot.js
```