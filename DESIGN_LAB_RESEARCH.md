# Telegram Runner Design Lab — UI/UX direction

Updated: 2026-09-03

## Design decision

The Design Lab uses a **Midnight Field System** rather than a crypto dashboard: calm Telegram-aware planning surfaces, then a dark, high-contrast training instrument as soon as a session starts.

- One dominant action before a run: start a live foreground GPS session.
- During a run: distance, elapsed time, pace, GPS state, pause, and finish only. Reward information remains secondary.
- At the end: a compact private-receipt summary before the separate Rewards check.
- Tone: serious athletic tool, with signal blue for GPS/trust and acid-lime only for positive progress or live state.

## Research signals applied

1. Telegram Mini Apps receive live theme parameters. The app should be responsive, mobile-first, respect safe areas, and retain the host's visual behavior. This lab keeps Telegram colors as the surface fallback and uses a mobile bottom navigation that stays clear of safe areas.
   Source: https://core.telegram.org/bots/webapps

2. Apple’s workout guidance calls for a visually distinct active-workout state, large legible data during movement, easy-to-tap controls, clear sensor-state explanations, and a summary at session end. The dark live instrument panel, large distance metric, GPS state, and two-button pause/finish pattern directly follow those principles.
   Source: https://developer.apple.com/design/human-interface-guidelines/workouts

3. Strava’s July 2025 Record redesign places the map and updating activity stats together in one intuitive recording surface. The lab retains a real map after a GPS fix and keeps the live metrics continuously visible beneath it.
   Source: https://press.strava.com/articles/strava-launches-redesigned-record-experience

## Scope boundary

This is a visual and interaction refinement only. GPS behavior, privacy receipt, TON Connect, and the existing demo reward boundary remain unchanged.
