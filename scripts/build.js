// Siteyi content/*.json + views/*.ejs dosyalarından statik HTML olarak üretir (çıktı: dist/).
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const ejs = require("ejs");
const { seoFor, telGoster, doldur, SITE_URL } = require("./seo");
const { cssAyikla } = require("./css-ayikla");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

// Sabit sayfalar: Google başlığı (~60 karakter), açıklama (~120-155 karakter) ve H1. {telefon} otomatik doldurulur.
// kaynaklar: sayfayı besleyen content dosya/klasörleri; site haritasındaki lastmod bunların son git tarihinden gelir.
// guncelleme: yalnızca o sayfanın başlığı, açıklaması, H1'i ya da şablona yazılı ana metni gerçekten değişince elle güncelleyin.
const SABIT_SAYFALAR = [
  {
    route: "/", view: "index", file: "index.html", type: "WebPage",
    title: "Yenibosna Klima, Kombi, Beyaz Eşya Servisi | Fırtına Klima",
    description: "Bahçelievler ve Yenibosna’da klima, kombi ve beyaz eşya servisi: montaj, bakım, arıza tamiri; çamaşır, bulaşık, buzdolabı, fırın tamiri. Her gün 08–21.",
    h1: "Bahçelievler ve Yenibosna’da Klima, Kombi ve Beyaz Eşya Servisi",
    kaynaklar: ["content/hizmetler.json", "content/kategoriler", "content/yazilar", "content/bolgeler.json"], guncelleme: "2026-10-13",
  },
  {
    route: "/hakkimizda", view: "hakkimizda", file: "hakkimizda.html", type: "AboutPage",
    title: "Hakkımızda | Fırtına Klima & Kombi, Bahçelievler",
    description: "Bahçelievler Hürriyet Mahallesi’nde bağımsız klima, kombi ve beyaz eşya servisi; yetkili servis değiliz. Tüm markalar, orijinal parça, garanti.",
    h1: "Fırtına Klima & Kombi Hakkında", crumbs: [{ ad: "Hakkımızda", route: "/hakkimizda" }],
    kaynaklar: ["content/hakkimizda.json"], guncelleme: "2026-10-13",
  },
  {
    route: "/hizmetler", view: "hizmetler", file: "hizmetler.html", type: "CollectionPage",
    title: "Hizmetlerimiz: Klima, Kombi, Beyaz Eşya | Fırtına Klima",
    description: "Klima montajı, tamiri, bakımı ve gaz dolumu; kombi bakımı ve onarımı; çamaşır, bulaşık makinesi, buzdolabı, fırın tamiri. Tüm markalar. {telefon}",
    h1: "Klima, Kombi ve Beyaz Eşya Servis Hizmetlerimiz", crumbs: [{ ad: "Hizmetler", route: "/hizmetler" }],
    kaynaklar: ["content/hizmetler.json", "content/kategoriler"], guncelleme: "2026-10-13",
  },
  {
    route: "/serviscagir", view: "hizmet_detay", file: "serviscagir.html", type: "WebPage",
    title: "Servis Çağır: Telefon ve WhatsApp | Fırtına Klima",
    description: "Telefon veya WhatsApp’tan servis isteyin; çoğu çağrıya aynı gün geliyoruz. Yenibosna, Bahçelievler, Şirinevler, Sefaköy, Bakırköy. {telefon}",
    h1: "Klima, Kombi ve Beyaz Eşya İçin Servis Çağırın", crumbs: [{ ad: "Servis Çağır", route: "/serviscagir" }],
    kaynaklar: ["content/hizmetler.json", "content/bolgeler.json", "content/iletisim.json"], guncelleme: "2026-10-13",
  },
  {
    route: "/hizmet-bolgeleri", view: "hizmet-bolgeleri", file: "hizmet-bolgeleri.html", type: "WebPage",
    title: "Hizmet Bölgeleri – Bahçelievler, Yenibosna | Fırtına Klima",
    description: "Bahçelievler’deki servisimizden Yenibosna, Şirinevler, Bakırköy, Ataköy, Küçükçekmece ve çevresine klima, kombi, beyaz eşya servisi. {telefon}",
    h1: "Hizmet Verdiğimiz Bölgeler: Bahçelievler, Yenibosna ve Çevresi", crumbs: [{ ad: "Hizmet Bölgeleri", route: "/hizmet-bolgeleri" }],
    kaynaklar: ["content/bolgeler.json", "content/hizmetler.json"],
  },
  {
    route: "/rehberler", view: "rehberler", file: "rehberler.html", type: "CollectionPage",
    title: "Klima ve Kombi Rehberleri | Fırtına Klima",
    description: "Klima ve kombi rehberleri: kombi basıncı, ısınmayan petekler, sıcak su sorunu, klima montajı, soğutma ve ısıtma sorunları için pratik bilgiler.",
    h1: "Klima ve Kombi Rehberleri", crumbs: [{ ad: "Rehberler", route: "/rehberler" }],
    kaynaklar: ["content/yazilar"], guncelleme: "2026-10-13",
  },
  {
    route: "/iletisim", view: "iletisim", file: "iletisim.html", type: "ContactPage",
    title: "İletişim ve Adres | Fırtına Klima & Kombi, Bahçelievler",
    description: "Hürriyet, Gazi 1 Sk No:35, 34192 Bahçelievler/İstanbul adresindeyiz; her gün 08.00–21.00 hizmet veriyoruz. Telefon ve WhatsApp: {telefon}.",
    h1: "İletişim ve Adres Bilgilerimiz", crumbs: [{ ad: "İletişim", route: "/iletisim" }],
    kaynaklar: ["content/iletisim.json"],
  },
];

