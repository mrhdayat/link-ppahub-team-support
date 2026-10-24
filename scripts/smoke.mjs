// Smoke e2e against a running production server (CI runs it after `npm run build && npx next start`).
// Local: node --env-file-if-exists=.env.local scripts/smoke.mjs   (BASE=http://localhost:3130, needs ADMIN_PASSWORD)
// Note: it sends one real "view" hit and one wrong login attempt to BASE.
import { readFileSync } from "node:fs";
import { checkCsp, launch, login } from "./csp-check.mjs";

const base = (process.env.BASE ?? "http://localhost:3130").replace(/\/$/, "");
const password = process.env.ADMIN_PASSWORD;
if (!password) throw new Error("ADMIN_PASSWORD wajib diset");

// A link everyone has: the first visible one in the seed CONFIG.
const seed = JSON.parse(readFileSync(new URL("../src/lib/default-site.json", import.meta.url), "utf8"));
const known = seed.link.find((l) => !l.arsip).judul;

let failed = 0;
async function step(name, fn) {
  const t = Date.now();
  try {
    await fn();
    console.log(`ok   ${name} (${Date.now() - t}ms)`);
  } catch (e) {
    failed++;
    console.error(`GAGAL ${name}: ${e.message}`);
  }
}
const expect = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const browser = await launch();
try {
  const page = await browser.newPage();
  await page.viewport(390, 844);

  await step("beranda: TEAM SUPPORT + minimal 1 jalur", async () => {
    await page.goto(`${base}/`);
    await page.waitFor(`document.querySelector("h1.hud-name")?.textContent.includes("TEAM SUPPORT")`, "judul TEAM SUPPORT");
    const lanes = await page.evaluate(`document.querySelectorAll("section.lane[id^='jalur-']").length`);
    expect(lanes >= 1, `jalur: ${lanes}`);
  });

  await step(`cari: "${known}"`, async () => {
    // Controlled React input: set through the native setter so React sees the change.
    await page.evaluate(`(() => {
      const i = document.querySelector("#cari");
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, ${JSON.stringify(known)});
      i.dispatchEvent(new Event("input", { bubbles: true }));
    })()`);
    await page.waitFor(`document.querySelector(".lane.hasil")?.textContent.includes(${JSON.stringify(known)})`, "hasil pencarian");
  });

  await step("login: password salah → pesan di bawah field", async () => {
    await login(page, base, "salah-" + Date.now());
    await page.waitFor(`document.querySelector("#password-err")?.textContent.trim()`, "pesan error");
  });

  await step("login: password benar → /admin", async () => {
    await login(page, base, password);
    await page.waitFor(`location.pathname === "/admin" && document.querySelector(".dash")`, "panel admin");
  });

  await step("POST /api/hit view → 204, kunci asal → 400", async () => {
    const hit = (body) => fetch(`${base}/api/hit`, { method: "POST", body, headers: { "content-type": "text/plain" } }).then((r) => r.status);
    expect((await hit("view")) === 204, "view bukan 204");
    expect((await hit("bukan-kunci")) === 400, "kunci asal bukan 400");
  });

  await step("CSP: tidak ada pelanggaran", async () => {
    const v = await checkCsp(page, base, ["/", "/admin/login", "/admin", "/tim"]);
    expect(v.length === 0, `${v.length} pelanggaran\n  ${v.map((x) => JSON.stringify(x)).join("\n  ")}`);
  });
} finally {
  await browser.close();
}
if (failed) {
  console.error(`${failed} langkah gagal`);
  process.exit(1);
}
console.log("smoke ok");
