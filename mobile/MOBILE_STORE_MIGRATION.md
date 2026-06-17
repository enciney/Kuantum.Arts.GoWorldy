# GoWorldy Mobil — Store Yayın & Uyumluluk Raporu

> Hazırlanma: 2026-06-11 · Hazırlayan: Developer agent
> Kapsam: `mobile/` (Expo / React Native) uygulamasının App Store + Google Play'e
> çıkışı için gereken teknik durum, eksikler ve yapılacaklar.

---

## 0. Özet (TL;DR)

- Uygulama **mobil uyumludur**: tek kod tabanından **Web + iOS + Android** üretir.
  Web'de çalışıyorsa mobilde de çalışır (aynı React Native bileşenleri).
- Store'a çıkış için **zorunlu olan kimlik/config eksikleri** giderildi
  (bkz. Bölüm 3 — `app.json` + `eas.json`).
- Geriye **2 sert bloker** ve birkaç orta öncelikli madde kaldı; bunlar karar/iş
  gerektirdiği için **uygulanmadı, yalnızca burada raporlandı** (Bölüm 4–5).

---

## 1. Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Framework | Expo SDK 54 + React Native 0.81.5 (New Architecture açık) |
| Web | react-native-web 0.20 (Metro bundler) — şu an test edilen katman |
| Dil / UI | TypeScript 5.9, React 19 |
| Navigasyon | React Navigation 7 (native-stack + bottom-tabs) |
| Depolama | @react-native-async-storage/async-storage |
| Auth | expo-auth-session (Google Sign-In) + JWT |
| Medya | expo-image-picker (profil fotoğrafı) |
| İkonlar | @expo/vector-icons (Ionicons, MaterialCommunityIcons) |
| Ödeme | Stripe (backend checkout, tarayıcıda açılır) — **store politikası açısından sorunlu, bkz. 4.1** |
| Test | Jest (unit / integration / component) |