// Hizmet kategorileri; "sayfa" varsa content/kategoriler/<sayfa>.json bir kategori (hub) sayfası üretir.
const KATEGORILER = {
  klima: { ad: "Klima Servisi" },
  kombi: { ad: "Kombi Servisi" },
  "beyaz-esya": { ad: "Beyaz Eşya Tamiri", sayfa: "beyaz-esya-tamiri" },
};

// Metin içi bağlantı: content JSON'da [[/hedef-sayfa|bağlantı metni]] yazılır. Metin önce HTML-escape edilir,
// sonra yalnızca sitede var olan sayfalara giden bağlantılar <a>'ya çevrilir (bozuk bağlantı ya da HTML enjeksiyonu olmaz).
const LINK_RE = /\[\[(\/[a-z0-9-]*)\|([^\]|]{2,80})\]\]/g;
function linkle(s, iletisim, route, routeSet, kayit) {
  return ejs.escapeXML(doldur(s, iletisim)).replace(LINK_RE, (_, href, anchor) => {
    if (!routeSet.has(href)) throw new Error(`${route}: [[${href}|...]] hedef sayfa yok`);
    if (href === route) throw new Error(`${route}: sayfa kendine bağlantı veriyor`);
    kayit.push({ kaynak: route, hedef: href });
    return `<a href="${href}">${anchor}</a>`;
  });
}
// Sadece görünen metin (meta, kart, başlık) gereken yerlerde işaretlemeyi temizler
const linksiz = (s) => String(s ?? "").replace(LINK_RE, "$2");

// Tam git geçmişi varsa bir dosyanın (ya da dosya/klasör listesinin) son değişiklik tarihi (YYYY-MM-DD); sığ klonda tarih uydurmamak için null.
let derinGecmis;
function gitTarih(rel) {
  try {
    if (derinGecmis === undefined) derinGecmis = execFileSync("git", ["rev-parse", "--is-shallow-repository"], { cwd: ROOT }).toString().trim() === "false";
    if (!derinGecmis) return null;
    const yollar = Array.isArray(rel) ? rel : [rel];
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", ...yollar], { cwd: ROOT }).toString().trim() || null;
  } catch {
    return null;
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    throw new Error(`${path.relative(ROOT, file)} okunamadı: ${err.message}`);
  }
}
const readContent = (name) => readJson(path.join(ROOT, "content", `${name}.json`));

// Görsel alanı "/static/assets/uploads/x.webp" ya da sadece "x.webp" olabilir; şablonlar sadece dosya adını bekliyor.
function imageName(value) {
  return value ? String(value).split("/").pop() : null;
}

