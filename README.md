# Statik site

Sunucu ve veritabanı yok; site GitHub Pages üzerinde yayınlanır.

```
content/*.json  ──►  scripts/build.js (EJS şablonları)  ──►  dist/  ──►  GitHub Pages
                                                     ▲
                 git push ──► GitHub Actions build edip yayınlar (~1-2 dk)
```

## Klasörler

| Klasör / dosya | Ne işe yarar |
| --- | --- |
| `content/` | Sitenin tüm içeriği: iletişim, hizmetler, hakkımızda, bölgeler; `sayfalar/` hizmet sayfaları, `kategoriler/` kategori sayfaları (ör. beyaz eşya tamiri), `yazilar/` rehber yazıları. |
| `views/` | Sayfa şablonları (EJS). |
| `public/` | CSS, JS, font ve görseller. Sitede `/static/...` adresinden yayınlanır. |
| `public/assets/uploads/` | Hizmet, blog ve hakkımızda görselleri. |
| `site/` | Sitenin köküne kopyalanan dosyalar (Google doğrulama dosyası, IndexNow anahtarı). |
| `scripts/indexnow.js` | Yayından sonra değişen sayfaları IndexNow ile Bing/Yandex'e bildirir. |
| `scripts/build.js` | `dist/` klasörünü üretir. Ayrıca `sitemap.xml` ve `robots.txt` oluşturur. |
| `scripts/css-ayikla.js` | Build sonunda temanın CSS'inden sitede kullanılmayan kuralları çıkarır (PurgeCSS). |
| `scripts/ikon-fontu.js` | Font Awesome fontunu sadece kullanılan simgelere indirir. |
| `scripts/preview.js` | `dist/` klasörünü yerelde GitHub Pages gibi sunar. |
| `.github/workflows/deploy.yml` | Her push'ta siteyi build edip yayınlar. |

## Yerelde çalıştırma

```bash
npm install
npm run dev
```

Ardından http://localhost:3000 adresini açın. Sadece build için: `npm run build`.

Bir JSON dosyası bozulursa ya da zorunlu bir alan boş kalırsa build hata verir. Zorunlu alanlar: telefon, e-posta, başlıklar, hizmet açıklaması ve hizmet/blog görselleri. Build hata verdiğinde yeni sürüm yayınlanmaz ve sitedeki önceki sürüm olduğu gibi kalır.

## İçerik düzenleme

İçerik `content/*.json` dosyalarındadır (iletişim bilgileri, hizmetler, hakkımızda, blog kartları, bölgeler). Dosyayı düzenleyip `main` dalına gönderince site 1-2 dakikada güncellenir.

- Görseller `public/assets/uploads/` klasörüne konur, JSON'a sadece dosya adı yazılır.
- Facebook, Instagram, YouTube veya WhatsApp alanı boş bırakılırsa o buton sitede gizlenir.
- Hakkımızda görseli boş bırakılırsa varsayılan görsel kullanılır.
- Metin içinde başka bir sayfaya bağlantı: `[[/klima-bakimi|klima bakımı]]`. Hedef sayfa yoksa build hata verir; başlık, soru ve SEO alanlarında kullanılamaz.
- Her sayfanın paylaşım (Open Graph) görseli `public/images/og/` klasöründe. Sayfa eklendiğinde ya da başlığı değiştiğinde yeniden üretin: `CHROME=<chrome-headless-shell yolu> node scripts/og-gorselleri.js` (ffmpeg gerekir). Görseli olmayan sayfa genel paylaşım görselini kullanır.
- Rehber yazılarında `kategori` alanı `klima` ya da `kombi` olmalı; Rehberler sayfası ve "Diğer yazılar" listesi buna göre gruplanır.
- `hizmetler.json` içindeki her hizmetin `kategori` alanı `klima`, `kombi` ya da `beyaz-esya` olmalı. Menü, ana sayfa ve Hizmetler sayfasındaki kartlar bu üç başlık altında gruplanır. Kategori sayfaları `content/kategoriler/` klasöründedir.
- Zorunlu alanlardan biri boşsa build hata verir ve sitedeki önceki sürüm olduğu gibi kalır.

## Hız notları

- İkonlar sadece Font Awesome 4 (`fa fa-*`) ile gösteriliyor. Font, sitede kullanılan simgelere indirilmiş hâliyle (`fa-subset.ttf`, ~9 KB) yükleniyor. Şablona yeni bir `fa fa-*` simgesi eklerseniz `node scripts/ikon-fontu.js` çalıştırın (hb-subset gerekir: `brew install harfbuzz`), yoksa simge görünmez.
- CSS dosyaları build sırasında ayıklanır; yalnızca HTML'de ve `public/js` içindeki dosyalarda geçen sınıfların kuralları kalır. Bir sınıf sadece JS ile sonradan ekleniyor ve stili kayboluyorsa `scripts/css-ayikla.js` içindeki `safelist` listesine ekleyin.
- Hizmet ve rehber kartlarında görselin 700 px genişliğindeki `-kart.webp` sürümü (varsa) kullanılır. Büyük bir kart görseli eklerseniz yanına küçük sürümünü de koyun.
- Slider (swiper) dosyaları yalnızca ana sayfada yüklenir.
- Manrope yazı tipi `public/fonts/manrope/` klasöründen (latin + latin-ext) yükleniyor; Google Fonts'a bağlantı kurulmuyor.
- Alt sayfa arka planlarının (`background/1, 4, 8.webp`) dikey telefonlar için ortadan kırpılmış `-dikey.webp` sürümleri var; ana görsel değişirse bunlar da güncellenmeli.
- Ana sayfadaki ilk slider görselinin dikey ekranlar için kırpılmış sürümü `public/images/slider/5-mobile.webp`. `5.webp` değişirse bu da güncellenmeli.
- Yeni görselleri yüklemeden önce WebP'ye çevirip sıkıştırmak (kalite ~80) siteyi hızlı tutar.
