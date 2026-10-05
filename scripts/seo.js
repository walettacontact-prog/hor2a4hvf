// Her sayfanın <head> SEO verisini (başlık, açıklama, Open Graph/Twitter, JSON-LD @graph) content/*.json'dan üretir.
// İşletme bilgileri tek yerden (content/iletisim.json, bolgeler.json, hizmetler.json) gelir; sayfalar arasında çelişki olmaz.
"use strict";

const SITE_URL = "https://www.firtinaklima.com";
const THEME_COLOR = "#234982"; // public/css/colors/scheme-01.css --primary-color
const LOGO = { url: `${SITE_URL}/static/images/brand/logo-512.png`, width: 512, height: 512 };
const SHARE = { url: `${SITE_URL}/static/images/brand/paylasim-1200x630.jpg`, width: 1200, height: 630, type: "image/jpeg" };

const abs = (p) => (/^https?:\/\//.test(p) ? p : `${SITE_URL}${p.startsWith("/") ? "" : "/"}${p}`);
const pageUrl = (route) => (route === "/" ? `${SITE_URL}/` : `${SITE_URL}${route}`);
const upload = (file) => (file ? abs(`/static/assets/uploads/${String(file).split("/").pop()}`) : undefined);

// "+905334120894" -> "0533 412 08 94"
const telGoster = (t) => String(t).replace(/^\+90(\d{3})(\d{3})(\d{2})(\d{2})$/, "0$1 $2 $3 $4");

// Metinlerdeki {telefon} yer tutucusunu doldurur
const doldur = (s, iletisim) => String(s ?? "").split("{telefon}").join(telGoster(iletisim.telefon));

// Çalışma saatleri metnini schema.org OpeningHoursSpecification'a çevirir; anlaşılamazsa build durur.
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TR_DAY = { pazartesi: 0, pzt: 0, salı: 1, sal: 1, çarşamba: 2, çar: 2, perşembe: 3, per: 3, cuma: 4, cum: 4, cumartesi: 5, cmt: 5, pazar: 6, paz: 6 };
const DAY = "(pazartesi|pzt|salı|sal|çarşamba|çar|perşembe|per|cumartesi|cmt|cuma|cum|pazar|paz)\\.?";
const TIME = "(\\d{1,2})[.:](\\d{2})\\s*[-–]\\s*(\\d{1,2})[.:](\\d{2})";
function saatAraligi(m) {
  const kapanis = `${m[3].padStart(2, "0")}:${m[4]}`;
  return { opens: `${m[1].padStart(2, "0")}:${m[2]}`, closes: kapanis === "24:00" ? "23:59" : kapanis };
}
function parseHours(text) {
  const t = String(text || "").toLocaleLowerCase("tr").trim();
  if (/^(7\s*\/\s*24|her gün 24 saat)$/.test(t)) return { "@type": "OpeningHoursSpecification", dayOfWeek: DAYS, opens: "00:00", closes: "23:59" };
  let m = t.match(new RegExp(`^her gün\\s+${TIME}$`));
  if (m) return { "@type": "OpeningHoursSpecification", dayOfWeek: DAYS, ...saatAraligi(m) };
  m = t.match(new RegExp(`^${DAY}\\s*[-–]\\s*${DAY}\\s+${TIME}$`));
  if (!m || TR_DAY[m[2]] < TR_DAY[m[1]]) {
    throw new Error(`İletişim: çalışma saatleri anlaşılamadı ("${text}"). Örnek: "Her gün 08.00 - 21.00" veya "Pzt - Cmt 08.00 - 20.00"`);
  }
  return { "@type": "OpeningHoursSpecification", dayOfWeek: DAYS.slice(TR_DAY[m[1]], TR_DAY[m[2]] + 1), ...saatAraligi(m.slice(2)) };
}

function isletme({ iletisim, hizmetler, teknikServis, hakkimizda }) {
  const sameAs = [iletisim.instagram, iletisim.facebook, iletisim.youtube].filter(Boolean);
  return {
    "@type": "HVACBusiness",
    "@id": `${SITE_URL}/#isletme`,
    name: iletisim.firma_adi,
    alternateName: iletisim.kisa_ad,
    url: `${SITE_URL}/`,
    logo: { "@type": "ImageObject", "@id": `${SITE_URL}/#logo`, url: LOGO.url, width: LOGO.width, height: LOGO.height, caption: iletisim.firma_adi },
    image: [SHARE.url, LOGO.url, upload(hakkimizda[0] && hakkimizda[0].resim)].filter(Boolean),
    description: "Bahçelievler ve Yenibosna merkezli klima ve kombi teknik servisi: klima montajı, klima arıza tamiri, klima bakımı, gaz dolumu, VRF/multi sistem servisi, kombi bakımı ve kombi arıza onarımı.",
    telephone: iletisim.telefon,
    email: iletisim.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: iletisim.adres_sokak,
      addressLocality: iletisim.adres_ilce,
      addressRegion: iletisim.adres_il,
      postalCode: iletisim.posta_kodu,
      addressCountry: "TR",
    },
    geo: { "@type": "GeoCoordinates", latitude: Number(iletisim.enlem), longitude: Number(iletisim.boylam) },
    hasMap: iletisim.harita,
    openingHoursSpecification: [parseHours(iletisim.calisma_saatleri)],
    areaServed: teknikServis.map((b) => ({ "@type": "Place", name: b.bolge, containedInPlace: { "@id": `${SITE_URL}/#istanbul` } })),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      "@id": `${SITE_URL}/#hizmetler`,
      name: "Klima ve Kombi Servis Hizmetleri",
      itemListElement: hizmetler.map((h) => ({
        "@type": "Offer",
        itemOffered: { "@id": `${SITE_URL}/${h.slug}#hizmet` },
      })),
    },
    contactPoint: { "@type": "ContactPoint", telephone: iletisim.telefon, email: iletisim.email, contactType: "customer service", availableLanguage: "Turkish" },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

function hizmetDugumu(h, sayfa, iletisim) {
  return {
    "@type": "Service",
    "@id": `${SITE_URL}/${h.slug}#hizmet`,
    name: h.baslik,
    serviceType: h.baslik,
    description: h.aciklama,
    url: `${SITE_URL}/${h.slug}`,
    provider: { "@id": `${SITE_URL}/#isletme` },
    ...(sayfa ? { mainEntityOfPage: { "@id": `${SITE_URL}/${h.slug}#webpage` } } : {}),
    availableChannel: { "@type": "ServiceChannel", servicePhone: { "@type": "ContactPoint", telephone: iletisim.telefon } },
  };
}

/**
 * page: { route, type, title, description, crumbs: [{ad, route}], image?, hizmet?, yazi? }
 * Döner: { url, title, description, siteName, image, imageAlt, themeColor, jsonLd }
 */
function seoFor(data, page) {
  const { iletisim, hizmetler } = data;
  const url = pageUrl(page.route);
  const graph = [
    isletme(data),
    { "@type": "City", "@id": `${SITE_URL}/#istanbul`, name: "İstanbul", sameAs: "https://www.wikidata.org/wiki/Q406" },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: iletisim.firma_adi,
      alternateName: iletisim.kisa_ad,
      inLanguage: "tr-TR",
      publisher: { "@id": `${SITE_URL}/#isletme` },
    },
  ];

  const image = page.image ? { url: abs(page.image) } : page.yazi ? { url: upload(page.yazi.resim) } : SHARE;
  const webpage = {
    "@type": page.type || "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: page.title,
    description: page.description,
    inLanguage: "tr-TR",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#isletme` },
    primaryImageOfPage: { "@type": "ImageObject", url: image.url },
  };
  if (page.crumbs && page.crumbs.length) webpage.breadcrumb = { "@id": `${url}#breadcrumb` };
  if (page.route === "/hizmetler") webpage.mainEntity = { "@id": `${SITE_URL}/#hizmetler` };
  if (page.route === "/iletisim" || page.route === "/hakkimizda") webpage.mainEntity = { "@id": `${SITE_URL}/#isletme` };
  graph.push(webpage);

  // Hizmetler sayfada görünen her hizmet için Service düğümü (hizmet sayfası, hizmetler listesi ve ana sayfa kartları)
  if (page.hizmet) graph.push(hizmetDugumu(page.hizmet, true, iletisim));
  else if (page.route === "/" || page.route === "/hizmetler") hizmetler.forEach((h) => graph.push(hizmetDugumu(h, false, iletisim)));

  if (page.yazi) {
    graph.push({
      "@type": "BlogPosting",
      "@id": `${url}#yazi`,
      mainEntityOfPage: { "@id": `${url}#webpage` },
      headline: page.yazi.baslik,
      description: page.description,
      image: page.image ? abs(page.image) : upload(page.yazi.resim),
      datePublished: page.yazi.tarih,
      dateModified: page.yazi.guncelleme || page.yazi.tarih,
      inLanguage: "tr-TR",
      author: { "@id": `${SITE_URL}/#isletme` },
      publisher: { "@id": `${SITE_URL}/#isletme` },
    });
  }

  if (page.crumbs && page.crumbs.length) {
    const items = [{ ad: "Ana Sayfa", route: "/" }, ...page.crumbs];
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.ad, item: pageUrl(c.route) })),
    });
  }

  const jsonLd = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  return {
    url,
    title: page.title,
    description: page.description,
    siteName: iletisim.firma_adi,
    image: page.image ? { url: abs(page.image) } : SHARE,
    imageAlt: page.imageAlt || `${iletisim.firma_adi} – klima ve kombi servisi, ${telGoster(iletisim.telefon)}`,
    themeColor: THEME_COLOR,
    jsonLd,
  };
}

module.exports = { seoFor, parseHours, telGoster, doldur, SITE_URL, SHARE, LOGO };
