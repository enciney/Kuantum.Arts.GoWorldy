import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getCollections } from "./repositories/mongodb/db";
import { config } from "./config";

export async function seedDatabase() {
  const {
    users, countries: countriesCol, forumCategories,
    forumTopics, forumComments, guideSteps, notifications,
  } = await getCollections();

  // ── Admin user ────────────────────────────────────────────────────────────
  const adminEmail = config.admin.email;
  const adminPassword = config.admin.defaultPassword;

  let adminDoc = await users.findOne({ email: adminEmail });
  let adminId: string;

  if (!adminDoc) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    adminId = crypto.randomUUID();
    await users.insertOne({
      _id: adminId,
      email: adminEmail,
      passwordHash,
      displayName: "Admin",
      role: config.roles.admin,
      userType: config.userTypes.consultant,
      isPremium: false,
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
    });
    console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);
  } else {
    adminId = adminDoc._id;
  }

  // ── Countries ─────────────────────────────────────────────────────────────
  const countries = [
    { id: "global", name: "Genel",          code: "XX" },
    { id: "us",     name: "United States",  code: "US" },
    { id: "de",     name: "Germany",        code: "DE" },
    { id: "uk",     name: "United Kingdom", code: "GB" },
    { id: "ca",     name: "Canada",         code: "CA" },
    { id: "au",     name: "Australia",      code: "AU" },
    { id: "nl",     name: "Netherlands",    code: "NL" },
    { id: "fr",     name: "France",         code: "FR" },
    { id: "tr",     name: "Turkey",         code: "TR" },
  ];

  for (const c of countries) {
    await countriesCol.updateOne(
      { _id: c.id },
      { $setOnInsert: { _id: c.id, name: c.name, code: c.code } },
      { upsert: true }
    );
  }

  // ── Forum categories ──────────────────────────────────────────────────────
  const baseCategories = ["Vize ve Oturum", "Çalışma Hayatı", "Eğitim", "Yaşam ve Konaklama", "Sağlık", "Genel"];

  for (const country of countries) {
    for (const catName of baseCategories) {
      const catId = `${country.id}-${catName.toLowerCase().replace(/\s+/g, "-")}`;
      await forumCategories.updateOne(
        { _id: catId },
        { $setOnInsert: { _id: catId, countryId: country.id, name: catName } },
        { upsert: true }
      );
    }
  }
  console.log("Forum categories seeded");

  // ── Sample topics + comments ──────────────────────────────────────────────
  const sampleTopics = [
    {
      countryId: "us", categoryName: "Vize ve Oturum",
      title: "F-1 öğrenci vizesi için mali belgeler nasıl hazırlanır?",
      comment: "Bana yardımcı olan rehber: son 3 ay banka ekstresi + sponsor mektubu + I-20.",
    },
    {
      countryId: "de", categoryName: "Çalışma Hayatı",
      title: "Almanya'da Blue Card başvuru süreci 2025",
      comment: "Maaş limiti güncellendi, IT için 45.300 EUR civarı yeterli.",
    },
    {
      countryId: "uk", categoryName: "Eğitim",
      title: "İngiltere'de yüksek lisans için CAS letter ne zaman gelir?",
      comment: "Genelde kabul aldıktan 2-3 hafta sonra geliyor, depozito yatırılması gerekiyor.",
    },
  ];

  for (const t of sampleTopics) {
    const catId = `${t.countryId}-${t.categoryName.toLowerCase().replace(/\s+/g, "-")}`;
    const existing = await forumTopics.findOne({ title: t.title });
    if (existing) continue;
    const topicId = crypto.randomUUID();
    await forumTopics.insertOne({
      _id: topicId, categoryId: catId, title: t.title,
      authorId: adminId, isPinned: false, status: "approved",
      createdAt: new Date().toISOString(),
    });
    await forumComments.insertOne({
      _id: crypto.randomUUID(), topicId, authorId: adminId,
      content: t.comment, createdAt: new Date().toISOString(),
    });
  }
  console.log("Sample topics seeded");

  // ── Guide steps ───────────────────────────────────────────────────────────
  const steps: Array<{
    id: string; countryId: string; order: number; question: string;
    description?: string; stepType: "checklist" | "assessment";
    options: string[]; blockingAnswer?: string; faqUrl?: string; isGlobal?: boolean;
  }> = [
    // US
    { id: "us-1", countryId: "us", order: 1, stepType: "checklist", question: "Pasaportunuz geçerli mi?", description: "Kalış sürenizden en az 6 ay sonrası için geçerli olmalı", options: ["Evet", "Hayır"], blockingAnswer: "Hayır", faqUrl: "https://travel.state.gov/content/travel/en/passports.html" },
    { id: "us-2", countryId: "us", order: 2, stepType: "checklist", question: "Pasaportunuzda en az 2 boş sayfa var mı?", description: "Vize damgaları boş sayfa gerektirir", options: ["Evet", "Hayır"], blockingAnswer: "Hayır" },
    { id: "us-3", countryId: "us", order: 3, stepType: "assessment", question: "Hangi vize tipine başvuracaksınız?", description: "Turist, öğrenci, çalışma veya göç vizesi", options: ["Turist (B-2)", "Öğrenci (F-1)", "Çalışma (H-1B)", "Göç Vizesi", "Diğer"] },
    { id: "us-4", countryId: "us", order: 4, stepType: "checklist", question: "Mali belgeleriniz hazır mı?", description: "Banka ekstresi, vergi belgesi, iş yazısı", options: ["Evet, hazır", "Hazırlanıyor", "Hayır"], blockingAnswer: "Hayır" },
    { id: "us-5", countryId: "us", order: 5, stepType: "checklist", question: "Vize mülakatı randevusu aldınız mı?", description: "En yakın ABD konsolosluğunda mülakat", options: ["Evet, aldım", "Randevu bekliyorum", "Hayır, almadım"], blockingAnswer: "Hayır, almadım" },
    // DE
    { id: "de-1", countryId: "de", order: 1, stepType: "assessment", question: "Almanca dil seviyeniz ne?", description: "Çalışma vizesi için genelde B1, akademik için B2/C1", options: ["A1-A2 (Başlangıç)", "B1 (Orta)", "B2 (İyi)", "C1+ (İleri)", "Almanca bilmiyorum"] },
    { id: "de-2", countryId: "de", order: 2, stepType: "checklist", question: "Diplomanız Almanya'da tanınıyor mu?", description: "anabin.kmk.org üzerinden kontrol edin", options: ["Evet", "Hayır", "Henüz kontrol etmedim"], blockingAnswer: "Hayır" },
    { id: "de-3", countryId: "de", order: 3, stepType: "checklist", question: "Sponsor şirket / kabul mektubunuz var mı?", description: "Blue Card için iş teklifi, akademi için kabul", options: ["Evet, var", "Süreç devam ediyor", "Hayır"], blockingAnswer: "Hayır" },
    { id: "de-4", countryId: "de", order: 4, stepType: "checklist", question: "Sağlık sigortanız hazır mı?", description: "Almanya'da geçerli özel veya kamu sigortası", options: ["Evet, hazır", "Başvuru aşamasında", "Hayır"], blockingAnswer: "Hayır" },
    { id: "de-5", countryId: "de", order: 5, stepType: "checklist", question: "Konaklama planınız var mı?", description: "İlk 3 ay için Anmeldung yapılabilir adres", options: ["Evet, var", "Araştırıyorum", "Hayır"], blockingAnswer: "Hayır" },
    // UK
    { id: "uk-1", countryId: "uk", order: 1, stepType: "assessment", question: "İngilizce sertifikanız hazır mı?", description: "IELTS / TOEFL — vize tipine göre minimum skor", options: ["IELTS 6.0+", "IELTS 7.0+", "TOEFL 80+", "Diğer sertifika", "Sertifikam yok"] },
    { id: "uk-2", countryId: "uk", order: 2, stepType: "checklist", question: "Sponsor lisansı olan kuruma kabul aldınız mı?", description: "UKVI onaylı kurum olmalı", options: ["Evet, aldım", "Başvurusu devam ediyor", "Hayır"], blockingAnswer: "Hayır" },
    { id: "uk-3", countryId: "uk", order: 3, stepType: "checklist", question: "CAS / CoS kodu aldınız mı?", description: "Confirmation of Acceptance / Sponsorship", options: ["Evet, elimde var", "Bekliyorum", "Hayır"], blockingAnswer: "Hayır" },
    { id: "uk-4", countryId: "uk", order: 4, stepType: "checklist", question: "Mali belgeleriniz son 28 günden eski olmasın", description: "Banka ekstresi 28 günden eski olmamalı", options: ["Evet, son 28 günden", "28 günden eski", "Henüz yok"], blockingAnswer: "28 günden eski" },
    { id: "uk-5", countryId: "uk", order: 5, stepType: "checklist", question: "TB testi (Türkiye dahil) yaptırdınız mı?", description: "6 aydan uzun kalış için zorunlu", options: ["Evet, yaptırdım", "Gerekli değil (6 aydan az kalış)", "Hayır"], blockingAnswer: "Hayır" },
    // CA
    { id: "ca-1", countryId: "ca", order: 1, stepType: "checklist", question: "Express Entry profilinizi oluşturdunuz mu?", description: "CRS skorunuzu hesaplayın", options: ["Evet, oluşturdum", "Oluşturma aşamasındayım", "Hayır"], blockingAnswer: "Hayır" },
    { id: "ca-2", countryId: "ca", order: 2, stepType: "checklist", question: "ECA (diploma denkliği) aldınız mı?", description: "WES gibi onaylı kurumlardan", options: ["Evet, aldım", "Başvurdum, bekliyorum", "Hayır"], blockingAnswer: "Hayır" },
    { id: "ca-3", countryId: "ca", order: 3, stepType: "assessment", question: "IELTS General skorunuz CRS'e uygun mu?", description: "Genel CLB 7+ önerilir", options: ["CLB 5-6", "CLB 7-8", "CLB 9+", "Henüz sınava girmedim"] },
    { id: "ca-4", countryId: "ca", order: 4, stepType: "checklist", question: "Mali yeterlik belgeniz var mı?", description: "Settlement funds — aile büyüklüğüne göre", options: ["Evet, var", "Hazırlanıyorum", "Hayır"], blockingAnswer: "Hayır" },
    { id: "ca-5", countryId: "ca", order: 5, stepType: "checklist", question: "Polis kaydı belgenizi aldınız mı?", description: "18 yaş üstü her ülkeden", options: ["Evet, aldım", "Başvurdum", "Hayır"], blockingAnswer: "Hayır" },
    // Global assessment
    { id: "global-assess-1", countryId: "global", order: 1, stepType: "assessment", isGlobal: true, question: "Yurt dışına çıkma amacınız nedir?", description: "Genel seyahat profilinizi belirler.", options: ["Çalışmak", "Eğitim", "Aile birleşimi", "Turizm / Seyahat", "Göç / Yerleşim"] },
    { id: "global-assess-2", countryId: "global", order: 2, stepType: "assessment", isGlobal: true, question: "Daha önce yurt dışında yaşadınız mı?", options: ["Evet, 1 yıldan az", "Evet, 1-5 yıl", "Evet, 5 yıldan fazla", "Hayır, ilk defa"] },
    { id: "global-assess-3", countryId: "global", order: 3, stepType: "assessment", isGlobal: true, question: "Ne zaman gitmeyi planlıyorsunuz?", options: ["1-3 ay içinde", "3-6 ay içinde", "6-12 ay içinde", "1 yıldan uzun süre sonra"] },
    // Global checklist
    { id: "global-check-1", countryId: "global", order: 4, stepType: "checklist", isGlobal: true, question: "Geçerli bir pasaportunuz var mı?", description: "Gitmek istediğiniz ülkeye kalış sürenizden en az 6 ay sonrasına kadar geçerli olmalı.", options: ["Evet, geçerli", "Süresi dolmuş / yakında bitiyor", "Pasaportunuz yok"], blockingAnswer: "Pasaportunuz yok", faqUrl: "https://www.nvi.gov.tr/pasaport" },
    { id: "global-check-2", countryId: "global", order: 5, stepType: "checklist", isGlobal: true, question: "Pasaportunuzda boş sayfa var mı?", description: "Vize damgaları ve giriş-çıkış mühürleri için en az 2 boş sayfa gerekir.", options: ["Evet, var", "Az kaldı (1-2 sayfa)", "Hayır, dolu"], blockingAnswer: "Hayır, dolu" },
    { id: "global-check-3", countryId: "global", order: 6, stepType: "checklist", isGlobal: true, question: "Seyahat sigortanız hazır mı?", description: "Çoğu vize başvurusu ve havayolu şirketi seyahat sigortası ister.", options: ["Evet, aktif poliçem var", "Başvuracağım", "Hayır"], blockingAnswer: "Hayır" },
    { id: "global-check-4", countryId: "global", order: 7, stepType: "checklist", isGlobal: true, question: "Biyometrik fotoğrafınız mevcut mu?", description: "Çoğu vize başvurusu için son 6 ayda çekilmiş, mat arka planlı fotoğraf gerekir.", options: ["Evet, hazır", "Çektireceğim", "Hayır"], blockingAnswer: "Hayır" },
  ];

  for (const s of steps) {
    await guideSteps.updateOne(
      { _id: s.id },
      {
        $setOnInsert: {
          _id: s.id,
          countryId: s.countryId,
          order: s.order,
          question: s.question,
          description: s.description ?? null,
          stepType: s.stepType,
          options: s.options,
          blockingAnswer: s.blockingAnswer ?? null,
          faqUrl: s.faqUrl ?? null,
          isGlobal: s.isGlobal ?? false,
        },
      },
      { upsert: true }
    );
  }
  console.log("Guide steps seeded (US, DE, UK, CA + global)");

  // ── Sample notifications ──────────────────────────────────────────────────
  const notifCount = await notifications.countDocuments({ userId: adminId });
  if (notifCount === 0) {
    const sampleTopic = await forumTopics.findOne({});
    const sampleTopicId = sampleTopic ? sampleTopic._id : null;

    await notifications.insertMany([
      ...(sampleTopicId ? [{
        _id: crypto.randomUUID(), userId: adminId, type: "topic_approved",
        title: "Konunuz onaylandı",
        message: "F-1 öğrenci vizesi sorunuz forum'da yayınlandı.",
        targetType: "forum_topic", targetId: sampleTopicId, read: false,
        createdAt: new Date().toISOString(),
      }] : []),
      {
        _id: crypto.randomUUID(), userId: adminId, type: "comment_reply",
        title: "Yorumunuza yanıt geldi",
        message: "Bir kullanıcı konunuza yorum yaptı.",
        targetType: "forum_topic", targetId: sampleTopicId ?? null, read: false,
        createdAt: new Date().toISOString(),
      },
      {
        _id: crypto.randomUUID(), userId: adminId, type: "system",
        title: "GoWorldy'ye Hoş Geldiniz",
        message: "Hesabınız başarıyla oluşturuldu. Rehberim sekmesinden göç planınıza başlayabilirsiniz.",
        targetType: null, targetId: null, read: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    console.log("Sample notifications seeded");
  }

  console.log("Database seeding completed");
}