function requireFields(label, obj, fields) {
  const missing = fields.filter((f) => !obj || !String(obj[f] ?? "").trim());
  if (missing.length) throw new Error(`${label}: zorunlu alan(lar) boş: ${missing.join(", ")}`);
}

// content/<klasor>/*.json dosyalarını okur
function readFolder(klasor) {
  const dir = path.join(ROOT, "content", klasor);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => readJson(path.join(dir, f)));
}

function checkMetin(label, s) {
  for (const k of ["bolumler", "sss", "giris"]) if (!Array.isArray(s[k])) throw new Error(`${label}: "${k}" bir liste olmalı`);
  // Bu alanlar meta etiketlerine, kartlara ve başlıklara gidiyor; bağlantı işaretlemesi içeremez.
  const metaAlanlari = ["seo_baslik", "seo_aciklama", "h1", "baslik", "kart_baslik", "ozet", "resim_alt"].map((k) => s[k]);
  for (const v of [...metaAlanlari, ...s.bolumler.map((b) => b.baslik), ...s.sss.map((q) => q.soru)]) {
    if (String(v ?? "").includes("[[")) throw new Error(`${label}: başlık/meta alanında [[...]] bağlantısı olamaz: "${v}"`);
  }
  s.bolumler.forEach((b, i) => requireFields(`${label} bölüm #${i + 1}`, b, ["baslik"]));
  s.sss.forEach((q, i) => requireFields(`${label} soru #${i + 1}`, q, ["soru", "cevap"]));
}

function loadData() {
  const iletisim = readContent("iletisim");
  requireFields("İletişim", iletisim, ["firma_adi", "kisa_ad", "telefon", "email", "adres", "adres_sokak", "adres_ilce", "adres_il", "posta_kodu", "calisma_saatleri", "harita"]);
  if (!Number.isFinite(Number(iletisim.enlem)) || !Number.isFinite(Number(iletisim.boylam))) throw new Error("İletişim: enlem/boylam sayı olmalı");

  const hakkimizdaRaw = readContent("hakkimizda");
  requireFields("Hakkımızda", hakkimizdaRaw, ["baslik"]);
  const hakkimizda = [{ ...hakkimizdaRaw, resim: imageName(hakkimizdaRaw.resim) }];

  const hizmetler = (readContent("hizmetler").hizmetler || []).map((h, i) => {
    requireFields(`Hizmet #${i + 1}`, h, ["baslik", "slug", "aciklama", "resim", "resim_alt", "kategori"]);
    if (!KATEGORILER[h.kategori]) throw new Error(`Hizmet ${h.slug}: kategori "${Object.keys(KATEGORILER).join('", "')}" olmalı`);
    return { ...h, resim: imageName(h.resim) };
  });

  const bolgelerRaw = readContent("bolgeler");
  const teknikServis = (bolgelerRaw.bolgeler || []).map((b, i) => {
    requireFields(`Bölge #${i + 1}`, b, ["bolge"]);
    return b;
  });
  // Hizmet Bölgeleri sayfasının metni (content/bolgeler.json -> sayfa)
  const bolgeSayfasi = bolgelerRaw.sayfa;
  checkMetin("Hizmet bölgeleri sayfası", bolgeSayfasi || {});
  bolgeSayfasi.bolumler.forEach((x, i) => requireFields(`Hizmet bölgeleri bölüm #${i + 1}`, x, ["id"]));

  // Hizmet sayfaları: content/sayfalar/<slug>.json
  const sayfalar = {};
  for (const s of readFolder("sayfalar")) {
    requireFields(`Hizmet sayfası ${s.slug}`, s, ["slug", "seo_baslik", "seo_aciklama", "h1"]);
    checkMetin(`Hizmet sayfası ${s.slug}`, s);
    if (!hizmetler.some((h) => h.slug === s.slug)) throw new Error(`content/sayfalar/${s.slug}.json: hizmetler.json'da bu slug yok`);
    sayfalar[s.slug] = s;
  }

  // Blog yazıları: content/yazilar/<slug>.json (yeniden eskiye)
  const yazilar = readFolder("yazilar").map((y) => {
    requireFields(`Yazı ${y.slug}`, y, ["slug", "baslik", "kart_baslik", "seo_baslik", "seo_aciklama", "ozet", "resim", "resim_alt", "tarih", "kategori"]);
    if (!["klima", "kombi"].includes(y.kategori)) throw new Error(`Yazı ${y.slug}: kategori "klima" ya da "kombi" olmalı`);
    checkMetin(`Yazı ${y.slug}`, y);
    return { ...y, resim: imageName(y.resim) };
  }).sort((a, b) => b.tarih.localeCompare(a.tarih));

  // Kategori (hub) sayfaları: content/kategoriler/<slug>.json, örn. beyaz-esya-tamiri
  const kategoriSayfalari = {};
  for (const k of readFolder("kategoriler")) {
    requireFields(`Kategori sayfası ${k.slug}`, k, ["slug", "hizmet", "seo_baslik", "seo_aciklama", "h1"]);
    checkMetin(`Kategori sayfası ${k.slug}`, k);
    const anahtar = Object.keys(KATEGORILER).find((x) => KATEGORILER[x].sayfa === k.slug);
    if (!anahtar) throw new Error(`content/kategoriler/${k.slug}.json: KATEGORILER içinde bu sayfa yok`);
    kategoriSayfalari[anahtar] = k;
  }

  return { iletisim, hakkimizda, hizmetler, teknikServis, bolgeSayfasi, sayfalar, yazilar, kategoriSayfalari };
}

