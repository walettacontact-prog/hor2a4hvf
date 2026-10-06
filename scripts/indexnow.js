// Yayından sonra değişen sayfaları IndexNow ile arama motorlarına bildirir (Bing, Yandex ve diğer katılımcılar; Google kullanmıyor).
// Kullanım: node scripts/indexnow.js [önceki-commit] [--dry-run]
// Anahtar dosyası site/<anahtar>.txt; canlı sitede erişilemiyorsa (ör. alan adı henüz GitHub'a yönlenmemişse) hiçbir şey gönderilmez.
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { SITE_URL } = require("./seo");

const ROOT = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry-run");
const before = process.argv.slice(2).find((a) => !a.startsWith("--")) || "";
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

async function canliAnahtar(key) {
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(`${SITE_URL}/${key}.txt`, { cache: "no-store" });
      if (res.ok && (await res.text()).trim() === key) return true;
    } catch {}
    await bekle(20000);
  }
  return false;
}

// Hangi sayfalar değişti? Belirlenemezse null (= hepsi).
function degisenRoutelar() {
  if (!/^[0-9a-f]{40}$/.test(before) || /^0+$/.test(before)) return null;
  let dosyalar;
  try {
    dosyalar = execFileSync("git", ["diff", "--name-only", before, "HEAD"], { cwd: ROOT }).toString().split("\n").filter(Boolean);
  } catch {
    return null;
  }
  const routes = new Set();
  for (const f of dosyalar) {
    let m;
    if ((m = f.match(/^content\/sayfalar\/([a-z0-9-]+)\.json$/))) routes.add(`/${m[1]}`);
    else if ((m = f.match(/^content\/yazilar\/([a-z0-9-]+)\.json$/))) { routes.add(`/${m[1]}`); routes.add("/rehberler"); routes.add("/"); }
    else if (/^(content\/|views\/|scripts\/(build|seo)\.js$)/.test(f)) return null;
  }
  return routes;
}

(async () => {
  const keyFile = fs.readdirSync(path.join(ROOT, "site")).find((f) => /^[a-f0-9]{32}\.txt$/.test(f));
  if (!keyFile) return console.log("IndexNow: anahtar dosyası yok, atlandı.");
  const key = keyFile.replace(/\.txt$/, "");

  const sitemap = await fetch(`${SITE_URL}/sitemap.xml`, { cache: "no-store" }).then((r) => (r.ok ? r.text() : "")).catch(() => "");
  const tumUrller = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const routes = degisenRoutelar();
  const urlList = routes === null ? tumUrller : tumUrller.filter((u) => routes.has(u.slice(SITE_URL.length) || "/"));
  if (!urlList.length) return console.log("IndexNow: bildirilecek değişen sayfa yok.");
  console.log(`IndexNow: ${urlList.length} adres\n  ${urlList.join("\n  ")}`);
  if (DRY) return;

  if (!(await canliAnahtar(key))) return console.log(`::notice::IndexNow atlandı: ${SITE_URL}/${keyFile} canlı sitede henüz erişilebilir değil.`);
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: new URL(SITE_URL).host, key, keyLocation: `${SITE_URL}/${keyFile}`, urlList }),
  });
  console.log(`IndexNow yanıtı: HTTP ${res.status}`);
  if (res.status !== 200 && res.status !== 202) process.exitCode = 1;
})();
