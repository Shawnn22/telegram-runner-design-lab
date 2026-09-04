# Stride runner UI research and map reliability decisions

Updated: 2026-09-04

## Scope

Review runner-app patterns from Dribbble and apply only patterns that improve the live running flow. Diagnose why the current live map and tracking appear stuck.

## Design patterns selected

1. **Map-first live tracker.** Dribbble concepts consistently keep the live route visible with distance, duration, and pace in a strong hierarchy. Stride keeps the map above the three essential metrics.
2. **One-tap start.** The run screen keeps one primary Start action; wallet and rewards remain separate.
3. **Compact route card.** Post-run and activity surfaces remain concise rather than adding a dense fitness dashboard.
4. **Light, energetic palette.** White/ice surfaces with Telegram blue route lines and mint progress signals.
5. **Useful additions only.** Added map-ready state, current-location marker, live route line, GPS quality explanation, retry, and recenter. Deferred music, friends-on-map, heart rate, and advanced running dynamics because they require new permissions, devices, or social infrastructure.

## References

- Dribbble search: https://dribbble.com/search/runner-app
- Running Mobile App UI Design: https://dribbble.com/shots/26346900-Running-Mobile-App-UI-Design
- Running Tracker Widget: https://dribbble.com/shots/27376685-Running-Tracker-Widget-Fitness-App-UI-Run-Route-Widget
- GPS Running Tracker and Social Fitness UI: https://dribbble.com/shots/27669887-GPS-Running-Tracker-Social-Fitness-Mobile-App-UI-Design
- Running App UI Exploration: https://dribbble.com/shots/26296854-Running-App-UI-Design-Exploration
- Telegram Mini Apps LocationManager: https://core.telegram.org/bots/webapps
- MapLibre GL JS: https://maplibre.org/maplibre-gl-js/docs/
- OpenFreeMap quick start: https://openfreemap.org/quick_start/

## Root cause and fix

- The old map was an OpenStreetMap export iframe created only after the first accepted GPS fix. The iframe endpoint timed out during verification.
- GPS points with accuracy worse than 65 m were rejected before setting the visible position. A normal coarse first fix therefore left the entire map in a permanent waiting state.
- Telegram polling started only when that first fix also populated the accepted-point ref. A coarse first response could prevent follow-up Telegram readings.
- The new MapLibre map loads immediately with an OpenFreeMap style, shows coarse position without counting distance, polls after any Telegram location response, and draws only accepted points into the route. A denied GPS request remains on the tracking screen with retry/settings actions.

## Production boundary

OpenFreeMap is suitable for this demo and requires attribution, which MapLibre displays. It does not provide an SLA. Before a high-volume launch, choose a contracted map provider or self-host tiles. Physical-device Telegram GPS still requires validation on iOS and Android.
