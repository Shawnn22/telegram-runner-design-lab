# Stride capability upgrade

Updated: 2026-09-04

## Goal

Make the Design Lab behave like a usable foreground running app without adding any API-key-dependent integration.

## Implemented

- Three-second start countdown and Telegram haptic feedback.
- Separate moving and elapsed time.
- GPS route drawing with a 3 m accumulation anchor, accuracy filter, speed/jump rejection and quality receipt.
- Auto-pause after 20 seconds without accepted movement, plus manual pause/resume.
- Active-session recovery after reload; raw route points exist only while the session is active and are deleted at finish.
- Kilometer splits, average pace, longest run, current streak and best pace.
- Rich run summary, activity verification states and Telegram/native sharing.
- Pre-run workout selection for Easy, Tempo and Long runs; the choice is retained in each activity receipt.
- Seven-day journey visualization and three progressive runner milestones in Run History.
- Solar Sprint visual-depth system: atmospheric light field, glass navigation, layered elevations, deep focal surfaces and a typography-only header wordmark.
- Quick Launch Dock surfaces GPS mode, current training plan and the primary Start action before brand storytelling, with a compact mobile layout.
- Rewards stays visible as an optional feature. With no active campaign it shows an honest waiting state; campaign rules, matching and claim controls mount only when campaign data is active.
- Automatic reward matching when an active campaign opens in Rewards; wallet remains claim-only.

## Explicit demo or external-infrastructure boundaries

- Run history remains device-local until a production backend and verified Telegram initData endpoint are configured.
- TON Connect is live, but escrow deployment, oracle signatures, Merkle claims and notifications require production contract/backend infrastructure.
- CARTO tiles still show their API-key watermark; map provider work is intentionally excluded from this sprint.
- Physical GPS behavior must still be validated on Telegram iOS and Android while moving outdoors.

## Verification

- npm test
- npm run lint
- git diff --check
- Production build and deployment bundle inspection
