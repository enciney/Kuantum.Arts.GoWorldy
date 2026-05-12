import { DatabaseSync } from "node:sqlite";
import path from "path";

let db: DatabaseSync;

export function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(path.resolve(__dirname, "../../../data/goworldy.sqlite"));
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA foreign_keys = ON");
    initTables(db);
  }
  return db;
}

function addColumnIfNotExists(db: DatabaseSync, table: string, column: string, definition: string) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!info.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function initTables(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      displayName TEXT NOT NULL,
      bio TEXT,
      role TEXT DEFAULT 'user',
      userType TEXT DEFAULT 'emigrant',
      credits INTEGER DEFAULT 0,
      isPremium INTEGER DEFAULT 0,
      premiumUntil TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS forum_countries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS forum_categories (
      id TEXT PRIMARY KEY,
      countryId TEXT NOT NULL REFERENCES forum_countries(id),
      name TEXT NOT NULL,
      parentId TEXT REFERENCES forum_categories(id)
    );

    CREATE TABLE IF NOT EXISTS forum_topics (
      id TEXT PRIMARY KEY,
      categoryId TEXT NOT NULL REFERENCES forum_categories(id),
      title TEXT NOT NULL,
      authorId TEXT NOT NULL REFERENCES users(id),
      isPinned INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS forum_comments (
      id TEXT PRIMARY KEY,
      topicId TEXT NOT NULL REFERENCES forum_topics(id),
      authorId TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS guide_steps (
      id TEXT PRIMARY KEY,
      countryId TEXT NOT NULL REFERENCES forum_countries(id),
      "order" INTEGER NOT NULL,
      question TEXT NOT NULL,
      description TEXT,
      blockingAnswer TEXT
    );

    CREATE TABLE IF NOT EXISTS user_guide_progress (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id),
      stepId TEXT NOT NULL REFERENCES guide_steps(id),
      answer TEXT NOT NULL,
      completedAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      targetType TEXT,
      targetId TEXT,
      read INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_country_subscriptions (
      userId TEXT NOT NULL REFERENCES users(id),
      countryId TEXT NOT NULL REFERENCES forum_countries(id),
      PRIMARY KEY (userId, countryId)
    );

    CREATE TABLE IF NOT EXISTS forum_topic_upvotes (
      topicId TEXT NOT NULL REFERENCES forum_topics(id),
      userId TEXT NOT NULL REFERENCES users(id),
      createdAt TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (topicId, userId)
    );
  `);

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_guide_progress_user_step
    ON user_guide_progress(userId, stepId)
  `);

  // Mevcut DB'ye yeni kolonlar (idempotent migrasyon)
  addColumnIfNotExists(db, "users", "credits", "INTEGER DEFAULT 0");
  addColumnIfNotExists(db, "users", "isPremium", "INTEGER DEFAULT 0");
  addColumnIfNotExists(db, "users", "premiumUntil", "TEXT");
  addColumnIfNotExists(db, "users", "phoneNumber", "TEXT");
  addColumnIfNotExists(db, "users", "sharePhoneNumber", "INTEGER DEFAULT 1");
  addColumnIfNotExists(db, "users", "avatarUrl", "TEXT");
  addColumnIfNotExists(db, "guide_steps", "blockingAnswer", "TEXT");
  addColumnIfNotExists(db, "forum_topics", "rejectionReason", "TEXT");
  addColumnIfNotExists(db, "users", "onboardingCompleted", "INTEGER DEFAULT 0");
  addColumnIfNotExists(db, "users", "targetCountryId", "TEXT");
  addColumnIfNotExists(db, "guide_steps", "options", "TEXT");
  addColumnIfNotExists(db, "guide_steps", "faqUrl", "TEXT");
}
