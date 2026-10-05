// Siteyi content/*.json + views/*.ejs dosyalarından statik HTML olarak üretir (çıktı: dist/).
// Eski Express route'larının (routes/user-new.js) verdiği verilerin aynısı şablonlara verilir.
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const SITE_URL = "https://www.firtinaklima.com";

const PAGES = [
  { route: "/", view: "index", file: "index.html", priority: "1.00" },
  { route: "/hakkimizda", view: "hakkimizda", file: "hakkimizda.html", priority: "0.80" },
  { route: "/hizmetler", view: "hizmetler", file: "hizmetler.html", priority: "0.80" },
  { route: "/serviscagir", view: "hizmet_detay", file: "serviscagir.html", priority: "0.80" },
  { route: "/iletisim", view: "iletisim", file: "iletisim.html", priority: "0.80" },
];

function readContent(name) {
  const file = path.join(ROOT, "content", `${name}.json`);
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    throw new Error(`content/${name}.json okunamadı: ${err.message}`);
  }
}

// CMS görsel yolunu "/static/assets/uploads/x.webp" diye kaydedebilir; şablonlar sadece dosya adını bekliyor.
function imageName(value) {
  return value ? String(value).split("/").pop() : null;
}

function requireFields(label, obj, fields) {
  const missing = fields.filter((f) => !obj || !String(obj[f] ?? "").trim());
  if (missing.length) throw new Error(`${label}: zorunlu alan(lar) boş: ${missing.join(", ")}`);
}

function loadData() {
  const iletisim = readContent("iletisim");
  requireFields("İletişim", iletisim, ["telefon", "email"]);

  const hakkimizdaRaw = readContent("hakkimizda");
  requireFields("Hakkımızda", hakkimizdaRaw, ["baslik"]);
  const hakkimizda = [{ ...hakkimizdaRaw, resim: imageName(hakkimizdaRaw.resim) }];

  const hizmetler = (readContent("hizmetler").hizmetler || []).map((h, i) => {
    requireFields(`Hizmet #${i + 1}`, h, ["baslik", "aciklama", "resim"]);
    return { ...h, aciklama: h.aciklama || "", resim: imageName(h.resim) };
  });

  const bloglar = (readContent("bloglar").bloglar || []).map((b, i) => {
    requireFields(`Blog #${i + 1}`, b, ["baslik", "resim"]);
    return { ...b, aciklama: b.aciklama || "", resim: imageName(b.resim) };
  });

  const teknikServis = (readContent("bolgeler").bolgeler || []).map((b, i) => {
    requireFields(`Bölge #${i + 1}`, b, ["bolge"]);
    return b;
  });

  return { iletisim, hakkimizda, hizmetler, bloglar: bloglar.slice(0, 6), teknikServis };
}

function copyDir(src, dest) {
  fs.cpSync(src, dest, {
    recursive: true,
    filter: (p) => path.basename(p) !== ".DS_Store",
  });
}

function sitemap(lastmod) {
  const urls = PAGES.map(
    (p) => `  <url>\n    <loc>${SITE_URL}${p.route}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${p.priority}</priority>\n  </url>`
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function build() {
  const data = loadData();

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  // Eski sitede public/ klasörü /static altında sunuluyordu; URL'ler aynı kalsın.
  copyDir(path.join(ROOT, "public"), path.join(DIST, "static"));
  copyDir(path.join(ROOT, "site"), DIST);

  for (const page of [...PAGES, { view: "404", file: "404.html" }]) {
    const viewFile = path.join(ROOT, "views", `${page.view}.ejs`);
    const html = ejs.render(fs.readFileSync(viewFile, "utf8"), data, { filename: viewFile });
    fs.writeFileSync(path.join(DIST, page.file), html);
    console.log(`  ✓ ${page.route || "(404)"} -> dist/${page.file}`);
  }

  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap(today));
  // Search Console'a eski adres (/static/sitemap.xml) gönderilmiş olabilir, orada da dursun.
  fs.writeFileSync(path.join(DIST, "static", "sitemap.xml"), sitemap(today));
  fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

  console.log("Build tamamlandı: dist/");
}

try {
  build();
} catch (err) {
  // Hata olursa build başarısız olur ve GitHub Pages yayındaki eski sürümü korur.
  console.error(`\nBUILD HATASI: ${err.message}\n`);
  process.exit(1);
}
