// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * На узком viewport навигация в бургере — открыть перед кликом по ссылке.
 * @param {import('@playwright/test').Page} page
 */
async function openMobileNavIfNeeded(page) {
  const vw = page.viewportSize()?.width ?? 1280;
  if (vw >= 768) return;
  const toggle = page.getByRole("button", { name: /меню навигации/i });
  await expect(toggle).toBeVisible();
  if ((await toggle.getAttribute("aria-expanded")) === "false") {
    await toggle.click();
  }
}

test.describe("Коди.АИ лендинг", () => {
  test("главный заголовок и ключевые секции доступны", async ({ page }) => {
    await page.goto("/index.html");
    await expect(page.getByRole("heading", { level: 1, name: /Коди.АИ учит на ошибках/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Что такое Коди.АИ" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Для кого Коди.АИ" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Демо: код слева/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Развитие продукта" })).toBeVisible();
    await expect(page.locator("#roadmap")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Наша команда" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Связаться с нами" })).toBeVisible();
  });

  test("блок «Наша команда»: четыре участника с фото и ролями", async ({ page }) => {
    await page.goto("/index.html");
    const team = page.locator("#team");
    await expect(team.getByRole("heading", { level: 2, name: "Наша команда" })).toBeVisible();
    const cards = team.locator(".team-card");
    await expect(cards).toHaveCount(4);
    await expect(team.getByRole("heading", { name: "Анастасия Тихонова" })).toBeVisible();
    await expect(team.getByText("Управление командой")).toBeVisible();
    await expect(team.getByRole("heading", { name: "Дмитрий Поляков" })).toBeVisible();
    await expect(team.getByRole("heading", { name: "Борис Басов" })).toBeVisible();
    await expect(team.getByRole("heading", { name: "Михаил Кузьминов" })).toBeVisible();
    const firstPhoto = cards.first().locator(".team-card__photo");
    await firstPhoto.scrollIntoViewIfNeeded();
    await expect
      .poll(
        async () => firstPhoto.evaluate((el) => /** @type {HTMLImageElement} */ (el).naturalWidth),
        { timeout: 5000 }
      )
      .toBeGreaterThan(0);
  });

  test("маскот Коди отрисован во всех секциях", async ({ page }) => {
    await page.goto("/index.html");
    const mascots = page.locator(".mascot-figure__img");
    await expect(mascots).toHaveCount(8);
    const heroMascot = page.locator("#hero .mascot-figure__img");
    await expect(heroMascot).toBeVisible();
    await expect
      .poll(
        async () => heroMascot.evaluate((el) => /** @type {HTMLImageElement} */ (el).naturalWidth),
        { timeout: 15000 }
      )
      .toBeGreaterThan(0);
  });

  test("навигация по якорям не ломает layout (основные блоки в потоке)", async ({ page }) => {
    await page.goto("/index.html");
    await openMobileNavIfNeeded(page);
    await page
      .getByRole("navigation", { name: "Навигация по странице" })
      .getByRole("link", { name: "Демо IDE", exact: true })
      .click();
    await expect(page.locator("#ide-demo")).toBeInViewport();
    await openMobileNavIfNeeded(page);
    await page
      .getByRole("navigation", { name: "Навигация по странице" })
      .getByRole("link", { name: "Дорожная карта", exact: true })
      .click();
    await expect(page.locator("#roadmap")).toBeInViewport();
    await openMobileNavIfNeeded(page);
    await page
      .getByRole("navigation", { name: "Навигация по странице" })
      .getByRole("link", { name: "Команда", exact: true })
      .click();
    await expect(page.locator("#team")).toBeInViewport();
    await openMobileNavIfNeeded(page);
    await page.getByRole("navigation", { name: "Навигация по странице" }).getByRole("link", { name: "Связаться" }).click();
    await expect(page.locator("#feedback")).toBeInViewport();
  });

  test("демо IDE: код, пояснения и окна macOS", async ({ page }) => {
    await page.goto("/index.html");
    await expect(page.locator("#ide-demo .mac-window")).toHaveCount(4);
    await expect(page.locator(".ide-demo__editors .mac-window")).toHaveCount(2);
    const explain = page.locator("#ide-demo-explain");
    await expect(explain).toBeVisible();
    await expect(explain).toContainText(/Разбор кода|появится разбор/i);
    await expect(page.locator(".ide-demo__ticker")).toContainText(/промо-демо сайта/i);
    const run = page.getByRole("button", { name: /Показать улучшенный вариант/i });
    await run.click();
    const out = page.locator("#ide-demo-output");
    await expect(out).toContainText("def summ");
    await expect(out).toContainText("-> int");
    await expect(explain).toContainText(/Кратко|аннотации типов|PEP 8/i);
    await expect(explain.locator(".ide-demo__badge")).not.toHaveCount(0);
  });

  test("демо IDE: вкладки переключают язык и код примера", async ({ page }) => {
    await page.goto("/index.html");
    const tablist = page.getByRole("tablist", { name: /Язык и учебный трек/i });
    await expect(tablist.getByRole("tab")).toHaveCount(4);

    const input = page.locator("#ide-demo-input");
    await expect(input).toHaveValue(/def summ/);

    await tablist.getByRole("tab", { name: /JavaScript/i }).click();
    await expect(page.getByRole("tab", { name: /JavaScript/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await expect(input).toHaveValue(/function srt/);
    await expect(page.locator("#ide-demo-input-title")).toContainText("app.js");

    const run = page.getByRole("button", { name: /Показать улучшенный вариант/i });
    await run.click();
    const out = page.locator("#ide-demo-output");
    await expect(out).toContainText("sortAscending");
    await expect(page.locator("#ide-demo-explain .ide-demo__badge--critical")).not.toHaveCount(0);
  });

  test("демо IDE: чат отвечает на выбранный вопрос", async ({ page }) => {
    await page.goto("/index.html");
    const chat = page.locator("#ide-demo-chat");
    await expect(chat).toBeVisible();
    const chips = page.locator("#ide-demo-chat-suggestions .ide-demo__chat-chip");
    await expect(chips).not.toHaveCount(0);
    await chips.first().click();
    const log = page.locator("#ide-demo-chat-log");
    await expect(log.locator(".ide-demo__chat-msg--user")).toHaveCount(1);
    await expect(log.locator(".ide-demo__chat-msg--ai")).toHaveCount(1);
    await expect(log.locator(".ide-demo__chat-msg--ai")).toContainText(/\S/);
  });

  test("контакт: только Telegram с рабочей ссылкой", async ({ page }) => {
    await page.goto("/index.html");
    const list = page.locator(".social-links");
    await expect(list).toBeVisible();
    await expect(list.locator(".social-links__item")).toHaveCount(1);
    const tg = list.getByRole("link", { name: /Telegram/i });
    await expect(tg).toBeVisible();
    await expect(tg).toHaveAttribute("href", "https://t.me/kodi_ai");
    await expect(list.getByRole("link", { name: /мессенджере МАХ/i })).toHaveCount(0);
    await expect(list.getByRole("link", { name: /ВКонтакте/i })).toHaveCount(0);
  });

  test("«Наверх» возвращает к началу страницы", async ({ page }) => {
    await page.goto("/index.html");
    await page.locator("#feedback").scrollIntoViewIfNeeded();
    const scrollBefore = await page.evaluate(() => window.scrollY);
    expect(scrollBefore).toBeGreaterThan(100);
    await page.getByRole("link", { name: "Наверх", exact: true }).click();
    await expect
      .poll(async () => page.evaluate(() => window.scrollY), { timeout: 3000 })
      .toBeLessThan(50);
  });

  test("skip-link ведёт к main", async ({ page }) => {
    await page.goto("/index.html");
    await page.keyboard.press("Tab");
    await page.getByRole("link", { name: /Перейти к основному содержимому/i }).click();
    await expect(page.locator("#main")).toBeFocused();
  });

  test("брендовый знак в шапке", async ({ page }) => {
    await page.goto("/index.html");
    const logo = page.locator(".site-header__brand .brand-mark");
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("src", /kodi\.png/);
    const logoW = await logo.evaluate((el) => /** @type {HTMLImageElement} */ (el).naturalWidth);
    expect(logoW).toBeGreaterThan(0);
    await expect(page.locator("#hero .hero__content")).toBeVisible();
    await expect(page.locator("#hero .hero__title")).toBeVisible();
  });

  test("бургер: открытие и закрытие по Escape", async ({ page }) => {
    await page.goto("/index.html");
    const vw = page.viewportSize()?.width ?? 1280;
    test.skip(vw >= 768, "только мобильный viewport");
    const toggle = page.getByRole("button", { name: /Открыть меню навигации/i });
    await toggle.click();
    await expect(page.getByRole("navigation", { name: "Навигация по странице" }).locator("a").first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