// Sayfaya özel paylaşım (Open Graph) görseli: public/images/og/<ad>.jpg (scripts/og-gorselleri.js üretir)
const ogDosyaAdi = (route) => (route === "/" ? "ana-sayfa" : route.slice(1));
function ogEkle(page, iletisim) {
  const ad = ogDosyaAdi(page.route);
  if (fs.existsSync(path.join(ROOT, "public", "images", "og", `${ad}.jpg`))) {
    page.ogImage = `/static/images/og/${ad}.jpg`;
    page.ogAlt = `${linksiz(page.h1)} – ${iletisim.firma_adi}, ${telGoster(iletisim.telefon)}`;
  }
  return page;
}

// Rehber sayfalarının site haritası tarihi: views/yazi.ejs ya da rehberlerin breadcrumb/yapısal verisi değişince elle güncelleyin.
// Makale tarihi (dateModified, "Güncellendi") bundan etkilenmez; o content/yazilar/*.json içindeki guncelleme/tarih alanından gelir.
const YAZI_SABLON_GUNCELLEME = "2026-10-13";

function tumSayfalar(data) {
  // Sabit sayfalar: lastmod, elle girilen guncelleme ile kaynak içeriğin son git tarihinden yeni olanıdır.
  const list = SABIT_SAYFALAR.map(({ kaynaklar, guncelleme, ...p }) => ({
    ...p,
    lastmod: [guncelleme, kaynaklar ? gitTarih(kaynaklar) : null].filter(Boolean).sort().pop() || null,
  }));
  for (const [anahtar, k] of Object.entries(data.kategoriSayfalari)) {
    list.push({
      route: `/${k.slug}`, view: "kategori", file: `${k.slug}.html`, type: "CollectionPage",
      title: k.seo_baslik, description: k.seo_aciklama, h1: k.h1,
      crumbs: [{ ad: KATEGORILER[anahtar].ad, route: `/${k.slug}` }],
      kategori: anahtar, kategoriSayfa: k, lastmod: gitTarih(`content/kategoriler/${k.slug}.json`),
    });
  }
  for (const h of data.hizmetler) {
    const s = data.sayfalar[h.slug];
    if (!s) { console.warn(`  ! ${h.slug}: content/sayfalar/${h.slug}.json yok, hizmet sayfası üretilmedi`); continue; }
    list.push({
      route: `/${h.slug}`, view: "hizmet", file: `${h.slug}.html`, type: "WebPage",
      title: s.seo_baslik, description: s.seo_aciklama, h1: s.h1,
      crumbs: [KATEGORILER[h.kategori].sayfa && data.kategoriSayfalari[h.kategori] ? { ad: KATEGORILER[h.kategori].ad, route: `/${KATEGORILER[h.kategori].sayfa}` } : { ad: "Hizmetler", route: "/hizmetler" }, { ad: h.baslik, route: `/${h.slug}` }],
      hizmet: h, sayfa: s, lastmod: gitTarih(`content/sayfalar/${h.slug}.json`),
    });
  }
  for (const y of data.yazilar) {
    list.push({
      route: `/${y.slug}`, view: "yazi", file: `${y.slug}.html`, type: "WebPage", ogType: "article",
      title: y.seo_baslik, description: y.seo_aciklama, h1: y.baslik,
      crumbs: [{ ad: "Rehberler", route: "/rehberler" }, { ad: y.kart_baslik, route: `/${y.slug}` }],
      yazi: y, lastmod: [y.guncelleme || y.tarih, YAZI_SABLON_GUNCELLEME].sort().pop(),
    });
  }
  return list.map((p) => ogEkle(p, data.iletisim));
}

