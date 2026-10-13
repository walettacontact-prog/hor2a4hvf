// Temanın CSS dosyalarının büyük kısmı (~%90) sitede kullanılmıyor ve sayfa açılışını geciktiriyor.
// Build sonunda dist/ içindeki CSS'ten, üretilen HTML'de ve sitenin JS dosyalarında geçmeyen kuralları çıkarır.
// JS dosyaları da taranır: menü, slider, yorum karuseli gibi eklentilerin sonradan eklediği sınıflar korunur.
"use strict";
const fs = require("fs");
const path = require("path");
const { PurgeCSS } = require("purgecss");

const CSS_DOSYALARI = [
  "static/css/bootstrap.min.css",
  "static/css/plugins.css",
  "static/css/swiper.css",
  "static/fonts/fontawesome4/css/font-awesome.min.css",
  "static/css/style.css",
  "static/css/coloring.css",
  "static/css/colors/scheme-01.css",
];

async function cssAyikla(DIST) {
  const sonuc = await new PurgeCSS().purge({
    content: [`${DIST}/**/*.html`, `${DIST}/static/js/**/*.js`],
    keyframes: true,
    css: CSS_DOSYALARI.map((f) => path.join(DIST, f)),
    // Eklentilerin çalışırken eklediği sınıflar (JS'te birleştirilerek yazılanlar dahil)
    safelist: {
      standard: [/^swiper/, /^owl-/, /^mfp-/, /^jarallax/, /^wow/, /^animated/, /^fadeIn/, /^fadeOut/, /^flipIn/, /^zoomIn/, /^slideIn/, /^is-/, /^has-/, /^menu-/, /^header-/, /^smaller/, /^scroll/, /^show/, /^active/, /^open/, /^collapse/, /^collaps/, /^fade/, /^in$/],
      greedy: [/swiper-/, /owl-/, /mfp-/],
    },
  });
  let once = 0, sonra = 0;
  for (const r of sonuc) {
    once += fs.statSync(r.file).size;
    fs.writeFileSync(r.file, r.css);
    sonra += Buffer.byteLength(r.css);
  }
  console.log(`  CSS ayıklandı: ${Math.round(once / 1024)} KB -> ${Math.round(sonra / 1024)} KB`);
}

module.exports = { cssAyikla };
