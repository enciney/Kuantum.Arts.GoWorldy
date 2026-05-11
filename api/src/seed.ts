import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getDb } from "./repositories/sqlite/db";
import { config } from "./config";

export async function seedDatabase() {
  const db = getDb();

  // ---------- Admin user ----------
  const adminEmail = config.admin.email;
  const adminPassword = config.admin.defaultPassword;
  const existingAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get(adminEmail) as
    | { id: string }
    | undefined;

  let adminId: string;
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    adminId = crypto.randomUUID();
    db.prepare(
      "INSERT INTO users (id, email, passwordHash, displayName, role, userType) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(
      adminId,
      adminEmail,
      passwordHash,
      "Admin",
      config.roles.admin,
      config.userTypes.consultant
    );
    console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);
  } else {
    adminId = existingAdmin.id;
  }

  // ---------- Countries ----------
  const countries = [
    { id: "us", name: "United States", code: "US" },
    { id: "de", name: "Germany", code: "DE" },
    { id: "uk", name: "United Kingdom", code: "GB" },
    { id: "ca", name: "Canada", code: "CA" },
    { id: "au", name: "Australia", code: "AU" },
    { id: "nl", name: "Netherlands", code: "NL" },
    { id: "fr", name: "France", code: "FR" },
    { id: "tr", name: "Turkey", code: "TR" },
  ];
  const insertCountry = db.prepare(
    "INSERT OR IGNORE INTO forum_countries (id, name, code) VALUES (?, ?, ?)"
  );
  for (const c of countries) insertCountry.run(c.id, c.name, c.code);

  // ---------- Forum categories (her ülke için aynı set) ----------
  const baseCategories = [
    "Vize ve Oturum",
    "Çalışma Hayatı",
    "Eğitim",
    "Yaşam ve Konaklama",
    "Sağlık",
    "Genel",
  ];

  const insertCategory = db.prepare(
    "INSERT OR IGNORE INTO forum_categories (id, countryId, name) VALUES (?, ?, ?)"
  );
  const findCategory = db.prepare(
    "SELECT id FROM forum_categories WHERE countryId = ? AND name = ?"
  );

  for (const country of countries) {
    for (const catName of baseCategories) {
      const existing = findCategory.get(country.id, catName) as { id: string } | undefined;
      if (!existing) {
        insertCategory.run(`${country.id}-${catName.toLowerCase().replace(/\s+/g, "-")}`, country.id, catName);
      }
    }
  }
  console.log("Forum categories seeded");

  // ---------- Sample topics + comments ----------
  const sampleTopics = [
    {
      countryId: "us",
      categoryName: "Vize ve Oturum",
      title: "F-1 öğrenci vizesi için mali belgeler nasıl hazırlanır?",
      comment: "Bana yardımcı olan rehber: son 3 ay banka ekstresi + sponsor mektubu + I-20.",
    },
    {
      countryId: "de",
      categoryName: "Çalışma Hayatı",
      title: "Almanya'da Blue Card başvuru süreci 2025",
      comment: "Maaş limiti güncellendi, IT için 45.300 EUR civarı yeterli.",
    },
    {
      countryId: "uk",
      categoryName: "Eğitim",
      title: "İngiltere'de yüksek lisans için CAS letter ne zaman gelir?",
      comment: "Genelde kabul aldıktan 2-3 hafta sonra geliyor, depozito yatırılması gerekiyor.",
    },
  ];

  const insertTopic = db.prepare(
    "INSERT OR IGNORE INTO forum_topics (id, categoryId, title, authorId, isPinned, status) VALUES (?, ?, ?, ?, ?, 'approved')"
  );
  const insertComment = db.prepare(
    "INSERT OR IGNORE INTO forum_comments (id, topicId, authorId, content) VALUES (?, ?, ?, ?)"
  );
  const findTopicByTitle = db.prepare(
    "SELECT id FROM forum_topics WHERE title = ?"
  );

  for (const t of sampleTopics) {
    const cat = findCategory.get(t.countryId, t.categoryName) as { id: string } | undefined;
    if (!cat) continue;
    const existing = findTopicByTitle.get(t.title) as { id: string } | undefined;
    if (existing) continue;
    const topicId = crypto.randomUUID();
    insertTopic.run(topicId, cat.id, t.title, adminId, 0);
    insertComment.run(crypto.randomUUID(), topicId, adminId, t.comment);
  }
  console.log("Sample topics seeded");

  // ---------- Guide steps (US + DE + UK + CA) ----------
  const guideSteps = [
    // US
    { countryId: "us", order: 1, question: "Pasaportunuz geçerli mi?", description: "Kalış sürenizden en az 6 ay sonrası için geçerli olmalı" },
    { countryId: "us", order: 2, question: "Pasaportunuzda en az 2 boş sayfa var mı?", description: "Vize damgaları boş sayfa gerektirir" },
    { countryId: "us", order: 3, question: "Hangi vize tipine başvuracaksınız?", description: "Turist, öğrenci, çalışma veya göç vizesi" },
    { countryId: "us", order: 4, question: "Mali belgeleriniz hazır mı?", description: "Banka ekstresi, vergi belgesi, iş yazısı" },
    { countryId: "us", order: 5, question: "Vize mülakatı randevusu aldınız mı?", description: "En yakın ABD konsolosluğunda mülakat" },
    // DE
    { countryId: "de", order: 1, question: "Almanca dil seviyeniz ne?", description: "Çalışma vizesi için genelde B1, akademik için B2/C1" },
    { countryId: "de", order: 2, question: "Diplomanız Almanya'da tanınıyor mu?", description: "anabin.kmk.org üzerinden kontrol edin" },
    { countryId: "de", order: 3, question: "Sponsor şirket / kabul mektubunuz var mı?", description: "Blue Card için iş teklifi, akademi için kabul" },
    { countryId: "de", order: 4, question: "Sağlık sigortanız hazır mı?", description: "Almanya'da geçerli özel veya kamu sigortası" },
    { countryId: "de", order: 5, question: "Konaklama planınız var mı?", description: "İlk 3 ay için Anmeldung yapılabilir adres" },
    // UK
    { countryId: "uk", order: 1, question: "İngilizce sertifikanız hazır mı?", description: "IELTS / TOEFL — vize tipine göre minimum skor" },
    { countryId: "uk", order: 2, question: "Sponsor lisansı olan kuruma kabul aldınız mı?", description: "UKVI onaylı kurum olmalı" },
    { countryId: "uk", order: 3, question: "CAS / CoS kodu aldınız mı?", description: "Confirmation of Acceptance / Sponsorship" },
    { countryId: "uk", order: 4, question: "Mali belgeleriniz son 28 günden eski olmasın", description: "Banka ekstresi 28 günden eski olmamalı" },
    { countryId: "uk", order: 5, question: "TB testi (Türkiye dahil) yaptırdınız mı?", description: "6 aydan uzun kalış için zorunlu" },
    // CA
    { countryId: "ca", order: 1, question: "Express Entry profilinizi oluşturdunuz mu?", description: "CRS skorunuzu hesaplayın" },
    { countryId: "ca", order: 2, question: "ECA (diploma denkliği) aldınız mı?", description: "WES gibi onaylı kurumlardan" },
    { countryId: "ca", order: 3, question: "IELTS General skorunuz CRS'e uygun mu?", description: "Genel CLB 7+ önerilir" },
    { countryId: "ca", order: 4, question: "Mali yeterlik belgeniz var mı?", description: "Settlement funds — aile büyüklüğüne göre" },
    { countryId: "ca", order: 5, question: "Polis kaydı belgenizi aldınız mı?", description: "18 yaş üstü her ülkeden" },
  ];

  const insertStep = db.prepare(
    'INSERT OR IGNORE INTO guide_steps (id, countryId, "order", question, description) VALUES (?, ?, ?, ?, ?)'
  );
  const findStep = db.prepare(
    'SELECT id FROM guide_steps WHERE countryId = ? AND "order" = ?'
  );

  for (const step of guideSteps) {
    const existing = findStep.get(step.countryId, step.order);
    if (existing) continue;
    insertStep.run(
      crypto.randomUUID(),
      step.countryId,
      step.order,
      step.question,
      step.description
    );
  }
  console.log("Guide steps seeded (US, DE, UK, CA)");

  // ---------- Sample notifications ----------
  const notifCount = db.prepare("SELECT COUNT(*) as cnt FROM notifications WHERE userId = ?").get(adminId) as { cnt: number };
  if (notifCount.cnt === 0) {
    const insertNotif = db.prepare(
      "INSERT OR IGNORE INTO notifications (id, userId, type, title, message, targetType, targetId) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    const sampleTopic = db.prepare("SELECT id FROM forum_topics LIMIT 1").get() as { id: string } | undefined;
    if (sampleTopic) {
      insertNotif.run(
        crypto.randomUUID(), adminId, "topic_approved",
        "Konunuz onaylandı",
        "F-1 öğrenci vizesi sorunuz forum'da yayınlandı.",
        "forum_topic", sampleTopic.id
      );
    }
    insertNotif.run(
      crypto.randomUUID(), adminId, "comment_reply",
      "Yorumunuza yanıt geldi",
      "Bir kullanıcı konunuza yorum yaptı.",
      "forum_topic", sampleTopic?.id ?? null
    );
    insertNotif.run(
      crypto.randomUUID(), adminId, "system",
      "GoWorldy'ye Hoş Geldiniz",
      "Hesabınız başarıyla oluşturuldu. Rehberim sekmesinden göç planınıza başlayabilirsiniz.",
      null, null
    );
    console.log("Sample notifications seeded");
  }

  console.log("Database seeding completed");
}