// Başlık/açıklama uzunluklarını ve tekrarları kontrol eder; tekrar varsa build durur.
function seoKontrol(pages) {
  const seen = { title: new Map(), description: new Map() };
  for (const p of pages) {
    if (p.title.length > 65) console.warn(`  ! ${p.route}: başlık ${p.title.length} karakter (önerilen ≤ 60)`);
    if (p.description.length < 110 || p.description.length > 160) console.warn(`  ! ${p.route}: açıklama ${p.description.length} karakter (önerilen 120-155)`);
    for (const k of ["title", "description"]) {
      if (seen[k].has(p[k])) throw new Error(`SEO: "${p.route}" ile "${seen[k].get(p[k])}" aynı ${k} kullanıyor`);
      seen[k].set(p[k], p.route);
    }
  }
}

function copyDir(src, dest) {
  fs.cpSync(src, dest, {
    recursive: true,
    filter: (p) => path.basename(p) !== ".DS_Store",
  });
}

function sitemap(pages) {
  const urls = pages.map((p) => {
    const loc = p.route === "/" ? `${SITE_URL}/` : `${SITE_URL}${p.route}`;
    return `  <url>\n    <loc>${loc}</loc>${p.lastmod ? `\n    <lastmod>${p.lastmod}</lastmod>` : ""}\n  </url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

// Üretilen HTML'deki JSON-LD geçerli mi, başvurulan yerel dosyalar var mı?
function ciktiKontrol(file, html) {
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { throw new Error(`${file}: JSON-LD bozuk (${e.message})`); }
  }
  for (const m of html.matchAll(/(?:href|src|content)="(?:https:\/\/www\.firtinaklima\.com)?(\/(?:static|favicon|apple-touch|site\.web)[^"#?]*)"/g)) {
    if (!fs.existsSync(path.join(DIST, decodeURI(m[1])))) throw new Error(`${file}: ${m[1]} dosyası yok`);
  }
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const aday of m[1].split(",")) {
      const yol = aday.trim().split(/\s+/)[0];
      if (yol.startsWith("/static/") && !fs.existsSync(path.join(DIST, decodeURI(yol)))) throw new Error(`${file}: ${yol} dosyası yok (srcset)`);
    }
  }
  for (const m of html.matchAll(/"(?:url|contentUrl)":"https:\/\/www\.firtinaklima\.com(\/static\/[^"]+)"/g)) {
    if (!fs.existsSync(path.join(DIST, decodeURI(m[1])))) throw new Error(`${file}: JSON-LD'deki ${m[1]} dosyası yok`);
  }
  if (html.includes("[[")) throw new Error(`${file}: işlenmemiş [[...]] bağlantısı var`);
}

function build() {
  const data = loadData();
  const pages = tumSayfalar(data);
  for (const p of pages) {
    p.title = doldur(p.title, data.iletisim);
    p.description = doldur(p.description, data.iletisim);
  }
  seoKontrol(pages);

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  // Eski sitede public/ klasörü /static altında sunuluyordu; URL'ler aynı kalsın.
  copyDir(path.join(ROOT, "public"), path.join(DIST, "static"));
  copyDir(path.join(ROOT, "site"), DIST);

  const routeSet = new Set(pages.map((p) => p.route));
  const kayit = [];
  // Kartlarda 700px genişliğinde küçük sürüm (varsa) kullanılır: x.webp -> x-kart.webp
  const kartGorseli = (ad) => {
    const kok = String(ad).replace(/\.[a-z]+$/i, "");
    return fs.existsSync(path.join(ROOT, "public", "assets", "uploads", `${kok}-kart.webp`)) ? `${kok}-kart.webp` : ad;
  };
  const ortak = { ...data, KATEGORILER, kartGorseli, telGoster, doldur: (s) => doldur(s, data.iletisim), linksiz, routes: pages.map((p) => p.route).filter((r) => r !== "/") };
  for (const page of [...pages, { view: "404", file: "404.html" }]) {
    const viewFile = path.join(ROOT, "views", `${page.view}.ejs`);
    // WhatsApp mesajı hazır gelsin: işletme hangi hizmet için yazıldığını sohbetin ilk satırında görür.
    const waMesaj = page.hizmet ? `Merhaba, ${page.hizmet.baslik} için servis istiyorum. Semtim: ` : page.kategoriSayfa ? `Merhaba, ${page.kategoriSayfa.hizmet} için servis istiyorum. Semtim: ` : "Merhaba, klima, kombi veya beyaz eşya servisi için yazıyorum. Semtim: ";
    const locals = {
      ...ortak, page, ogType: page.ogType, seo: page.route ? seoFor(data, page) : null,
      linkle: (s) => linkle(s, data.iletisim, page.route, routeSet, kayit),
      wa: data.iletisim.whatsapp ? `${data.iletisim.whatsapp}?text=${encodeURIComponent(waMesaj)}` : "",
    };
    const html = ejs.render(fs.readFileSync(viewFile, "utf8"), locals, { filename: viewFile });
    ciktiKontrol(page.file, html);
    fs.writeFileSync(path.join(DIST, page.file), html);
    console.log(`  ✓ ${page.route || "(404)"} -> dist/${page.file}`);
  }

  // Metin içi bağlantı raporu: aynı sayfaya iki kez ya da bir sayfadan çok fazla bağlantı verilmesin.
  const kaynakSayisi = new Map(), ikili = new Set(), gelen = new Map();
  for (const k of kayit) {
    const anahtar = `${k.kaynak} -> ${k.hedef}`;
    if (ikili.has(anahtar)) console.warn(`  ! ${anahtar}: aynı sayfaya birden fazla metin içi bağlantı`);
    ikili.add(anahtar);
    kaynakSayisi.set(k.kaynak, (kaynakSayisi.get(k.kaynak) || 0) + 1);
    gelen.set(k.hedef, (gelen.get(k.hedef) || 0) + 1);
  }
  for (const [r, n] of kaynakSayisi) if (n > 8) console.warn(`  ! ${r}: ${n} metin içi bağlantı (önerilen ≤ 8)`);
  console.log(`  Metin içi bağlantılar: ${kayit.length} (${[...gelen].map(([r, n]) => `${r}:${n}`).join(", ")})`);

  const xml = sitemap(pages);
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), xml);
  // Search Console'a eski adres (/static/sitemap.xml) gönderilmiş olabilir, orada da dursun.
  fs.writeFileSync(path.join(DIST, "static", "sitemap.xml"), xml);
  fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

  console.log("Build tamamlandı: dist/");
}

// scripts/og-gorselleri.js sayfa listesini buradan alır; doğrudan çalıştırılınca siteyi üretir.
module.exports = { loadData, tumSayfalar, ogDosyaAdi, ROOT };

if (require.main === module) {
  (async () => {
    build();
    await cssAyikla(DIST);
  })().catch((err) => {
    // Hata olursa build başarısız olur ve GitHub Pages yayındaki eski sürümü korur.
    console.error(`\nBUILD HATASI: ${err.message}\n`);
    process.exit(1);
  });
}
