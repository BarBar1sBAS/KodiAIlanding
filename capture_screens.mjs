/**
 * Скриншоты лендинга. Запуск: cd landing && node capture_screens.mjs
 * Сервер: python3 -m http.server 9876 (порт 8080 может быть занят)
 */
import { chromium } from "playwright";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screensDir = path.join(__dirname, "..", "screens");
const printAssetsDir = path.join(__dirname, "..", "print", "assets");
const base = "http://127.0.0.1:9876/index.html";

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "load" });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(screensDir, "01-full.png"), fullPage: true });

  for (const [id, name] of [
    ["#hero", "02-hero.png"],
    ["#intro", "03-intro.png"],
    ["#audience", "04-audience.png"],
  ]) {
    const el = page.locator(id);
    await el.scrollIntoViewIfNeeded();
    await new Promise((r) => setTimeout(r, 200));
    await el.screenshot({ path: path.join(screensDir, name) });
  }
  // До клика
  await page.locator("#ide-demo").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.locator("#ide-demo").screenshot({ path: path.join(screensDir, "05-ide-demo-before.png") });
  const btn = page.locator("#ide-demo-run");
  await btn.click();
  await new Promise((r) => setTimeout(r, 800));
  await page.locator("#ide-demo").screenshot({ path: path.join(screensDir, "05-ide-demo-after.png") });

  // Скриншот для печатного буклета (print/assets) — компактный кроп редакторов
  await fs.mkdir(printAssetsDir, { recursive: true });
  const editors = page.locator("#ide-demo-tabpanel");
  await editors.scrollIntoViewIfNeeded();
  await new Promise((r) => setTimeout(r, 200));
  await editors.screenshot({ path: path.join(printAssetsDir, "ide-demo-after.png") });

  for (const [id, name] of [
    ["#features", "06-features.png"],
    ["#roadmap", "07-roadmap.png"],
    ["#feedback", "08-feedback.png"],
  ]) {
    const el = page.locator(id);
    await el.scrollIntoViewIfNeeded();
    await new Promise((r) => setTimeout(r, 200));
    await el.screenshot({ path: path.join(screensDir, name) });
  }
  await context.close();

  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mpage = await mctx.newPage();
  await mpage.goto(base, { waitUntil: "load" });
  await new Promise((r) => setTimeout(r, 800));
  await mpage.screenshot({ path: path.join(screensDir, "09-mobile.png"), fullPage: true });
  await mctx.close();
  await browser.close();
  console.log("OK:", screensDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
