// Her sayfa için 1200x630 paylaşım kartı (Open Graph görseli) üretir: public/images/og/<ad>.jpg
// Sayfa başlığı veya görseli değişince yeniden çalıştırın:  CHROME=/yol/chrome node scripts/og-gorselleri.js
// Gerekenler: Chrome ya da chrome-headless-shell (CHROME ortam değişkeni) ve ffmpeg.
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { loadData, tumSayfalar, ogDosyaAdi, ROOT } = require("./build");
const { telGoster } = require("./seo");

const CIKTI = path.join(ROOT, "public", "images", "og");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PUB = (p) => "file://" + path.join(ROOT, "public", p).split(path.sep).map(encodeURIComponent).join("/");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Küçük görseller büyütülünce bulanıklaşır; en az bu yükseklikte olanlar kartta kullanılır.
function boyut(dosya) {
  try {
    const [w, h] = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", dosya]).toString().trim().split(",").map(Number);
    return { w, h };
  } catch {
    return { w: 0, h: 0 };
  }
}
function uygunGorsel(uploadAdi) {
  if (!uploadAdi) return null;
  const dosya = path.join(ROOT, "public", "assets", "uploads", uploadAdi);
  const { w, h } = boyut(dosya);
  return w >= 380 && h >= 380 ? PUB(path.join("assets", "uploads", uploadAdi)) : null;
}

function kartBilgisi(page, data) {
  const bolge = "Bahçelievler · Yenibosna ve çevresi";
  if (page.hizmet) return { etiket: "Hizmet", baslik: page.hizmet.baslik, alt: bolge, gorsel: uygunGorsel(page.hizmet.resim) };
  if (page.yazi) {
    const y = page.yazi;
    return { etiket: y.kategori === "kombi" ? "Kombi Rehberi" : "Klima Rehberi", baslik: y.baslik.length <= 66 ? y.baslik : y.kart_baslik, alt: "Fırtına Klima & Kombi · Bahçelievler", gorsel: uygunGorsel(y.resim) };
  }
  const SABIT = {
    "/": { etiket: "Klima & Kombi Servisi", urun: PUB("images/slider/p3.webp") },
    "/hizmetler": { etiket: "Hizmetlerimiz", urun: PUB("images/slider/p3.webp") },
    "/hakkimizda": { etiket: "Hakkımızda", gorsel: uygunGorsel(data.hakkimizda[0].resim) },
    "/serviscagir": { etiket: "Servis Çağır", gorsel: uygunGorsel("kombi-bakimi-teknisyen.webp") },
    "/rehberler": { etiket: "Rehberler", gorsel: uygunGorsel("kombi-basinc-gostergesi.webp") },
    "/hizmet-bolgeleri": { etiket: "Hizmet Bölgeleri" },
    "/iletisim": { etiket: "İletişim", alt: data.iletisim.adres },
  };
  const s = SABIT[page.route] || { etiket: data.iletisim.kisa_ad };
  return { alt: bolge, ...s, baslik: page.h1 };
}

function html(k, data) {
  const uzunluk = k.baslik.length;
  const punto = uzunluk <= 26 ? 74 : uzunluk <= 44 ? 62 : uzunluk <= 60 ? 54 : 48;
  const sag = k.gorsel
    ? `<div class="foto" style="background-image:url('${k.gorsel}')"></div>`
    : k.urun ? `<img class="urun" src="${k.urun}">` : `<img class="filigran" src="${PUB("logobeyaz.webp")}">`;
  const genis = k.gorsel || k.urun ? 660 : 960;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:M;font-weight:200 800;src:url('${PUB("fonts/manrope/manrope-latin-ext.woff2")}') format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+20A0-20AB,U+20AD-20C4}
@font-face{font-family:M;font-weight:200 800;src:url('${PUB("fonts/manrope/manrope-latin.woff2")}') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;font-family:M,sans-serif;color:#fff;background:radial-gradient(ellipse at 30% 20%,#2b5fa3 0%,#1d4479 45%,#13294a 100%);position:relative}
.foto{position:absolute;top:0;right:0;width:560px;height:630px;background-size:cover;background-position:center;-webkit-mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.6) 22%,#000 48%);mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.6) 22%,#000 48%)}
.urun{position:absolute;right:-40px;top:150px;width:560px;filter:drop-shadow(0 30px 40px rgba(0,0,0,.35))}
.filigran{position:absolute;right:-60px;top:70px;width:520px;opacity:.07}
.ic{position:absolute;left:68px;top:56px;bottom:56px;width:${genis}px;display:flex;flex-direction:column}
.ust{display:flex;align-items:center;gap:18px}
.ust img{width:128px;height:128px;margin:-14px 0 -14px -14px}
.etiket{margin-top:30px;align-self:flex-start;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);border-radius:40px;padding:8px 20px;font-weight:700;font-size:22px;letter-spacing:.3px}
h1{margin-top:20px;font-weight:800;font-size:${punto}px;line-height:1.08;letter-spacing:-1px;text-wrap:balance}
.alt{margin-top:18px;font-weight:500;font-size:26px;color:#d3e2f5}
.alt-bant{margin-top:auto;display:flex;align-items:center;gap:22px}
.tel{background:#dc1d2c;border-radius:50px;padding:14px 34px;font-weight:800;font-size:38px;letter-spacing:1px;box-shadow:0 10px 24px rgba(0,0,0,.25)}
.saat{font-weight:600;font-size:22px;color:#d3e2f5;line-height:1.3}
</style></head><body>${sag}
<div class="ic">
  <div class="ust"><img src="${PUB("logobeyaz.webp")}"></div>
  <div class="etiket">${esc(k.etiket)}</div>
  <h1>${esc(k.baslik)}</h1>
  <div class="alt">${esc(k.alt)}</div>
  <div class="alt-bant"><div class="tel">${esc(telGoster(data.iletisim.telefon))}</div><div class="saat">${esc(data.iletisim.calisma_saatleri)}<br>Telefon ve WhatsApp</div></div>
</div></body></html>`;
}

function main() {
  if (!fs.existsSync(CHROME)) throw new Error(`Chrome bulunamadı: ${CHROME} (CHROME ortam değişkeniyle yolu verin)`);
  const data = loadData();
  const sayfalar = tumSayfalar(data);
  const gecici = fs.mkdtempSync(path.join(os.tmpdir(), "og-"));
  fs.mkdirSync(CIKTI, { recursive: true });
  for (const page of sayfalar) {
    const ad = ogDosyaAdi(page.route);
    const htmlDosya = path.join(gecici, `${ad}.html`);
    const png = path.join(gecici, `${ad}.png`);
    fs.writeFileSync(htmlDosya, html(kartBilgisi(page, data), data));
    execFileSync(CHROME, [...(process.env.CHROME_FLAG ? [process.env.CHROME_FLAG] : ["--headless"]), "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--allow-file-access-from-files", `--user-data-dir=${path.join(gecici, "profil")}`, "--window-size=1200,630", `--screenshot=${png}`, "file://" + htmlDosya], { stdio: "ignore" });
    const jpg = path.join(CIKTI, `${ad}.jpg`);
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", png, "-q:v", "3", jpg]);
    console.log(`  ✓ ${page.route} -> public/images/og/${ad}.jpg (${Math.round(fs.statSync(jpg).size / 1024)} KB)`);
  }
}

main();
