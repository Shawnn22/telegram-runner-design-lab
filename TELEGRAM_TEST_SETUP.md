# Test Telegram Runner inside Telegram

## Goal

Open the deployed runner as a real Telegram Mini App, so the app receives Telegram WebApp context and requests location through Telegram's `LocationManager`.

## One-time BotFather setup

Use an existing bot, or create a test bot with [@BotFather](https://t.me/BotFather).

1. Send `/mybots`, choose the bot, then open **Bot Settings → Menu Button**.
2. Set the button text to `Open Runner` and its URL to:
   `https://telegram-runner-demo.shawn22222.chatgpt.site`
3. In **Bot Settings → Configure Mini App**, enable the **Main Mini App** and use the same URL. This creates the bot-profile **Launch app** button.
4. Open the bot on the Telegram mobile app and tap either **Open Runner** or **Launch app**.

## Expected signal

The top-right pill must say **Telegram session**. If it says **Browser preview**, the URL was opened outside Telegram and will only use browser location fallback.

## GPS test

1. In the bot, open Runner app.
2. Confirm **Live GPS** is selected (it is the default).
3. Tap **Enable GPS & start** and approve Telegram's location prompt.
4. Move outdoors for a stable signal. The tracking screen should show **LIVE GPS** and a status like `Telegram GPS · ±12m`.
5. Tap **Finish run**. Only the activity summary/proof is saved; raw route points are not persisted.

## If GPS is blocked

- Tap **Open Telegram settings** in the runner, then allow location for Telegram.
- Check phone-level location permission for Telegram and retry outdoors.
- Do not use the **Demo route** toggle: it deliberately displays `DEMO ROUTE` and simulates distance.

## Security boundary

This setup requires no bot token in the app or in this repository. Do not paste a BotFather token into the client code. The current project still treats campaign settlement, KYB/KYC, and anti-cheat as demo flows.

## Official references

- [Telegram Mini Apps: Menu Button and Main Mini App](https://core.telegram.org/bots/webapps#launching-mini-apps-from-the-menu-button)
- [Telegram Mini Apps: Geolocation access](https://core.telegram.org/bots/webapps#geolocation-access)