**Platforma özgü kod:** Mevcut kod `Platform.OS` kontrollerini doğru kullanıyor
(klavye davranışı, Android'de LayoutAnimation). Modern Expo, Android sürüm
farklarını büyük oranda **otomatik soyutlar** — kod içinde elle `if/else` veya
manuel ikon değişimi **gerekmez**. Tek gerçek "Android sürümüne bağlı" konu
izinlerdi; o da `app.json`'da çözüldü (bkz. 3.2).

---

## 2. Mobil Uyumluluk Durumu

- ✅ Web, iOS ve Android aynı `App.tsx`'ten besleniyor.
- ✅ `SafeAreaProvider` ile çentik/status bar güvenli alanları yönetiliyor.
- ✅ Klav­ye davranışı iOS/Android için ayrı ayrı ele alınmış (`KeyboardAvoidingView`).
- ✅ Dokunma hedefleri `MinTapTarget` ile standartlaştırılmış (erişilebilirlik).
- ⚠️ Deep link şeması kodda kullanılıyordu ama tanımsızdı → düzeltildi (3.1).

---

## 3. Yapılan Düzeltmeler (UYGULANDI)

Bu bölümdeki değişiklikler config dosyalarındadır, geri alınması kolaydır ve
store'a çıkış için her durumda gereklidir.

### 3.1 `app.json` — deep link şeması + uygulama kimliği
- `scheme: "goworldy"` eklendi.
  - **Neden:** Kod `goworldy://payment/success` ve Google OAuth dönüş linklerini
    kullanıyor (`src/config/env.ts`, `premiumHandlers.ts`). Şema tanımlı olmadan
    bu linkler **native'de çalışmıyordu** — gerçek bir hata.
- `name` → "GoWorldy", `slug` → "goworldy" (önceden jenerik "mobile" idi).
- iOS: `bundleIdentifier: "com.goworldy.app"`, `buildNumber: "1"`,
  `ITSAppUsesNonExemptEncryption: false` eklendi.
- Android: `package: "com.goworldy.app"`, `versionCode: 1` eklendi.
  - **Neden:** Bunlar olmadan store'a build **yüklenemez** (bkz. Bölüm 6 — Bundle ID).

### 3.2 `app.json` — Android izinleri (sürüm uyumu)
- `READ_EXTERNAL_STORAGE` kaldırıldı, sadece `READ_MEDIA_IMAGES` bırakıldı.
  - **Neden:** Android 13+ (API 33) eski depolama iznini yok sayar ve foto erişimi
    için `READ_MEDIA_IMAGES` ister. Eski izni beyan etmek Play Console'da gereksiz
    "hassas izin" uyarısı doğurur. Expo + expo-image-picker sürüm dallanmasını
    kendi yönetir; biz sadece modern izni beyan ederiz.

### 3.3 `eas.json` — build/submit pipeline (YENİ DOSYA)
- `development` / `preview` / `production` build profilleri tanımlandı.
- `submit.production` altında iOS ve Android için **placeholder** kimlik alanları
  var (`REPLACE_WITH_...`). Store hesapları açılınca bunlar doldurulacak.

---

## 4. Sert Blokerler (KARAR + İŞ GEREKİYOR — uygulanmadı)

### 4.1 Ödeme: Stripe yerine uygulama-içi satın alma (IAP) zorunluluğu
- **Durum:** Premium abonelik şu an Stripe checkout ile tarayıcıda satılıyor
  (`premiumHandlers.ts → executePurchase`, `api.payment.checkout`).
- **Politika:** Apple Guideline **3.1.1** ve Google Play **Billing** politikası,
  uygulama içinde satılan **dijital ürün/abonelik** için store'un kendi IAP
  sistemini **zorunlu** kılar. Harici ödeme (Stripe) ile dijital premium satmak:
  - iOS'ta **kesin ret** sebebi.
  - Android'de uygulama askıya alma / kaldırma riski.
- **Seçenekler:**
  1. **Native IAP entegre et** (en sağlam): `expo-in-app-purchases` veya
     **RevenueCat** ile iOS/Android satın almaları store üzerinden; Stripe'ı
     yalnızca web sürümünde bırak. Backend'de makbuz (receipt) doğrulama gerekir.
  2. **Mobilde premium satışını kapat:** Store sürümünde satın alma butonlarını
     gizle, kullanıcıyı bilgilendir. Düşük risk, hızlı; ama mobilde gelir yok ve
     "satın almaya web'e yönlendirme" iOS'ta çok kısıtlı (reader-app istisnası
     bu uygulamaya muhtemelen uymaz).
- **Tavsiye:** Orta vadede (1); ilk sürümü hızlı çıkarmak için geçici olarak (2).
- **Tahmini iş:** (1) için 3–5 gün (RN IAP + backend receipt doğrulama + test).

### 4.2 Uygulama içi hesap silme (Apple zorunlu)
- **Durum:** Mobil tarafta hesap silme akışı/ekranı **yok**
  (`src/` taramasında bulunamadı).
- **Politika:** Apple Guideline **5.1.1(v)** — kayıt olunabilen her uygulama,
  **uygulama içinden** hesap silmeyi sunmak zorunda. Yoksa iOS reddi.
- **Yapılacak:**
  - Profil ekranına "Hesabımı sil" aksiyonu + onay (geri alınamaz uyarısı).
  - Backend'de `DELETE /api/users/me` (veya benzeri) endpoint'i + ilişkili veri
    temizliği/anonimleştirme.
- **Tahmini iş:** 0.5–1 gün (mobil + backend + test).

---

## 5. Orta Öncelikli Maddeler (store onayını kolaylaştırır)

