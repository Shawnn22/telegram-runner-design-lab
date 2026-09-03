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

test("server-renders the Telegram Runner demo shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Telegram Runner — Move communities onchain/i);
  assert.match(html, /Move communities/i);
  assert.match(html, /Reward real effort/i);
  assert.match(html, /RUNNING, REFINED/i);
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
  assert.match(page, /openstreetmap\.org\/export\/embed/);
  assert.match(page, /Your live GPS location/);
  assert.match(page, /setLivePoint\(next\)/);
  assert.match(page, /Finish & save/);
  assert.match(page, /pauseRun/);
  assert.match(page, /RunSummary/);
  assert.match(page, /Use device GPS now/);
  assert.match(page, /GPS LOCKED · RECORDING/);
  assert.match(page, /setGpsLocked\(true\)/);
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
  const telegramLocation = await readFile(new URL("../app/telegram-location.ts", import.meta.url), "utf8");
  assert.match(telegramLocation, /getLocation/);
  assert.match(telegramLocation, /timeoutMs = 6000/);
  assert.match(telegramLocation, /openSettings/);
  assert.match(telegramLocation, /webApp\?\.ready/);
  assert.match(telegramLocation, /webApp\?\.expand/);
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /telegram-web-app\.js/);
  const manifest = await readFile(new URL("../public/tonconnect-manifest.json", import.meta.url), "utf8");
  assert.match(manifest, /Telegram Runner/);
  assert.match(manifest, /https:\/\/telegram-runner-design-lab\.shawn22222\.chatgpt\.site/);
  assert.match(page, /Activities saved/i);
  assert.match(page, /DESIGN LAB/i);
  assert.match(page, /Foreground only/i);
  assert.match(page, /Raw GPS points were discarded/i);
  assert.match(page, /Campaign auto-match/i);
  assert.match(page, /Several activity receipts can contribute/i);
  assert.match(page, /VERIFIED THIS WEEK/i);
  assert.match(page, /Run demo eligibility check/i);
  assert.match(page, /Connect a TON wallet/i);
  const previewFiles = await readdir(new URL("../app/_sites-preview", import.meta.url)).catch((error) => {
    if (error && error.code === "ENOENT") return [];
    throw error;
  });
  assert.deepEqual(previewFiles, []);
});
