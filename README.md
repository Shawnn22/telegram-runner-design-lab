# Telegram Runner Demo

Hybrid fundraising demo for a Telegram Mini App that connects TON projects with real-world running campaigns.

## Demo flow

### Project portal (`/project`)

1. Approve a clearly labelled simulated KYB check.
2. Configure a global completion campaign.
3. Review reward pool and flexible fees.
4. Approve a simulated funding transaction and publish.

### Runner app

1. Start a Quick Run without joining a campaign or connecting a wallet.
2. Use live foreground GPS or a time-compressed demo route.
3. Finish one or more runs; Activity retains only compact proof records, not route maps.
4. Open Rewards to auto-match total verified distance against live campaign rules.
5. Connect the demo TON wallet only when an eligible reward is claimed.

Production KYB and anti-cheat are still pending. TON Connect wallet connection is live; the escrow contract and claim payload remain testnet configuration work, documented in `contracts/README.md`.

## Entry points

- `/` — user-only runner flow: Quick Run → Activity → Reward check.
- `/project` — separate portal for project KYB demo, campaign configuration and funding simulation. Do not use this URL as the bot's Mini App entry point.

## Local development

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
npm run build
npm test
```

## Test inside Telegram

Follow [TELEGRAM_TEST_SETUP.md](./TELEGRAM_TEST_SETUP.md) to attach the deployed URL to a bot's Main Mini App and Menu Button. A direct browser tab is only a browser preview; test the live GPS flow after opening the app from the bot inside the Telegram mobile app.

## Product documents

- `PRD_DEMO.md`
- `QA_FLOW_AUDIT.md`
- `RESEARCH_INDEX.md`
- `research/2026-08-15-preliminary-product-feasibility.md`
- `research/2026-08-15-product-decisions-and-demo-direction.md`
- `research/2026-08-16-runner-app-market-and-post-run-rewards.md`