| # | Konu | Açıklama |
|---|------|----------|
| 5.1 | Gizlilik politikası URL'i | Her iki store da yayında erişilebilir bir Privacy Policy URL'i ister. Uygulamada `PrivacyScreen` var (✅); ayrıca **herkese açık bir web URL'i** (örn. goworldy.com/privacy) store formuna girilmeli. |
| 5.2 | Veri güvenliği formları | Apple "App Privacy" + Google "Data Safety" formlarında toplanan veriler (e-posta, foto, ödeme) beyan edilmeli. Stripe/SendGrid/Google kullanımı `RegisterScreen`'de zaten belirtiliyor. |
| 5.3 | Google Sign-In yapılandırması | `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` env'leri prod'da set edilmeli; iOS/Android için ayrı OAuth client ID'leri ve URL şeması gerekir. |
| 5.4 | Store görselleri | İkon (1024×1024), ekran görüntüleri (her cihaz boyutu), açıklama metni, kategori. Mevcut `assets/icon.png` (1024) ve `adaptive-icon.png` var (✅). |
| 5.5 | Test hesabı | Apple/Google inceleme ekibi için demo giriş bilgisi (premium dahil) sağlanmalı. |
| 5.6 | İçerik / yaş derecesi | Forum içeriği var → moderasyon ve kullanıcı şikayet/engelleme akışı (Apple UGC kuralı 1.2). Admin moderasyonu var; kullanıcı tarafı raporlama kontrol edilmeli. |
| 5.7 | Hedef SDK sürümü | Google Play her yıl minimum `targetSdkVersion` ister. Expo 54 güncel hedefi karşılar; build zamanı doğrulanmalı. |

---

## 6. "Bundle ID nedir?" — açıklama

**Bundle Identifier** (iOS) / **Package name** (Android), uygulamanın tüm
dünyada **benzersiz kimliğidir**. İnsanın TC kimlik numarası gibi düşün:
mağaza, telefon ve imza sistemi uygulamayı bu metinle tanır.

- Biçim: ters alan adı → `com.sirket.uygulama`. Senin için `com.goworldy.app`
  atadım (goworldy.com alan adından türetildi). Sadece harf/rakam/nokta, boşluk yok.
- iOS ve Android'de **aynı** olması zorunlu değil ama aynı tutmak yönetimi kolaylaştırır.
- **Çok önemli:** İlk kez store'a yükledikten **sonra DEĞİŞTİRİLEMEZ**. Değiştirmek,
  sıfırdan yeni bir uygulama oluşturmak demektir (eski kullanıcılar güncelleme alamaz).
  İlk yüklemeden **önce** ise serbestçe değiştirilebilir.
- **Karar:** Kendine ait bir alan adın varsa (goworldy.com gibi), `com.goworldy.app`
  gayet uygundur ve önerilir. Farklı bir marka/alan adı düşünüyorsan ilk yüklemeden
  önce söyle, tek satır config ile değiştiririm. Şu an `app.json`'da bu değer
  **placeholder/varsayılan** olarak duruyor — store hesabı açılana kadar bağlayıcı değil.

---

## 7. Yayın İçin Önerilen Sıra

1. Apple Developer ($99/yıl) ve Google Play Developer ($25 tek sefer) hesapları aç.
2. Bundle ID'yi onayla/değiştir (Bölüm 6).
3. **Bloker 4.1** (IAP) için strateji seç → uygula.
4. **Bloker 4.2** (hesap silme) → uygula.
5. Orta öncelikli maddeleri (Bölüm 5) tamamla.
6. `eas build --profile production` → `eas submit` ile internal track'e yükle.
7. Inceleme öncesi test hesabı + gizlilik URL'i + store görsellerini hazırla.

---

## 8. Karar Bekleyen Açık Sorular

- [ ] **4.1 Ödeme:** Native IAP mı eklenecek, yoksa ilk sürümde mobil premium
      satışı kapatılıp web'e mi bırakılacak?
- [ ] **4.2 Hesap silme:** Ne zaman uygulansın? (iOS için ilk sürümde zorunlu.)
- [ ] **6 Bundle ID:** `com.goworldy.app` onaylanıyor mu, yoksa değişecek mi?

> Bu maddeler kararlaştırıldığında developer agent uygulamaya geçebilir.
