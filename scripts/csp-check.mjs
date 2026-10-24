// CSP check: loads pages in headless Chrome (raw CDP, no deps) and fails on any securitypolicyviolation.
// Run against a production server:  npm run build && npx next start -p 3130
//   node --env-file-if-exists=.env.local scripts/csp-check.mjs      (BASE=http://localhost:3130 by default)
// With ADMIN_PASSWORD set it also logs in and checks /admin. Chrome: CHROME_PATH, else the usual install paths.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CHROMES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Starts headless Chrome and speaks CDP over its websocket (Node 22's global WebSocket). */
export async function launch() {
  const bin = CHROMES.find((p) => p && existsSync(p));
  if (!bin) throw new Error("Chrome tidak ditemukan; set CHROME_PATH");
  const dir = mkdtempSync(path.join(tmpdir(), "cdp-"));
  const args = ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${dir}`, "--no-first-run", "--no-default-browser-check", "--no-sandbox", "--disable-gpu", "about:blank"];
  const proc = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
  const wsUrl = await new Promise((res, rej) => {
    let log = "";
    proc.stderr.on("data", (d) => {
      log += d;
      const m = log.match(/DevTools listening on (ws:\S+)/);
      if (m) res(m[1]);
    });
    proc.on("exit", (code) => rej(new Error(`Chrome berhenti (${code}): ${log.slice(-400)}`)));
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => ((ws.onopen = res), (ws.onerror = rej)));

  let seq = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    const p = m.id && pending.get(m.id);
    if (p) {
      pending.delete(m.id);
      m.error ? p.rej(new Error(`${p.method}: ${m.error.message}`)) : p.res(m.result);
    } else for (const l of listeners) l(m);
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((res, rej) => {
      const id = ++seq;
      pending.set(id, { res, rej, method });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });

  async function newPage() {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    const s = (method, params) => send(method, params, sessionId);
    const violations = [];
    const once = (method) =>
      new Promise((res) => {
        const l = (m) => m.sessionId === sessionId && m.method === method && (listeners.delete(l), res(m.params));
        listeners.add(l);
      });
    listeners.add((m) => {
      if (m.sessionId !== sessionId) return;
      if (m.method === "Runtime.bindingCalled" && m.params.name === "__csp") violations.push(JSON.parse(m.params.payload));
      // Belt and braces: violations Chrome only logs (e.g. outside the document's event loop).
      if (m.method === "Log.entryAdded" && /Content Security Policy/i.test(m.params.entry.text)) violations.push({ log: m.params.entry.text, url: m.params.entry.url });
    });
    await Promise.all([s("Page.enable"), s("Runtime.enable"), s("Log.enable")]);
    await s("Runtime.addBinding", { name: "__csp" });
    await s("Page.addScriptToEvaluateOnNewDocument", {
      source: `addEventListener("securitypolicyviolation", (e) => __csp(JSON.stringify({ page: location.pathname, directive: e.effectiveDirective, blocked: e.blockedURI, sample: e.sample, src: e.sourceFile + ":" + e.lineNumber + ":" + e.columnNumber })), true)`,
    });

    const evaluate = async (expression) => {
      const r = await s("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
      return r.result.value;
    };
    return {
      cdp: s,
      violations,
      evaluate,
      async goto(url) {
        const loaded = once("Page.loadEventFired");
        const nav = await s("Page.navigate", { url });
        if (nav.errorText) throw new Error(`${url}: ${nav.errorText}`);
        await loaded;
      },
      /** Polls a page expression until it is truthy (DOM nodes can't cross CDP by value, so only its truthiness does). */
      async waitFor(expression, what = expression, ms = 15000) {
        for (const end = Date.now() + ms; Date.now() < end; await sleep(150)) {
          if (await evaluate(`!!(${expression})`).catch(() => false)) return;
        }
        throw new Error(`Timeout menunggu: ${what}`);
      },
      viewport: (width, height) => s("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 }),
    };
  }

  return {
    newPage,
    async close() {
      const exited = new Promise((r) => proc.once("exit", r));
      await send("Browser.close").catch(() => proc.kill());
      await exited;
      rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
    },
  };
}

/** Logs in through the real form (uncontrolled input, so a plain value set is enough). */
export async function login(page, base, password) {
  await page.goto(`${base}/admin/login`);
  await page.waitFor(`document.querySelector("#password")`, "form login");
  await page.evaluate(`(() => { const i = document.querySelector("#password"); i.value = ${JSON.stringify(password)}; i.form.requestSubmit(); })()`);
}

/** Visits each path (plus the QR dialog on /) and returns every CSP violation seen. */
export async function checkCsp(page, base, paths) {
  for (const p of paths) {
    await page.goto(base + p);
    if (p === "/") {
      // QR is a dynamic import + data: URL image; the weather fetch starts 400ms after hydration.
      await page.waitFor(`[...document.querySelectorAll("button.act")].find((b) => b.textContent.trim() === "Kode QR")`, "tombol Kode QR");
      await page.evaluate(`[...document.querySelectorAll("button.act")].find((b) => b.textContent.trim() === "Kode QR").click()`);
      await page.waitFor(`document.querySelector("dialog.qr[open] img.qr-code")?.complete`, "gambar QR");
    }
    await sleep(2500); // late work: weather, hydration, prefetches
  }
  return page.violations;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const base = (process.env.BASE ?? "http://localhost:3130").replace(/\/$/, "");
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await checkCsp(page, base, ["/", "/admin/login", "/tim"]);
    if (process.env.ADMIN_PASSWORD) {
      await login(page, base, process.env.ADMIN_PASSWORD);
      await page.waitFor(`location.pathname === "/admin" && document.querySelector(".dash")`, "panel admin");
      await checkCsp(page, base, ["/admin"]);
    } else console.log("ADMIN_PASSWORD kosong: /admin dilewati");
    if (page.violations.length) {
      console.error(`CSP: ${page.violations.length} pelanggaran`);
      for (const v of page.violations) console.error(" ", JSON.stringify(v));
      process.exitCode = 1;
    } else console.log("CSP ok: tidak ada pelanggaran");
  } finally {
    await browser.close();
  }
}
