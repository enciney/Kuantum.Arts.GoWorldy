import Database from "better-sqlite3";
import path from "path";

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(path.resolve(__dirname, "../../../data/goworldy.sqlite"));
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initTables(db);
  }
  return db;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      displayName TEXT NOT NULL,
      bio TEXT,
      role TEXT DEFAULT 'user',
      userType TEXT DEFAULT 'emigrant',
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
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS user_guide_progress (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id),
      stepId TEXT NOT NULL REFERENCES guide_steps(id),
      answer TEXT NOT NULL,
      completedAt TEXT DEFAULT (datetime('now'))
    );
  `);
}
