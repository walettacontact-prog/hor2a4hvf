// Font Awesome 4 fontunu sadece sitede kullanılan simgelere indirir: public/fonts/fontawesome4/fonts/fa-subset.ttf
// Şablonlara yeni bir "fa fa-..." simgesi eklenince yeniden çalıştırın:  node scripts/ikon-fontu.js   (hb-subset gerekir: brew install harfbuzz)
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const FA = path.join(ROOT, "public", "fonts", "fontawesome4");
const css = fs.readFileSync(path.join(FA, "css", "font-awesome.min.css"), "utf8");

const sinifKodu = {};
for (const m of css.matchAll(/((?:\.fa-[a-z0-9-]+:before,?)+)\{content:"\\(f[0-9a-f]{3})"\}/g)) {
  for (const c of m[1].matchAll(/\.fa-([a-z0-9-]+):before/g)) sinifKodu[c[1]] = m[2];
}
const kodlar = new Set();
// Tema CSS'indeki sözde öğeler (content: "\f...")
for (const f of ["style.css", "plugins.css", "coloring.css", "swiper.css", "bootstrap.min.css", "colors/scheme-01.css"]) {
  for (const m of fs.readFileSync(path.join(ROOT, "public", "css", f), "utf8").matchAll(/content:\s*["']\\(f[0-9a-f]{3})["']/gi)) kodlar.add(m[1].toLowerCase());
}
// Şablonlar ve JS içindeki fa-* sınıfları
const dosyalar = [];
(function gez(d) {
  for (const x of fs.readdirSync(d)) {
    const p = path.join(d, x);
    if (fs.statSync(p).isDirectory()) gez(p);
    else if (/\.(ejs|js)$/.test(x)) dosyalar.push(p);
  }
})(path.join(ROOT, "views"));
for (const x of fs.readdirSync(path.join(ROOT, "public", "js"))) dosyalar.push(path.join(ROOT, "public", "js", x));
for (const f of dosyalar) for (const m of fs.readFileSync(f, "utf8").matchAll(/fa-([a-z0-9-]+)/g)) if (sinifKodu[m[1]]) kodlar.add(sinifKodu[m[1]]);

execFileSync("hb-subset", [
  `--font-file=${path.join(FA, "fonts", "fontawesome-webfont.ttf")}`,
  `--unicodes=${[...kodlar].map((k) => "U+" + k.toUpperCase()).join(",")}`,
  `--output-file=${path.join(FA, "fonts", "fa-subset.ttf")}`,
]);
console.log(`${kodlar.size} simge -> fa-subset.ttf (${Math.round(fs.statSync(path.join(FA, "fonts", "fa-subset.ttf")).size / 1024)} KB)`);
