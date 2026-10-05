// dist/ klasörünü GitHub Pages gibi sunan küçük yerel sunucu:
// /hakkimizda -> hakkimizda.html, klasör -> sonuna "/" eklenerek index.html, bilinmeyen adres -> 404.html (404 koduyla).
const http = require("http");
const fs = require("fs");
const path = require("path");

const DIST = path.resolve(__dirname, "..", "dist");
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "font/otf",
};

// GitHub Pages büyük/küçük harfe duyarlı; macOS dosya sistemi değil. Her parçayı birebir eşleştir.
function existsExactCase(full) {
  let dir = DIST;
  for (const part of path.relative(DIST, full).split(path.sep).filter(Boolean)) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory() || !fs.readdirSync(dir).includes(part)) return false;
    dir = path.join(dir, part);
  }
  return true;
}

function inDist(rel) {
  const full = path.join(DIST, path.normalize(rel).replace(/^(\.\.[/\\])+/, ""));
  return full.startsWith(DIST) && existsExactCase(full) ? full : null;
}

function isFile(rel) {
  const full = inDist(rel);
  return full && fs.statSync(full).isFile() ? full : null;
}

function isDir(rel) {
  const full = inDist(rel);
  return full && fs.statSync(full).isDirectory() ? full : null;
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      pathname = null; // bozuk %-kodlu adres: sunucu çökmesin, 404 dönsün
    }

    // GitHub Pages: /klasor -> 301 /klasor/
    if (pathname && !pathname.endsWith("/") && isDir(pathname) && isFile(path.join(pathname, "index.html"))) {
      res.writeHead(301, { Location: pathname + "/" + url.search });
      return res.end();
    }

    const file = !pathname
      ? null
      : pathname.endsWith("/")
      ? isFile(path.join(pathname, "index.html"))
      : isFile(pathname) || isFile(pathname + ".html");
    if (!file) {
      res.writeHead(404, { "Content-Type": TYPES[".html"] });
      return fs.createReadStream(path.join(DIST, "404.html")).pipe(res);
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`Önizleme: http://localhost:${PORT}`));
