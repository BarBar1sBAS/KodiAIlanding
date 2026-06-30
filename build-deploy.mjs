#!/usr/bin/env node
// Собирает папку dist/ для выгрузки лендинга на статический хостинг.
// Копирует только нужные файлы (без симлинков, node_modules и dev-обвязки),
// чтобы img/ на сервере содержал реальные файлы рядом с index.html.

import { cp, mkdir, rm, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const landingDir = dirname(fileURLToPath(import.meta.url));
const distDir = join(landingDir, "dist");

const staticEntries = ["index.html", "css", "js"];

// Картинки, реально используемые в index.html (src="img/...").
const imageFiles = [
  "kodi.png",
  "улыбака.svg",
  "коди.svg",
  "подмиг.svg",
  "умни.svg",
  "умниикрут.svg",
  "супер.svg",
  "счасти.svg",
  "ручки.svg",
  "Настя.jpg",
  "Дима.jpg",
  "Боря.jpg",
  "Миша.jpg",
];

async function build() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  for (const entry of staticEntries) {
    await cp(join(landingDir, entry), join(distDir, entry), {
      recursive: true,
      dereference: true,
    });
  }

  const distImg = join(distDir, "img");
  await mkdir(distImg, { recursive: true });
  for (const file of imageFiles) {
    await cp(join(landingDir, "img", file), join(distImg, file), {
      dereference: true,
    });
  }

  // Шрифты копируем, только если они реально добавлены (см. css/fonts.css).
  const fontsDir = join(landingDir, "fonts");
  const woff2 = (await readdir(fontsDir).catch(() => [])).filter((f) =>
    f.endsWith(".woff2")
  );
  if (woff2.length > 0) {
    await cp(fontsDir, join(distDir, "fonts"), { recursive: true });
  }

  console.log(`Готово: ${distDir}`);
  console.log("Загрузите на хостинг СОДЕРЖИМОЕ папки dist/ (а не саму папку landing/).");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
