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
  const previewFiles = await readdir(new URL("../app/_sites-preview", import.meta.url));
  assert.deepEqual(previewFiles, []);
});
