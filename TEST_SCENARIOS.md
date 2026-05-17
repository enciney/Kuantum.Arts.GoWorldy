# GoWorldy — Test Senaryoları

> Tüm test senaryoları mobile uygulama ekranları ve API endpoint'leri bazında gruplanmıştır.
> Her senaryo için: **Başlangıç koşulu → Adımlar → Beklenen sonuç** formatı kullanılır.

---

## İçindekiler

1. [Auth — Kimlik Doğrulama](#1-auth--kimlik-doğrulama)
2. [HomeScreen — Ana Sayfa](#2-homescreen--ana-sayfa)
3. [GuideScreen — Rehberlik](#3-guidescreen--rehberlik)
4. [ForumScreen — Forum Ana](#4-forumscreen--forum-ana)
5. [ForumCategoriesScreen — Kategoriler](#5-forumcategoriesscreen--kategoriler)
6. [ForumTopicsScreen — Konular](#6-forumtopicsscreen--konular)
7. [ForumTopicDetailScreen — Konu Detayı](#7-forumtopicdetailscreen--konu-detayı)
8. [CreateTopicScreen — Yeni Konu](#8-createtopicscreen--yeni-konu)
9. [ProfileScreen — Profil](#9-profilescreen--profil)
10. [MyTopicsScreen — Konularım](#10-mytopicsscreen--konularım)
11. [MyCommentsScreen — Yorumlarım](#11-mycommentsscreen--yorumlarım)
12. [NotificationsScreen — Bildirimler](#12-notificationsscreen--bildirimler)
13. [PremiumScreen — Premium](#13-premiumscreen--premium)
14. [CreditGateModal — Kredi Kapısı](#14-creditgatemodal--kredi-kapısı)
15. [API — Auth Endpoint'leri](#15-api--auth-endpointleri)
16. [API — Users Endpoint'leri](#16-api--users-endpointleri)
17. [API — Forum Endpoint'leri](#17-api--forum-endpointleri)
18. [API — Guide Endpoint'leri](#18-api--guide-endpointleri)
19. [API — Payment Endpoint'leri](#19-api--payment-endpointleri)
20. [API — Notifications Endpoint'leri](#20-api--notifications-endpointleri)
21. [API — Admin Endpoint'leri](#21-api--admin-endpointleri)
22. [Navigasyon & Deep Link](#22-navigasyon--deep-link)
23. [Güvenlik & Yetkilendirme](#23-güvenlik--yetkilendirme)
24. [Kredi & Premium İş Kuralları](#24-kredi--premium-iş-kuralları)

---

## 1. Auth — Kimlik Doğrulama

### LoginScreen

| # | Senaryo | Başlangıç | Adımlar | Beklenen |
|---|---------|-----------|---------|----------|
| L-01 | Başarılı giriş | Kayıtlı kullanıcı | Geçerli email + şifre gir, "Giriş Yap" bas | HomeScreen açılır, JWT token AsyncStorage'a kaydedilir |
| L-02 | Hatalı şifre | Kayıtlı kullanıcı | Yanlış şifre gir | "Hatalı email veya şifre" mesajı |
| L-03 | Kayıtsız email | — | Olmayan email gir | Hata mesajı gösterilir |
| L-04 | Boş alan | — | Email veya şifreyi boş bırak | Form gönderilmez, alan hatası gösterilir |
| L-05 | Geçersiz email formatı | — | "abc@" gir | "Geçerli email girin" hatası |
| L-06 | Google ile giriş | — | "Google ile Giriş" bas | OAuth flow açılır, başarıda HomeScreen |
| L-07 | Şifremi unuttum linki | — | "Şifremi unuttum" bas | ForgotPasswordScreen açılır |
| L-08 | Kayıt ol linki | — | "Kayıt ol" bas | RegisterScreen açılır |
| L-09 | Oturum kalıcılığı | Giriş yapıp uygulamayı kapat | Uygulamayı yeniden aç | Otomatik giriş yapılır, HomeScreen açılır |

### RegisterScreen

| # | Senaryo | Başlangıç | Adımlar | Beklenen |
|---|---------|-----------|---------|----------|
| R-01 | Başarılı kayıt | — | Geçerli tüm alanları doldur | Kayıt tamamlanır, giriş yapılır, HomeScreen |
| R-02 | Var olan email | — | Mevcut email kullan | "Bu email zaten kayıtlı" hatası |
| R-03 | Kısa şifre | — | 5 karakterden kısa şifre | Minimum uzunluk hatası |
| R-04 | Boş displayName | — | İsim alanını boş bırak | Alan hatası |
| R-05 | userType seçimi | — | "Göçmen" veya "Diaspora" seç | Seçim kaydedilir, seçilmeden devam edilemez |
| R-06 | Şifre eşleşmeme | — | Şifreler farklı gir | "Şifreler eşleşmiyor" hatası |
| R-07 | Google ile kayıt | — | Google OAuth ile kayıt | displayName otomatik doldurulur, kayıt tamamlanır |

### ForgotPasswordScreen

| # | Senaryo | Başlangıç | Adımlar | Beklenen |
|---|---------|-----------|---------|----------|
| FP-01 | Başarılı reset talebi | Kayıtlı email | Geçerli email gir, gönder | "E-posta gönderildi" mesajı |
| FP-02 | Kayıtsız email | — | Olmayan email gir | Genel "gönderildi" mesajı (güvenlik için email gizlenir) |
| FP-03 | Boş alan | — | Email boş bırak | Alan hatası |

### ResetPasswordScreen

| # | Senaryo | Başlangıç | Adımlar | Beklenen |
|---|---------|-----------|---------|----------|
| RP-01 | Başarılı sıfırlama | Geçerli reset tokeni | Yeni şifre gir, onayla | Şifre değişir, LoginScreen yönlendirilir |
| RP-02 | Süresi dolmuş token | — | Eski token ile dene | "Token süresi dolmuş" hatası |
| RP-03 | Geçersiz token | — | Sahte token ile dene | "Geçersiz token" hatası |
| RP-04 | Şifre eşleşmeme | — | Farklı şifreler | "Şifreler eşleşmiyor" hatası |

---

## 2. HomeScreen — Ana Sayfa

| # | Senaryo | Başlangıç | Adımlar | Beklenen |
|---|---------|-----------|---------|----------|
| H-01 | Sayfa yüklenmesi | Giriş yapılmış | HomeScreen aç | Rehberlik özeti, bildirim sayısı, forum özetleri yüklenir |
| H-02 | Rehberlik istatistikleri | Bazı adımlar tamamlanmış | — | Tamamlanan/toplam adım sayısı doğru gösterilir |
| H-03 | Bildirim rozeti | Okunmamış bildirim var | — | Tab bar'da bildirim sayısı rozeti görünür |
| H-04 | Aktif ülke olmadan | Yeni kullanıcı | — | Ülke seçme yönlendirmesi görünür |
| H-05 | Aktif ülke seçili | Profil'den ülke seçilmiş | — | O ülkeye ait rehberlik özeti gösterilir |
| H-06 | Pull-to-refresh | — | Sayfayı aşağı çekerek yenile | Veriler güncellenir |

---

## 3. GuideScreen — Rehberlik

| # | Senaryo | Başlangıç | Adımlar | Beklenen |
|---|---------|-----------|---------|----------|
| G-01 | İlk açılış | Aktif ülke yok | GuideScreen aç | Ülke seçim ekranı gelir |
| G-02 | Ülke seçimi | — | Listeden ülke seç | O ülkenin rehberlik adımları yüklenir |
| G-03 | Sıralı adımlar | Ülke seçili | — | Adımlar sırayla gösterilir, blocker adım işaretlenmeden ileri geçilemez |
| G-04 | Adım tamamlama | — | Bir seçenek işaretle | İlerleme kaydedilir, sonraki adım aktif olur |
| G-05 | Blocker adım | Blocker adım var | Blocker yanıtı seç | Uyarı mesajı gösterilir, ilerleme durur |
| G-06 | İlerleme kalıcılığı | Adımları tamamla, uygulamayı kapat | Yeniden aç | İlerleme korunmuş olur |
| G-07 | Farklı ülkeye geç | Bir ülkede ilerleme var | Başka ülke seç | Yeni ülkenin adımları sıfırdan başlar |
| G-08 | Global adımlar | — | — | isGlobal=true adımlar her ülkede görünür |
| G-09 | FAQ linki | Adımda faqUrl var | FAQ linkine bas | Tarayıcıda ilgili sayfa açılır |
| G-10 | İki sekme yapısı | — | Tab'lar arasında geç | "Checklist" ve "Assessment" tabları çalışır |

---

## 4. ForumScreen — Forum Ana

| # | Senaryo | Başlangıç | Adımlar | Beklenen |
|---|---------|-----------|---------|----------|
| F-01 | Ülke listesi | — | ForumScreen aç | Tüm ülkeler listelenir, topicCount gösterilir |
| F-02 | Ülkeye tıklama | — | Bir ülkeye bas | ForumCategoriesScreen açılır |
| F-03 | Arama | — | Arama çubuğuna yaz | Eşleşen konular listelenir |
| F-04 | Boş arama sonucu | — | Sonuçsuz kelime ara | "Sonuç bulunamadı" mesajı |

---

## 5. ForumCategoriesScreen — Kategoriler

| # | Senaryo | Başlangıç | Adımlar | Beklenen |
|---|---------|-----------|---------|----------|
| FC-01 | Kategori listesi | Ülke seçilmiş | — | O ülkeye ait kategoriler topicCount ile gösterilir |
| FC-02 | Kategoriye tıklama | — | Bir kategoriye bas | ForumTopicsScreen açılır |
| FC-03 | Boş kategori | Hiç konu yok | — | "Henüz konu yok" mesajı |

---

## 6. ForumTopicsScreen — Konular

| # | Senaryo | Başlangıç | Adımlar | Beklenen |
|---|---------|-----------|---------|----------|
| FT-01 | Konu listesi | Kategori seçilmiş | — | Onaylı konular listelenir (commentCount, upvotes, yazar) |
| FT-02 | Sabitlenmiş konular | isPinned=true konu var | — | Pinli konular üstte görünür |
| FT-03 | Konuya tıklama | — | Bir konuya bas | ForumTopicDetailScreen açılır |
| FT-04 | Yeni konu butonu | — | "+" butonuna bas | CreateTopicScreen açılır |
| FT-05 | Pagination | 20'den fazla konu | — | Sayfalama / infinite scroll çalışır |
| FT-06 | Bekleyen konu | status=pending | Normal kullanıcı | Bekleyen konu listelenmez |

---

## 7. ForumTopicDetailScreen — Konu Detayı

| # | Senaryo | Başlangıç | Adımlar | Beklenen |
|---|---------|-----------|---------|----------|
| FTD-01 | Konu detay yükle | Onaylı konu | Konuya gir | Başlık, içerik, yorumlar listelenir |
| FTD-02 | Yorum ekleme | Giriş yapılmış | Yorum yaz, gönder | CreditGateModal açılır (50 kredi kontrolü) |
| FTD-03 | Yeterli krediyle yorum | 50+ kredi | Yorum gönder → Onayla | Yorum eklenir, kredi düşülür |
| FTD-04 | Yetersiz krediyle yorum | 0 kredi | Yorum gönder | "Yetersiz kredi" mesajı, Premium önerisi |
| FTD-05 | Upvote | — | Beğen butonuna bas | Upvote eklenir, sayaç artar |
| FTD-06 | Tekrar upvote | Daha önce upvote yapılmış | Tekrar bas | Upvote kaldırılır (toggle) |
| FTD-07 | Abone ol | — | Bildirim ikonuna bas | Konuya abone olunur |
| FTD-08 | Abonelikten çık | Abone olunmuş konu | Tekrar bas | Abonelik iptal edilir |
| FTD-09 | Sayfalı yorumlar | 20+ yorum | — | Yorumlar sayfalı yüklenir |

---

## 8. CreateTopicScreen — Yeni Konu

| # | Senaryo | Başlangıç | Adımlar | Beklenen |
|---|---------|-----------|---------|----------|
| CT-01 | Başarılı konu oluşturma | 50+ kredi | Başlık + içerik yaz, kategori seç, gönder | CreditGateModal açılır, onaylarsa konu oluşturulur |
| CT-02 | Kredi ile oluşturma | 50 kredi | Onayla | 50 kredi düşülür, konu "pending" durumunda oluşur |
| CT-03 | Premium kullanıcı | isPremium=true | — | Kredi kontrolü yapılmaz, direkt oluşturulur |
| CT-04 | Yetersiz kredi | <50 kredi | Gönder | CreditGateModal "yetersiz" durumu, premium yönlendirme |
| CT-05 | Boş başlık | — | Başlık boş bırak | Alan hatası, gönderilmez |
| CT-06 | Boş içerik | — | İçerik boş bırak | Alan hatası |
| CT-07 | Kategori seçilmeden | — | Kategori seçmeden gönder | "Kategori seçin" hatası |
| CT-08 | Admin onay süreci | Normal kullanıcı | Konu oluştur | status=pending, admin onayını bekler |

---

## 9. ProfileScreen — Profil

| # | Senaryo | Başlangıç | Adımlar | Beklenen |
|---|---------|-----------|---------|----------|
| P-01 | Profil yüklenme | Giriş yapılmış | ProfileScreen aç | displayName, bio, kredi, premium durumu gösterilir |
| P-02 | İsim güncelleme | — | displayName değiştir, kaydet | Güncelleme başarılı mesajı |
| P-03 | Bio güncelleme | — | Bio yaz, kaydet | Kaydedilir |
| P-04 | Avatar güncelleme | — | Fotoğraf seç | Avatar yüklenir, güncellenir |
| P-05 | userType değiştirme | — | Göçmen ↔ Diaspora | Değişiklik kaydedilir |
| P-06 | Hedef ülke değiştirme | — | targetCountry güncelle | Kaydedilir |
| P-07 | Rehber ülke değiştirme | — | activeGuideCountry güncelle | GuideScreen bu ülke için açılır |
| P-08 | İstatistikler | Aktivite var | — | Konu sayısı, yorum sayısı, tamamlanan rehber adımı doğru gösterilir |
| P-09 | Kredi bakiyesi | — | — | Güncel kredi miktarı doğru gösterilir |
| P-10 | Premium durumu | isPremium=true | — | "Premium Üye" rozeti görünür, premiumUntil tarihi gösterilir |
| P-11 | Premium durumu | isPremium=false | — | "Premium'a Geç" butonu görünür |
| P-12 | Çıkış yapma | — | "Çıkış" bas | AsyncStorage temizlenir, LoginScreen'e yönlendirilir |

---

## 10. MyTopicsScreen — Konularım

| # | Senaryo | Başlangıç | Adımlar | Beklenen |
|---|---------|-----------|---------|----------|
| MT-01 | Konu listesi | Konuları olan kullanıcı | — | Sadece o kullanıcının konuları listelenir |
| MT-02 | Boş liste | Hiç konu yok | — | "Henüz konu açmadınız" mesajı |
| MT-03 | Bekleyen konu | status=pending | — | "Onay bekliyor" etiketi görünür |
| MT-04 | Onaylı konu | status=approved | — | Normal liste öğesi |
| MT-05 | Reddedilen konu | status=rejected | — | "Reddedildi" etiketi görünür |
| MT-06 | Konuya tıklama | — | Bir konuya bas | ForumTopicDetailScreen açılır |

---

## 11. MyCommentsScreen — Yorumlarım

| # | Senaryo | Başlangıç | Adımlar | Beklenen |
|---|---------|-----------|---------|----------|
| MC-01 | Yorum listesi | Yorumları olan kullanıcı | — | Sadece o kullanıcının yorumları listelenir |
| MC-02 | Boş liste | Yorum yok | — | "Henüz yorum yapmadınız" mesajı |
| MC-03 | Yoruma tıklama | — | Bir yoruma bas | İlgili konunun ForumTopicDetailScreen açılır |

---

## 12. NotificationsScreen — Bildirimler

| # | Senaryo | Başlangıç | Adımlar | Beklenen |
|---|---------|-----------|---------|----------|
| N-01 | Bildirim listesi | Bildirimler var | — | Tüm bildirimler listelenir, okunmayanlar vurgulanır |
| N-02 | Bildirimi okundu işaretle | Okunmamış bildirim | Bildirime bas | Okundu işaretlenir, rozet azalır |
| N-03 | Tümünü okundu işaretle | Okunmamış bildirimler | "Tümünü okundu işaretle" bas | Tüm bildirimler okundu olur, rozet sıfırlanır |
| N-04 | Boş liste | Bildirim yok | — | "Bildirim yok" mesajı |
| N-05 | Bildirime tıklama | Forum konusu bildirimi | Bas | İlgili konu detayına yönlendirilir |
| N-06 | Tab bar rozeti | Okunmamış bildirim | — | Tab bar'da sayı gösterilir |
| N-07 | Ülke aboneliği | — | Ülkeye abone ol | O ülkedeki yeni konularda bildirim gelir |
| N-08 | Konu aboneliği | — | Konuya abone ol | O konuya yeni yorum geldiğinde bildirim gelir |

---

## 13. PremiumScreen — Premium

| # | Senaryo | Başlangıç | Adımlar | Beklenen |
|---|---------|-----------|---------|----------|
| PR-01 | Plan listesi | — | PremiumScreen aç | Aktif premium planlar listelenir (fiyat, özellikler, süre) |
| PR-02 | Kredi paketi listesi | — | — | Kredi paketleri listelenir |
| PR-03 | Stripe checkout | — | Bir plan seç, satın al | Stripe checkout URL açılır |
| PR-04 | Kredi satın alma | — | Kredi paketi seç | Stripe kredi checkout URL açılır |
| PR-05 | Mevcut premium | isPremium=true | PremiumScreen aç | "Aktif Premium" durumu gösterilir, bitiş tarihi |
| PR-06 | Satın alma sonrası güncelleme | Stripe webhook gelir | — | isPremium=true olur, premiumUntil set edilir |
| PR-07 | Mock topup (dev) | — | Dev butonuna bas | 50 kredi eklenir |

---

## 14. CreditGateModal — Kredi Kapısı

| # | Senaryo | Başlangıç | Adımlar | Beklenen |
|---|---------|-----------|---------|----------|
| CG-01 | Yeterli kredi | 50+ kredi | İşlem başlat | Modal açılır, maliyet ve bakiye gösterilir |
| CG-02 | Onaylama | — | "Devam Et" bas | Kredi düşülür, işlem yapılır |
| CG-03 | İptal | — | "İptal" bas | Modal kapanır, kredi düşülmez |
| CG-04 | Yetersiz kredi | <50 kredi | İşlem başlat | "Yetersiz kredi" gösterilir, Premium yönlendirme var |
| CG-05 | Premium kullanıcı | isPremium=true | — | CreditGateModal hiç açılmaz, direkt işlem |
| CG-06 | Farklı işlem maliyetleri | — | Konu vs yorum | Doğru maliyet gösterilir (topic=50, comment=50) |

---

## 15. API — Auth Endpoint'leri

### POST /api/auth/register

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| A-01 | Başarılı kayıt | `{email, password, displayName, userType}` | 201, `{user, token}` |
| A-02 | Var olan email | Mevcut email | 409 Conflict |
| A-03 | Eksik alan | password yok | 400 Bad Request |
| A-04 | Geçersiz email | `"notanemail"` | 400 |
| A-05 | Kısa şifre | 4 karakter şifre | 400 |

### POST /api/auth/login

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| A-06 | Başarılı giriş | Geçerli credentials | 200, `{user, token}` |
| A-07 | Hatalı şifre | Yanlış şifre | 401 |
| A-08 | Olmayan email | — | 401 |
| A-09 | Eksik alan | Email yok | 400 |

### POST /api/auth/google

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| A-10 | Geçerli Google token | `{idToken}` | 200, `{user, token}`, yeni kullanıcı veya var olan |
| A-11 | Geçersiz Google token | Sahte token | 401 |

### POST /api/auth/forgot-password

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| A-12 | Var olan email | Kayıtlı email | 200 (e-posta gönderildi) |
| A-13 | Var olmayan email | — | 200 (güvenlik — bilgi sızdırma yok) |
| A-14 | Eksik email | — | 400 |

### POST /api/auth/reset-password

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| A-15 | Geçerli token | `{token, newPassword}` | 200, şifre güncellendi |
| A-16 | Süresi dolmuş token | Eski token | 400/401 |
| A-17 | Geçersiz token | Sahte | 400 |

---

## 16. API — Users Endpoint'leri

### GET /api/users/me

| # | Senaryo | Auth | Beklenen |
|---|---------|------|----------|
| U-01 | Giriş yapılmış | Bearer token | 200, user objesi (passwordHash YOK) |
| U-02 | Token yok | — | 401 |
| U-03 | Geçersiz token | Sahte token | 401 |

### PATCH /api/users/me

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| U-04 | displayName güncelle | `{displayName: "Yeni Ad"}` | 200, güncellenmiş user |
| U-05 | bio güncelle | `{bio: "..."}` | 200 |
| U-06 | avatar güncelle | `{avatar: "url"}` | 200 |
| U-07 | userType güncelle | `{userType: "immigrant"}` | 200 |
| U-08 | Güncelleme yok | `{}` | 200, değişmez |
| U-09 | Role güncelleme denemesi | `{role: "admin"}` | 200 ama role değişmez (whitelist kontrolü) |

### GET /api/users/me/stats

| # | Senaryo | Auth | Beklenen |
|---|---------|------|----------|
| U-10 | İstatistik çekme | Bearer token | 200, `{topicCount, commentCount, completedSteps}` doğru sayılar |

---

## 17. API — Forum Endpoint'leri

### GET /api/forum/countries

| # | Senaryo | — | Beklenen |
|---|---------|---|----------|
| F-01 | Ülke listesi | — | 200, ülkeler dizisi, topicCount dahil |

### GET /api/forum/categories?countryId=X

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| F-02 | Geçerli countryId | Var olan id | 200, kategoriler |
| F-03 | Geçersiz countryId | Olmayan id | 200, boş dizi |

### GET /api/forum/topics?categoryId=X

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| F-04 | Kategori konuları | Geçerli categoryId | 200, sadece status=approved konular |
| F-05 | Pagination | page=2&limit=10 | Doğru sayfalama |
| F-06 | Pinli konular | — | isPinned=true konular önce |

### POST /api/forum/topics

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| F-07 | Başarılı konu oluşturma (kredi) | `{categoryId, title, content}`, 50+ kredi | 201, topic, 50 kredi düşülür, status=pending |
| F-08 | Premium kullanıcı | isPremium=true | 201, kredi düşülmez |
| F-09 | Yetersiz kredi | 0 kredi | 402 Payment Required |
| F-10 | Eksik alan | title yok | 400 |
| F-11 | Auth yok | — | 401 |

### POST /api/forum/comments

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| F-12 | Yorum ekleme (kredi) | `{topicId, content}`, 50+ kredi | 201, comment, 50 kredi düşülür |
| F-13 | Premium kullanıcı | isPremium=true | 201, kredi düşülmez |
| F-14 | Yetersiz kredi | 0 kredi | 402 |
| F-15 | Bekleyen konuya yorum | status=pending topic | 404 veya 403 |

### POST /api/forum/upvotes

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| F-16 | Upvote ekle | `{topicId}` | 200, upvote eklendi |
| F-17 | Tekrar upvote | Zaten upvote var | 200, upvote kaldırıldı (toggle) |

### GET /api/forum/search?q=X

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| F-18 | Sonuçlu arama | Var olan kelime | 200, eşleşen konular |
| F-19 | Sonuçsuz arama | Olmayan kelime | 200, boş dizi |
| F-20 | Boş q parametresi | q="" | 400 |

---

## 18. API — Guide Endpoint'leri

### GET /api/guide/steps/:countryId

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| G-01 | Ülke adımları | Geçerli countryId | 200, sıralı adımlar |
| G-02 | Global adımlar | — | isGlobal=true adımlar dahil |
| G-03 | Olmayan ülke | Sahte id | 200, boş dizi |

### GET /api/guide/progress

| # | Senaryo | Auth | Beklenen |
|---|---------|------|----------|
| G-04 | İlerleme çekme | Bearer token | 200, tamamlanan adımlar listesi |
| G-05 | Auth yok | — | 401 |

### POST /api/guide/progress

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| G-06 | Adım kaydet | `{stepId, answer}` | 201, progress kaydedildi |
| G-07 | Aynı adımı tekrar kaydet | Mevcut stepId | 200, üzerine yazılır |
| G-08 | Checklist reset | stepType=checklist, yeni ülke | Önceki ilerleme sıfırlanır |

### PUT /api/guide/active-country

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| G-09 | Aktif ülke ayarla | `{countryId}` | 200, activeGuideCountryId güncellendi |

---

## 19. API — Payment Endpoint'leri

### GET /api/payment/packages

| # | Senaryo | — | Beklenen |
|---|---------|---|----------|
| PM-01 | Paket listesi | — | 200, kredi ve premium paketleri |

### POST /api/payment/spend-credit

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| PM-02 | Kredi harca | `{action: "topic"}` | 200, kredi düşüldü |
| PM-03 | Yetersiz kredi | 0 kredi | 402 |
| PM-04 | Geçersiz action | `{action: "unknown"}` | 400 |
| PM-05 | Premium kullanıcı | isPremium=true | 200, kredi düşülmez |

### POST /api/payment/topup/mock

| # | Senaryo | Auth | Beklenen |
|---|---------|------|----------|
| PM-06 | Mock kredi ekle | Bearer token | 200, 50 kredi eklendi |

### POST /api/payment/checkout

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| PM-07 | Premium checkout | `{planId}` | 200, Stripe checkout URL |
| PM-08 | Geçersiz planId | — | 404 |

### POST /api/payment/webhook

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| PM-09 | Stripe başarılı ödeme | Stripe event (checkout.session.completed) | 200, isPremium güncellendi |
| PM-10 | Geçersiz Stripe imzası | — | 400 |

---

## 20. API — Notifications Endpoint'leri

### GET /api/notifications

| # | Senaryo | Auth | Beklenen |
|---|---------|------|----------|
| NO-01 | Bildirim listesi | Bearer token | 200, kullanıcının bildirimleri |
| NO-02 | Başka kullanıcının bildirimleri | — | Sadece kendi bildirimleri gelir |

### GET /api/notifications/unread-count

| # | Senaryo | Auth | Beklenen |
|---|---------|------|----------|
| NO-03 | Okunmamış sayı | — | 200, `{count: N}` |

### PATCH /api/notifications/:id/read

| # | Senaryo | Auth | Beklenen |
|---|---------|------|----------|
| NO-04 | Bildirimi okundu işaretle | Kendi bildirimi | 200 |
| NO-05 | Başka kullanıcı bildirimi | — | 403 veya 404 |

### PATCH /api/notifications/read-all

| # | Senaryo | Auth | Beklenen |
|---|---------|------|----------|
| NO-06 | Tümünü okundu | — | 200, tüm bildirimler read=true |

### GET/PATCH /api/notifications/subscriptions

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| NO-07 | Abonelik listesi | — | 200, ülke abonelikleri |
| NO-08 | Ülkeye abone ol | `{countryId, subscribed: true}` | 200 |
| NO-09 | Abonelikten çık | `{subscribed: false}` | 200 |

---

## 21. API — Admin Endpoint'leri

### GET /api/admin/dashboard

| # | Senaryo | Auth | Beklenen |
|---|---------|------|----------|
| AD-01 | Admin dashboard | admin role | 200, stats objesi |
| AD-02 | Normal kullanıcı | user role | 403 Forbidden |
| AD-03 | Auth yok | — | 401 |

### GET /api/admin/topics/pending

| # | Senaryo | Auth | Beklenen |
|---|---------|------|----------|
| AD-04 | Bekleyen konular | admin role | 200, status=pending konular |

### PATCH /api/admin/topics/:id/approve

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| AD-05 | Konuyu onayla | Pending topic id | 200, status=approved |
| AD-06 | Zaten onaylı konu | — | 200 veya 409 |

### PATCH /api/admin/topics/:id/reject

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| AD-07 | Konuyu reddet | Pending topic id | 200, status=rejected |

### GET /api/admin/users

| # | Senaryo | Auth | Beklenen |
|---|---------|------|----------|
| AD-08 | Kullanıcı listesi | admin role | 200, tüm kullanıcılar |
| AD-09 | Arama filtresi | q=engin | Eşleşen kullanıcılar |

### PATCH /api/admin/users/:id

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| AD-10 | Role güncelle | `{role: "admin"}` | 200 |
| AD-11 | Geçersiz role | `{role: "superadmin"}` | 400 |

---

## 22. Navigasyon & Deep Link

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| NAV-01 | Giriş yapılmamış kullanıcı | Uygulamayı aç | AuthStack (Login) açılır |
| NAV-02 | Giriş yapılmış kullanıcı | Uygulamayı aç | MainTabs (Home) açılır |
| NAV-03 | Tab bar navigasyon | Her tab'a bas | Home / Guide / Forum / Profile açılır |
| NAV-04 | Geri tuşu | — | Stack navigasyonunda geri gidilir |
| NAV-05 | Deep link — konu | `goworldy://topic/123` | ForumTopicDetailScreen açılır |
| NAV-06 | Deep link — giriş yapılmamış | `goworldy://topic/123` | Login'e yönlendirilir, sonra konuya |
| NAV-07 | Bildirim rozeti | Okunmamış bildirim | Bottom tab'da N sayısı gösterilir |

---

## 23. Güvenlik & Yetkilendirme

| # | Senaryo | Input | Beklenen |
|---|---------|-------|----------|
| SEC-01 | Süresi dolmuş JWT | Eski token | 401, kullanıcı login'e yönlendirilir |
| SEC-02 | Başka kullanıcı verisi | userId manipulation | 403 |
| SEC-03 | Admin endpoint normal user | user role | 403 |
| SEC-04 | SQL/NoSQL injection | `{email: {"$gt": ""}}` | 400 veya boş sonuç |
| SEC-05 | Token yenileme | — | Token süresi dolduktan sonra oturum kapanır |
| SEC-06 | passwordHash sızıntısı | GET /me | Response'da passwordHash alanı YOK |
| SEC-07 | Rate limiting | Çok hızlı istek | 429 Too Many Requests |
| SEC-08 | CORS | Farklı origin'den istek | CORS politikası uygulanır |

---

## 24. Kredi & Premium İş Kuralları

| # | Senaryo | Başlangıç | Adımlar | Beklenen |
|---|---------|-----------|---------|----------|
| CR-01 | Konu açma maliyeti | 50 kredi | Konu aç | 50 kredi düşülür |
| CR-02 | Yorum maliyeti | 50 kredi | Yorum yap | 50 kredi düşülür |
| CR-03 | Atomik kredi işlemi | — | Başarısız işlemde | Kredi düşülmez (transaction) |
| CR-04 | Premium — konu açma | isPremium=true | Konu aç | Kredi düşülmez |
| CR-05 | Premium — yorum | isPremium=true | Yorum yap | Kredi düşülmez |
| CR-06 | Premium süresi dolması | premiumUntil geçti | — | isPremium=false olur |
| CR-07 | Kredi eksi olamaz | 0 kredi | 30 kredilik işlem | 402, kredi eksi düşülmez |
| CR-08 | Stripe webhook — kredi | checkout.session.completed | — | Doğru kredi miktarı eklenir |
| CR-09 | Stripe webhook — premium | — | — | premiumUntil doğru hesaplanır |

---

## Öncelik Sıralaması

### P0 — Kritik (Blok eden)
- Auth akışı (L-01, R-01, A-06)
- Kredi güvenliği (CR-01, CR-03, CR-07)
- Admin yetki kontrolü (AD-02, SEC-03)
- JWT güvenliği (SEC-01, U-02)

### P1 — Yüksek (Temel işlevler)
- Forum CRUD (F-07, F-12, F-16)
- Guide ilerleme (G-04, G-06)
- Bildirim sistemi (NO-03, NO-06)
- Stripe webhook (PM-09)

### P2 — Normal (UX)
- Pagination (FT-05, F-05)
- Deep link (NAV-05)
- Profile güncelleme (P-02 → P-09)
- Arama (F-18, F-19)

### P3 — Düşük (Edge case)
- Mock endpoints (PM-06)
- Privacy screen
- Rate limiting (SEC-07)
