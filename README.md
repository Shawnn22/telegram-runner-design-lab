# Telegram Runner Demo

Hybrid fundraising demo for a Telegram Mini App that connects TON projects with real-world running campaigns.

## Demo flow

### Project console

1. Approve a clearly labelled simulated KYB check.
2. Configure a global completion campaign.
3. Review reward pool and flexible fees.
4. Approve a simulated funding transaction and publish.

### Runner app

1. Connect the demo TON wallet state.
2. Join the sponsored campaign.
3. Use live foreground GPS or a time-compressed demo route.
4. Finish the run and save it to Activity.
5. Open Rewards for the separate eligibility check and demo claim.

The UI labels every mocked integration. Production KYB, anti-cheat and TON settlement are not represented as complete.

## Local development

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
npm run build
npm test
```

## Product documents

- `PRD_DEMO.md`
- `QA_FLOW_AUDIT.md`
- `RESEARCH_INDEX.md`
- `research/2026-08-15-preliminary-product-feasibility.md`
- `research/2026-08-15-product-decisions-and-demo-direction.md`
