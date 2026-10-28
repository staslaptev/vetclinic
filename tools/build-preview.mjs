// Собирает preview/index.html для публикации артефактом: CSS и JS встраиваются,
// обёртка doctype/html/head/body снимается (артефакт добавляет свою).
// Запуск: node tools/build-preview.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let html = readFileSync(join(root, "index.html"), "utf8");

// Шрифты из fonts\ в артефакте можно подключить только как data: URI
const MIME = { otf: "font/otf", ttf: "font/ttf", woff: "font/woff", woff2: "font/woff2" };
const inlineFonts = (css) => css.replace(/url\("\.\.\/(fonts\/[^"]+)"\)/g, (_, p) => {
  const ext = p.split(".").pop();
  return `url("data:${MIME[ext]};base64,${readFileSync(join(root, p)).toString("base64")}")`;
});

html = html.replace(/<link rel="stylesheet" href="(css\/[^"]+)">/g, (_, p) =>
  `<style>\n${inlineFonts(readFileSync(join(root, p), "utf8"))}</style>`);
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, p) =>
  `<script>\n${readFileSync(join(root, p), "utf8")}</script>`);

html = html
  .replace(/<!doctype html>\s*/i, "")
  .replace(/<html[^>]*>\s*/i, "")
  .replace(/<\/html>\s*/i, "")
  .replace(/<head>\s*/i, "")
  .replace(/<\/head>\s*/i, "")
  .replace(/<body>\s*/i, "")
  .replace(/<\/body>\s*/i, "")
  .replace(/<meta charset="utf-8">\s*/i, "")
  .replace(/<meta name="viewport"[^>]*>\s*/i, "");

// Картинки из img\ встраиваем в превью как data: URI
const IMG_MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
const imgCache = {};
html = html.replace(/src="(img\/[^"]+)"/g, (m, p) => {
  if (!existsSync(join(root, p))) return m;
  imgCache[p] ??= `data:${IMG_MIME[p.split(".").pop()]};base64,${readFileSync(join(root, p)).toString("base64")}`;
  return `src="${imgCache[p]}"`;
});

// Внешние таблицы стилей (кроме Google Fonts) артефакт не пускает; карта в превью и так не запускается
html = html.replace(/\s*<link rel="stylesheet" href="https:\/\/cdnjs[^"]+">/g, "");

// В артефакте внешние iframe запрещены: карта показывает ссылки вместо виджета
html = html.replace("<script>\n", "<script>window.VET_PREVIEW = true;</script>\n<script>\n");

// <title> должен идти первым
const title = html.match(/<title>.*?<\/title>/)[0];
html = title + "\n" + html.replace(title, "");

mkdirSync(join(root, "preview"), { recursive: true });
writeFileSync(join(root, "preview", "index.html"), html);
console.log("preview/index.html:", html.length, "bytes");
