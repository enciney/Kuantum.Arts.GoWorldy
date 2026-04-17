# **🌍 Uygulama Feature Seti (Sistematik Tanım)**

## **1\. Uygulamanın Amacı**

Bu uygulama, Türkiye’den yurt dışına çıkmak isteyen veya hali hazırda yurt dışında yaşayan kullanıcıların bilgiye ulaşabileceği, rehberlik alabileceği ve topluluk içinde iletişim kurabileceği bir platform olacaktır.

Uygulamanın temel hedefleri:

* **Yurt dışına çıkacak kişilerin bilgi bulabileceği bir kaynak oluşturmak**

* Kullanıcıların kendi süreçlerini takip edebileceği bir **“Rehberim” sistemi sunmak**

* Danışmanların müşteri bulabileceği bir alan sağlamak

* Yurt dışında yaşayanların kendi aralarında bilgi alışverişi yapabileceği bir forum topluluğu kurmak

---

# **📌 Ana Sayfalar ve Modüller**

## **2\. Authentication (Login / Sign Up)**

Kullanıcıların uygulamaya giriş yapabileceği temel kimlik doğrulama sistemi.

Özellikler:

* E-posta & şifre ile giriş

* Google ile giriş

* Şifremi unuttum akışı

* Aktivasyon kodu / doğrulama maili gönderimi

* Basic authentication altyapısı

---

## **3\. Anasayfa \+ Alt Navigasyon**

Uygulamanın ana giriş ekranı.

Alt navigasyonda temel sekmeler:

* **Rehberim**

* **Forum**

* (Profil sekmesi eklenebilir)

---

## **4\. Rehberim Sayfası (Progress Tabanlı Süreç)**

Kullanıcıların yurt dışına çıkış sürecini adım adım takip edebileceği rehber modülü.

Yapı:

* Kullanıcıya sırayla sorular sorulur

* Kullanıcı cevap verdikçe progress ilerler

* Kullanıcı takıldığı noktada sistem yönlendirme sağlar

Örnek adımlar:

* Pasaportun var mı?

* Pasaport geçerlilik süresi ne zaman bitiyor?

* En az 2 boş sayfa var mı?

* Vize, uçuş, oturum gibi ilerleyen aşamalar…

---

## **5\. Forum Modülü**

Ülke bazlı organize edilmiş iletişim ve bilgi paylaşım alanı.

Forum hiyerarşisi:

* Ülkeler (ana gruplar)

  * Kategoriler

    * Alt kategoriler (yoğunluğa göre)

      * Sabit konular (admin/moderator tarafından açılır)

### **Kullanıcı Yetkileri**

* Kullanıcılar yorum yazabilir (ilk etapta ücretsiz)

* Yeni konu açmak **her zaman ücretli**

* Danışmanlar veya acil ihtiyacı olanlar ücretli ilan açabilir

### **Moderasyon Süreci**

* Açılan yeni konu ve ilanlar önce **admin/moderator onayına düşer**

* Onay sonrası yayınlanır

---

## **6\. Profil Sayfası**

Kullanıcıların kişisel bilgilerini ve aktivitelerini görebileceği alan.

İçerikler:

* Ad / Soyad

* Bio

* İletişim bilgileri (isteğe bağlı)

* Rehberim progress bar (% tamamlanma) **( başkalarına göstermek okay mi )** 

Kullanıcı kendi profiline girdiğinde ayrıca:

* Katıldığı gruplar

* Aktivite geçmişi

* Beğendiği mesajlar

* Açtığı ilanlar / konular

---

## **7\. Bildirim Sistemi**

Kullanıcıların forum aktivitelerinden haberdar olmasını sağlayan sistem.

Bildirim yönetimi:

* Takip edilen grup veya konu bazlı bildirim aç/kapat

* Sadece yorum gelince bildirim al

* Sadece üye olunan gruplardan bildirim al

---

## **8\. Premium / Kredi Satın Alma Sistemi**

Uygulama içi ücretli özelliklere erişim için ödeme sistemi.

Premium kullanım senaryoları:

* Konu açma hakkı satın alma

* Forum yorum yapma erişimi

* İlan açma hakkı

* Daha sonra eklenecek özel özellikler

Örnek paketler:

* İlan açma: 50 TL

* 1 haftalık yorum hakkı: 50 TL

* 5 konu açma paketi: 50 TL

* Aylık Premium: 250 TL

---

## **9\. Reklam Sistemi (Fayda Bazlı) \- (Gerek olmayabilir buna) \- google ads e gerek yok**

Reklam gösterimi rastgele değil, kullanıcıya avantaj sağlayacak şekilde kurgulanacaktır.

Örnekler:

* Haftada 1 reklam izleyerek ücretsiz konu açma hakkı kazanma

* Rehberim adımlarında ilgili kurum önerileri

* Sponsor anlaşmaları ile belirli alanlarda görünürlük **( bunun kalması mantıklı)**

---

# **👥 Üyelik ve Rol Sistemi**

## **10\. Kullanıcı Tipleri**

### **Admin**

* Tüm sistemi yönetir

* Dashboard erişimi vardır

* Rol atama, konfigurasyon, ödeme ayarlarını yönetir

### **Moderatör**

Yetkiler:

* Blog/sabit içerik düzenleme (ülke bazlı yetkilendirme)

* Kullanıcı banlama

* İlan silme

* Konu düzenleme / silme

* Forum kontrol süreçleri  
  

### **Normal Kullanıcı**

* Forumda yorum yapabilir

* Premium ile konu/ilan açabilir

* Rehberim modülünü kullanabilir

---

# **🛠 Admin Dashboard (Web)**

Sadece admin kullanıcılarının erişebileceği yönetim paneli.

## **Dashboard İçerikleri**

### **Kullanıcı Yönetimi**

* Toplam kullanıcı sayısı

* İsim/mail ile arama

* Kullanıcı profil görüntüleme

* Rol set etme (admin/moderator/user)

### **Forum Analitikleri**

* Grup/konu bazlı mesaj sayıları

* Aktif/pasif ilan sayıları

### **Rehberim Analitiği**

* Kaç kişi rehberim kullanmış

### **Kullanıcı Segmentleri**

3 ana kullanıcı tipi:

* Yurt dışına çıkmak isteyen

* Danışman

* Zaten yurt dışında yaşayan

Bu grupların sayı ve oranları dashboard’da gösterilecek

### **Konfigurasyon Paneli**

Admin tarafından yönetilebilecek yapı:

* Forum altına ülke/grup/kategori/alt kategori/konu ekleme

* Rehberim adımlarını ülke bazlı oluşturma

* Yeni eklenen öğelerin kimlere görüneceğini belirleme: **( buna izin yok , premium ile bu çözülebilir belki)** \- **redflag tarzı bir tool**  
  * Admin

  * Moderatör

  * User

### **Ödeme Yönetimi**

* Ödemelerin aktarılacağı hesap ayarları

* Premium özellik fiyatlarını değiştirme paneli **( bunu marketten yapıyor olabiliriz) / update de gerekebilir**

---

# **✅ Özet: Modüller Listesi**

1. Login / Signup

2. Anasayfa \+ Navigation

3. Rehberim (Progress Tracker)

4. Forum (Ülke bazlı topluluk)

5. Profil

6. Bildirimler

7. Premium & Kredi Sistemi

8. Fayda bazlı Reklam Sistemi **( kaldıralım)**

9. Rol bazlı Üyelik Sistemi

10. Admin Dashboard \+ Konfigurasyon \+ Ödeme Yönetimi ( ödeme yöntemi uygulama ile alakalı değil \- account ) 

