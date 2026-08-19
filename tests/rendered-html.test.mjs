import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
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
  assert.match(html, /Project console/i);
  assert.match(html, /Runner app/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("keeps simulated integrations explicit", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /SIMULATED/);
  assert.match(page, /approve demo verification/i);
  assert.match(page, /Approve demo transaction/i);
  assert.match(page, /Demo boundary/i);
  assert.match(page, /navigator\.geolocation\.watchPosition/);
  assert.match(page, /LocationManager/);
  assert.match(page, /initializeTelegramWebApp/);
  assert.match(page, /Telegram session/);
  assert.match(page, /Open Telegram settings/);
  assert.match(page, /useState<"demo" \| "live">\("live"\)/);
  assert.match(page, /trackingMode === "demo" &&/);
  assert.match(page, /openstreetmap\.org\/export\/embed/);
  assert.match(page, /Your live GPS location/);
  assert.match(page, /setLivePoint\(next\)/);
  assert.match(page, /Finish run/);
  const telegramLocation = await readFile(new URL("../app/telegram-location.ts", import.meta.url), "utf8");
  assert.match(telegramLocation, /getLocation/);
  assert.match(telegramLocation, /openSettings/);
  assert.match(telegramLocation, /webApp\?\.ready/);
  assert.match(telegramLocation, /webApp\?\.expand/);
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /telegram-web-app\.js/);
  assert.match(page, /Activities saved/i);
  assert.match(page, /Quick Run/i);
  assert.match(page, /No campaign signup/i);
  assert.match(page, /Raw GPS points were discarded/i);
  assert.match(page, /Campaign auto-match/i);
  assert.match(page, /Several activity receipts can contribute/i);
  assert.match(page, /VERIFIED THIS WEEK/i);
  assert.match(page, /Run demo eligibility check/i);
  assert.match(page, /Connect a TON wallet/i);
  const previewFiles = await readdir(new URL("../app/_sites-preview", import.meta.url));
  assert.deepEqual(previewFiles, []);
});
