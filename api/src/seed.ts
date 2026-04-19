import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getDb } from "./repositories/sqlite/db";
import { config } from "./config";

export async function seedDatabase() {
  const db = getDb();

  const adminEmail = config.admin.email;
  const adminPassword = config.admin.defaultPassword;
  const existingAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get(adminEmail);

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    db.prepare(
      "INSERT INTO users (id, email, passwordHash, displayName, role, userType) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(
      crypto.randomUUID(),
      adminEmail,
      passwordHash,
      "Admin",
      config.roles.admin,
      config.userTypes.consultant
    );
    console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log("Admin user already exists");
  }

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

  for (const country of countries) {
    insertCountry.run(country.id, country.name, country.code);
  }
  console.log("Default countries seeded");

  const guideSteps = [
    { countryId: "us", order: 1, question: "Do you have a valid passport?", description: "Check if your passport is valid for at least 6 months beyond your intended stay" },
    { countryId: "us", order: 2, question: "Do you have at least 2 blank pages in your passport?", description: "Visa stamps require blank pages" },
    { countryId: "us", order: 3, question: "What type of visa do you need?", description: "Tourist, student, work, or immigration visa" },
    { countryId: "us", order: 4, question: "Have you prepared financial documents?", description: "Bank statements, tax returns, employment letter" },
    { countryId: "us", order: 5, question: "Have you scheduled a visa interview?", description: "Schedule at the nearest US embassy or consulate" },
  ];

  const insertStep = db.prepare(
    "INSERT OR IGNORE INTO guide_steps (id, countryId, \"order\", question, description) VALUES (?, ?, ?, ?, ?)"
  );

  for (const step of guideSteps) {
    insertStep.run(crypto.randomUUID(), step.countryId, step.order, step.question, step.description);
  }
  console.log("Default guide steps seeded");

  console.log("Database seeding completed");
}