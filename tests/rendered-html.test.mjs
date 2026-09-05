import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Stride running app shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Stride — Move with purpose/i);
  assert.match(html, /Make every/i);
  assert.match(html, /STRIDE SIGNAL/i);
  assert.match(html, /GLOBAL RUN CLUB/i);
  assert.doesNotMatch(html, /Project console/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("serves project submission outside the runner entry", async () => {
  const response = await render("/project");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /PROJECT PORTAL/i);
  assert.match(html, /Project verification/i);
  assert.match(html, /Open runner app/i);
});

test("keeps simulated integrations explicit", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /SIMULATED/);
  assert.match(page, /approve demo verification/i);
  assert.match(page, /Approve demo transaction/i);
  assert.match(page, /Demo boundary/i);
  assert.match(page, /navigator\.geolocation\.watchPosition/);
  assert.match(page, /LocationManager/);
  assert.match(page, /using device GPS instead/);
  assert.match(page, /initializeTelegramWebApp/);
  assert.match(page, /Telegram session/);
  assert.match(page, /Open Telegram settings/);
  assert.match(page, /useState<"demo" \| "live">\("live"\)/);
  assert.match(page, /trackingMode === "demo" &&/);
  assert.match(page, /<LiveRunMap latestPoint={livePoint} routePoints={routePoints} \/>/);
  assert.match(page, /setLivePoint\(next\)/);
  assert.match(page, /if \(accuracy > 65\) \{[\s\S]*?setLivePoint\(next\)/);
  assert.match(page, /receivedFirstFix && sessionId === liveSessionId\.current/);
  assert.match(page, /Finish & save/);
  assert.match(page, /pauseRun/);
  assert.match(page, /RunSummary/);
  assert.match(page, /Use device GPS/);
  assert.match(page, /GPS LOCKED · RECORDING/);
  assert.match(page, /setGpsLocked\(true\)/);
  assert.match(page, /ACTIVE_RUN_KEY/);
  assert.match(page, /AUTO_PAUSE_MS/);
  assert.match(page, /Auto-paused · movement stopped/);
  assert.match(page, /tracking-stats-three/);
  assert.match(page, /KILOMETER SPLITS/);
  assert.match(page, /route-energy-stage/);
  assert.match(page, /Quick start run/);
  assert.match(page, /READY TO RUN/);
  assert.match(page, /run-setup/);
  assert.doesNotMatch(page, /stride-logo-stage/);
  assert.match(page, /Recent movement/);
  assert.match(page, /Choose workout type/);
  assert.match(page, /activityType: ActivityType/);
  assert.match(page, /Seven day running journey/);
  assert.match(page, /Built by showing up/);
  assert.match(page, /function RunDetail/);
  assert.match(page, /Filter run history/);
  assert.match(page, /Verification timeline/);
  assert.match(page, /View reward matches/);
  assert.match(page, /ACTIVE_CAMPAIGN_COUNT = 0/);
  assert.match(page, /REWARDS · OPTIONAL/);
  assert.match(page, /NO ACTIVE CAMPAIGN/);
  assert.match(page, /Stride is a running tracker first/);
  assert.match(page, /campaignModeEnabled \? <RewardsScreen/);
  assert.match(page, /navigator\.share/);
  assert.match(page, /setRewardStatus\(verifiedDistance >= campaign\.goal/);
  assert.match(page, /verification: riskReasons\.length/);
  assert.match(page, /Tap Finish again to save/);
  assert.match(page, /resumeRun/);
  assert.match(page, /visibilitychange/);
  assert.match(page, /<RunnerApp \/>/);
  assert.match(page, /export function AdminConsole/);
  assert.match(page, /TODAY(?:'|&apos;)S RUN/);
  assert.match(page, /Your pace\. Your moment/);
  assert.match(page, /OPEN CHALLENGE/);
  assert.match(page, /Start → record → save privately/);
  assert.match(page, /Start live run/);
  assert.match(page, /Private receipt/);
  assert.match(page, /TonConnectUIProvider/);
  assert.match(page, /tonconnect-manifest\.json/);
  const liveMap = await readFile(new URL("../app/live-run-map.tsx", import.meta.url), "utf8");
  assert.match(liveMap, /import\("maplibre-gl"\)/);
  assert.match(liveMap, /basemaps\.cartocdn\.com\/light_all/);
  assert.match(liveMap, /runner-route/);
  assert.match(liveMap, /Map ready · waiting for GPS/);
  assert.match(liveMap, /Recenter map on your location/);
  const telegramLocation = await readFile(new URL("../app/telegram-location.ts", import.meta.url), "utf8");
  assert.match(telegramLocation, /getLocation/);
  assert.match(telegramLocation, /timeoutMs = 6000/);
  assert.match(telegramLocation, /openSettings/);
  assert.match(telegramLocation, /webApp\?\.ready/);
  assert.match(telegramLocation, /webApp\?\.expand/);
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /telegram-web-app\.js/);
  const manifest = await readFile(new URL("../public/tonconnect-manifest.json", import.meta.url), "utf8");
  assert.match(manifest, /"name": "Stride"/);
  assert.match(manifest, /stride-logo-telegram-blue-v1\.png/);
  assert.match(manifest, /https:\/\/telegram-runner-design-lab\.shawn22222\.chatgpt\.site/);
  assert.match(page, /Run history/i);
  assert.match(page, /STRIDE/);
  assert.match(page, /Stride running experience/);
  assert.match(page, /brand-logo/);
  assert.match(page, /Foreground only/i);
  assert.match(page, /RUN_STORAGE_KEY/);
  assert.match(page, /localStorage/);
  assert.match(page, /clearRunHistory/);
  assert.match(page, /Personal run target/);
  assert.match(page, /TODAY(?:'|&apos;)S PLAN/);
  assert.match(page, /Raw coordinates are not retained/i);
  assert.match(page, /Campaign auto-match/i);
  assert.match(page, /Verified receipts are matched later/i);
  assert.match(page, /VERIFIED THIS WEEK/i);
  assert.match(page, /Run demo eligibility check/i);
  assert.match(page, /Connect a TON wallet/i);
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /stride-hero/);
  assert.match(css, /stride-logo-telegram-blue-v1\.png/);
  assert.match(layout, /stride-logo-telegram-blue-v1\.png/);
  assert.match(css, /@keyframes stride-orbit/);
  assert.match(css, /stride-hero h1\{color:#f8fdff/);
  assert.match(css, /stride-hero p\{color:#c5dfed/);
  const previewFiles = await readdir(new URL("../app/_sites-preview", import.meta.url)).catch((error) => {
    if (error && error.code === "ENOENT") return [];
    throw error;
  });
  assert.deepEqual(previewFiles, []);
});
