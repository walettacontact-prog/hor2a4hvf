# Statik site

Sunucu ve veritabanı yok; site GitHub Pages üzerinde yayınlanır.

```
content/*.json  ──►  scripts/build.js (EJS şablonları)  ──►  dist/  ──►  GitHub Pages
      ▲                                                                    ▲
 Pages CMS ile düzenle ──► GitHub'a commit ──► GitHub Actions build edip yayınlar (~1-2 dk)
```

## Klasörler

| Klasör / dosya | Ne işe yarar |
| --- | --- |
| `content/` | Sitenin tüm içeriği: iletişim, hizmetler, hakkımızda, blog kartları, bölgeler. |
| `views/` | Sayfa şablonları (EJS). |
| `public/` | CSS, JS, font ve görseller. Sitede `/static/...` adresinden yayınlanır. |
| `public/assets/uploads/` | CMS'ten yüklenen görseller. |
| `site/` | Sitenin köküne kopyalanan dosyalar (Google doğrulama dosyası). |
| `scripts/build.js` | `dist/` klasörünü üretir. Ayrıca `sitemap.xml` ve `robots.txt` oluşturur. |
| `scripts/preview.js` | `dist/` klasörünü yerelde GitHub Pages gibi sunar. |
| `.pages.yml` | Pages CMS (yönetim paneli) ayarı. |
| `.github/workflows/deploy.yml` | Her push'ta siteyi build edip yayınlar. |

## Yerelde çalıştırma

```bash
npm install
npm run dev
```

Ardından http://localhost:3000 adresini açın. Sadece build için: `npm run build`.

Bir JSON dosyası bozulursa ya da zorunlu bir alan boş kalırsa build hata verir. Zorunlu alanlar: telefon, e-posta, başlıklar, hizmet açıklaması ve hizmet/blog görselleri. Build hata verdiğinde yeni sürüm yayınlanmaz ve sitedeki önceki sürüm olduğu gibi kalır.

## İçerik düzenleme

İçerik [Pages CMS](https://app.pagescms.org) ile düzenlenir.

- **Geliştirici:** GitHub hesabıyla giriş yapar.
- **İşletme sahibi:** GitHub hesabına ihtiyaç duymaz. Sol menüdeki **Collaborators → Invite** ile e-posta adresinden davet edilir ve e-postasına gelen 6 haneli kodla giriş yapar.
- Her "Kaydet" bir commit oluşturur. Site 1-2 dakika içinde güncellenir.
- Eski `/admin` ve `/account/...` adresleri Pages CMS'e yönlenir.

Dikkat edilecekler:

- Görselleri medya klasörüne **alt klasör oluşturmadan** yükleyin.
- Facebook, Instagram, YouTube veya WhatsApp alanını boş bırakırsanız o buton sitede gizlenir.
- Hakkımızda görseli boş bırakılırsa varsayılan görsel kullanılır.

## Hız notları

- IcoFont, sadece sitede kullanılan 7 ikonu içeren `public/fonts/icofont/fonts/icofont-subset.ttf` dosyasından yükleniyor. Şablonlara yeni bir `icofont-*` ikonu eklenirse bu dosya o ikonu da içerecek şekilde yeniden üretilmeli (`hb-subset`), yoksa ikon görünmez.
- Ana sayfadaki ilk slider görselinin dikey ekranlar için kırpılmış sürümü `public/images/slider/5-mobile.webp`. `5.webp` değişirse bu da güncellenmeli.
- Yeni görselleri yüklemeden önce WebP'ye çevirip sıkıştırmak (kalite ~80) siteyi hızlı tutar.
